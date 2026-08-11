"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ClusteredMapView } from "@/components/map/ClusteredMapView";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatDateRange, formatDistance } from "@/lib/utils";
import { ACCESSIBILITY_CATEGORIES, ACCESSIBILITY_CATEGORY_LABELS, ACCESSIBILITY_FEATURE_META, featuresByCategory } from "@/lib/accessibility";
import { RADIUS_OPTIONS_MILES } from "@/lib/geo";
import type { AccessibilityFeature } from "@prisma/client";
import type { EventCardData } from "@/types/event";

export function MapPageClient({
  initialEvents,
  center,
}: {
  initialEvents: EventCardData[];
  center: { lat: number; lng: number };
}) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number; radiusMiles: number } | null>(null);
  const [radius, setRadius] = useState(25);
  const [accessibility, setAccessibility] = useState<AccessibilityFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const mapPoints = useMemo(
    () => events.map((e) => ({ id: e.id, lat: e.latitude, lng: e.longitude, title: e.title, matchPercent: e.matchPercent })),
    [events],
  );

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const grouped = featuresByCategory();

  async function searchThisArea() {
    if (!pendingCenter) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(pendingCenter.lat),
      lng: String(pendingCenter.lng),
      radius: String(radius),
    });
    accessibility.forEach((a) => params.append("accessibility", a));
    const res = await fetch(`/api/events/nearby?${params.toString()}`);
    const data = (await res.json()) as { events: EventCardData[] };
    setEvents(data.events);
    setPendingCenter(null);
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:flex-row">
      <div className="relative flex-1">
        <ClusteredMapView
          points={mapPoints}
          center={center}
          className="h-full w-full"
          onSelect={setSelectedId}
          onMoveEnd={(c) => setPendingCenter(c)}
        />

        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2">
          {pendingCenter && (
            <Button type="button" size="sm" onClick={searchThisArea} disabled={loading}>
              {loading ? "Searching…" : "Search this area"}
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
            <Icon name="filter" size={16} /> Filters
          </Button>
        </div>

        {filtersOpen && (
          <div className="absolute left-4 top-16 z-10 max-h-[70%] w-72 overflow-y-auto rounded-card border border-border bg-surface p-4 shadow-lg">
            <label htmlFor="map-radius" className="text-sm font-medium">
              Radius
            </label>
            <select
              id="map-radius"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="tap-target mt-1 mb-4 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm"
            >
              {RADIUS_OPTIONS_MILES.map((r) => (
                <option key={r} value={r}>
                  {r} miles
                </option>
              ))}
            </select>
            {ACCESSIBILITY_CATEGORIES.map((cat) => (
              <fieldset key={cat} className="mb-3">
                <legend className="text-xs font-semibold uppercase text-neutral-500">{ACCESSIBILITY_CATEGORY_LABELS[cat]}</legend>
                {grouped[cat].map((f) => (
                  <label key={f} className="flex items-center gap-2 py-0.5 text-sm">
                    <input
                      type="checkbox"
                      checked={accessibility.includes(f)}
                      onChange={() =>
                        setAccessibility((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
                      }
                    />
                    {ACCESSIBILITY_FEATURE_META[f].shortLabel}
                  </label>
                ))}
              </fieldset>
            ))}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPendingCenter(pendingCenter ?? { ...center, radiusMiles: radius });
                searchThisArea();
              }}
            >
              Apply
            </Button>
          </div>
        )}

        {selected && (
          <div className="absolute bottom-4 left-1/2 z-10 w-[min(92vw,380px)] -translate-x-1/2 rounded-card border border-border bg-surface p-3 shadow-xl">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Close preview"
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-surface-muted"
            >
              <Icon name="x" size={16} />
            </button>
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control bg-surface-muted">
                {selected.coverImageUrl && <Image src={selected.coverImageUrl} alt="" fill unoptimized className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{selected.title}</p>
                <p className="text-xs text-neutral-500">{formatDateRange(selected.startAt, selected.endAt)}</p>
                <Badge tone={selected.matchPercent >= 80 ? "confirmed" : "unknown"} className="mt-1">
                  {selected.matchPercent}% match
                </Badge>
              </div>
            </div>
            <Link href={`/events/${selected.slug}`} className="mt-2 block">
              <Button type="button" size="sm" className="w-full">
                View event
              </Button>
            </Link>
          </div>
        )}
      </div>

      <aside className="w-full overflow-y-auto border-t border-border bg-surface p-4 md:h-full md:w-96 md:border-l md:border-t-0">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
          {events.length} event{events.length === 1 ? "" : "s"} in view
        </h2>
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => setSelectedId(event.id)}
                className="flex w-full items-center gap-3 rounded-control border border-border p-3 text-left hover:bg-surface-muted"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-control bg-surface-muted">
                  {event.coverImageUrl && <Image src={event.coverImageUrl} alt="" fill unoptimized className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-neutral-500">
                    {event.distanceMiles != null ? formatDistance(event.distanceMiles) : event.city} · {event.matchPercent}% match
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
