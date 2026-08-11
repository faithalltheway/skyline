"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { setPlatformSetting } from "@/lib/settings";

export interface SystemSettingsState {
  success?: boolean;
}

export async function updatePlatformSettingsAction(
  _prev: SystemSettingsState,
  formData: FormData,
): Promise<SystemSettingsState> {
  await requireRole("ADMIN");

  const partnerPremium = Math.round(Number(formData.get("partnerPremiumPrice")) * 100);
  const userPremium = Math.round(Number(formData.get("userPremiumPrice")) * 100);
  const featured = Math.round(Number(formData.get("featuredPrice")) * 100);

  await Promise.all([
    setPlatformSetting("partnerPremiumPriceCents", partnerPremium),
    setPlatformSetting("userPremiumPriceCents", userPremium),
    setPlatformSetting("featuredEventPriceCentsPerWeek", featured),
  ]);

  revalidatePath("/admin/system");
  return { success: true };
}
