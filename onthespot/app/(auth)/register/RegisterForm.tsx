"use client";

import { useActionState, useState } from "react";
import { registerAction, type RegisterFormState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const initialState: RegisterFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [accountType, setAccountType] = useState<"USER" | "PARTNER">("USER");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-control bg-[var(--color-unavailable-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-unavailable)]">
          {state.error}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          I&apos;m signing up as a…
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(["USER", "PARTNER"] as const).map((type) => (
            <label
              key={type}
              className={cn(
                "tap-target flex cursor-pointer items-center justify-center rounded-control border border-border p-3 text-sm font-semibold",
                accountType === type && "border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200",
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={type}
                checked={accountType === type}
                onChange={() => setAccountType(type)}
                className="sr-only"
              />
              {type === "USER" ? "Individual" : "Organization / host"}
            </label>
          ))}
        </div>
      </fieldset>

      <TextField label="Full name" name="name" autoComplete="name" required error={state.fieldErrors?.name} />
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      {accountType === "PARTNER" && (
        <TextField
          label="Organization name"
          name="organizationName"
          required
          error={state.fieldErrors?.organizationName}
        />
      )}
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with a letter and a number."
        error={state.fieldErrors?.password}
      />
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-neutral-500">
        Administrator accounts cannot be self-registered and are created internally.
      </p>
    </form>
  );
}
