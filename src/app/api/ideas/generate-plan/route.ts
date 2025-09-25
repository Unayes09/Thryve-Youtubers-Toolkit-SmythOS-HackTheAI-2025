import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";
import { deductCredits } from "@/lib/credit-utils";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { ideaId, context, scheduleData } = body || {};

    if (!ideaId || !context) {
      return NextResponse.json(
        { error: "ideaId and context are required" },
        { status: 400 }
      );
    }

    // Verify idea exists and belongs to user
    const idea = await prisma.videoIdeas.findUnique({
      where: { id: ideaId },
      include: { channel: true },
    });

    if (!idea || idea.channel.userId !== userId) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Deduct credits atomically
    const creditResult = await deductCredits(userId, "IDEAS_GENERATE_PLAN");
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
      context,
      scheduleData: scheduleData || null,
    } as const;

    const resp = await fetch(targetUrl + "/Video_Plan", {
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

    const planData = data?.result?.Reply;
    if (!planData) {
      return NextResponse.json(
        { error: "Missing plan data in external response" },
        { status: 502 }
      );
    }

    // Save the plan to the database
    const updatedIdea = await prisma.videoIdeas.update({
      where: { id: ideaId },
      data: {
        plan: JSON.stringify(planData),
      },
      select: { id: true, plan: true },
    });

    return NextResponse.json({
      success: true,
      plan: updatedIdea.plan,
      planData: planData,
    });
  } catch (error) {
    console.error("/api/ideas/generate-plan POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
