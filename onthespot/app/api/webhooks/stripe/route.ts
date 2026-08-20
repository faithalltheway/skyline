import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};

    if (metadata.kind === "PARTNER_PREMIUM" && metadata.organizationId) {
      await db.subscription.upsert({
        where: { organizationId: metadata.organizationId },
        update: { tier: "PARTNER_PREMIUM", status: "ACTIVE", stripeSubscriptionId: session.subscription as string },
        create: {
          organizationId: metadata.organizationId,
          tier: "PARTNER_PREMIUM",
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

    if (metadata.kind === "USER_PREMIUM" && metadata.userId) {
      await db.subscription.upsert({
        where: { userId: metadata.userId },
        update: { tier: "USER_PREMIUM", status: "ACTIVE", stripeSubscriptionId: session.subscription as string },
        create: {
          userId: metadata.userId,
          tier: "USER_PREMIUM",
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

    if (metadata.kind === "USER_ACCESS_UNLOCK" && metadata.payerId && metadata.payeeId && metadata.accessType) {
      const type = metadata.accessType as "MESSAGE" | "FOLLOW";
      await db.paidAccessGrant.upsert({
        where: { payerId_payeeId_type: { payerId: metadata.payerId, payeeId: metadata.payeeId, type } },
        update: { status: "ACTIVE", stripeSubscriptionId: session.subscription as string, amountCents: session.amount_total ?? 0 },
        create: {
          payerId: metadata.payerId,
          payeeId: metadata.payeeId,
          type,
          status: "ACTIVE",
          amountCents: session.amount_total ?? 0,
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

    if (metadata.kind === "FEATURED_PLACEMENT" && metadata.eventId && metadata.organizationId) {
      const weeks = Number(metadata.weeks ?? 1);
      const endAt = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
      await db.$transaction([
        db.featuredPlacement.create({
          data: {
            eventId: metadata.eventId,
            organizationId: metadata.organizationId,
            startAt: new Date(),
            endAt,
            amountCents: session.amount_total ?? 0,
            status: "SUCCEEDED",
          },
        }),
        db.event.update({ where: { id: metadata.eventId }, data: { isFeatured: true, featuredUntil: endAt } }),
      ]);
    }

    if (session.customer_details?.email) {
      await db.payment.create({
        data: {
          amountCents: session.amount_total ?? 0,
          status: "SUCCEEDED",
          stripePaymentIntentId: session.payment_intent as string,
          description: `Stripe checkout (${metadata.kind ?? "unknown"})`,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
