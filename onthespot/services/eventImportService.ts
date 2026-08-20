import "server-only";
import { db } from "@/lib/db";
import { fetchGoogleEvents, type SerpApiEventResult } from "@/lib/serpapi";
import { fetchTicketmasterEvents } from "@/lib/ticketmaster";
import { fetchPredictHqEvents } from "@/lib/predicthq";
import { parseGoogleEventDate } from "@/lib/parseEventDate";
import { CITY_COORDINATES } from "@/lib/geocoding";
import { slugify } from "@/lib/utils";
import { ALL_ACCESSIBILITY_FEATURES } from "@/lib/accessibility";
import type { NormalizedImportedEvent } from "@/types/eventImport";
import type { EventSource } from "@prisma/client";

export const IMPORT_BOT_EMAIL = "imports@onthespot.internal";

const TARGET_CITIES: { city: string; state: string }[] = [
  { city: "Waco", state: "TX" },
  { city: "Austin", state: "TX" },
  { city: "Dallas", state: "TX" },
  { city: "Houston", state: "TX" },
];

const SOURCE_LABEL: Record<EventSource, string> = {
  GOOGLE_EVENTS: "Google Events",
  TICKETMASTER: "Ticketmaster",
  PREDICTHQ: "PredictHQ",
};

// Rough keyword → category-slug mapping, used only for Google's data (the
// only source here without a real category field of its own).
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/comedy|stand-?up/i, "comedy"],
  [/concert|live music|band|singer|dj\b/i, "concert"],
  [/museum|exhibit|gallery/i, "museum"],
  [/festival|fair\b/i, "festival"],
  [/food|tasting|brewery|culinary/i, "food"],
  [/adaptive|wheelchair|para-?sport/i, "adaptive-sports"],
  [/game|esports|arcade|tabletop/i, "gaming"],
  [/art\b|painting|craft/i, "art"],
  [/class|workshop|seminar|lecture/i, "education"],
  [/meetup|community|social\b/i, "community-meetup"],
  [/sport|game\b|match|tournament/i, "sports"],
];

function guessCategorySlug(title: string, description: string): string | null {
  const text = `${title} ${description}`;
  for (const [pattern, slug] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return slug;
  }
  return null;
}

async function getOrCreateImportBotUser() {
  const existing = await db.user.findUnique({ where: { email: IMPORT_BOT_EMAIL } });
  if (existing) return existing;

  // Placeholder hash — this account can never log in (no password reset
  // flow issues a token for it, and it's excluded from any "browse hosts"
  // UI); it exists purely as a FK target for createdById attribution.
  return db.user.create({
    data: {
      name: "OnTheSpot Data Sync",
      email: IMPORT_BOT_EMAIL,
      passwordHash: "!",
      role: "USER",
      status: "ACTIVE",
      profile: { create: { username: "onthespot-data-sync" } },
    },
  });
}

