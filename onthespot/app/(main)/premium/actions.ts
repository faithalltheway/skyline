"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { startUserPremiumCheckout } from "@/services/billingService";

export async function startUserUpgradeAction() {
  const user = await requireUser();
  const url = await startUserPremiumCheckout(user.id, user.email);
  redirect(url);
}
