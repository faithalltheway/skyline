import { RADIUS_OPTIONS_MILES } from "@/lib/geo";
import {
  ACCESSIBILITY_CATEGORIES,
  ACCESSIBILITY_CATEGORY_LABELS,
  ACCESSIBILITY_FEATURE_META,
  featuresByCategory,
} from "@/lib/accessibility";
import { UseMyLocationButton } from "./UseMyLocationButton";
import type { DiscoverFilters } from "@/lib/validations/discover";

interface Category {
  slug: string;
  name: string;
}

export function DiscoverControls({ filters, categories }: { filters: DiscoverFilters; categories: Category[] }) {
  const grouped = featuresByCategory();

  return (
    <form id="discover-filters" method="get" className="flex flex-col gap-4">
      <input type="hidden" name="lat" defaultValue={filters.lat ?? ""} />
      <input type="hidden" name="lng" defaultValue={filters.lng ?? ""} />

      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Search events
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Concerts, food festivals, meetups…"
            className="tap-target rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="radius" className="text-sm font-medium">
            Distance
          </label>
          <select
            id="radius"
            name="radius"
            defaultValue={filters.radius}
            className="tap-target rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm"
          >
            {RADIUS_OPTIONS_MILES.map((r) => (
              <option key={r} value={r}>
                Within {r} mi
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sort" className="text-sm font-medium">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={filters.sort}
            className="tap-target rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm"
          >
            <option value="match">Best match</option>
            <option value="date">Soonest</option>
            <option value="distance">Nearest</option>
          </select>
        </div>

        <UseMyLocationButton />

        <button
          type="submit"
          className="tap-target rounded-control bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Search
        </button>
      </div>

      <details className="rounded-card border border-border bg-surface open:pb-4 shadow-sm">
        <summary className="tap-target flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold">
          <span>Accessibility &amp; more filters</span>
          <span aria-hidden="true" className="text-neutral-400">
            {(filters.accessibility.length || filters.categories.length) > 0
              ? `${filters.accessibility.length + filters.categories.length} active`
              : "Show"}
          </span>
        </summary>

        <div className="flex flex-col gap-6 px-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">When</legend>
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label="From date"
                type="date"
                name="dateFrom"
                defaultValue={filters.dateFrom}
                className="tap-target rounded-control border border-border bg-surface px-3 py-2 text-sm"
              />
              <input
                aria-label="To date"
                type="date"
                name="dateTo"
                defaultValue={filters.dateTo}
                className="tap-target rounded-control border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Price</legend>
              {[
                ["any", "Any price"],
                ["free", "Free"],
                ["paid", "Paid"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="price" value={value} defaultChecked={filters.price === value} />
                  {label}
                </label>
              ))}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Setting</legend>
              {[
                ["ANY", "Any"],
                ["INDOOR", "Indoor"],
                ["OUTDOOR", "Outdoor"],
                ["BOTH", "Indoor & outdoor"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="indoorOutdoor"
                    value={value}
                    defaultChecked={filters.indoorOutdoor === value}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </div>

          {categories.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Category</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {categories.map((c) => (
                  <label key={c.slug} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="categories"
                      value={c.slug}
                      defaultChecked={filters.categories.includes(c.slug)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold">Accessibility features</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {ACCESSIBILITY_CATEGORIES.map((category) => (
                <fieldset key={category} className="flex flex-col gap-1.5">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {ACCESSIBILITY_CATEGORY_LABELS[category]}
                  </legend>
                  {grouped[category].map((feature) => (
                    <label key={feature} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="accessibility"
                        value={feature}
                        defaultChecked={filters.accessibility.includes(feature)}
                      />
                      {ACCESSIBILITY_FEATURE_META[feature].shortLabel}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="matchAll" value="true" defaultChecked={filters.matchAll} />
              Only show events matching ALL selected accessibility features
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="tap-target rounded-control bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Apply filters
            </button>
            <a href="/discover" className="text-sm font-semibold text-neutral-500 hover:underline">
              Clear all
            </a>
          </div>
        </div>
      </details>
    </form>
  );
}
