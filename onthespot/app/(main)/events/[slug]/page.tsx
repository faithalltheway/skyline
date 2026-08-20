import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getEventDetail, getSimilarEvents } from "@/services/eventService";
import { recordEventView } from "@/services/analyticsService";
import { lookupCityCoordinates } from "@/lib/geocoding";
import { formatDateRange, formatPrice, titleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { AccessibilityBreakdown } from "@/components/events/AccessibilityBreakdown";
import { RsvpControls } from "@/components/events/RsvpControls";
import { SaveEventButton } from "@/components/events/SaveEventButton";
import { ShareButton } from "@/components/events/ShareButton";
import { ReportEventButton } from "@/components/events/ReportEventButton";
import { EventCard } from "@/components/events/EventCard";
import { MapView } from "@/components/map/MapView";
import { AttendeeList } from "@/components/events/AttendeeList";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug }, select: { title: true, description: true } });
  return { title: event?.title ?? "Event", description: event?.description?.slice(0, 150) };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const [profile, prefs] = await Promise.all([
    session?.user ? db.userProfile.findUnique({ where: { userId: session.user.id } }) : null,
    session?.user ? db.accessibilityPreference.findMany({ where: { userId: session.user.id } }) : Promise.resolve([]),
  ]);
  const origin = lookupCityCoordinates(profile?.city, profile?.state);

  const event = await getEventDetail(
    slug,
    prefs.map((p) => p.feature),
    origin,
  );
  if (!event || (event.status !== "PUBLISHED" && session?.user?.role !== "ADMIN" && session?.user?.id !== event.createdById)) {
    notFound();
  }

  await recordEventView(event.id).catch(() => {});

  const [similar, myRsvp, saved, appUrl, attendeeRsvps] = await Promise.all([
    getSimilarEvents(event, prefs.map((p) => p.feature)),
    session?.user ? db.rSVP.findUnique({ where: { eventId_userId: { eventId: event.id, userId: session.user.id } } }) : null,
    session?.user ? db.savedEvent.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: event.id } } }) : null,
    Promise.resolve(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    // Attendee identities are personal info — only shown to signed-in visitors, same as the rest of the app's social features.
    session?.user
      ? db.rSVP.findMany({
          where: { eventId: event.id, status: "GOING" },
          orderBy: { createdAt: "asc" },
          take: 24,
          include: { user: { select: { id: true, name: true, profile: { select: { username: true, avatarUrl: true } } } } },
        })
      : Promise.resolve([]),
  ]);

  const attendees = attendeeRsvps.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    username: r.user.profile?.username ?? null,
    avatarUrl: r.user.profile?.avatarUrl ?? null,
  }));

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="relative mb-6 aspect-[16/7] w-full overflow-hidden rounded-card bg-surface-muted">
        {event.coverImageUrl ? (
          <Image src={event.coverImageUrl} alt="" fill unoptimized className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Icon name="pin" size={48} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {event.isFeatured && (
          <Badge tone="accent">
            <Icon name="star" size={12} /> Featured
          </Badge>
        )}
        {event.categoryNames.map((c) => (
          <Badge key={c} tone="neutral">
            {c}
          </Badge>
        ))}
        {event.hostVerified && (
          <Badge tone="brand">
            <Icon name="shield" size={12} /> Verified host
          </Badge>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{event.title}</h1>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Icon name="clock" size={18} className="text-brand-600" />
          <span>{formatDateRange(event.startAt, event.endAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="pin" size={18} className="text-brand-600" />
          <span>
            {event.venueName}, {event.addressLine1}, {event.city}, {event.state} {event.zip}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand-700 dark:text-brand-300">{formatPrice(event.isFree, event.price)}</span>
          {event.ticketUrl && (
            <a href={event.ticketUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">
              Tickets
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Icon name="user" size={18} className="text-brand-600" />
          {event.organizationSlug ? (
            <Link href={`/organizations/${event.organizationSlug}`} className="font-semibold hover:underline">
              {event.hostName}
            </Link>
          ) : (
            <span className="font-semibold">{event.hostName}</span>
          )}
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <RsvpControls eventId={event.id} eventSlug={event.slug} initialStatus={myRsvp?.status ?? null} />
        <SaveEventButton eventId={event.id} initialSaved={!!saved} />
        <ShareButton title={event.title} url={`${appUrl}/events/${event.slug}`} />
        <span className="text-sm text-neutral-500">
          {event.goingCount} going · {event.interestedCount} interested
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-xl font-extrabold">
              About this event
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {event.description}
            </p>
            {(event.minAge || event.maxAge) && (
              <p className="mt-2 text-xs text-neutral-500">
                Age range: {event.minAge ?? "0"}–{event.maxAge ?? "Any"}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500">Setting: {titleCase(event.indoorOutdoor)}</p>
          </section>

          <AttendeeList attendees={attendees} totalGoing={event.goingCount} />

          <AccessibilityBreakdown
            accessibility={event.accessibility}
            hostName={event.hostName}
            lastVerifiedAt={event.accessibilityLastVerifiedAt}
          />

          {(event.accessibilityContactName || event.accessibilityContactEmail || event.accessibilityContactPhone) && (
            <section className="rounded-card border border-border bg-surface-muted p-5 text-sm">
              <h2 className="font-bold">Accessibility contact</h2>
              <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                {event.accessibilityContactName && <>{event.accessibilityContactName}<br /></>}
                {event.accessibilityContactEmail && (
                  <>
                    <a href={`mailto:${event.accessibilityContactEmail}`} className="underline">
                      {event.accessibilityContactEmail}
                    </a>
                    <br />
                  </>
                )}
                {event.accessibilityContactPhone && <>{event.accessibilityContactPhone}</>}
              </p>
            </section>
          )}

          <div>
            <ReportEventButton eventId={event.id} />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="directions-heading">
            <h2 id="directions-heading" className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
              Directions
            </h2>
            <MapView
              markers={[{ id: event.id, lat: event.latitude, lng: event.longitude, label: event.title }]}
              center={{ lat: event.latitude, lng: event.longitude }}
              zoom={14}
              className="h-56 w-full"
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Get directions →
            </a>
          </section>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="text-xl font-extrabold">
            Similar accessible events
          </h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((e) => (
              <li key={e.id}>
                <EventCard event={e} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
