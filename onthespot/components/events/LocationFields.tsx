"use client";

import { useState } from "react";
import { TextField, SelectField } from "@/components/ui/Field";
import { CITY_COORDINATES } from "@/lib/geocoding";

// A representative ZIP per seeded metro so the quick-fill preset produces a
// fully valid location in one click instead of leaving ZIP for the user to
// remember on its own.
const CITY_ZIPS: Record<string, string> = {
  "waco,tx": "76701",
  "austin,tx": "78701",
  "dallas,tx": "75201",
  "houston,tx": "77002",
  "san antonio,tx": "78205",
  "fort worth,tx": "76102",
};

const PRESETS = Object.entries(CITY_COORDINATES).map(([key, coords]) => ({
  key,
  label: key
    .split(",")
    .map((p) => p.trim())
    .join(", ")
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  ...coords,
}));

export interface LocationFieldErrors {
  venueName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: string;
  longitude?: string;
}

export function LocationFields({
  defaultValues,
  required = true,
  errors,
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
  // Whether these fields carry the HTML `required` attribute. Pass `false`
  // when this step is hidden (e.g. `step !== locationStepIndex` in a
  // multi-step wizard) — a `required` field inside a `hidden` step still
  // blocks native form submission, but the browser can't show its
  // validation message since the field isn't rendered, so submission just
  // silently does nothing with no visible error.
  required?: boolean;
  errors?: LocationFieldErrors;
}) {
  const [lat, setLat] = useState(defaultValues?.latitude ?? "");
  const [lng, setLng] = useState(defaultValues?.longitude ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [state, setState] = useState(defaultValues?.state ?? "");
  const [zip, setZip] = useState(defaultValues?.zip ?? "");

  function applyPreset(key: string) {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setLat(preset.lat);
    setLng(preset.lng);
    const [presetCity, presetState] = preset.key.split(",");
    setCity(presetCity.replace(/\b\w/g, (c) => c.toUpperCase()));
    setState(presetState.toUpperCase());
    setZip(CITY_ZIPS[preset.key] ?? "");
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Venue name"
        name="venueName"
        required={required}
        defaultValue={defaultValues?.venueName}
        error={errors?.venueName}
      />
      <TextField
        label="Street address"
        name="addressLine1"
        required={required}
        defaultValue={defaultValues?.addressLine1}
        error={errors?.addressLine1}
      />

      <SelectField
        label="Quick-fill city (Texas MVP metros)"
        name="cityPreset"
        onChange={(e) => applyPreset(e.target.value)}
        hint="Auto-fills city, state, ZIP, and coordinates. You can still edit them below."
      >
        <option value="">Choose a city…</option>
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <TextField
          label="City"
          name="city"
          required={required}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          error={errors?.city}
        />
        <TextField
          label="State"
          name="state"
          maxLength={2}
          required={required}
          value={state}
          onChange={(e) => setState(e.target.value)}
          error={errors?.state}
        />
        <TextField
          label="ZIP code"
          name="zip"
          required={required}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          error={errors?.zip}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Latitude"
          name="latitude"
          type="number"
          step="any"
          required={required}
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          hint="Use the city quick-fill, or enter exact coordinates."
          error={errors?.latitude}
        />
        <TextField
          label="Longitude"
          name="longitude"
          type="number"
          step="any"
          required={required}
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          error={errors?.longitude}
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
