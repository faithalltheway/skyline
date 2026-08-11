"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";

export interface ClusterMapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  matchPercent: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SOURCE_ID = "events-source";

export function ClusteredMapView({
  points,
  center,
  zoom = 10,
  className,
  onSelect,
  onMoveEnd,
}: {
  points: ClusterMapPoint[];
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onSelect: (id: string) => void;
  onMoveEnd: (bounds: { lat: number; lng: number; radiusMiles: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  const onMoveEndRef = useRef(onMoveEnd);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onMoveEndRef.current = onMoveEnd;
  }, [onSelect, onMoveEnd]);

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
      map.addControl(new mapboxgl.default.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");

      map.on("load", () => {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#0f8a7f",
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 25, 30],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["DIN Pro Bold"] },
          paint: { "text-color": "#ffffff" },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "case",
              [">=", ["get", "matchPercent"], 80],
              "#157f4b",
              [">=", ["get", "matchPercent"], 50],
              "#c99a00",
              "#0f8a7f",
            ],
            "circle-radius": 9,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.on("click", "clusters", (e: MapMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
          if (clusterId == null) return;
          source.getClusterExpansionZoom(clusterId, (err, targetZoom) => {
            if (err || targetZoom == null) return;
            const geometry = features[0].geometry;
            if (geometry.type === "Point") {
              map.easeTo({ center: geometry.coordinates as [number, number], zoom: targetZoom });
            }
          });
        });

        map.on("click", "unclustered-point", (e: MapMouseEvent) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) onSelectRef.current(id);
        });

        map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
        map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));

        setReady(true);
      });

      map.on("moveend", () => {
        const c = map.getCenter();
        const bounds = map.getBounds();
        if (!bounds) return;
        const radiusMiles = Math.round(
          (Math.abs(bounds.getNorth() - bounds.getSouth()) * 69) / 2,
        );
        onMoveEndRef.current({ lat: c.lat, lng: c.lng, radiusMiles: Math.max(radiusMiles, 5) });
      });

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
    if (!ready || !mapRef.current) return;
    const source = mapRef.current.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        properties: { id: p.id, title: p.title, matchPercent: p.matchPercent },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    });
  }, [points, ready]);

  if (failed) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface-muted p-8 text-center", className)}>
        <p className="text-sm font-semibold">Map view unavailable</p>
        <p className="max-w-xs text-xs text-neutral-500">
          Add a <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> environment variable to enable the interactive map. Browse
          events in the list view meanwhile.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className={cn("rounded-card", className)} role="application" aria-label="Events map" />;
}
