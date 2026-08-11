import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "accent" | "confirmed" | "unavailable" | "unknown" | "neutral";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200",
  accent: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200",
  confirmed: "bg-[var(--color-confirmed-bg)] text-[var(--color-confirmed)]",
  unavailable: "bg-[var(--color-unavailable-bg)] text-[var(--color-unavailable)]",
  unknown: "bg-[var(--color-unknown-bg)] text-[var(--color-unknown)]",
  neutral: "bg-surface-muted text-neutral-700 dark:text-neutral-200",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
