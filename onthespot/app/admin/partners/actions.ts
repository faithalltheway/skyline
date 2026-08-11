"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import * as moderationService from "@/services/moderationService";
import type { ReasonActionState } from "@/components/admin/ReasonActionForm";

export async function verifyOrgAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "Verified by admin");
  await moderationService.verifyOrganization(String(formData.get("organizationId")), admin.id, reason);
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function rejectOrgVerificationAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required." };
  await moderationService.rejectOrganizationVerification(String(formData.get("organizationId")), admin.id, reason);
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function suspendOrgAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required." };
  await moderationService.suspendOrganization(String(formData.get("organizationId")), admin.id, reason);
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function restoreOrgAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "Restored by admin");
  await moderationService.restoreOrganization(String(formData.get("organizationId")), admin.id, reason);
  revalidatePath("/admin/partners");
  return { success: true };
}
