import { auth } from "@/auth";
import { db } from "@/lib/db";
import { discoverEvents } from "@/services/eventService";
import { lookupCityCoordinates } from "@/lib/geocoding";
import { MapPageClient } from "./MapPageClient";

export const metadata = { title: "Map" };

const DEFAULT_CENTER = { lat: 31.5493, lng: -97.1467 }; // Waco, TX

export default async function MapPage() {
  const session = await auth();
  const [profile, prefs] = await Promise.all([
    session?.user ? db.userProfile.findUnique({ where: { userId: session.user.id } }) : null,
    session?.user ? db.accessibilityPreference.findMany({ where: { userId: session.user.id } }) : Promise.resolve([]),
  ]);

  const center = lookupCityCoordinates(profile?.city, profile?.state) ?? DEFAULT_CENTER;

  const { events } = await discoverEvents({
    lat: center.lat,
    lng: center.lng,
    radiusMiles: 50,
    userRequirements: prefs.map((p) => p.feature),
    sort: "distance",
  });

  return <MapPageClient initialEvents={events} center={center} />;
}
