import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { PartnerRowActions } from "./PartnerRowActions";

export const metadata = { title: "Partners" };

export default async function AdminPartnersPage() {
  await requireRole("ADMIN");

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { events: true } },
      members: { where: { role: "OWNER" }, include: { user: true }, take: 1 },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Partners</h1>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">Organization</th>
              <th scope="col" className="px-4 py-3">Contact</th>
              <th scope="col" className="px-4 py-3">Verification</th>
              <th scope="col" className="px-4 py-3">Subscription</th>
              <th scope="col" className="px-4 py-3">Events</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orgs.map((org) => (
              <tr key={org.id}>
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/organizations/${org.slug}`} className="hover:underline">
                    {org.name}
                  </Link>
                  {org.deletedAt && <Badge tone="unavailable" className="ml-2">Suspended</Badge>}
                </td>
                <td className="px-4 py-3 text-neutral-500">{org.members[0]?.user.email ?? org.contactEmail}</td>
                <td className="px-4 py-3">
                  <Badge tone={org.verificationStatus === "VERIFIED" ? "confirmed" : org.verificationStatus === "REJECTED" ? "unavailable" : "unknown"}>
                    {org.verificationStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">{org.subscription?.tier ?? "FREE"}</td>
                <td className="px-4 py-3">{org._count.events}</td>
                <td className="px-4 py-3">
                  <PartnerRowActions organizationId={org.id} verificationStatus={org.verificationStatus} suspended={!!org.deletedAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
