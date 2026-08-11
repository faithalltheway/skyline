import { AccessibilityFeature, AccessibilityState } from "@prisma/client";
import { ACCESSIBILITY_FEATURE_META } from "./accessibility";

export interface EventAccessibilityRecord {
  feature: AccessibilityFeature;
  state: AccessibilityState;
  note?: string | null;
}

export interface AccessibilityMatchResult {
  /** Number of user-required features present in the event's data at all. */
  totalRequired: number;
  /** Number of user-required features explicitly CONFIRMED by the host. */
  confirmedCount: number;
  /** Percentage 0-100, rounded. 100 when the user has no requirements set. */
  percent: number;
  /** Per-feature breakdown for anything the user requires. */
  breakdown: {
    feature: AccessibilityFeature;
    label: string;
    state: AccessibilityState;
  }[];
  unmet: AccessibilityFeature[];
  summary: string;
}

/**
 * Compares a user's saved accessibility requirements against a single event's
 * structured accessibility data. UNKNOWN is never treated as a match — only
 * an explicit CONFIRMED counts toward the score, per product requirements.
 */
export function calculateAccessibilityMatch(
  userRequirements: AccessibilityFeature[],
  eventAccessibility: EventAccessibilityRecord[],
): AccessibilityMatchResult {
  const eventStateByFeature = new Map(
    eventAccessibility.map((row) => [row.feature, row.state]),
  );

  if (userRequirements.length === 0) {
    return {
      totalRequired: 0,
      confirmedCount: 0,
      percent: 100,
      breakdown: [],
      unmet: [],
      summary: "No accessibility preferences set",
    };
  }

  const breakdown = userRequirements.map((feature) => ({
    feature,
    label: ACCESSIBILITY_FEATURE_META[feature].shortLabel,
    state: eventStateByFeature.get(feature) ?? "UNKNOWN",
  }));

  const confirmedCount = breakdown.filter((row) => row.state === "CONFIRMED").length;
  const unmet = breakdown.filter((row) => row.state !== "CONFIRMED").map((row) => row.feature);
  const percent = Math.round((confirmedCount / userRequirements.length) * 100);

  return {
    totalRequired: userRequirements.length,
    confirmedCount,
    percent,
    breakdown,
    unmet,
    summary: `Matches ${confirmedCount} of your ${userRequirements.length} accessibility preference${
      userRequirements.length === 1 ? "" : "s"
    }`,
  };
}

export function matchLabel(percent: number): { label: string; tone: "high" | "medium" | "low" } {
  if (percent >= 80) return { label: "Great match", tone: "high" };
  if (percent >= 50) return { label: "Partial match", tone: "medium" };
  return { label: "Limited match", tone: "low" };
}
