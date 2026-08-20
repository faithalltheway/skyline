import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const maxDuration = 30;

interface MapboxGeocodeResponse {
  features?: { text?: string; place_type?: string[] }[];
}

async function lookupZip(lat: number, lng: number, token: string): Promise<string | null> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
  url.searchParams.set("types", "postcode");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as MapboxGeocodeResponse;
  return data.features?.[0]?.text ?? null;
}

// One-off data-quality fix: the seed script hardcoded zip="00000" on every
// demo event. Their venue name/address/city/state/coordinates are all real
// (jittered around real city centers) — only the zip is a placeholder.
// Reverse-geocodes each event's real coordinates via Mapbox to backfill the
// actual zip rather than guessing. Idempotent: only touches rows still at
// the "00000" placeholder, so re-running is a no-op once fixed.
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "NEXT_PUBLIC_MAPBOX_TOKEN is not configured" }, { status: 503 });
  }

  const events = await db.event.findMany({
    where: { externalSource: null, zip: "00000" },
    select: { id: true, title: true, latitude: true, longitude: true },
  });

  const results: { id: string; title: string; zip: string | null; error?: string }[] = [];

  for (const event of events) {
    try {
      const zip = await lookupZip(event.latitude, event.longitude, token);
      if (zip) {
        await db.event.update({ where: { id: event.id }, data: { zip } });
      }
      results.push({ id: event.id, title: event.title, zip });
    } catch (err) {
      results.push({ id: event.id, title: event.title, zip: null, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const fixed = results.filter((r) => r.zip).length;
  return NextResponse.json({ status: "ok", checked: events.length, fixed, results });
}
