import { cn } from "@/lib/utils";

export function ProgressSteps({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <nav aria-label="Progress">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((step, i) => {
          const status = i < currentStep ? "complete" : i === currentStep ? "current" : "upcoming";
          return (
            <li key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  status === "complete" && "bg-brand-600 text-white",
                  status === "current" && "border-2 border-brand-600 text-brand-700 dark:text-brand-300",
                  status === "upcoming" && "border border-border text-neutral-400",
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                {status === "complete" ? (
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  status === "upcoming" ? "text-neutral-400" : "text-foreground",
                )}
              >
                {step}
              </span>
              {i < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-4 bg-border sm:w-8" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
