import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

export interface Attendee {
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export function AttendeeList({ attendees, totalGoing }: { attendees: Attendee[]; totalGoing: number }) {
  if (attendees.length === 0) return null;

  const overflow = totalGoing - attendees.length;

  return (
    <section aria-labelledby="attendees-heading">
      <h2 id="attendees-heading" className="text-sm font-bold uppercase tracking-wide text-neutral-500">
        Who&apos;s going
      </h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {attendees.map((a) => {
          const content = (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
                {a.avatarUrl ? (
                  <Image src={a.avatarUrl} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover" />
                ) : (
                  <Icon name="user" size={16} className="text-neutral-400" />
                )}
              </div>
              <span className="text-sm font-medium">{a.name}</span>
            </>
          );
          return (
            <li key={a.userId}>
              {a.username ? (
                <Link href={`/u/${a.username}`} className="flex items-center gap-2 rounded-full py-1 pr-3 hover:bg-surface-muted">
                  {content}
                </Link>
              ) : (
                <span className="flex items-center gap-2 py-1 pr-3">{content}</span>
              )}
            </li>
          );
        })}
      </ul>
      {overflow > 0 && <p className="mt-2 text-xs text-neutral-500">+{overflow} more going</p>}
    </section>
  );
}
