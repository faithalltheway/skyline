import { auth } from "@/auth";
import { db } from "@/lib/db";
import { discoverEvents } from "@/services/eventService";
import { parseDiscoverSearchParams } from "@/lib/validations/discover";
import { lookupCityCoordinates } from "@/lib/geocoding";
import { DiscoverControls } from "@/components/discover/FilterPanel";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Discover events" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseDiscoverSearchParams(sp);
  const session = await auth();

  const [categories, profile, prefs] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    session?.user ? db.userProfile.findUnique({ where: { userId: session.user.id } }) : null,
    session?.user
      ? db.accessibilityPreference.findMany({ where: { userId: session.user.id } })
      : Promise.resolve([]),
  ]);

  const origin =
    filters.lat != null && filters.lng != null
      ? { lat: filters.lat, lng: filters.lng }
      : lookupCityCoordinates(profile?.city, profile?.state);

  const { events, total, pageSize } = await discoverEvents({
    q: filters.q,
    categories: filters.categories,
    accessibility: filters.accessibility,
    matchAll: filters.matchAll,
    price: filters.price,
    indoorOutdoor: filters.indoorOutdoor,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    lat: origin?.lat,
    lng: origin?.lng,
    radiusMiles: origin ? filters.radius : undefined,
    userRequirements: prefs.map((p) => p.feature),
    sort: filters.sort,
    page: filters.page,
  });

  const savedIds = session?.user
    ? new Set((await db.savedEvent.findMany({ where: { userId: session.user.id }, select: { eventId: true } })).map((s) => s.eventId))
    : new Set<string>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Discover accessible events</h1>
        <p className="mt-1 text-neutral-500">
          {profile?.city ? `Showing events near ${profile.city}, ${profile.state}` : "Search or share your location to find events nearby"}
          {prefs.length > 0 && ` · personalized to your ${prefs.length} accessibility preference${prefs.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside aria-label="Filters">
          <DiscoverControls filters={filters} categories={categories} />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-500">
              {total} event{total === 1 ? "" : "s"} found
            </p>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={<Icon name="compass" size={32} />}
              title="No events match your filters"
              body="Try widening your distance, clearing an accessibility filter, or searching a different keyword."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} saved={savedIds.has(event.id)} />
                </li>
              ))}
            </ul>
          )}

          <Pagination total={total} pageSize={pageSize} currentPage={filters.page} searchParams={sp} />
        </div>
      </div>
    </div>
  );
}
