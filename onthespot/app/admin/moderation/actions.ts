"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import * as moderationService from "@/services/moderationService";

export interface ModerationActionState {
  error?: string;
}

export async function approveEventAction(
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const admin = await requireRole("ADMIN");
  const eventId = String(formData.get("eventId"));
  const reason = String(formData.get("reason") ?? "Meets accessibility and content guidelines");
  await moderationService.approveEvent(eventId, admin.id, reason);
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?done=approved");
}

export async function rejectEventAction(
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const admin = await requireRole("ADMIN");
  const eventId = String(formData.get("eventId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required to reject an event." };
  await moderationService.rejectEvent(eventId, admin.id, reason);
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?done=rejected");
}

export async function requestChangesAction(
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const admin = await requireRole("ADMIN");
  const eventId = String(formData.get("eventId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required to request changes." };
  await moderationService.requestEventChanges(eventId, admin.id, reason);
  revalidatePath("/admin/moderation");
  redirect("/admin/moderation?done=changes-requested");
}
