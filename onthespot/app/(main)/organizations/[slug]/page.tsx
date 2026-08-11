import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { discoverEvents } from "@/services/eventService";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/organizations/FollowButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await db.organization.findUnique({ where: { slug }, select: { name: true, description: true } });
  return { title: org?.name ?? "Organization", description: org?.description ?? undefined };
}

export default async function OrganizationProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const org = await db.organization.findUnique({
    where: { slug },
    include: { _count: { select: { followers: true, events: true } } },
  });
  if (!org || org.deletedAt) notFound();

  const [{ events }, prefs, following] = await Promise.all([
    discoverEvents({ organizationId: org.id, userRequirements: [] }),
    session?.user ? db.accessibilityPreference.findMany({ where: { userId: session.user.id } }) : Promise.resolve([]),
    session?.user
      ? db.follow.findUnique({ where: { followerId_organizationId: { followerId: session.user.id, organizationId: org.id } } })
      : null,
  ]);
  void prefs;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
          {org.logoUrl ? (
            <Image src={org.logoUrl} alt="" width={80} height={80} unoptimized className="h-full w-full object-cover" />
          ) : (
            <Icon name="building" size={32} className="text-neutral-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold">{org.name}</h1>
            {org.verificationStatus === "VERIFIED" && (
              <Badge tone="brand">
                <Icon name="shield" size={12} /> Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            {org._count.followers} follower{org._count.followers === 1 ? "" : "s"} · {org._count.events} event
            {org._count.events === 1 ? "" : "s"}
            {org.city && ` · ${org.city}, ${org.state}`}
          </p>
        </div>
        {session?.user && session.user.id !== org.id && (
          <FollowButton organizationId={org.id} initialFollowing={!!following} />
        )}
      </div>

      {org.description && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{org.description}</p>}

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {org.website && (
          <a href={org.website} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Website
          </a>
        )}
        {org.contactEmail && (
          <a href={`mailto:${org.contactEmail}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Contact
          </a>
        )}
      </div>

      <h2 className="mt-10 text-xl font-extrabold">Upcoming events</h2>
      {events.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No upcoming events" body={`${org.name} doesn't have any published events right now.`} />
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
