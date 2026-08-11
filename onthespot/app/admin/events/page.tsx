import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDateRange } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { EventStatus } from "@prisma/client";

export const metadata = { title: "All events" };

const STATUS_TONE: Record<EventStatus, "confirmed" | "unknown" | "unavailable" | "neutral" | "brand"> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "unknown",
  APPROVED: "brand",
  REJECTED: "unavailable",
  PUBLISHED: "confirmed",
  CANCELLED: "unavailable",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;

  const events = await db.event.findMany({
    where: status ? { status: status as EventStatus } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { organization: { select: { name: true } }, createdBy: { select: { name: true } } },
  });

  const statuses: EventStatus[] = ["PENDING_REVIEW", "PUBLISHED", "APPROVED", "REJECTED", "DRAFT", "CANCELLED"];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">All events</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/events" className={`rounded-full border border-border px-3 py-1 text-xs font-semibold ${!status ? "bg-brand-600 text-white" : ""}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/events?status=${s}`}
            className={`rounded-full border border-border px-3 py-1 text-xs font-semibold ${status === s ? "bg-brand-600 text-white" : ""}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">Event</th>
              <th scope="col" className="px-4 py-3">Host</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-semibold">
                  <Link href={event.status === "PENDING_REVIEW" ? `/admin/moderation/${event.id}` : `/events/${event.slug}`} className="hover:underline">
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-500">{event.organization?.name ?? event.createdBy.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[event.status]}>{event.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-500">{formatDateRange(event.startAt, event.endAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
