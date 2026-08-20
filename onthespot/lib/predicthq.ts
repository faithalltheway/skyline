import "server-only";
import type { NormalizedImportedEvent } from "@/types/eventImport";

interface PredictHqEntity {
  entity_id?: string;
  name?: string;
  type?: string;
}

interface PredictHqEvent {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  start?: string;
  end?: string;
  location?: [number, number]; // [longitude, latitude] — GeoJSON order
  entities?: PredictHqEntity[];
  geo?: {
    address?: {
      formatted_address?: string;
      locality?: string;
      postcode?: string;
      region?: string;
    };
  };
}

interface PredictHqResponse {
  results?: PredictHqEvent[];
  error?: string;
  errors?: { field?: string; message?: string }[];
}

// PredictHQ's category taxonomy mapped onto our category slugs. Categories
// not listed (public-holidays, academic, politics, severe-weather, etc.)
// are simply never requested — see CATEGORIES below.
const CATEGORY_MAP: Record<string, string> = {
  concerts: "concert",
  sports: "sports",
  festivals: "festival",
  "performing-arts": "art",
  "community": "community-meetup",
  expos: "education",
};

// Only request categories that correspond to real, attendable local events —
// PredictHQ also covers things like severe weather and public holidays that
// aren't "events" in our sense.
const CATEGORIES = Object.keys(CATEGORY_MAP).join(",");

export async function fetchPredictHqEvents(city: string, state: string, lat: number, lng: number): Promise<NormalizedImportedEvent[]> {
  const token = process.env.PREDICTHQ_ACCESS_TOKEN;
  if (!token) throw new Error("PREDICTHQ_ACCESS_TOKEN is not configured");

  const url = new URL("https://api.predicthq.com/v1/events/");
  url.searchParams.set("within", `25mi@${lat},${lng}`);
  url.searchParams.set("country", "US");
  url.searchParams.set("category", CATEGORIES);
  url.searchParams.set("active.gte", new Date().toISOString().slice(0, 10));
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort", "start");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  const data = (await res.json()) as PredictHqResponse;

  if (!res.ok) {
    const message = data.error || data.errors?.[0]?.message || `HTTP ${res.status}`;
    throw new Error(`PredictHQ error: ${message}`);
  }

  const normalized: NormalizedImportedEvent[] = [];

  for (const event of data.results ?? []) {
    if (!event.title || !event.start || !event.location) continue;

    const [lon, evLat] = event.location;
    const startAt = new Date(event.start);
    const endAt = event.end ? new Date(event.end) : new Date(startAt.getTime() + 3 * 60 * 60 * 1000);
    const venueEntity = event.entities?.find((e) => e.type === "venue");
    const venueName = venueEntity?.name || event.title;
    const address = event.geo?.address;

    normalized.push({
      externalId: event.id,
      title: event.title,
      description: event.description?.trim() || `${event.title} — an upcoming ${event.category ?? "local"} event near ${city}, ${state}.`,
      startAt,
      endAt,
      venueName,
      addressLine1: address?.formatted_address || "Address not provided",
      city: address?.locality || city,
      state,
      zip: address?.postcode || "00000",
      latitude: evLat,
      longitude: lon,
      // PredictHQ provides no pricing data at all — that's not the same as
      // the event being free, so don't conflate the two.
      isFree: false,
      price: null,
      ticketUrl: null,
      coverImageUrl: null,
      categorySlug: event.category ? (CATEGORY_MAP[event.category] ?? null) : null,
    });
  }

  return normalized;
}
