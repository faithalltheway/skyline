import "server-only";

export interface SerpApiEventResult {
  title?: string;
  description?: string;
  link?: string;
  date?: { start_date?: string; when?: string };
  address?: string[];
  venue?: { name?: string; phone_number?: string };
  thumbnail?: string;
  ticket_info?: { source?: string; link?: string; link_type?: string }[];
  event_location_map?: { link?: string };
}

interface SerpApiEventsResponse {
  events_results?: SerpApiEventResult[];
  error?: string;
}

const SERPAPI_BASE = "https://serpapi.com/search.json";

/**
 * Queries SerpApi's Google Events engine for a free-text location query
 * (e.g. "events in Austin, TX"). Google's events data doesn't paginate
 * cleanly for this engine, so this returns whatever a single page yields.
 */
export async function fetchGoogleEvents(query: string): Promise<SerpApiEventResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not configured");

  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("engine", "google_events");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`SerpApi request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SerpApiEventsResponse;
  if (data.error) {
    throw new Error(`SerpApi error: ${data.error}`);
  }

  return data.events_results ?? [];
}
