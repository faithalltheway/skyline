"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/authz";
import { duplicateEvent as duplicateEventService } from "@/services/eventCreationService";
import { startFeaturedPlacementCheckout } from "@/services/billingService";

async function assertOwnership(eventId: string, organizationId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizationId !== organizationId) throw new Error("Not found");
  return event;
}

export async function publishEventAction(eventId: string) {
  const { organization } = await requireOrganization();
  const event = await assertOwnership(eventId, organization.id);
  if (event.status !== "APPROVED" && event.status !== "PUBLISHED") {
    throw new Error("Event must be approved by moderation before it can be published.");
  }
  await db.event.update({ where: { id: eventId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  revalidatePath("/partner/events");
}

export async function unpublishEventAction(eventId: string) {
  const { organization } = await requireOrganization();
  await assertOwnership(eventId, organization.id);
  await db.event.update({ where: { id: eventId }, data: { status: "APPROVED" } });
  revalidatePath("/partner/events");
}

export async function cancelEventAction(eventId: string) {
  const { organization } = await requireOrganization();
  await assertOwnership(eventId, organization.id);
  await db.event.update({ where: { id: eventId }, data: { status: "CANCELLED" } });
  revalidatePath("/partner/events");
}

export async function featureEventAction(eventId: string, weeks: number) {
  const { organization } = await requireOrganization();
  const event = await assertOwnership(eventId, organization.id);
  if (event.status !== "PUBLISHED") throw new Error("Only published events can be featured.");
  const url = await startFeaturedPlacementCheckout(eventId, organization.id, weeks);
  revalidatePath("/partner/events");
  redirect(url);
}

export async function duplicateEventAction(eventId: string) {
  const { user, organization } = await requireOrganization();
  await assertOwnership(eventId, organization.id);
  const copy = await duplicateEventService(eventId, user.id);
  revalidatePath("/partner/events");
  redirect(`/partner/events/${copy.id}/edit`);
}
