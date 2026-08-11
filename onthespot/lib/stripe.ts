import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Returns a Stripe client, or null if no secret key is configured (dev/demo mode). */
export function getStripeClient(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
