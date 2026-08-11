import { requireUser } from "@/lib/authz";
import { getPlatformSetting, formatCents } from "@/lib/settings";
import { stripeConfigured } from "@/lib/stripe";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { startUserUpgradeAction } from "./actions";

export const metadata = { title: "OnTheSpot Premium" };

const FEATURES = ["Advanced discovery filters", "Early access to selected events", "Ad-free browsing"];

export default async function PremiumPage() {
  await requireUser();
  const priceCents = await getPlatformSetting("userPremiumPriceCents");

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-extrabold">OnTheSpot Premium</h1>
        <p className="mt-1 text-4xl font-extrabold text-brand-700 dark:text-brand-300">
          {formatCents(priceCents)}
          <span className="text-base font-medium text-neutral-500">/month</span>
        </p>
        <ul className="mt-6 flex flex-col gap-2 text-left text-sm">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-[var(--color-confirmed)]" />
              {f}
            </li>
          ))}
        </ul>
        <form action={startUserUpgradeAction} className="mt-6">
          <Button type="submit" size="lg" className="w-full">
            {stripeConfigured ? "Continue to checkout" : "Upgrade now (demo mode)"}
          </Button>
        </form>
        {!stripeConfigured && (
          <p className="mt-3 text-xs text-neutral-500">
            Stripe isn&apos;t configured in this environment — upgrading will activate the plan directly for demo
            purposes.
          </p>
        )}
      </Card>
    </div>
  );
}
