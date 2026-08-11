import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { lookupCityCoordinates } from "@/lib/geocoding";
import { calculateAccessibilityMatch } from "@/lib/matching";
import { haversineDistanceMiles } from "@/lib/geo";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import type { EventCardData } from "@/types/event";

export const metadata = { title: "Saved events" };

export default async function SavedPage() {
  const user = await requireUser();
  const [saved, profile, prefs] = await Promise.all([
    db.savedEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            categories: { include: { category: true } },
            accessibility: true,
            organization: { select: { name: true, slug: true, verificationStatus: true } },
            createdBy: { select: { name: true } },
            _count: { select: { rsvps: { where: { status: "GOING" } } } },
          },
        },
      },
    }),
    db.userProfile.findUnique({ where: { userId: user.id } }),
    db.accessibilityPreference.findMany({ where: { userId: user.id } }),
  ]);

  const origin = lookupCityCoordinates(profile?.city, profile?.state);
  const requirements = prefs.map((p) => p.feature);

  const events: EventCardData[] = saved.map(({ event }) => {
    const match = calculateAccessibilityMatch(requirements, event.accessibility);
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      coverImageUrl: event.coverImageUrl ?? event.images[0]?.url ?? null,
      startAt: event.startAt,
      endAt: event.endAt,
      venueName: event.venueName,
      city: event.city,
      state: event.state,
      latitude: event.latitude,
      longitude: event.longitude,
      isFree: event.isFree,
      price: event.price?.toString() ?? null,
      isFeatured: event.isFeatured,
      status: event.status,
      hostName: event.organization?.name ?? event.createdBy.name,
      hostVerified: event.organization?.verificationStatus === "VERIFIED",
      hostSlug: event.organization?.slug ?? null,
      distanceMiles: origin ? haversineDistanceMiles(origin.lat, origin.lng, event.latitude, event.longitude) : null,
      matchPercent: match.percent,
      matchSummary: match.summary,
      goingCount: event._count.rsvps,
      categoryNames: event.categories.map((c) => c.category.name),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold">Saved events</h1>
      <p className="mt-1 text-neutral-500">Events you&apos;ve bookmarked to revisit later.</p>

      {events.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Icon name="heart" size={32} />}
            title="No saved events yet"
            body="Save events from Discover or the map to keep track of ones you're interested in."
            action={<LinkButton href="/discover">Browse events</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} saved />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
