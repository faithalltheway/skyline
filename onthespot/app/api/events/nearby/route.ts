import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { discoverEvents } from "@/services/eventService";
import type { AccessibilityFeature } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radius = Number(url.searchParams.get("radius") ?? 25);
  const accessibility = url.searchParams.getAll("accessibility") as AccessibilityFeature[];

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const session = await auth();
  const prefs = session?.user
    ? await db.accessibilityPreference.findMany({ where: { userId: session.user.id } })
    : [];

  const { events, total } = await discoverEvents({
    lat,
    lng,
    radiusMiles: radius,
    accessibility,
    userRequirements: prefs.map((p) => p.feature),
    sort: "distance",
  });

  return NextResponse.json({ events, total });
}
