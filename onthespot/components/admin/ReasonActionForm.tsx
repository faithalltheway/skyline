"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";

export interface ReasonActionState {
  error?: string;
  success?: boolean;
}

export function ReasonActionForm({
  action,
  hiddenFields,
  label,
  variant = "outline",
  confirmLabel,
}: {
  action: (prevState: ReasonActionState, formData: FormData) => Promise<ReasonActionState>;
  hiddenFields: Record<string, string>;
  label: string;
  variant?: "outline" | "danger" | "primary";
  confirmLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  if (!open) {
    return (
      <Button type="button" size="sm" variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-control border border-border p-3">
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <TextAreaField label={`Reason for: ${label} (required)`} name="reason" rows={2} required />
      {state.error && (
        <p role="alert" className="text-xs font-medium text-[var(--color-unavailable)]">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant={variant} disabled={pending}>
          {pending ? "Submitting…" : confirmLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
