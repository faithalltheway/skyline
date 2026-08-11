"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRsvpAction } from "@/actions/engagement";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";

export function CancelRsvpButton({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const announce = useAnnounce();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setRsvpAction(eventId, "CANCELLED", eventSlug);
          announce("RSVP cancelled");
          router.refresh();
        })
      }
    >
      {pending ? "Cancelling…" : "Cancel RSVP"}
    </Button>
  );
}
