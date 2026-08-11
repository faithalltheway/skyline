"use client";

import { useState } from "react";
import { TextField, SelectField } from "@/components/ui/Field";
import { CITY_COORDINATES } from "@/lib/geocoding";

const PRESETS = Object.entries(CITY_COORDINATES).map(([key, coords]) => ({
  key,
  label: key
    .split(",")
    .map((p) => p.trim())
    .join(", ")
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  ...coords,
}));

export function LocationFields({
  defaultValues,
}: {
  defaultValues?: {
    venueName?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zip?: string;
    latitude?: number;
    longitude?: number;
  };
}) {
  const [lat, setLat] = useState(defaultValues?.latitude ?? "");
  const [lng, setLng] = useState(defaultValues?.longitude ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [state, setState] = useState(defaultValues?.state ?? "");

  function applyPreset(key: string) {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setLat(preset.lat);
    setLng(preset.lng);
    const [presetCity, presetState] = preset.key.split(",");
    setCity(presetCity.replace(/\b\w/g, (c) => c.toUpperCase()));
    setState(presetState.toUpperCase());
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField label="Venue name" name="venueName" required defaultValue={defaultValues?.venueName} />
      <TextField label="Street address" name="addressLine1" required defaultValue={defaultValues?.addressLine1} />

      <SelectField
        label="Quick-fill city (Texas MVP metros)"
        name="cityPreset"
        onChange={(e) => applyPreset(e.target.value)}
        hint="Auto-fills city, state, and coordinates. You can still edit them below."
      >
        <option value="">Choose a city…</option>
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <TextField label="City" name="city" required value={city} onChange={(e) => setCity(e.target.value)} />
        <TextField label="State" name="state" maxLength={2} required value={state} onChange={(e) => setState(e.target.value)} />
        <TextField label="ZIP code" name="zip" required defaultValue={defaultValues?.zip} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Latitude"
          name="latitude"
          type="number"
          step="any"
          required
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          hint="Use the city quick-fill, or enter exact coordinates."
        />
        <TextField
          label="Longitude"
          name="longitude"
          type="number"
          step="any"
          required
          value={lng}
          onChange={(e) => setLng(e.target.value)}
        />
      </div>

      <SelectField label="Setting" name="indoorOutdoor" defaultValue="INDOOR">
        <option value="INDOOR">Indoor</option>
        <option value="OUTDOOR">Outdoor</option>
        <option value="BOTH">Indoor &amp; outdoor</option>
      </SelectField>
    </div>
  );
}
