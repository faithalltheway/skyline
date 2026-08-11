"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
};

export function CheckboxCard({ label, description, className, id, ...props }: Props) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-control border border-border p-3.5 text-sm transition-colors",
        "has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-950/40",
        "hover:bg-surface-muted",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand-600)]"
        {...props}
      />
      <span>
        <span className="block font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>}
      </span>
    </label>
  );
}
