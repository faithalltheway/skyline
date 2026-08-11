import {
  ACCESSIBILITY_CATEGORIES,
  ACCESSIBILITY_CATEGORY_LABELS,
  ACCESSIBILITY_FEATURE_META,
  featuresByCategory,
} from "@/lib/accessibility";
import { AccessibilityStateBadge } from "@/components/ui/AccessibilityStateBadge";
import type { AccessibilityRow } from "@/types/event";

export function AccessibilityBreakdown({
  accessibility,
  hostName,
  lastVerifiedAt,
}: {
  accessibility: AccessibilityRow[];
  hostName: string;
  lastVerifiedAt: Date | null;
}) {
  const grouped = featuresByCategory();
  const byFeature = new Map(accessibility.map((a) => [a.feature, a]));

  return (
    <section aria-labelledby="accessibility-heading" className="rounded-card border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="accessibility-heading" className="text-xl font-extrabold">
          Accessibility breakdown
        </h2>
        {lastVerifiedAt && (
          <p className="text-xs text-neutral-500">
            Last verified {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(lastVerifiedAt)}
          </p>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Accessibility information supplied by <span className="font-semibold">{hostName}</span>.
      </p>

      <div className="mt-5 flex flex-col gap-6">
        {ACCESSIBILITY_CATEGORIES.map((category) => {
          const features = grouped[category];
          const rows = features.map((f) => byFeature.get(f) ?? { feature: f, state: "UNKNOWN" as const, note: null });
          const anyConfirmed = rows.some((r) => r.state === "CONFIRMED");
          if (!anyConfirmed && rows.every((r) => r.state === "UNKNOWN")) {
            // Still show the category, but it's fine to show all-unknown groups too — accessibility
            // status should never be hidden, only summarized.
          }
          return (
            <div key={category}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                {ACCESSIBILITY_CATEGORY_LABELS[category]}
              </h3>
              <ul className="mt-2 divide-y divide-border">
                {rows.map((row) => (
                  <li key={row.feature} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{ACCESSIBILITY_FEATURE_META[row.feature].label}</p>
                      {row.note && <p className="text-xs text-neutral-500">{row.note}</p>}
                    </div>
                    <AccessibilityStateBadge state={row.state} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
