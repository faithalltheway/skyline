import "server-only";
import { db } from "@/lib/db";
import type { AccessibilityFeature, IndoorOutdoor, Prisma } from "@prisma/client";
import { boundingBox } from "@/lib/geo";

export const EVENT_CARD_INCLUDE = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  categories: { include: { category: true } },
  accessibility: true,
  organization: { select: { id: true, name: true, slug: true, logoUrl: true, verificationStatus: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { savedBy: true, rsvps: { where: { status: "GOING" } } } },
} satisfies Prisma.EventInclude;

export type EventWithRelations = Prisma.EventGetPayload<{ include: typeof EVENT_CARD_INCLUDE }>;

export interface EventQueryOptions {
  q?: string;
  categories?: string[];
  accessibility?: AccessibilityFeature[];
  matchAll?: boolean;
  price?: "any" | "free" | "paid";
  indoorOutdoor?: string;
  dateFrom?: string;
  dateTo?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  organizationId?: string;
  createdById?: string;
  statuses?: Prisma.EventWhereInput["status"];
  includePast?: boolean;
  skip?: number;
  take?: number;
}

export function buildEventWhere(opts: EventQueryOptions): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {
    deletedAt: null,
  };

  if (opts.statuses) where.status = opts.statuses;
  if (!opts.includePast) where.endAt = { gte: new Date() };
  if (opts.organizationId) where.organizationId = opts.organizationId;
  if (opts.createdById) where.createdById = opts.createdById;

  if (opts.q) {
    where.OR = [
      { title: { contains: opts.q, mode: "insensitive" } },
      { description: { contains: opts.q, mode: "insensitive" } },
      { venueName: { contains: opts.q, mode: "insensitive" } },
    ];
  }

  if (opts.categories?.length) {
    where.categories = { some: { category: { slug: { in: opts.categories } } } };
  }

  if (opts.accessibility?.length) {
    if (opts.matchAll) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        ...opts.accessibility.map((feature) => ({
          accessibility: { some: { feature, state: "CONFIRMED" as const } },
        })),
      ];
    } else {
      where.accessibility = { some: { feature: { in: opts.accessibility }, state: "CONFIRMED" } };
    }
  }

  if (opts.price === "free") where.isFree = true;
  if (opts.price === "paid") where.isFree = false;

  if (opts.indoorOutdoor && opts.indoorOutdoor !== "ANY") {
    where.indoorOutdoor = opts.indoorOutdoor as IndoorOutdoor;
  }

  if (opts.dateFrom || opts.dateTo) {
    where.startAt = {
      ...(opts.dateFrom ? { gte: new Date(opts.dateFrom) } : {}),
      ...(opts.dateTo ? { lte: new Date(`${opts.dateTo}T23:59:59`) } : {}),
    };
  }

  if (opts.lat != null && opts.lng != null && opts.radiusMiles) {
    const box = boundingBox(opts.lat, opts.lng, opts.radiusMiles);
    where.latitude = { gte: box.minLat, lte: box.maxLat };
    where.longitude = { gte: box.minLon, lte: box.maxLon };
  }

  return where;
}

export async function queryEvents(opts: EventQueryOptions) {
  const where = buildEventWhere(opts);
  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      include: EVENT_CARD_INCLUDE,
      orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
      skip: opts.skip,
      take: opts.take,
    }),
    db.event.count({ where }),
  ]);
  return { events, total };
}

export async function getEventBySlug(slug: string) {
  return db.event.findUnique({
    where: { slug },
    include: {
      ...EVENT_CARD_INCLUDE,
      images: { orderBy: { position: "asc" } },
    },
  });
}
