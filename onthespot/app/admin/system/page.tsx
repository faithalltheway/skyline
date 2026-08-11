import { requireRole } from "@/lib/authz";
import { getAllPlatformSettings } from "@/lib/settings";
import { stripeConfigured } from "@/lib/stripe";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SystemSettingsForm } from "./SystemSettingsForm";

export const metadata = { title: "System settings" };

export default async function AdminSystemPage() {
  await requireRole("ADMIN");
  const settings = await getAllPlatformSettings();

  const integrations = [
    { name: "Stripe (payments)", configured: stripeConfigured },
    { name: "Cloudinary (image storage)", configured: cloudinaryConfigured },
    { name: "Mapbox (maps)", configured: Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">System settings</h1>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">Monetization pricing</h2>
        <SystemSettingsForm
          partnerPremium={settings.partnerPremiumPriceCents}
          userPremium={settings.userPremiumPriceCents}
          featured={settings.featuredEventPriceCentsPerWeek}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">Integrations</h2>
        <ul className="flex flex-col gap-2">
          {integrations.map((i) => (
            <li key={i.name} className="flex items-center justify-between text-sm">
              {i.name}
              <Badge tone={i.configured ? "confirmed" : "unknown"}>{i.configured ? "Configured" : "Not configured"}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          Missing integrations fall back to local/demo behavior — the app remains fully usable without them.
        </p>
      </Card>
    </div>
  );
}
