"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authz";
import * as engagementService from "@/services/engagementService";
import type { RSVPStatus } from "@prisma/client";

export async function toggleSaveEventAction(eventId: string): Promise<{ saved: boolean }> {
  const user = await requireUser();
  const saved = await engagementService.toggleSave(user.id, eventId);
  revalidatePath("/saved");
  return { saved };
}

export async function setRsvpAction(eventId: string, status: RSVPStatus, eventSlug?: string) {
  const user = await requireUser();
  await engagementService.setRsvp(user.id, eventId, status);
  revalidatePath("/rsvps");
  if (eventSlug) revalidatePath(`/events/${eventSlug}`);
  return { status };
}

export async function toggleFollowAction(organizationId: string): Promise<{ following: boolean }> {
  const user = await requireUser();
  const following = await engagementService.toggleFollow(user.id, organizationId);
  return { following };
}
