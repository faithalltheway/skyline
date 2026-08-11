import { requireOrganization } from "@/lib/authz";
import { db } from "@/lib/db";
import { getOrganizationAnalytics } from "@/services/analyticsService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { DEFAULT_PLATFORM_SETTINGS, formatCents } from "@/lib/settings";

export const metadata = { title: "Partner overview" };

export default async function PartnerOverviewPage() {
  const { organization } = await requireOrganization();

  const [activeListings, upcomingEvents, analytics, subscription] = await Promise.all([
    db.event.count({ where: { organizationId: organization.id, status: { in: ["PUBLISHED", "APPROVED"] } } }),
    db.event.count({ where: { organizationId: organization.id, status: "PUBLISHED", startAt: { gte: new Date() } } }),
    getOrganizationAnalytics(organization.id, 30),
    db.subscription.findUnique({ where: { organizationId: organization.id } }),
  ]);

  const stats = [
    { label: "Active listings", value: activeListings },
    { label: "Upcoming events", value: upcomingEvents },
    { label: "Total views (30d)", value: analytics.views },
    { label: "Total RSVPs (30d)", value: analytics.rsvps },
    { label: "Conversion rate", value: `${analytics.conversionRate}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Welcome back, {organization.name}</h1>
          <p className="text-sm text-neutral-500">
            Verification:{" "}
            <Badge tone={organization.verificationStatus === "VERIFIED" ? "confirmed" : "unknown"}>
              {organization.verificationStatus}
            </Badge>
          </p>
        </div>
        <LinkButton href="/partner/events/new">Create event</LinkButton>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Subscription</h2>
            <p className="text-sm text-neutral-500">
              Current plan: <span className="font-semibold">{subscription?.tier ?? "FREE"}</span>
            </p>
          </div>
          {subscription?.tier !== "PARTNER_PREMIUM" && (
            <LinkButton href="/partner/upgrade" variant="outline">
              Upgrade — {formatCents(DEFAULT_PLATFORM_SETTINGS.partnerPremiumPriceCents)}/mo
            </LinkButton>
          )}
        </div>
      </Card>

      {organization.verificationStatus === "UNVERIFIED" && (
        <Card className="border-l-4 border-l-accent-500 p-5">
          <h2 className="font-bold">Get verified</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Verified organizations get a trust badge shown to attendees and priority placement.
          </p>
          <LinkButton href="/partner/profile" variant="outline" className="mt-3">
            Submit verification
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
