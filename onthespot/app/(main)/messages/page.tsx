import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/authz";
import { listConversations } from "@/services/messagingService";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Messages" };

export default async function MessagesInboxPage() {
  const user = await requireUser();
  const conversations = await listConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No conversations yet" body="Messages you send or receive from other members will show up here." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 hover:bg-surface-muted"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
                  {c.other.profile?.avatarUrl ? (
                    <Image src={c.other.profile.avatarUrl} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="user" size={20} className="text-neutral-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.other.name}</p>
                  <p className="truncate text-sm text-neutral-500">
                    {c.lastMessage ? c.lastMessage.body : "No messages yet"}
                  </p>
                </div>
                {c.unread && <Badge tone="accent">New</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
