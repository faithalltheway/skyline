import "server-only";
import { db } from "@/lib/db";

export class FollowAccessError extends Error {
  constructor(public readonly targetUserId: string) {
    super("This user charges to be followed.");
    this.name = "FollowAccessError";
  }
}

async function hasActiveGrant(payerId: string, payeeId: string) {
  const grant = await db.paidAccessGrant.findUnique({
    where: { payerId_payeeId_type: { payerId, payeeId, type: "FOLLOW" } },
  });
  return grant?.status === "ACTIVE";
}

/**
 * Toggles a user-to-user follow. Gated by the target's followPriceCents
 * (see UserProfile) only on the way in — unfollowing is always free.
 * Throws FollowAccessError if the target charges for follows and the
 * follower hasn't paid (checked with startUserAccessCheckout in
 * billingService).
 */
export async function toggleUserFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
  if (followerId === followingId) throw new Error("Cannot follow yourself.");

  const existing = await db.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await db.userFollow.delete({ where: { id: existing.id } });
    return { following: false };
  }

  const targetProfile = await db.userProfile.findUnique({ where: { userId: followingId } });
  if (targetProfile?.followPriceCents) {
    const unlocked = await hasActiveGrant(followerId, followingId);
    if (!unlocked) throw new FollowAccessError(followingId);
  }

  await db.userFollow.create({ data: { followerId, followingId } });
  return { following: true };
}

export async function isFollowingUser(followerId: string, followingId: string) {
  const existing = await db.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return Boolean(existing);
}

export async function userFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    db.userFollow.count({ where: { followingId: userId } }),
    db.userFollow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}
