"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { startUserAccessCheckout } from "@/services/billingService";
import type { PaidAccessType } from "@prisma/client";

export async function unlockUserAccessAction(payeeId: string, type: PaidAccessType) {
  const user = await requireUser();
  const url = await startUserAccessCheckout(user.id, user.email, payeeId, type);
  redirect(url);
}
