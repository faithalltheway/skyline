"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import * as moderationService from "@/services/moderationService";
import type { ReasonActionState } from "@/components/admin/ReasonActionForm";

export async function resolveReportAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A resolution note is required." };
  await moderationService.resolveReport(String(formData.get("reportId")), admin.id, reason);
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function dismissReportAction(_prev: ReasonActionState, formData: FormData): Promise<ReasonActionState> {
  const admin = await requireRole("ADMIN");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required." };
  await moderationService.dismissReport(String(formData.get("reportId")), admin.id, reason);
  revalidatePath("/admin/reports");
  return { success: true };
}
