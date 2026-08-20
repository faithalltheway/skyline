"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { bulkApproveImportedEventsAction } from "./actions";

export function BulkApproveImportedEventsButton({ pendingImportedCount }: { pendingImportedCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (pendingImportedCount === 0) return null;

  if (!open) {
    return (
      <Button type="button" size="sm" variant="primary" onClick={() => setOpen(true)}>
        Publish all imported events ({pendingImportedCount})
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-control border border-border p-3">
      <p className="text-sm">
        Publish all {pendingImportedCount} pending Ticketmaster/PredictHQ/Google Events imports? Their
        accessibility stays marked unconfirmed until a moderator or the venue updates it.
      </p>
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void bulkApproveImportedEventsAction();
          })
        }
      >
        {pending ? "Publishing…" : "Confirm: publish them all"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}
