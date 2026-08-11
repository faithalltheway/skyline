import "server-only";
import { db } from "@/lib/db";
import type { RSVPStatus } from "@prisma/client";
import { recordEventSave, recordEventRsvp } from "@/services/analyticsService";

export async function toggleSave(userId: string, eventId: string): Promise<boolean> {
  const existing = await db.savedEvent.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (existing) {
    await db.savedEvent.delete({ where: { id: existing.id } });
    await recordEventSave(eventId, -1);
    return false;
  }
  await db.savedEvent.create({ data: { userId, eventId } });
  await recordEventSave(eventId, 1);
  return true;
}

export async function setRsvp(userId: string, eventId: string, status: RSVPStatus) {
  const result = await db.rSVP.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: { status },
    create: { eventId, userId, status },
  });
  if (status === "GOING") await recordEventRsvp(eventId);
  return result;
}

export async function cancelRsvp(userId: string, eventId: string) {
  return db.rSVP.updateMany({
    where: { eventId, userId },
    data: { status: "CANCELLED" },
  });
}

export async function toggleFollow(followerId: string, organizationId: string): Promise<boolean> {
  const existing = await db.follow.findUnique({
    where: { followerId_organizationId: { followerId, organizationId } },
  });
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return false;
  }
  await db.follow.create({ data: { followerId, organizationId } });
  return true;
}
