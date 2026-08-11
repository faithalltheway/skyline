"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleFollowAction } from "@/actions/engagement";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";

export function FollowButton({ organizationId, initialFollowing }: { organizationId: string; initialFollowing: boolean }) {
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
        const next = !following;
        setFollowing(next);
        startTransition(async () => {
          const result = await toggleFollowAction(organizationId);
          setFollowing(result.following);
          announce(result.following ? "Following organizer" : "Unfollowed organizer");
        });
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
