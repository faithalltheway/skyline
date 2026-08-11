import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDateRange } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import { CancelRsvpButton } from "@/components/events/CancelRsvpButton";

export const metadata = { title: "My RSVPs" };

export default async function RsvpsPage() {
  const user = await requireUser();
  const rsvps = await db.rSVP.findMany({
    where: { userId: user.id, status: { in: ["GOING", "INTERESTED"] } },
    orderBy: { event: { startAt: "asc" } },
    include: {
      event: {
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      },
    },
  });

  const now = new Date();
  const upcoming = rsvps.filter((r) => r.event.endAt >= now);
  const past = rsvps.filter((r) => r.event.endAt < now);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold">My RSVPs</h1>
      <p className="mt-1 text-neutral-500">Events you&apos;re going to or interested in.</p>

      <section className="mt-8" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-lg font-bold">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Icon name="check" size={28} />}
              title="No upcoming RSVPs"
              body="RSVP to an event from Discover to see it here."
              action={<LinkButton href="/discover">Browse events</LinkButton>}
            />
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center gap-4 rounded-card border border-border bg-surface p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control bg-surface-muted">
                  {r.event.coverImageUrl && (
                    <Image src={r.event.coverImageUrl} alt="" fill unoptimized className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/events/${r.event.slug}`} className="font-bold hover:underline">
                    {r.event.title}
                  </Link>
                  <p className="text-sm text-neutral-500">{formatDateRange(r.event.startAt, r.event.endAt)}</p>
                  <Badge tone={r.status === "GOING" ? "confirmed" : "neutral"} className="mt-1">
                    {r.status === "GOING" ? "Going" : "Interested"}
                  </Badge>
                </div>
                <CancelRsvpButton eventId={r.eventId} eventSlug={r.event.slug} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10" aria-labelledby="past-heading">
          <h2 id="past-heading" className="text-lg font-bold">
            Past ({past.length})
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {past.map((r) => (
              <li key={r.id} className="flex items-center gap-4 rounded-card border border-border bg-surface-muted p-4 opacity-80">
                <div className="flex-1">
                  <Link href={`/events/${r.event.slug}`} className="font-bold hover:underline">
                    {r.event.title}
                  </Link>
                  <p className="text-sm text-neutral-500">{formatDateRange(r.event.startAt, r.event.endAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