async function uniqueSlug(title: string): Promise<string> {
  const root = slugify(title) || "event";
  let candidate = root;
  let n = 1;
  while (await db.event.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

function jitter(base: number, spreadMiles: number) {
  const spreadDegrees = spreadMiles / 69;
  return base + (Math.random() - 0.5) * 2 * spreadDegrees;
}

export interface ImportSummary {
  source: string;
  city: string;
  fetched: number;
  imported: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  errors: string[];
}

type ImportOutcome = "imported" | "duplicate" | "invalid";

/**
 * Creates a single event from any source's already-normalized data. Shared
 * by every importer so every source gets the exact same safety guarantees:
 * dedup by (source, externalId), PENDING_REVIEW status, and every
 * accessibility feature explicitly UNKNOWN rather than guessed.
 */
async function importNormalizedEvent(
  event: NormalizedImportedEvent,
  source: EventSource,
  botUserId: string,
): Promise<ImportOutcome> {
  const existing = await db.event.findUnique({
    where: { externalSource_externalId: { externalSource: source, externalId: event.externalId } },
    select: { id: true },
  });
  if (existing) return "duplicate";

  const categoryRow = event.categorySlug ? await db.category.findUnique({ where: { slug: event.categorySlug } }) : null;
  const slug = await uniqueSlug(event.title);
  const sourceLabel = SOURCE_LABEL[source];

  await db.event.create({
    data: {
      slug,
      title: event.title,
      description: `${event.description}\n\nImported automatically from ${sourceLabel}. Accessibility details have not yet been confirmed — an OnTheSpot moderator or the venue can update them.`,
      createdById: botUserId,
      status: "PENDING_REVIEW",
      externalSource: source,
      externalId: event.externalId,
      startAt: event.startAt,
      endAt: event.endAt,
      venueName: event.venueName,
      addressLine1: event.addressLine1,
      city: event.city,
      state: event.state,
      zip: event.zip,
      latitude: event.latitude,
      longitude: event.longitude,
      indoorOutdoor: "INDOOR",
      isFree: event.isFree,
      price: event.price,
      ticketUrl: event.ticketUrl,
      coverImageUrl: event.coverImageUrl,
      categories: categoryRow ? { create: [{ categoryId: categoryRow.id }] } : undefined,
      accessibility: {
        create: ALL_ACCESSIBILITY_FEATURES.map((feature) => ({
          feature,
          state: "UNKNOWN",
          note: "Not yet confirmed — this event was imported automatically.",
        })),
      },
      images: event.coverImageUrl ? { create: [{ url: event.coverImageUrl, position: 0 }] } : undefined,
    },
  });

  return "imported";
}

async function runImportForCities(
  source: EventSource,
  botUserId: string,
  fetchCity: (city: string, state: string) => Promise<NormalizedImportedEvent[]>,
): Promise<ImportSummary[]> {
  const summaries: ImportSummary[] = [];

  for (const { city, state } of TARGET_CITIES) {
    const summary: ImportSummary = {
      source: SOURCE_LABEL[source],
      city: `${city}, ${state}`,
      fetched: 0,
      imported: 0,
      skippedDuplicate: 0,
      skippedInvalid: 0,
      errors: [],
    };

    try {
      const events = await fetchCity(city, state);
      summary.fetched = events.length;

      for (const event of events) {
        try {
          const outcome = await importNormalizedEvent(event, source, botUserId);
          if (outcome === "imported") summary.imported += 1;
          else if (outcome === "duplicate") summary.skippedDuplicate += 1;
          else summary.skippedInvalid += 1;
        } catch (err) {
          summary.errors.push(err instanceof Error ? err.message : String(err));
        }
      }
    } catch (err) {
      summary.errors.push(err instanceof Error ? err.message : String(err));
    }

    summaries.push(summary);
  }

  return summaries;
}

async function logImportRun(botUserId: string, action: string, summaries: ImportSummary[]) {
  await db.auditLog.create({
    data: {
      actorId: botUserId,
      action,
      entityType: "SYSTEM",
      entityId: "import",
      metadata: JSON.parse(JSON.stringify(summaries)),
    },
  });
}

export async function runTicketmasterImport(): Promise<ImportSummary[]> {
  const botUser = await getOrCreateImportBotUser();
  const summaries = await runImportForCities("TICKETMASTER", botUser.id, fetchTicketmasterEvents);
  await logImportRun(botUser.id, "TICKETMASTER_IMPORT_RUN", summaries);
  return summaries;
}

export async function runPredictHqImport(): Promise<ImportSummary[]> {
  const botUser = await getOrCreateImportBotUser();
  const summaries = await runImportForCities("PREDICTHQ", botUser.id, (city, state) => {
    const coords = CITY_COORDINATES[`${city.toLowerCase()},${state.toLowerCase()}`];
    if (!coords) return Promise.resolve([]);
    return fetchPredictHqEvents(city, state, coords.lat, coords.lng);
  });
  await logImportRun(botUser.id, "PREDICTHQ_IMPORT_RUN", summaries);
  return summaries;
}

/** Runs both of the reliable, structured-data sources in one pass. */
export async function runReliableSourcesImport(): Promise<ImportSummary[]> {
  const [ticketmaster, predicthq] = await Promise.all([runTicketmasterImport(), runPredictHqImport()]);
  return [...ticketmaster, ...predicthq];
}

// --- Google Events (SerpApi) — kept for manual-only retesting; see
// README.md §11 for why this source is unreliable and disabled by default. ---

function normalizeGoogleEvent(result: SerpApiEventResult, city: string, state: string): NormalizedImportedEvent | null {
  if (!result.title || !result.link) return null;
  const parsedDate = parseGoogleEventDate(result.date?.start_date, result.date?.when);
  if (!parsedDate) return null;

  const coords = CITY_COORDINATES[`${city.toLowerCase()},${state.toLowerCase()}`];
  const hasTicketLink = Boolean(result.ticket_info?.length);

  return {
    externalId: result.link,
    title: result.title,
    description: result.description?.trim() || `Imported from Google Events. See original listing: ${result.link}`,
    startAt: parsedDate.startAt,
    endAt: parsedDate.endAt,
    venueName: result.venue?.name || result.address?.[0] || "Venue TBA",
    addressLine1: result.address?.slice(1).join(", ") || result.address?.[0] || "Address not provided",
    city,
    state,
    zip: "00000",
    latitude: coords ? jitter(coords.lat, 1) : 0,
    longitude: coords ? jitter(coords.lng, 1) : 0,
    // Absence of a ticket link in Google's listing means we don't know the
    // price, not that the event is free — don't conflate the two.
    isFree: false,
    price: null,
    ticketUrl: hasTicketLink ? (result.ticket_info?.[0]?.link ?? result.link) : null,
    coverImageUrl: result.thumbnail || null,
    categorySlug: guessCategorySlug(result.title, result.description ?? ""),
  };
}

export async function runGoogleEventsImport(): Promise<ImportSummary[]> {
  const botUser = await getOrCreateImportBotUser();
  const summaries = await runImportForCities("GOOGLE_EVENTS", botUser.id, async (city, state) => {
    const results = await fetchGoogleEvents(`events in ${city}, ${state}`);
    return results.map((r) => normalizeGoogleEvent(r, city, state)).filter((e): e is NormalizedImportedEvent => e != null);
  });
  await logImportRun(botUser.id, "GOOGLE_EVENTS_IMPORT_RUN", summaries);
  return summaries;
}
