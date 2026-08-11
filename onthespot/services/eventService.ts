import "server-only";
import { db } from "@/lib/db";
import type { AccessibilityFeature } from "@prisma/client";
import { queryEvents, getEventBySlug, type EventWithRelations, type EventQueryOptions } from "@/repositories/eventRepository";
import { calculateAccessibilityMatch } from "@/lib/matching";
import { haversineDistanceMiles } from "@/lib/geo";
import { formatPrice } from "@/lib/utils";
import type { EventCardData, EventDetailData } from "@/types/event";

const PAGE_SIZE = 12;

function toCardData(
  event: EventWithRelations,
  userRequirements: AccessibilityFeature[],
  origin?: { lat: number; lng: number } | null,
): EventCardData {
  const match = calculateAccessibilityMatch(userRequirements, event.accessibility);
  const distanceMiles = origin
    ? haversineDistanceMiles(origin.lat, origin.lng, event.latitude, event.longitude)
    : null;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    coverImageUrl: event.coverImageUrl ?? event.images[0]?.url ?? null,
    startAt: event.startAt,
    endAt: event.endAt,
    venueName: event.venueName,
    city: event.city,
    state: event.state,
    latitude: event.latitude,
    longitude: event.longitude,
    isFree: event.isFree,
    price: event.price ? event.price.toString() : null,
    isFeatured: event.isFeatured,
    status: event.status,
    hostName: event.organization?.name ?? event.createdBy.name,
    hostVerified: event.organization?.verificationStatus === "VERIFIED",
    hostSlug: event.organization?.slug ?? null,
    distanceMiles,
    matchPercent: match.percent,
    matchSummary: match.summary,
    goingCount: event._count.rsvps,
    categoryNames: event.categories.map((c) => c.category.name),
  };
}

export interface DiscoverResult {
  events: EventCardData[];
  total: number;
  pageSize: number;
}

export async function discoverEvents(
  opts: EventQueryOptions & { userRequirements?: AccessibilityFeature[]; sort?: "match" | "date" | "distance"; page?: number },
): Promise<DiscoverResult> {
  const page = opts.page ?? 1;
  const { events, total } = await queryEvents({
    ...opts,
    statuses: "PUBLISHED",
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const origin = opts.lat != null && opts.lng != null ? { lat: opts.lat, lng: opts.lng } : null;
  let cards = events.map((e) => toCardData(e, opts.userRequirements ?? [], origin));

  if (origin && opts.radiusMiles) {
    cards = cards.filter((c) => c.distanceMiles == null || c.distanceMiles <= opts.radiusMiles!);
  }

  const sort = opts.sort ?? "match";
  cards.sort((a, b) => {
    if (sort === "distance" && a.distanceMiles != null && b.distanceMiles != null) {
      return a.distanceMiles - b.distanceMiles;
    }
    if (sort === "match") {
      if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
    }
    return a.startAt.getTime() - b.startAt.getTime();
  });

  // Featured events always float to the top within their sort bucket.
  cards.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

  return { events: cards, total, pageSize: PAGE_SIZE };
}

export async function getEventDetail(
  slug: string,
  userRequirements: AccessibilityFeature[] = [],
  origin?: { lat: number; lng: number } | null,
): Promise<EventDetailData | null> {
  const event = await getEventBySlug(slug);
  if (!event) return null;

  const card = toCardData(event, userRequirements, origin);
  const interestedCount = await db.rSVP.count({ where: { eventId: event.id, status: "INTERESTED" } });

  return {
    ...card,
    description: event.description,
    addressLine1: event.addressLine1,
    zip: event.zip,
    latitude: event.latitude,
    longitude: event.longitude,
    indoorOutdoor: event.indoorOutdoor,
    ticketUrl: event.ticketUrl,
    minAge: event.minAge,
    maxAge: event.maxAge,
    accessibilityContactName: event.accessibilityContactName,
    accessibilityContactEmail: event.accessibilityContactEmail,
    accessibilityContactPhone: event.accessibilityContactPhone,
    accessibilityLastVerifiedAt: event.accessibilityLastVerifiedAt,
    accessibility: event.accessibility.map((a) => ({ feature: a.feature, state: a.state, note: a.note })),
    images: event.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText })),
    organizationSlug: event.organization?.slug ?? null,
    organizationId: event.organizationId,
    createdById: event.createdById,
    interestedCount,
  };
}

export async function getSimilarEvents(event: EventDetailData, userRequirements: AccessibilityFeature[]) {
  const categorySlugs = await db.eventCategory.findMany({
    where: { eventId: event.id },
    select: { category: { select: { slug: true } } },
  });
  const slugs = categorySlugs.map((c) => c.category.slug);
  if (!slugs.length) return [];

  const { events } = await queryEvents({
    categories: slugs,
    statuses: "PUBLISHED",
    take: 4,
  });

  return events
    .filter((e) => e.id !== event.id)
    .slice(0, 3)
    .map((e) => toCardData(e, userRequirements, null));
}

export { formatPrice };
