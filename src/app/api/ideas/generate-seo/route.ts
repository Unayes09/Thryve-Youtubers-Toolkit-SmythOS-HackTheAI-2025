import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";
import { deductCredits } from "@/lib/credit-utils";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { ideaId, video_idea } = body || {};

    if (!ideaId || !video_idea) {
      return NextResponse.json(
        { error: "ideaId and video_idea are required" },
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
    const creditResult = await deductCredits(userId, "IDEAS_GENERATE_SEO");
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
      video_idea,
    } as const;

    const resp = await fetch(targetUrl + "/SEO_agent", {
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

    const seoData = data?.result?.Output;
    if (!seoData || !seoData.keywords) {
      return NextResponse.json(
        { error: "Missing SEO data in external response" },
        { status: 502 }
      );
    }

    // Extract keywords and create comma-separated string
    const keywords = seoData.keywords.map((kw: any) => kw.keyword).join(", ");

    // Save the keywords to the database
    const updatedIdea = await prisma.videoIdeas.update({
      where: { id: ideaId },
      data: {
        tags: keywords,
      },
      select: { id: true, tags: true },
    });

    return NextResponse.json({
      success: true,
      keywords: updatedIdea.tags,
      seoData: seoData,
    });
  } catch (error) {
    console.error("/api/ideas/generate-seo POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
