const EARTH_RADIUS_MILES = 3958.8;

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in miles. */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

/**
 * Bounding box approximation for a radius search — used to cheaply pre-filter
 * rows in SQL (via indexed lat/lon range) before precise Haversine sorting.
 */
export function boundingBox(lat: number, lon: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69.0;
  const lonDelta = radiusMiles / (69.0 * Math.cos(toRadians(lat)) || 1);
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}

export const RADIUS_OPTIONS_MILES = [5, 10, 25, 50, 100] as const;
export type RadiusMiles = (typeof RADIUS_OPTIONS_MILES)[number];
