import "server-only";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { EventFormInput } from "@/lib/validations/event";
import type { AccessibilityFeature, AccessibilityState, EventStatus } from "@prisma/client";

async function uniqueEventSlug(title: string): Promise<string> {
  const root = slugify(title) || "event";
  let candidate = root;
  let n = 1;
  while (await db.event.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export interface CreateEventInput extends EventFormInput {
  images: string[];
  accessibilityAnswers: { feature: AccessibilityFeature; state: AccessibilityState; note?: string }[];
}

export async function createEvent(
  input: CreateEventInput,
  actor: { userId: string; organizationId?: string | null },
  status: EventStatus = "PENDING_REVIEW",
) {
  const slug = await uniqueEventSlug(input.title);
  const categories = await db.category.findMany({ where: { slug: { in: input.categories } } });

  const event = await db.event.create({
    data: {
      slug,
      title: input.title,
      description: input.description,
      organizationId: actor.organizationId ?? null,
      createdById: actor.userId,
      status,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      isRecurring: input.isRecurring,
      recurrenceRule: input.isRecurring ? input.recurrenceRule : null,
      venueName: input.venueName,
      addressLine1: input.addressLine1,
      city: input.city,
      state: input.state.toUpperCase(),
      zip: input.zip,
      latitude: input.latitude,
      longitude: input.longitude,
      indoorOutdoor: input.indoorOutdoor,
      isFree: input.isFree,
      price: input.isFree ? null : (input.price ?? null),
      ticketUrl: input.ticketUrl || null,
      minAge: input.minAge ?? null,
      maxAge: input.maxAge ?? null,
      coverImageUrl: input.coverImageUrl || input.images[0] || null,
      accessibilityContactName: input.accessibilityContactName || null,
      accessibilityContactEmail: input.accessibilityContactEmail || null,
      accessibilityContactPhone: input.accessibilityContactPhone || null,
      accessibilityLastVerifiedAt: input.accessibilityAnswers.length ? new Date() : null,
      categories: { create: categories.map((c) => ({ categoryId: c.id })) },
      accessibility: {
        create: input.accessibilityAnswers.map((a) => ({ feature: a.feature, state: a.state, note: a.note })),
      },
      images: { create: input.images.map((url, i) => ({ url, position: i })) },
    },
  });

  await db.auditLog.create({
    data: {
      actorId: actor.userId,
      action: "EVENT_SUBMITTED",
      entityType: "EVENT",
      entityId: event.id,
      metadata: { status },
    },
  });

  return event;
}

export async function updateEvent(
  eventId: string,
  input: CreateEventInput,
  actorId: string,
  status?: EventStatus,
) {
  const categories = await db.category.findMany({ where: { slug: { in: input.categories } } });

  const event = await db.event.update({
    where: { id: eventId },
    data: {
      title: input.title,
      description: input.description,
      ...(status ? { status } : {}),
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      isRecurring: input.isRecurring,
      recurrenceRule: input.isRecurring ? input.recurrenceRule : null,
      venueName: input.venueName,
      addressLine1: input.addressLine1,
      city: input.city,
      state: input.state.toUpperCase(),
      zip: input.zip,
      latitude: input.latitude,
      longitude: input.longitude,
      indoorOutdoor: input.indoorOutdoor,
      isFree: input.isFree,
      price: input.isFree ? null : (input.price ?? null),
      ticketUrl: input.ticketUrl || null,
      minAge: input.minAge ?? null,
      maxAge: input.maxAge ?? null,
      coverImageUrl: input.coverImageUrl || input.images[0] || null,
      accessibilityContactName: input.accessibilityContactName || null,
      accessibilityContactEmail: input.accessibilityContactEmail || null,
      accessibilityContactPhone: input.accessibilityContactPhone || null,
      accessibilityLastVerifiedAt: input.accessibilityAnswers.length ? new Date() : null,
      categories: { deleteMany: {}, create: categories.map((c) => ({ categoryId: c.id })) },
      accessibility: {
        deleteMany: {},
        create: input.accessibilityAnswers.map((a) => ({ feature: a.feature, state: a.state, note: a.note })),
      },
      images: { deleteMany: {}, create: input.images.map((url, i) => ({ url, position: i })) },
    },
  });

  await db.auditLog.create({
    data: { actorId, action: "EVENT_UPDATED", entityType: "EVENT", entityId: event.id },
  });

  return event;
}

export async function duplicateEvent(eventId: string, actorId: string) {
  const original = await db.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { categories: true, accessibility: true, images: true },
  });

  const slug = await uniqueEventSlug(`${original.title} copy`);

  const event = await db.event.create({
    data: {
      slug,
      title: `${original.title} (copy)`,
      description: original.description,
      organizationId: original.organizationId,
      createdById: actorId,
      status: "DRAFT",
      startAt: original.startAt,
      endAt: original.endAt,
      isRecurring: original.isRecurring,
      recurrenceRule: original.recurrenceRule,
      venueName: original.venueName,
      addressLine1: original.addressLine1,
      city: original.city,
      state: original.state,
      zip: original.zip,
      latitude: original.latitude,
      longitude: original.longitude,
      indoorOutdoor: original.indoorOutdoor,
      isFree: original.isFree,
      price: original.price,
      ticketUrl: original.ticketUrl,
      minAge: original.minAge,
      maxAge: original.maxAge,
      coverImageUrl: original.coverImageUrl,
      accessibilityContactName: original.accessibilityContactName,
      accessibilityContactEmail: original.accessibilityContactEmail,
      accessibilityContactPhone: original.accessibilityContactPhone,
      categories: { create: original.categories.map((c) => ({ categoryId: c.categoryId })) },
      accessibility: {
        create: original.accessibility.map((a) => ({ feature: a.feature, state: a.state, note: a.note })),
      },
      images: { create: original.images.map((img) => ({ url: img.url, position: img.position, altText: img.altText })) },
    },
  });

  return event;
}

export function accessibilityCompletionPercent(
  answers: { state: AccessibilityState }[],
  totalFeatures: number,
): number {
  const answered = answers.filter((a) => a.state !== "UNKNOWN").length;
  return totalFeatures === 0 ? 0 : Math.round((answered / totalFeatures) * 100);
}
