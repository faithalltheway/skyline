"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginFormState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: LoginFormState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error && (
        <p role="alert" className="rounded-control bg-[var(--color-unavailable-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-unavailable)]">
          {state.error}
        </p>
      )}
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
