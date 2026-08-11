"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  label: string;
  onClick?: () => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function MapView({
  markers,
  center,
  zoom = 12,
  className,
  onMoveEnd,
}: {
  markers: MapMarkerData[];
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMoveEnd?: (bounds: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) {
      setFailed(!MAPBOX_TOKEN);
      return;
    }

    let cancelled = false;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.default.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [center.lng, center.lat],
        zoom,
      });
      map.addControl(new mapboxgl.default.NavigationControl(), "top-right");
      if (onMoveEnd) {
        map.on("moveend", () => {
          const c = map.getCenter();
          onMoveEnd({ lat: c.lat, lng: c.lng });
        });
      }
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("mapbox-gl").then((mapboxgl) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = markers.map((marker) => {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", marker.label);
        el.className =
          "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--color-brand-600)] text-white shadow-md focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--color-brand-800)]";
        el.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/></svg>';
        if (marker.onClick) el.addEventListener("click", marker.onClick);
        return new mapboxgl.default.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .addTo(mapRef.current!);
      });
    });
  }, [markers]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface-muted p-8 text-center",
          className,
        )}
      >
        <p className="text-sm font-semibold">Map preview unavailable</p>
        <p className="max-w-xs text-xs text-neutral-500">
          Add a <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the interactive map.
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-brand-700 underline dark:text-brand-300"
        >
          Open in Google Maps
        </a>
      </div>
    );
  }

  return <div ref={containerRef} className={cn("rounded-card", className)} role="application" aria-label="Map" />;
}
