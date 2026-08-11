import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { titleCase } from "@/lib/utils";
import { ReportRowActions } from "./ReportRowActions";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  await requireRole("ADMIN");

  const reports = await db.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { name: true } }, event: { select: { title: true, slug: true } } },
  });

  const open = reports.filter((r) => r.status === "OPEN" || r.status === "REVIEWING");
  const resolved = reports.filter((r) => r.status === "RESOLVED" || r.status === "DISMISSED");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Reports</h1>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Open ({open.length})</h2>
        {open.length === 0 ? (
          <EmptyState title="No open reports" />
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((report) => (
              <li key={report.id} className="rounded-card border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge tone="unknown">{titleCase(report.reason)}</Badge>
                    {report.event && (
                      <Link href={`/events/${report.event.slug}`} className="ml-2 font-semibold hover:underline">
                        {report.event.title}
                      </Link>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">
                      Reported by {report.reporter.name} on {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(report.createdAt)}
                    </p>
                    {report.details && <p className="mt-1 text-sm">{report.details}</p>}
                  </div>
                  <ReportRowActions reportId={report.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Resolved ({resolved.length})</h2>
          <ul className="flex flex-col gap-2">
            {resolved.map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-2 rounded-control border border-border p-3 text-sm opacity-75">
                <span>
                  {titleCase(report.reason)} — {report.event?.title ?? "Deleted event"}
                </span>
                <Badge tone={report.status === "RESOLVED" ? "confirmed" : "neutral"}>{report.status}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
