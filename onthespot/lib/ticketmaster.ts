import "server-only";
import type { NormalizedImportedEvent } from "@/types/eventImport";

interface TicketmasterVenue {
  name?: string;
  address?: { line1?: string };
  city?: { name?: string };
  state?: { stateCode?: string };
  postalCode?: string;
  location?: { longitude?: string; latitude?: string };
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  dates?: {
    start?: { dateTime?: string; localDate?: string; localTime?: string };
    end?: { dateTime?: string };
  };
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  images?: { url: string; width: number; height: number }[];
  classifications?: { segment?: { name?: string }; genre?: { name?: string } }[];
  _embedded?: { venues?: TicketmasterVenue[] };
}

interface TicketmasterResponse {
  _embedded?: { events?: TicketmasterEvent[] };
  fault?: { faultstring?: string };
  errors?: { detail?: string }[];
}

// Ticketmaster's classification taxonomy mapped onto our category slugs.
// Segment is checked first (broader), genre second (more specific).
const SEGMENT_CATEGORY: Record<string, string> = {
  music: "concert",
  sports: "sports",
  "arts & theatre": "art",
  film: "education",
};
const GENRE_CATEGORY: Record<string, string> = {
  comedy: "comedy",
  theatre: "art",
  "musical theatre": "art",
  festival: "festival",
  family: "community-meetup",
};

function mapCategory(classifications: TicketmasterEvent["classifications"]): string | null {
  const c = classifications?.[0];
  const genre = c?.genre?.name?.toLowerCase();
  if (genre && GENRE_CATEGORY[genre]) return GENRE_CATEGORY[genre];
  const segment = c?.segment?.name?.toLowerCase();
  if (segment && SEGMENT_CATEGORY[segment]) return SEGMENT_CATEGORY[segment];
  return null;
}

function pickImage(images?: TicketmasterEvent["images"]): string | null {
  if (!images?.length) return null;
  // Prefer a wide 16:9-ish image close to 800px if available, else the first.
  const preferred = images.find((i) => i.width >= 640 && i.width <= 1024);
  return (preferred ?? images[0]).url;
}

export async function fetchTicketmasterEvents(city: string, state: string): Promise<NormalizedImportedEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) throw new Error("TICKETMASTER_API_KEY is not configured");

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("city", city);
  url.searchParams.set("stateCode", state);
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("startDateTime", new Date().toISOString().slice(0, 19) + "Z");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as TicketmasterResponse;

  if (!res.ok) {
    const message = data.fault?.faultstring || data.errors?.[0]?.detail || `HTTP ${res.status}`;
    throw new Error(`Ticketmaster error: ${message}`);
  }

  const events = data._embedded?.events ?? [];
  const normalized: NormalizedImportedEvent[] = [];

  for (const event of events) {
    const venue = event._embedded?.venues?.[0];
    const lat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : null;
    const lng = venue?.location?.longitude ? parseFloat(venue.location.longitude) : null;
    const startIso = event.dates?.start?.dateTime;
    if (!venue || lat == null || lng == null || !startIso) continue;

    const startAt = new Date(startIso);
    const endAt = event.dates?.end?.dateTime ? new Date(event.dates.end.dateTime) : new Date(startAt.getTime() + 3 * 60 * 60 * 1000);
    const price = event.priceRanges?.[0]?.min ?? null;

    normalized.push({
      externalId: event.id,
      title: event.name,
      description: event.info || event.pleaseNote || `${event.name} at ${venue.name ?? "a local venue"}.`,
      startAt,
      endAt,
      venueName: venue.name || "Venue TBA",
      addressLine1: venue.address?.line1 || "Address not provided",
      city: venue.city?.name || city,
      state: venue.state?.stateCode || state,
      zip: venue.postalCode || "00000",
      latitude: lat,
      longitude: lng,
      // Ticketmaster omits priceRanges when it simply doesn't have pricing data —
      // that's not the same as the event being free, so don't conflate them.
      isFree: false,
      price,
      ticketUrl: event.url ?? null,
      coverImageUrl: pickImage(event.images),
      categorySlug: mapCategory(event.classifications),
    });
  }

  return normalized;
}
