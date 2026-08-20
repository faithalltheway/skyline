import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/settings";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import { UserFollowButton } from "@/components/users/UserFollowButton";
import { userFollowCounts, isFollowingUser } from "@/services/userFollowService";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await db.userProfile.findUnique({ where: { username }, select: { user: { select: { name: true } } } });
  return { title: profile?.user.name ?? "Profile" };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();

  const profile = await db.userProfile.findUnique({
    where: { username },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!profile) notFound();

  const [{ followers, following: followingCount }, viewerFollowing] = await Promise.all([
    userFollowCounts(profile.user.id),
    session?.user ? isFollowingUser(session.user.id, profile.user.id) : Promise.resolve(false),
  ]);

  const isSelf = session?.user?.id === profile.user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="" width={80} height={80} unoptimized className="h-full w-full object-cover" />
          ) : (
            <Icon name="user" size={32} className="text-neutral-400" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{profile.user.name}</h1>
          <p className="text-sm text-neutral-500">
            @{profile.username} · {followers} follower{followers === 1 ? "" : "s"} · {followingCount} following
            {profile.city && ` · ${profile.city}, ${profile.state}`}
          </p>
        </div>
        {!isSelf && session?.user && (
          <div className="flex flex-wrap gap-2">
            <UserFollowButton targetUserId={profile.user.id} initialFollowing={viewerFollowing} />
            {profile.messagePriceCents ? (
              <LinkButton variant="outline" href={`/unlock/message/${profile.user.id}`}>
                Message ({formatCents(profile.messagePriceCents)}/mo)
              </LinkButton>
            ) : (
              <LinkButton variant="outline" href={`/messages/new/${profile.user.id}`}>
                Message
              </LinkButton>
            )}
          </div>
        )}
      </div>

      {profile.bio && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{profile.bio}</p>}

      {profile.followPriceCents ? (
        <p className="mt-4 text-xs text-neutral-500">
          Following @{profile.username} costs {formatCents(profile.followPriceCents)}/month.
        </p>
      ) : null}
    </div>
  );
}
