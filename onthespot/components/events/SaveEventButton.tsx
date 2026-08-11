"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleSaveEventAction } from "@/actions/engagement";
import { Icon } from "@/components/ui/Icon";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { cn } from "@/lib/utils";

export function SaveEventButton({
  eventId,
  initialSaved,
  compact = false,
}: {
  eventId: string;
  initialSaved: boolean;
  compact?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleSaveEventAction(eventId);
      setSaved(result.saved);
      announce(result.saved ? "Event saved" : "Event removed from saved");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved events" : "Save event"}
      className={cn(
        "tap-target inline-flex items-center justify-center rounded-full bg-surface/90 text-neutral-700 shadow backdrop-blur transition-colors hover:text-accent-600 dark:text-neutral-200",
        compact ? "h-10 w-10" : "gap-2 px-4 py-2 text-sm font-semibold",
      )}
    >
      <Icon name="heart" size={18} className={saved ? "fill-current text-accent-600" : undefined} />
      {!compact && (saved ? "Saved" : "Save")}
    </button>
  );
}
