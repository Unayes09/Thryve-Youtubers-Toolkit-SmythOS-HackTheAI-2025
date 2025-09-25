import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";
import { deductCredits } from "@/lib/credit-utils";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { channelId, text } = body || {};

    if (!channelId || !text) {
      return NextResponse.json(
        { error: "channelId and text are required" },
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
    const creditResult = await deductCredits(userId, "AUDIO_GENERATE");
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
      text,
      voice: "Rachel",
      fal_webhook: process.env.FAL_WEBHOOK || "",
    } as const;

    const resp = await fetch(targetUrl + "/Voice_from_text", {
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

    const requestId: string | undefined = data?.result?.Response?.request_id;
    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request_id in external response" },
        { status: 502 }
      );
    }

    // Create processing asset entry
    const created = await prisma.assests.create({
      data: {
        generatorId: requestId,
        status: "PROCESSING",
        channelId,
        url: null, // Will be updated when processing completes
        assetType: "mp3",
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      requestId,
      id: created.id,
    });
  } catch (error) {
    console.error("/api/audio/generate POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
