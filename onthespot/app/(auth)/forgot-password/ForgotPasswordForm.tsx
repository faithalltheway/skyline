"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.submitted) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          If an account exists for that email, we&apos;ve sent a password reset link.
        </p>
        {state.devResetUrl && (
          <div className="rounded-control border border-dashed border-border p-3 text-xs">
            <p className="font-semibold">Development mode — no email provider configured.</p>
            <p className="mt-1">
              Reset link:{" "}
              <a href={state.devResetUrl} className="break-all font-mono text-brand-700 underline dark:text-brand-300">
                {state.devResetUrl}
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
          {state.error}
        </p>
      )}
      <TextField label="Email address" name="email" type="email" autoComplete="email" required />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
