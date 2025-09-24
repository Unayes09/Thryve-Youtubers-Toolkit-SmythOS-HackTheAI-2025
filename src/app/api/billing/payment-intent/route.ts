import { NextResponse } from "next/server";
import { stripe, getCreditPackById } from "@/lib/stripe";
import { requireUserId } from "@/lib/clerk";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const packId: string | undefined = body?.packId;
    if (!packId)
      return NextResponse.json({ error: "packId required" }, { status: 400 });

    const pack = getCreditPackById(packId);
    if (!pack)
      return NextResponse.json({ error: "Invalid packId" }, { status: 400 });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pack.priceUsd * 100),
      currency: "usd",
      metadata: {
        userId,
        packId: pack.id,
        credits: String(pack.credits),
      },
      automatic_payment_methods: { enabled: false },
      payment_method_types: ["card"],
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("/api/billing/payment-intent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
