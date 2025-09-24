import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";
import { deductCredits } from "@/lib/credit-utils";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { channelId } = body || {};

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
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
    const creditResult = await deductCredits(userId, "IDEAS_GENERATE_NEXT");
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    const targetUrl = process.env.PYTHON_BACKEND;
    if (!targetUrl) {
      return NextResponse.json(
        { error: "PYTHON_BACKEND is not configured" },
        { status: 500 }
      );
    }

    const payload = {
      query: "Suggest my next video idea",
      yt_channel_id: channelId,
      extra_phrases: ["more video suggestion"],
    } as const;

    // Make the request to Python backend with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    try {
      const resp = await fetch(targetUrl + "/Next_Video_Idea_Generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      console.log(data);

      const nextVideoSuggestion = data?.next_video_suggestion;
      if (!nextVideoSuggestion) {
        return NextResponse.json(
          { error: "Missing next_video_suggestion in external response" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        next_video_suggestion: nextVideoSuggestion,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout - the generation process took too long" },
          { status: 408 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("/api/ideas/generate-next POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
