import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";
import { deductCredits } from "@/lib/credit-utils";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { channelId, prompt, image } = body || {};

    if (!channelId || !prompt || !image) {
      return NextResponse.json(
        { error: "channelId, prompt, and image are required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const channel = await prisma.channels.findUnique({
      where: { channelId },
    });
    if (!channel || channel.userId !== userId) {
      return NextResponse.json({ error: "Invalid channelId" }, { status: 404 });
    }

    // Deduct credits atomically
    const creditResult = await deductCredits(userId, "CTR_PREDICT");
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    const targetUrl = process.env.SMYTHOS_AGENT1;
    if (!targetUrl) {
      return NextResponse.json(
        { error: "SMYTHOS_AGENT1 is not configured" },
        { status: 500 }
      );
    }

    const payload = {
      prompt,
      image,
    } as const;

    const resp = await fetch(targetUrl + "/CTR_Predictor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const respText = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: "External agent error", details: respText },
        { status: 502 }
      );
    }

    let data: any = null;
    try {
      data = respText;
    } catch {
      // non-JSON response; return raw text
      data = { message: respText };
    }

    const ctrData = data?.result?.Output?.ctr_data;
    if (!ctrData) {
      return NextResponse.json(
        { error: "Missing ctr_data in external response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      ctr_data: ctrData,
    });
  } catch (error) {
    console.error("/api/ctr/predict POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
