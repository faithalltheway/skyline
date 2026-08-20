"use client";

import { useActionState } from "react";
import { updateMonetizationSettingsAction, type MonetizationFormState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function MonetizationForm({ messagePrice, followPrice }: { messagePrice: string; followPrice: string }) {
  const [state, formAction, pending] = useActionState<MonetizationFormState, FormData>(
    updateMonetizationSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">
        Optionally charge a monthly subscription for other members to message or follow you. Leave blank to keep it
        free. OnTheSpot keeps 100% of this — there&apos;s no separate payout to you.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Price to message you ($/month)"
          name="messagePrice"
          type="number"
          min="1"
          step="0.01"
          placeholder="Free"
          defaultValue={messagePrice}
        />
        <TextField
          label="Price to follow you ($/month)"
          name="followPrice"
          type="number"
          min="1"
          step="0.01"
          placeholder="Free"
          defaultValue={followPrice}
        />
      </div>
      {state.success && (
        <p role="status" className="text-sm font-medium text-[var(--color-confirmed)]">
          Saved.
        </p>
      )}
      <Button type="submit" variant="outline" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save pricing"}
      </Button>
    </form>
  );
}
