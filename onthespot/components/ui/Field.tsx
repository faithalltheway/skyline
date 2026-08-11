import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
  className?: string;
}

export function FieldWrapper({ label, hint, error, required, children, className }: FieldWrapperProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
        {required && (
          <span aria-hidden="true" className="text-accent-600">
            {" "}
            *
          </span>
        )}
      </label>
      {children({ inputId, describedBy })}
      {hint && (
        <p id={hintId} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-unavailable">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          required={required}
          className={cn(
            "tap-target rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-neutral-400",
            "focus-visible:outline-none",
            error && "border-unavailable",
            className,
          )}
          {...props}
        />
      )}
    </FieldWrapper>
  ),
);
TextField.displayName = "TextField";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, className, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          required={required}
          className={cn(
            "rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-neutral-400",
            "focus-visible:outline-none min-h-28",
            error && "border-unavailable",
            className,
          )}
          {...props}
        />
      )}
    </FieldWrapper>
  ),
);
TextAreaField.displayName = "TextAreaField";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, className, children, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <select
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          required={required}
          className={cn(
            "tap-target rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground",
            "focus-visible:outline-none",
            error && "border-unavailable",
            className,
          )}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  ),
);
SelectField.displayName = "SelectField";
