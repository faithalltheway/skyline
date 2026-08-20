import "server-only";
import { db } from "@/lib/db";
import { getStripeClient, stripeConfigured } from "@/lib/stripe";
import { getPlatformSetting } from "@/lib/settings";
import type { PaidAccessType } from "@prisma/client";

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

const ACCESS_TYPE_LABEL: Record<PaidAccessType, string> = { MESSAGE: "message", FOLLOW: "follow" };

/**
 * Starts a recurring monthly unlock so payerId can message or follow
 * payeeId, whose UserProfile has a messagePriceCents/followPriceCents set.
 * The platform keeps the payment in full (no Stripe Connect payout to
 * payeeId — see PaidAccessGrant).
 */
export async function startUserAccessCheckout(
  payerId: string,
  payerEmail: string,
  payeeId: string,
  type: PaidAccessType,
): Promise<string> {
  const targetProfile = await db.userProfile.findUniqueOrThrow({ where: { userId: payeeId } });
  const priceCents = type === "MESSAGE" ? targetProfile.messagePriceCents : targetProfile.followPriceCents;
  if (!priceCents) throw new Error("This user does not charge for that.");

  const returnPath = type === "MESSAGE" ? `/messages/new/${payeeId}` : `/u/${targetProfile.username}`;
  const stripe = getStripeClient();

  if (stripe && stripeConfigured) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: payerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Unlock ${ACCESS_TYPE_LABEL[type]}ing @${targetProfile.username} on OnTheSpot` },
            unit_amount: priceCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}${returnPath}?unlocked=true`,
      cancel_url: `${APP_URL}${returnPath}`,
      metadata: { kind: "USER_ACCESS_UNLOCK", payerId, payeeId, accessType: type },
    });
    return session.url!;
  }

  // Demo mode: no Stripe keys configured — simulate a successful unlock so
  // the feature is fully exercisable without external credentials.
  await db.$transaction([
    db.paidAccessGrant.upsert({
      where: { payerId_payeeId_type: { payerId, payeeId, type } },
      update: { status: "ACTIVE", amountCents: priceCents },
      create: { payerId, payeeId, type, status: "ACTIVE", amountCents: priceCents },
    }),
    db.payment.create({
      data: {
        userId: payerId,
        amountCents: priceCents,
        status: "SUCCEEDED",
        description: `Unlock ${ACCESS_TYPE_LABEL[type]}ing @${targetProfile.username} (demo mode)`,
      },
    }),
  ]);
  return `${returnPath}?unlocked=true`;
}
