"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleUserFollowAction } from "@/actions/userFollow";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";

export function UserFollowButton({ targetUserId, initialFollowing }: { targetUserId: string; initialFollowing: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();

  return (
    <Button
      type="button"
      variant={following ? "outline" : "primary"}
      aria-pressed={following}
      disabled={pending}
      onClick={() => {
        if (status !== "authenticated") {
          router.push("/login");
          return;
        }
        startTransition(async () => {
          const result = await toggleUserFollowAction(targetUserId);
          if (result.requiresPayment) {
            router.push(`/unlock/follow/${targetUserId}`);
            return;
          }
          setFollowing(result.following);
          announce(result.following ? "Following user" : "Unfollowed user");
        });
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
