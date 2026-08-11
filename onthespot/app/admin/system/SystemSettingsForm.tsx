"use client";

import { useActionState } from "react";
import { updatePlatformSettingsAction, type SystemSettingsState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: SystemSettingsState = {};

export function SystemSettingsForm({
  partnerPremium,
  userPremium,
  featured,
}: {
  partnerPremium: number;
  userPremium: number;
  featured: number;
}) {
  const [state, formAction, pending] = useActionState(updatePlatformSettingsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.success && (
        <p role="status" className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          Pricing updated.
        </p>
      )}
      <TextField label="Partner Premium ($/month)" name="partnerPremiumPrice" type="number" step="0.01" min={0} defaultValue={(partnerPremium / 100).toFixed(2)} />
      <TextField label="User Premium ($/month)" name="userPremiumPrice" type="number" step="0.01" min={0} defaultValue={(userPremium / 100).toFixed(2)} />
      <TextField label="Featured placement ($/week)" name="featuredPrice" type="number" step="0.01" min={0} defaultValue={(featured / 100).toFixed(2)} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save pricing"}
      </Button>
    </form>
  );
}
