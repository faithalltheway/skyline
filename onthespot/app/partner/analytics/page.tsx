import Link from "next/link";
import { requireOrganization } from "@/lib/authz";
import { getOrganizationAnalytics } from "@/services/analyticsService";
import { Card } from "@/components/ui/Card";
import { AnalyticsChart } from "@/components/partner/AnalyticsChart";
import { CsvExportButton } from "@/components/partner/CsvExportButton";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export default async function PartnerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { organization } = await requireOrganization();
  const { days: daysParam } = await searchParams;
  const days = Number(daysParam) || 30;

  const analytics = await getOrganizationAnalytics(organization.id, days);

  const stats = [
    { label: "Views", value: analytics.views },
    { label: "Unique visitors", value: analytics.uniqueVisitors },
    { label: "RSVPs", value: analytics.rsvps },
    { label: "Saves", value: analytics.saves },
    { label: "Conversion rate", value: `${analytics.conversionRate}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Analytics</h1>
        <div className="flex items-center gap-2">
          <nav aria-label="Date range" className="flex gap-1 rounded-control border border-border p-1">
            {RANGES.map((r) => (
              <Link
                key={r.days}
                href={`/partner/analytics?days=${r.days}`}
                className={cn(
                  "rounded-control px-3 py-1.5 text-sm font-semibold",
                  days === r.days ? "bg-brand-600 text-white" : "hover:bg-surface-muted",
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
          <CsvExportButton data={analytics.series} filename={`onthespot-analytics-${days}d.csv`} />
        </div>
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
