"use server";

import { redirect } from "next/navigation";
import { requireOrganization } from "@/lib/authz";
import { startPartnerPremiumCheckout } from "@/services/billingService";

export async function startPartnerUpgradeAction() {
  const { user, organization } = await requireOrganization();
  const url = await startPartnerPremiumCheckout(organization.id, user.email);
  redirect(url);
}
