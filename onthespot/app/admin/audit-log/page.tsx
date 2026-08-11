import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { titleCase } from "@/lib/utils";

export const metadata = { title: "Audit log" };

export default async function AdminAuditLogPage() {
  await requireRole("ADMIN");

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { actor: { select: { name: true, role: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Audit log</h1>
      <p className="text-sm text-neutral-500">Every moderation action, publish, and verification decision, in order.</p>

      <ol className="flex flex-col gap-2">
        {logs.map((log) => (
          <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border p-3 text-sm">
            <div>
              <Badge tone="neutral">{titleCase(log.action)}</Badge>
              <span className="ml-2 text-neutral-500">
                {log.entityType} · {log.entityId.slice(0, 8)}
              </span>
              {log.actor && <span className="ml-2 text-neutral-400">by {log.actor.name}</span>}
            </div>
            <time dateTime={log.createdAt.toISOString()} className="text-xs text-neutral-400">
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(log.createdAt)}
            </time>
          </li>
        ))}
      </ol>
    </div>
  );
}
