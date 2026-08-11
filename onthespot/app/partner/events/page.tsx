import Link from "next/link";
import { requireOrganization } from "@/lib/authz";
import { db } from "@/lib/db";
import { accessibilityCompletionPercent } from "@/services/eventCreationService";
import { ALL_ACCESSIBILITY_FEATURES } from "@/lib/accessibility";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRange } from "@/lib/utils";
import { EventRowActions } from "./EventRowActions";
import type { EventStatus } from "@prisma/client";

export const metadata = { title: "Events" };

const STATUS_TONE: Record<EventStatus, "confirmed" | "unknown" | "unavailable" | "neutral" | "brand"> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "unknown",
  APPROVED: "brand",
  REJECTED: "unavailable",
  PUBLISHED: "confirmed",
  CANCELLED: "unavailable",
};

export default async function PartnerEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { organization } = await requireOrganization();
  const { submitted } = await searchParams;

  const events = await db.event.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: {
      accessibility: true,
      _count: { select: { rsvps: { where: { status: "GOING" } } } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Events</h1>
        <LinkButton href="/partner/events/new">Create event</LinkButton>
      </div>

      {submitted && (
        <p role="status" className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          Event submitted for review.
        </p>
      )}

      {events.length === 0 ? (
        <EmptyState title="No events yet" body="Create your first event to start reaching accessible-event seekers." />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th scope="col" className="px-4 py-3">Event</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Views</th>
                <th scope="col" className="px-4 py-3">RSVPs</th>
                <th scope="col" className="px-4 py-3">Accessibility</th>
                <th scope="col" className="px-4 py-3">Featured</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/events/${event.slug}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[event.status]}>{event.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDateRange(event.startAt, event.endAt)}</td>
                  <td className="px-4 py-3">{event.viewCount}</td>
                  <td className="px-4 py-3">{event._count.rsvps}</td>
                  <td className="px-4 py-3">
                    {accessibilityCompletionPercent(event.accessibility, ALL_ACCESSIBILITY_FEATURES.length)}%
                  </td>
                  <td className="px-4 py-3">{event.isFeatured ? <Badge tone="accent">Featured</Badge> : "—"}</td>
                  <td className="px-4 py-3">
                    <EventRowActions eventId={event.id} status={event.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
