"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { setRsvpAction } from "@/actions/engagement";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";
import type { RSVPStatus } from "@prisma/client";

export function RsvpControls({
  eventId,
  eventSlug,
  initialStatus,
}: {
  eventId: string;
  eventSlug: string;
  initialStatus: RSVPStatus | null;
}) {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [rsvp, setRsvp] = useState<RSVPStatus | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();

  function update(next: RSVPStatus) {
    if (sessionStatus !== "authenticated") {
      router.push(`/login?callbackUrl=/events/${eventSlug}`);
      return;
    }
    const willCancel = rsvp === next;
    const target = willCancel ? "CANCELLED" : next;
    setRsvp(willCancel ? null : next);
    startTransition(async () => {
      await setRsvpAction(eventId, target, eventSlug);
      announce(
        willCancel
          ? "RSVP cancelled"
          : target === "GOING"
            ? "You're marked as going"
            : "You're marked as interested",
      );
    });
  }

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="RSVP to this event">
      <Button
        type="button"
        variant={rsvp === "GOING" ? "primary" : "outline"}
        onClick={() => update("GOING")}
        disabled={pending}
        aria-pressed={rsvp === "GOING"}
      >
        {rsvp === "GOING" ? "You're going ✓" : "RSVP: Going"}
      </Button>
      <Button
        type="button"
        variant={rsvp === "INTERESTED" ? "secondary" : "outline"}
        onClick={() => update("INTERESTED")}
        disabled={pending}
        aria-pressed={rsvp === "INTERESTED"}
      >
        {rsvp === "INTERESTED" ? "Interested ✓" : "Interested"}
      </Button>
    </div>
  );
}
