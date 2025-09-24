import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { deductCredits } from "@/lib/credit-utils";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const yt_id: string | undefined = body?.yt_id;
    const competitor_ids: string | undefined = body?.competitor_ids;
    if (!yt_id || !competitor_ids) {
      return NextResponse.json(
        { error: "yt_id and competitor_ids are required" },
        { status: 400 }
      );
    }

    // Validate that yt_id belongs to current user
    const owner = await prisma.channels.findUnique({
      where: { userId_channelId: { userId: user.id, channelId: yt_id } },
      select: { channelId: true },
    });
    if (!owner) {
      return NextResponse.json(
        { error: "Channel not found for current user" },
        { status: 404 }
      );
    }

    // Deduct credits atomically
    const creditResult = await deductCredits(user.id, "GAPS_ANALYSIS");
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    const agentBase = process.env.SMYTHOS_AGENT2;
    if (!agentBase) {
      return NextResponse.json(
        { error: "SMYTHOS_AGENT2 is not configured" },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    let resp: Response;
    try {
      resp = await fetch(agentBase + "/Competitor_Gap_Finder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ yt_id, competitor_ids }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json(
        { error: "External agent error", details: data },
        { status: 502 }
      );
    }

    console.log(data);

    // Pass-through the relevant output
    const content_gaps = data?.result?.Output?.content_gaps || [];
    console.log(content_gaps);
    return NextResponse.json({ content_gaps });
  } catch (error) {
    console.error("/api/channels/gaps error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
