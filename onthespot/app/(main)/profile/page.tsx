import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { signOut } from "@/auth";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProfileForm } from "./ProfileForm";
import { MonetizationForm } from "./MonetizationForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, prefs, following, dbUser] = await Promise.all([
    db.userProfile.findUnique({ where: { userId: user.id } }),
    db.accessibilityPreference.findMany({ where: { userId: user.id } }),
    db.follow.findMany({ where: { followerId: user.id }, include: { organization: true } }),
    db.user.findUnique({ where: { id: user.id }, select: { emailVerified: true, email: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-neutral-500">
            {dbUser?.email}
            {dbUser?.emailVerified ? (
              <Badge tone="confirmed" className="ml-2">
                Verified
              </Badge>
            ) : (
              <Badge tone="unknown" className="ml-2">
                Unverified
              </Badge>
            )}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>

      {following.length > 0 && (
        <Card className="mb-6 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            Following ({following.length})
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {following.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/organizations/${f.organization.slug}`}
                  className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface-muted"
                >
                  {f.organization.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {user.role === "USER" && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-bold">Become a partner</h2>
            <p className="text-sm text-neutral-500">Register an organization to host and publish your own events.</p>
          </div>
          <LinkButton href="/partner/onboarding" variant="outline">
            Get started
          </LinkButton>
        </Card>
      )}

      <Card className="p-6 sm:p-8">
        <ProfileForm
          username={profile?.username ?? ""}
          avatarUrl={profile?.avatarUrl ?? null}
          city={profile?.city ?? ""}
          state={profile?.state ?? ""}
          zip={profile?.zip ?? ""}
          initialInterests={profile?.interests ?? []}
          initialPreferences={prefs.map((p) => p.feature)}
        />
      </Card>

      <Card className="mt-6 p-6 sm:p-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-500">Messaging &amp; follow pricing</h2>
        <MonetizationForm
          messagePrice={profile?.messagePriceCents ? (profile.messagePriceCents / 100).toString() : ""}
          followPrice={profile?.followPriceCents ? (profile.followPriceCents / 100).toString() : ""}
        />
      </Card>
    </div>
  );
}
