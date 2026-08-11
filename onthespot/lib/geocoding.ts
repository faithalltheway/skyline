/**
 * Minimal static city lookup for the Texas metros used in seed data. This
 * stands in for a real geocoding API (Mapbox/Google) — swap in a live
 * geocoder call here for production without changing any call sites.
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "waco,tx": { lat: 31.5493, lng: -97.1467 },
  "austin,tx": { lat: 30.2672, lng: -97.7431 },
  "dallas,tx": { lat: 32.7767, lng: -96.797 },
  "houston,tx": { lat: 29.7604, lng: -95.3698 },
  "san antonio,tx": { lat: 29.4241, lng: -98.4936 },
  "fort worth,tx": { lat: 32.7555, lng: -97.3308 },
};

export function lookupCityCoordinates(city?: string | null, state?: string | null) {
  if (!city || !state) return null;
  const key = `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`;
  return CITY_COORDINATES[key] ?? null;
}
