import { requireRole } from "@/lib/authz";
import { getAllPlatformSettings } from "@/lib/settings";
import { stripeConfigured } from "@/lib/stripe";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SystemSettingsForm } from "./SystemSettingsForm";
import { EventImportSyncButton } from "./EventImportSyncButton";

export const metadata = { title: "System settings" };

export default async function AdminSystemPage() {
  await requireRole("ADMIN");
  const settings = await getAllPlatformSettings();
  const serpApiConfigured = Boolean(process.env.SERPAPI_KEY);
  const ticketmasterConfigured = Boolean(process.env.TICKETMASTER_API_KEY);
  const predictHqConfigured = Boolean(process.env.PREDICTHQ_ACCESS_TOKEN);
  const reliableSourcesConfigured = ticketmasterConfigured || predictHqConfigured;

  const integrations = [
    { name: "Stripe (payments)", configured: stripeConfigured },
    { name: "Cloudinary (image storage)", configured: cloudinaryConfigured },
    { name: "Mapbox (maps)", configured: Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN) },
    { name: "Ticketmaster (event import)", configured: ticketmasterConfigured },
    { name: "PredictHQ (event import)", configured: predictHqConfigured },
    { name: "SerpApi (Google Events import)", configured: serpApiConfigured },
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

      <Card className="p-6">
        <h2 className="text-lg font-bold">Event import — Ticketmaster &amp; PredictHQ</h2>
        <p className="mt-1 mb-4 text-sm text-neutral-500">
          Pulls upcoming events for Waco, Austin, Dallas, and Houston from Ticketmaster and PredictHQ — both give
          real structured dates, venues, and coordinates (no scraping, no geolocation guesswork). Runs automatically
          once a day via Vercel Cron; you can also trigger it here. Everything lands in the moderation queue as
          PENDING_REVIEW with accessibility left UNKNOWN until a moderator or the venue confirms it.
        </p>
        <EventImportSyncButton
          endpoint="/api/cron/import-events"
          configured={reliableSourcesConfigured}
          disabledHint="Add TICKETMASTER_API_KEY and/or PREDICTHQ_ACCESS_TOKEN to enable."
        />
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Event import — Google Events (unreliable)</h2>
        <p className="mt-1 mb-4 text-sm text-neutral-500">
          Pulls from Google Events via SerpApi. Confirmed unreliable — Google&apos;s Events feature depends on
          real-device location signals no proxy IP can supply, so results are frequently empty regardless of plan
          tier. No automatic schedule; manual retest only.
        </p>
        <EventImportSyncButton
          endpoint="/api/cron/import-events-google"
          configured={serpApiConfigured}
          disabledHint="Add SERPAPI_KEY to enable."
        />
      </Card>
    </div>
  );
}
