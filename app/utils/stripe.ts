import Stripe from "stripe";

if (!process.env.SECRET_STRIPE_KEY) {
  throw new Error("SECRET_STRIPE_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.SECRET_STRIPE_KEY!, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});
