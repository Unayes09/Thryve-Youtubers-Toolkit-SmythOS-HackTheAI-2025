import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireUserId } from "@/lib/clerk";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { paymentIntentId } = body || {};
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId required" },
        { status: 400 }
      );
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not succeeded" },
        { status: 400 }
      );
    }

    const intentUserId = pi.metadata?.userId as string | undefined;
    const creditsStr = pi.metadata?.credits as string | undefined;
    const credits = creditsStr ? parseInt(creditsStr, 10) : 0;

    if (!intentUserId || intentUserId !== userId || credits <= 0) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("/api/billing/credit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
