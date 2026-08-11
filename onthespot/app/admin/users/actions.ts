"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import * as moderationService from "@/services/moderationService";
import type { ReasonActionState } from "@/components/admin/ReasonActionForm";

export async function suspendUserAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required." };
  await moderationService.suspendUser(String(formData.get("userId")), admin.id, reason);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function banUserAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required." };
  await moderationService.banUser(String(formData.get("userId")), admin.id, reason);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function restoreUserAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "Reinstated by admin");
  await moderationService.restoreUser(String(formData.get("userId")), admin.id, reason);
  revalidatePath("/admin/users");
  return { success: true };
}
