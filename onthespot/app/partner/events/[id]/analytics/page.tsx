import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganization } from "@/lib/authz";
import { db } from "@/lib/db";
import { getEventAnalytics } from "@/services/analyticsService";
import { Card } from "@/components/ui/Card";
import { AnalyticsChart } from "@/components/partner/AnalyticsChart";
import { CsvExportButton } from "@/components/partner/CsvExportButton";
import { cn } from "@/lib/utils";

export const metadata = { title: "Event analytics" };

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export default async function EventAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { id } = await params;
  const { days: daysParam } = await searchParams;
  const { organization } = await requireOrganization();
  const days = Number(daysParam) || 30;

  const event = await db.event.findUnique({ where: { id } });
  if (!event || event.organizationId !== organization.id) notFound();

  const analytics = await getEventAnalytics(id, days);
  const stats = [
    { label: "Views", value: analytics.views },
    { label: "Unique visitors", value: analytics.uniqueVisitors },
    { label: "RSVPs", value: analytics.rsvps },
    { label: "Saves", value: analytics.saves },
    { label: "Conversion rate", value: `${analytics.conversionRate}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/partner/events" className="text-sm text-neutral-500 hover:underline">
          ← Back to events
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold">{event.title}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Date range" className="flex gap-1 rounded-control border border-border p-1">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/partner/events/${id}/analytics?days=${r.days}`}
              className={cn(
                "rounded-control px-3 py-1.5 text-sm font-semibold",
                days === r.days ? "bg-brand-600 text-white" : "hover:bg-surface-muted",
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <CsvExportButton data={analytics.series} filename={`${event.slug}-analytics-${days}d.csv`} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <AnalyticsChart data={analytics.series} />
      </Card>
    </div>
  );
}
