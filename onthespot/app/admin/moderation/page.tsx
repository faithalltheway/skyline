import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDateRange } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { EVENT_SOURCE_LABEL } from "@/lib/eventSource";
import { BulkApproveImportedEventsButton } from "./BulkApproveImportedEventsButton";

export const metadata = { title: "Moderation queue" };

export default async function ModerationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  await requireRole("ADMIN");
  const { done } = await searchParams;

  const [events, pendingImportedCount] = await Promise.all([
    db.event.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      include: { organization: { select: { name: true } }, createdBy: { select: { name: true } }, accessibility: true },
    }),
    db.event.count({ where: { status: "PENDING_REVIEW", externalSource: { not: null } } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Moderation queue</h1>
        <BulkApproveImportedEventsButton pendingImportedCount={pendingImportedCount} />
      </div>
      {done && (
        <p role="status" className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          {done === "imported-events-published" ? "Imported events published." : `Event ${done.replace("-", " ")}.`}
        </p>
      )}

      {events.length === 0 ? (
        <EmptyState title="Nothing to review" body="New submissions will show up here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/moderation/${event.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 hover:bg-surface-muted"
              >
                <div>
                  <p className="font-bold">{event.title}</p>
                  <p className="text-sm text-neutral-500">
                    {formatDateRange(event.startAt, event.endAt)} ·{" "}
                    {event.externalSource
                      ? `Imported from ${EVENT_SOURCE_LABEL[event.externalSource]}`
                      : `Hosted by ${event.organization?.name ?? event.createdBy.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.externalSource && <Badge tone="accent">Imported</Badge>}
                  <Badge tone="unknown">{event.accessibility.length} accessibility answers</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
