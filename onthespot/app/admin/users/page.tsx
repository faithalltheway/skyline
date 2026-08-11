import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { UserRowActions } from "./UserRowActions";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  await requireRole("ADMIN");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { createdEvents: true, reportsFiled: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Users</h1>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Email</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Joined</th>
              <th scope="col" className="px-4 py-3">Events</th>
              <th scope="col" className="px-4 py-3">Reports filed</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-semibold">{user.name}</td>
                <td className="px-4 py-3 text-neutral-500">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <Badge tone={user.status === "ACTIVE" ? "confirmed" : "unavailable"}>{user.status}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-500">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(user.createdAt)}</td>
                <td className="px-4 py-3">{user._count.createdEvents}</td>
                <td className="px-4 py-3">{user._count.reportsFiled}</td>
                <td className="px-4 py-3">
                  {user.role !== "ADMIN" && <UserRowActions userId={user.id} status={user.status} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
