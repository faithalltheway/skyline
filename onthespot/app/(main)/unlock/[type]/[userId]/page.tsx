import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/settings";
import { stripeConfigured } from "@/lib/stripe";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { unlockUserAccessAction } from "@/actions/paidAccess";
import type { PaidAccessType } from "@prisma/client";

const TYPE_BY_SLUG: Record<string, PaidAccessType> = { message: "MESSAGE", follow: "FOLLOW" };
const VERB: Record<PaidAccessType, string> = { MESSAGE: "message", FOLLOW: "follow" };

export const metadata = { title: "Unlock access" };

export default async function UnlockAccessPage({ params }: { params: Promise<{ type: string; userId: string }> }) {
  const { type: typeSlug, userId } = await params;
  const type = TYPE_BY_SLUG[typeSlug];
  if (!type) notFound();

  const user = await requireUser();
  if (user.id === userId) notFound();

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, profile: { select: { username: true, messagePriceCents: true, followPriceCents: true } } },
  });
  if (!target?.profile) notFound();

  const priceCents = type === "MESSAGE" ? target.profile.messagePriceCents : target.profile.followPriceCents;
  if (!priceCents) notFound();

  const unlockAction = unlockUserAccessAction.bind(null, userId, type);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-extrabold">
          Unlock {VERB[type]}ing @{target.profile.username}
        </h1>
        <p className="mt-1 text-4xl font-extrabold text-brand-700 dark:text-brand-300">
          {formatCents(priceCents)}
          <span className="text-base font-medium text-neutral-500">/month</span>
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          {target.name} charges a monthly subscription to {VERB[type]} them on OnTheSpot.
        </p>
        <form action={unlockAction} className="mt-6">
          <Button type="submit" size="lg" className="w-full">
            {stripeConfigured ? "Continue to checkout" : "Unlock now (demo mode)"}
          </Button>
        </form>
        {!stripeConfigured && (
          <p className="mt-3 text-xs text-neutral-500">
            Stripe isn&apos;t configured in this environment — unlocking will activate access directly for demo purposes.
          </p>
        )}
      </Card>
    </div>
  );
}
