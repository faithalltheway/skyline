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

// One-off data-quality fix for events with a real venue/address/coordinates
// but a placeholder zip="00000": the seed script hardcoded that on every
// demo event, and Ticketmaster/PredictHQ occasionally don't return a postal
// code even when they return real venue coordinates. Reverse-geocodes each
// event's real coordinates via Mapbox to backfill the actual zip rather
// than guessing. Deliberately excludes Google Events — that source is
// confirmed unreliable and its rows are unpublished instead (see
// /api/admin/unpublish-google-events), so there's no point fixing just
// their zip while their street address is still a placeholder too.
// Idempotent: only touches rows still at "00000", so re-running is a no-op.
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
    where: { zip: "00000", NOT: { externalSource: "GOOGLE_EVENTS" } },
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
