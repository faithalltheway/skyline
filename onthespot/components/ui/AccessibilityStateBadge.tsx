import type { AccessibilityState } from "@prisma/client";
import { Badge } from "./Badge";

const CONFIG: Record<AccessibilityState, { label: string; tone: "confirmed" | "unavailable" | "unknown"; icon: string }> = {
  CONFIRMED: { label: "Confirmed", tone: "confirmed", icon: "✓" },
  NOT_AVAILABLE: { label: "Not available", tone: "unavailable", icon: "✕" },
  UNKNOWN: { label: "Not confirmed", tone: "unknown", icon: "?" },
};

export function AccessibilityStateBadge({ state }: { state: AccessibilityState }) {
  const config = CONFIG[state];
  return (
    <Badge tone={config.tone}>
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
