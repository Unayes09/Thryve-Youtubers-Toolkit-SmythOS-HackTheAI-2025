import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { getGoogleAccessToken } from "@/lib/clerk";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const channelId: string | undefined = body?.channelId;
    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      );
    }

    // If channel already exists for this user, return it
    const existing = await prisma.channels.findUnique({
      where: { userId_channelId: { userId: user.id, channelId } },
    });
    if (existing) {
      return NextResponse.json({ channel: existing, created: false });
    }

    // Fetch channel details from YouTube to populate stats
    const token = await getGoogleAccessToken();
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const channelResp = await youtube.channels.list({
      part: ["snippet", "statistics"],
      id: [channelId],
    });
    const c = channelResp.data.items?.[0];
    if (!c) {
      return NextResponse.json(
        { error: "Channel not found on YouTube" },
        { status: 404 }
      );
    }

    const created = await prisma.channels.create({
      data: {
        userId: user.id,
        channelId: c.id || channelId,
        title: c.snippet?.title || "",
        description: c.snippet?.description || null,
        thumbnail:
          c.snippet?.thumbnails?.high?.url ||
          c.snippet?.thumbnails?.default?.url ||
          null,
        subscriberCount: c.statistics?.subscriberCount || "0",
        videoCount: c.statistics?.videoCount || "0",
        viewCount: c.statistics?.viewCount || "0",
      },
    });

    return NextResponse.json(
      { channel: created, created: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/channels error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
