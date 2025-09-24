import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
});

export type CreditPack = {
  id: string;
  credits: number;
  priceUsd: number;
};

// Define available credit packs. You can later map these to Stripe Prices.
export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_100", credits: 100, priceUsd: 5 },
  { id: "pack_500", credits: 500, priceUsd: 20 },
  { id: "pack_1200", credits: 1200, priceUsd: 45 },
];

export function getCreditPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === packId);
}
