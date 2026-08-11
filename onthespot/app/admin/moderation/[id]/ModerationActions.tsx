"use client";

import { useActionState, useState } from "react";
import { approveEventAction, rejectEventAction, requestChangesAction, type ModerationActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";

const initialState: ModerationActionState = {};

export function ModerationActions({ eventId }: { eventId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveEventAction, initialState);
  const [rejectState, rejectFormAction, rejectPending] = useActionState(rejectEventAction, initialState);
  const [changesState, changesFormAction, changesPending] = useActionState(requestChangesAction, initialState);
  const [activePanel, setActivePanel] = useState<"reject" | "changes" | null>(null);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Decision</h2>

      <form action={approveAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="reason" value="Meets accessibility and content guidelines" />
        <Button type="submit" disabled={approvePending} className="w-full">
          {approvePending ? "Approving…" : "Approve event"}
        </Button>
      </form>
      {approveState.error && <p role="alert" className="text-sm text-[var(--color-unavailable)]">{approveState.error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => setActivePanel(activePanel === "changes" ? null : "changes")}>
          Request changes
        </Button>
        <Button type="button" variant="danger" onClick={() => setActivePanel(activePanel === "reject" ? null : "reject")}>
          Reject
        </Button>
      </div>

      {activePanel === "changes" && (
        <form action={changesFormAction} className="flex flex-col gap-2">
          <input type="hidden" name="eventId" value={eventId} />
          <TextAreaField label="What needs to change? (required)" name="reason" rows={3} required />
          {changesState.error && <p role="alert" className="text-sm text-[var(--color-unavailable)]">{changesState.error}</p>}
          <Button type="submit" variant="outline" disabled={changesPending}>
            {changesPending ? "Sending…" : "Send back to host as draft"}
          </Button>
        </form>
      )}

      {activePanel === "reject" && (
        <form action={rejectFormAction} className="flex flex-col gap-2">
          <input type="hidden" name="eventId" value={eventId} />
          <TextAreaField label="Reason for rejection (required)" name="reason" rows={3} required />
          {rejectState.error && <p role="alert" className="text-sm text-[var(--color-unavailable)]">{rejectState.error}</p>}
          <Button type="submit" variant="danger" disabled={rejectPending}>
            {rejectPending ? "Rejecting…" : "Reject event"}
          </Button>
        </form>
      )}
    </div>
  );
}
