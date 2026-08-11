import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");

  const [
    totalUsers,
    activeUsers,
    totalEvents,
    pendingApprovals,
    verifiedPartners,
    totalRsvps,
    revenueAgg,
    reportedListings,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.event.count(),
    db.event.count({ where: { status: "PENDING_REVIEW" } }),
    db.organization.count({ where: { verificationStatus: "VERIFIED" } }),
    db.rSVP.count({ where: { status: "GOING" } }),
    db.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountCents: true } }),
    db.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
  ]);

  const stats = [
    { label: "Total users", value: totalUsers },
    { label: "Active users", value: activeUsers },
    { label: "Events", value: totalEvents },
    { label: "Pending approvals", value: pendingApprovals, highlight: pendingApprovals > 0 },
    { label: "Verified partners", value: verifiedPartners },
    { label: "RSVPs", value: totalRsvps },
    { label: "Revenue", value: `$${((revenueAgg._sum.amountCents ?? 0) / 100).toFixed(2)}` },
    { label: "Reported listings", value: reportedListings, highlight: reportedListings > 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Platform overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className={`text-2xl font-extrabold ${s.highlight ? "text-accent-600" : ""}`}>{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
