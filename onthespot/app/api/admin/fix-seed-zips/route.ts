import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const maxDuration = 30;

interface MapboxFeature {
  place_name?: string;
  text?: string;
  address?: string;
  place_type?: string[];
}

interface MapboxGeocodeResponse {
  features?: MapboxFeature[];
}

async function reverseGeocode(lat: number, lng: number, types: string, token: string): Promise<MapboxFeature[]> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
  url.searchParams.set("types", types);
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as MapboxGeocodeResponse;
  return data.features ?? [];
}

// One-off data-quality fix for events with real coordinates but placeholder
// address fields. Two placeholders, two different confidence levels:
//
// - zip="00000": fixed for every non-Google-Events source, including the
//   seed script's jittered city-center coordinates — postal-code
//   boundaries are coarse enough that even an approximate point almost
//   always resolves to the correct one.
// - addressLine1="Address not provided": only fixed for Ticketmaster/
//   PredictHQ, which return the venue's real precise coordinates (not
//   jittered), so a street-level reverse-geocode is trustworthy there.
//   Never attempted for seed data, where the coordinate is a randomized
//   approximation and a specific street number would be actively
//   misleading rather than just incomplete.
//
// Google Events is excluded entirely — confirmed unreliable, its rows are
// unpublished instead (see /api/admin/unpublish-google-events). Idempotent:
// only touches rows still at a placeholder value.
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
    where: {
      OR: [{ zip: "00000" }, { addressLine1: "Address not provided" }],
      NOT: { externalSource: "GOOGLE_EVENTS" },
    },
    select: { id: true, title: true, externalSource: true, zip: true, addressLine1: true, latitude: true, longitude: true },
  });

  const results: { id: string; title: string; zip?: string; addressLine1?: string; error?: string }[] = [];

  for (const event of events) {
    const update: { zip?: string; addressLine1?: string } = {};
    try {
      if (event.zip === "00000") {
        const [postcode] = await reverseGeocode(event.latitude, event.longitude, "postcode", token);
        if (postcode?.text) update.zip = postcode.text;
      }

      const preciseSource = event.externalSource === "TICKETMASTER" || event.externalSource === "PREDICTHQ";
      if (event.addressLine1 === "Address not provided" && preciseSource) {
        const [address] = await reverseGeocode(event.latitude, event.longitude, "address", token);
        if (address?.place_name) update.addressLine1 = address.place_name.split(",")[0];
      }

      if (Object.keys(update).length > 0) {
        await db.event.update({ where: { id: event.id }, data: update });
      }
      results.push({ id: event.id, title: event.title, ...update });
    } catch (err) {
      results.push({ id: event.id, title: event.title, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const fixed = results.filter((r) => r.zip || r.addressLine1).length;
  return NextResponse.json({ status: "ok", checked: events.length, fixed, results });
}
