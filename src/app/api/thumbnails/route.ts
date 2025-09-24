import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { deductCredits } from "@/lib/credit-utils";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId") || undefined;

    const thumbnails = await prisma.thumbnails.findMany({
      where: {
        status: "COMPLETED",
        channel: { userId: user.id },
        ...(channelId ? { channelId } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        url: true,
        channelId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ thumbnails });
  } catch (error) {
    console.error("/api/thumbnails GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const channelId: string | undefined = body?.channelId;
    const providedImages: string[] | undefined = body?.images;
    const userPrompt: string | undefined = body?.prompt;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to the user
    const channel = await prisma.channels.findUnique({ where: { channelId } });
    if (!channel || channel.userId !== user.id) {
      return NextResponse.json({ error: "Invalid channelId" }, { status: 404 });
    }

    // Deduct credits atomically
    const creditResult = await deductCredits(user.id, "THUMBNAIL_GENERATE");
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    // Resolve images: use provided, otherwise fetch last 3 video thumbnails
    let images: string[] = Array.isArray(providedImages)
      ? providedImages.filter(Boolean)
      : [];

    if (images.length === 0) {
      // Get Google OAuth token via Clerk
      const client = await clerkClient();
      const tokens = await client.users.getUserOauthAccessToken(
        user.id,
        "google"
      );
      const token = tokens?.data?.[0]?.token;
      if (!token) {
        return NextResponse.json(
          { error: "Google account not linked" },
          { status: 400 }
        );
      }

      const youtube = google.youtube({
        version: "v3",
        auth: process.env.YOUTUBE_API_KEY,
        headers: { Authorization: `Bearer ${token}` },
      });

      const videosResponse = await youtube.search.list({
        part: ["snippet"],
        channelId,
        type: ["video"],
        order: "date",
        maxResults: 3,
      });

      const items = videosResponse.data.items || [];
      images = items
        .map(
          (v) =>
            v.snippet?.thumbnails?.maxres?.url ||
            v.snippet?.thumbnails?.high?.url ||
            v.snippet?.thumbnails?.medium?.url ||
            v.snippet?.thumbnails?.default?.url ||
            ""
        )
        .filter((u): u is string => Boolean(u))
        .slice(0, 3);
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images available to generate thumbnail" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "Create an ultra HD 4K YouTube thumbnail image in a high-impact cinematic style using ONLY the provided images as sources. Do not include any text, numbers, or watermarks — only visuals. Ensure the composition has a clear central subject, dramatic lighting, vibrant contrast, and sharp edge definition. Match the platform-accurate 16:9 aspect ratio and enhance clarity for maximum thumbnail appeal.";

    const finalPrompt = [userPrompt?.trim(), systemPrompt]
      .filter(Boolean)
      .join("\n\n");

    const targetUrl = process.env.SMYTHOS_AGENT1;
    if (!targetUrl) {
      return NextResponse.json(
        { error: "SMYTHOS_AGENT1 is not configured" },
        { status: 500 }
      );
    }

    const payload = {
      images,
      prompt: finalPrompt,
      fal_webhook: process.env.FAL_WEBHOOK || "",
    } as const;

    const resp = await fetch(targetUrl + "/Thumbnail_Make", {
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

    // Create processing thumbnail entry
    const created = await prisma.thumbnails.create({
      data: {
        channelId,
        generatorId: requestId,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, requestId, id: created.id });
  } catch (error) {
    console.error("/api/thumbnails POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
