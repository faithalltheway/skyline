import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-10 text-center">
      {icon && <span className="text-neutral-400">{icon}</span>}
      <h2 className="text-lg font-bold">{title}</h2>
      {body && <p className="max-w-sm text-sm text-neutral-500">{body}</p>}
      {action}
    </div>
  );
}
