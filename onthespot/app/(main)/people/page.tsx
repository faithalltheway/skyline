import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { IMPORT_BOT_EMAIL } from "@/services/eventImportService";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "People" };

const PAGE_SIZE = 24;

export default async function PeopleDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // Browsing other members' identities is the same category of exposure as
  // the event attendee list — signed-in visitors only.
  await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.UserProfileWhereInput = {
    user: { status: "ACTIVE", email: { not: IMPORT_BOT_EMAIL } },
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [profiles, total] = await Promise.all([
    db.userProfile.findMany({
      where,
      orderBy: { username: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { username: true, avatarUrl: true, bio: true, city: true, state: true, user: { select: { name: true } } },
    }),
    db.userProfile.count({ where }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold">People</h1>
      <p className="mt-1 text-sm text-neutral-500">Browse and search other OnTheSpot members.</p>

      <form method="get" className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="people-search">
          Search people
        </label>
        <input
          id="people-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or @username"
          className="tap-target flex-1 rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm placeholder:text-neutral-400 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="tap-target rounded-control bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {profiles.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={q ? "No one matched your search" : "No members yet"}
            body={q ? "Try a different name or username." : "Members will show up here once people finish onboarding."}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <li key={p.username}>
              <Link
                href={`/u/${p.username}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 hover:bg-surface-muted"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
                  {p.avatarUrl ? (
                    <Image src={p.avatarUrl} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="user" size={20} className="text-neutral-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.user.name}</p>
                  <p className="truncate text-sm text-neutral-500">
                    @{p.username}
                    {p.city && ` · ${p.city}, ${p.state}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} searchParams={sp} />
    </div>
  );
}
