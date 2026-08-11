"use client";

import { useActionState, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { reportEventAction, type ReportFormState } from "@/actions/report";
import { ReportReason } from "@prisma/client";

const REASON_LABELS: Record<ReportReason, string> = {
  INCORRECT_ACCESSIBILITY: "Incorrect accessibility information",
  INAPPROPRIATE: "Inappropriate event",
  SCAM: "Scam",
  WRONG_LOCATION: "Wrong location",
  DUPLICATE: "Duplicate listing",
  OTHER: "Other",
};

const initialState: ReportFormState = {};

export function ReportEventButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(reportEventAction, initialState);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => (status === "authenticated" ? setOpen(true) : router.push("/login"))}
      >
        Report an issue
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report this event">
        {state.success ? (
          <div role="status" className="flex flex-col gap-4">
            <p className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
              Thanks — our moderation team will review this report.
            </p>
            <Button type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="eventId" value={eventId} />
            {state.error && (
              <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
                {state.error}
              </p>
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">What&apos;s wrong?</legend>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" value={value} required />
                  {label}
                </label>
              ))}
            </fieldset>
            <TextAreaField label="Additional details (optional)" name="details" rows={3} />
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit report"}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
