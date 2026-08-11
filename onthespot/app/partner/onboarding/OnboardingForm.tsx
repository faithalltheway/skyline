"use client";

import { useActionState } from "react";
import { createOrganizationAction, type PartnerOnboardingState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: PartnerOnboardingState = {};

export function OnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
          {state.error}
        </p>
      )}
      <TextField label="Organization name" name="organizationName" required error={state.fieldErrors?.organizationName} />
      <TextField
        label="Contact email"
        name="contactEmail"
        type="email"
        defaultValue={defaultEmail}
        required
        error={state.fieldErrors?.contactEmail}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
