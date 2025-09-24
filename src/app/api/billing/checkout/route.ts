import { NextResponse } from "next/server";
import { stripe, getCreditPackById } from "@/lib/stripe";
import { requireUserId } from "@/lib/clerk";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const packId: string | undefined = body?.packId;

    if (!packId) {
      return NextResponse.json({ error: "packId required" }, { status: 400 });
    }

    const pack = getCreditPackById(packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid packId" }, { status: 400 });
    }

    const origin =
      req.headers.get("origin") || req.headers.get("x-forwarded-host") || "";
    const protocol =
      req.headers.get("x-forwarded-proto") ||
      (origin.startsWith("http") ? origin.split(":")[0] : "https");
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const baseUrl = origin || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pack.credits} Credits`,
              description: `Recharge pack: ${pack.credits} credits`,
            },
            unit_amount: Math.round(pack.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packId: pack.id,
        credits: String(pack.credits),
      },
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/recharge?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("/api/billing/checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
