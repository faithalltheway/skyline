import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Revenue" };

export default async function AdminRevenuePage() {
  await requireRole("ADMIN");

  const [totalAgg, payments, partnerPremiumCount, userPremiumCount, featuredCount] = await Promise.all([
    db.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountCents: true }, _count: true }),
    db.payment.findMany({
      where: { status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { user: { select: { name: true } }, organization: { select: { name: true } } },
    }),
    db.subscription.count({ where: { tier: "PARTNER_PREMIUM", status: "ACTIVE" } }),
    db.subscription.count({ where: { tier: "USER_PREMIUM", status: "ACTIVE" } }),
    db.featuredPlacement.count({ where: { status: "SUCCEEDED" } }),
  ]);

  const stats = [
    { label: "Total revenue", value: `$${((totalAgg._sum.amountCents ?? 0) / 100).toFixed(2)}` },
    { label: "Transactions", value: totalAgg._count },
    { label: "Partner Premium subs", value: partnerPremiumCount },
    { label: "User Premium subs", value: userPremiumCount },
    { label: "Featured placements sold", value: featuredCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Revenue</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Description</th>
              <th scope="col" className="px-4 py-3">Payer</th>
              <th scope="col" className="px-4 py-3">Amount</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-neutral-500">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(p.createdAt)}</td>
                <td className="px-4 py-3">{p.description}</td>
                <td className="px-4 py-3">{p.organization?.name ?? p.user?.name ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">${(p.amountCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Badge tone="confirmed">{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
