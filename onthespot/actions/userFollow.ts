"use server";

import { requireUser } from "@/lib/authz";
import * as userFollowService from "@/services/userFollowService";

export async function toggleUserFollowAction(
  targetUserId: string,
): Promise<{ following: boolean; requiresPayment?: boolean }> {
  const user = await requireUser();

  try {
    return await userFollowService.toggleUserFollow(user.id, targetUserId);
  } catch (err) {
    if (err instanceof userFollowService.FollowAccessError) {
      return { following: false, requiresPayment: true };
    }
    throw err;
  }
}
