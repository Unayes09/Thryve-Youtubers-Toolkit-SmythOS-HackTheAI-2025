import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { deductCredits } from "@/lib/credit-utils";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ownerChannelId: string | undefined = body?.ownerChannelId;
    if (!ownerChannelId) {
      return NextResponse.json(
        { error: "ownerChannelId is required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const ownerChannel = await prisma.channels.findUnique({
      where: {
        userId_channelId: { userId: user.id, channelId: ownerChannelId },
      },
    });
    if (!ownerChannel) {
      return NextResponse.json(
        { error: "Channel not found for current user" },
        { status: 404 }
      );
    }

    // Deduct credits atomically
    const creditResult = await deductCredits(
      user.id,
      "SIMILAR_CHANNELS_DISCOVER"
    );
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    // Call external agent (may take up to ~100s)
    const agentBase = process.env.SMYTHOS_AGENT2;
    if (!agentBase) {
      return NextResponse.json(
        { error: "SMYTHOS_AGENT2 is not configured" },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let agentResp: Response;
    try {
      agentResp = await fetch(agentBase + "/competitor_find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ yt_channel_id: ownerChannelId }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const agentData = await agentResp.json().catch(() => ({}));
    if (!agentResp.ok) {
      return NextResponse.json(
        { error: "External agent error", details: agentData },
        { status: 502 }
      );
    }

    const competitors: Array<{
      rank?: number;
      channel_id: string;
      channel_name?: string;
      description?: string;
      relevance_score?: string;
      reasoning?: string;
    }> = agentData?.result?.Output?.competitors?.videoList || [];

    const similarIds = competitors
      .map((c) => c.channel_id)
      .filter(
        (v: unknown): v is string => typeof v === "string" && v.length > 0
      );

    // Create/Update Channels directly from agent data (no YouTube calls)
    for (const comp of competitors) {
      const id = comp.channel_id;
      if (!id) continue;

      await prisma.similarChannels.upsert({
        where: {
          ownerChannelId_similarChannelId: {
            ownerChannelId: ownerChannelId,
            similarChannelId: id,
          },
        },
        update: {
          updatedAt: new Date(),
          rank: typeof comp.rank === "number" ? comp.rank : 0,
          relevance_score: comp.relevance_score || "unknown",
          reasoning: comp.reasoning || null,
        },
        create: {
          ownerChannelId: ownerChannelId,
          similarChannelId: id,
          rank: typeof comp.rank === "number" ? comp.rank : 0,
          relevance_score: comp.relevance_score || "unknown",
          reasoning: comp.reasoning || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      similarCount: similarIds.length,
    });
  } catch (error) {
    console.error("/api/channels/similar/discover error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
