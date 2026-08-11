"use client";

import { useTransition } from "react";
import Link from "next/link";
import { publishEventAction, unpublishEventAction, cancelEventAction, duplicateEventAction, featureEventAction } from "./actions";
import { Button } from "@/components/ui/Button";
import type { EventStatus } from "@prisma/client";

export function EventRowActions({ eventId, status }: { eventId: string; status: EventStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href={`/partner/events/${eventId}/edit`}>
        <Button type="button" size="sm" variant="outline">
          Edit
        </Button>
      </Link>
      <Link href={`/partner/events/${eventId}/analytics`}>
        <Button type="button" size="sm" variant="outline">
          Analytics
        </Button>
      </Link>
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => duplicateEventAction(eventId))}>
        Duplicate
      </Button>
      {status === "APPROVED" && (
        <Button type="button" size="sm" disabled={pending} onClick={() => startTransition(() => publishEventAction(eventId))}>
          Publish
        </Button>
      )}
      {status === "PUBLISHED" && (
        <>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => unpublishEventAction(eventId))}>
            Unpublish
          </Button>
          <form action={featureEventAction.bind(null, eventId, 1)}>
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>
              Feature (1wk)
            </Button>
          </form>
        </>
      )}
      {status !== "CANCELLED" && (
        <Button type="button" size="sm" variant="danger" disabled={pending} onClick={() => startTransition(() => cancelEventAction(eventId))}>
          Cancel
        </Button>
      )}
    </div>
  );
}
