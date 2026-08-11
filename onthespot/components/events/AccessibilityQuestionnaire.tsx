"use client";

import { useState } from "react";
import {
  ACCESSIBILITY_CATEGORIES,
  ACCESSIBILITY_CATEGORY_LABELS,
  ACCESSIBILITY_FEATURE_META,
  ALL_ACCESSIBILITY_FEATURES,
  featuresByCategory,
} from "@/lib/accessibility";
import type { AccessibilityFeature, AccessibilityState } from "@prisma/client";

export interface AccessibilityAnswer {
  feature: AccessibilityFeature;
  state: AccessibilityState;
  note: string;
}

const STATE_OPTIONS: { value: AccessibilityState; label: string }[] = [
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "NOT_AVAILABLE", label: "Not available" },
  { value: "UNKNOWN", label: "Unknown" },
];

export function AccessibilityQuestionnaire({
  defaultAnswers = [],
}: {
  defaultAnswers?: { feature: AccessibilityFeature; state: AccessibilityState; note?: string | null }[];
}) {
  const defaults = new Map(defaultAnswers.map((a) => [a.feature, a]));
  const [answers, setAnswers] = useState<Record<string, AccessibilityAnswer>>(() =>
    Object.fromEntries(
      ALL_ACCESSIBILITY_FEATURES.map((f) => [
        f,
        { feature: f, state: defaults.get(f)?.state ?? "UNKNOWN", note: defaults.get(f)?.note ?? "" },
      ]),
    ),
  );
  const grouped = featuresByCategory();
  const completed = Object.values(answers).filter((a) => a.state !== "UNKNOWN").length;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-neutral-500">
        {completed} of {ALL_ACCESSIBILITY_FEATURES.length} features answered. Leaving a feature as &quot;Unknown&quot;
        is honest, but confirming what you do and don&apos;t offer helps attendees trust your listing.
      </p>
      {ACCESSIBILITY_CATEGORIES.map((category) => (
        <fieldset key={category} className="flex flex-col gap-4">
          <legend className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
            {ACCESSIBILITY_CATEGORY_LABELS[category]}
          </legend>
          {grouped[category].map((feature) => (
            <div key={feature} className="rounded-control border border-border p-3.5">
              <p className="text-sm font-medium">{ACCESSIBILITY_FEATURE_META[feature].label}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {STATE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name={`accessibility.${feature}.state`}
                      value={opt.value}
                      checked={answers[feature]?.state === opt.value}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [feature]: { ...prev[feature], state: opt.value } }))
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <input
                type="text"
                name={`accessibility.${feature}.note`}
                value={answers[feature]?.note ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [feature]: { ...prev[feature], note: e.target.value } }))
                }
                placeholder="Optional note"
                aria-label={`Note for ${ACCESSIBILITY_FEATURE_META[feature].label}`}
                className="tap-target mt-2 w-full rounded-control border border-border bg-surface px-3 py-1.5 text-xs"
              />
            </div>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
