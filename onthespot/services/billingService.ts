import "server-only";
import { db } from "@/lib/db";
import { getStripeClient, stripeConfigured } from "@/lib/stripe";
import { getPlatformSetting } from "@/lib/settings";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Starts (or simulates, in dev/demo mode without Stripe keys) a subscription
 * upgrade. Returns a URL to redirect the browser to.
 */
export async function startPartnerPremiumCheckout(organizationId: string, userEmail: string): Promise<string> {
  const priceCents = await getPlatformSetting("partnerPremiumPriceCents");
  const stripe = getStripeClient();

  if (stripe && stripeConfigured) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "OnTheSpot Partner Premium" },
            unit_amount: priceCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/partner?upgraded=true`,
      cancel_url: `${APP_URL}/partner/upgrade`,
      metadata: { organizationId, kind: "PARTNER_PREMIUM" },
    });
    return session.url!;
  }

  // Demo mode: no Stripe keys configured — simulate a successful upgrade so the
  // feature is fully exercisable without external credentials.
  await db.$transaction([
    db.subscription.upsert({
      where: { organizationId },
      update: { tier: "PARTNER_PREMIUM", status: "ACTIVE" },
      create: { organizationId, tier: "PARTNER_PREMIUM", status: "ACTIVE" },
    }),
    db.payment.create({
      data: {
        organizationId,
        amountCents: priceCents,
        status: "SUCCEEDED",
        description: "Partner Premium subscription (demo mode)",
      },
    }),
  ]);
  return "/partner?upgraded=true";
}

export async function startUserPremiumCheckout(userId: string, userEmail: string): Promise<string> {
  const priceCents = await getPlatformSetting("userPremiumPriceCents");
  const stripe = getStripeClient();

  if (stripe && stripeConfigured) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "OnTheSpot Premium" },
            unit_amount: priceCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/profile?upgraded=true`,
      cancel_url: `${APP_URL}/premium`,
      metadata: { userId, kind: "USER_PREMIUM" },
    });
    return session.url!;
  }

  await db.$transaction([
    db.subscription.upsert({
      where: { userId },
      update: { tier: "USER_PREMIUM", status: "ACTIVE" },
      create: { userId, tier: "USER_PREMIUM", status: "ACTIVE" },
    }),
    db.payment.create({
      data: { userId, amountCents: priceCents, status: "SUCCEEDED", description: "Premium subscription (demo mode)" },
    }),
  ]);
  return "/profile?upgraded=true";
}

export async function startFeaturedPlacementCheckout(
  eventId: string,
  organizationId: string,
  weeks: number,
): Promise<string> {
  const perWeek = await getPlatformSetting("featuredEventPriceCentsPerWeek");
  const amountCents = perWeek * weeks;
  const stripe = getStripeClient();
  const startAt = new Date();
  const endAt = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);

  if (stripe && stripeConfigured) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Featured placement — ${weeks} week${weeks === 1 ? "" : "s"}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/partner/events?featured=true`,
      cancel_url: `${APP_URL}/partner/events`,
      metadata: { eventId, organizationId, kind: "FEATURED_PLACEMENT", weeks: String(weeks) },
    });
    return session.url!;
  }

  await db.$transaction([
    db.featuredPlacement.create({
      data: { eventId, organizationId, startAt, endAt, amountCents, status: "SUCCEEDED" },
    }),
    db.event.update({ where: { id: eventId }, data: { isFeatured: true, featuredUntil: endAt } }),
    db.payment.create({
      data: { organizationId, amountCents, status: "SUCCEEDED", description: "Featured placement (demo mode)" },
    }),
  ]);
  return "/partner/events?featured=true";
}
