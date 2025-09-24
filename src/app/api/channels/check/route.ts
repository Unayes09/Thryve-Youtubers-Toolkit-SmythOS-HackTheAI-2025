import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { getGoogleAccessToken } from "@/lib/clerk";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const channels = await prisma.channels.findMany({
      where: { userId: user.id },
    });
    if (channels.length > 0) {
      return NextResponse.json({ hasChannels: true, channels });
    }

    // If no channels, try suggesting YouTube channels from the authenticated Google account
    const googleToken = await getGoogleAccessToken();
    if (!googleToken) {
      return NextResponse.json({
        hasChannels: false,
        suggestions: [],
        requiresGoogleOAuth: true,
        message: "Connect Google account to fetch your YouTube channels",
      });
    }

    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
      headers: { Authorization: `Bearer ${googleToken}` },
    });

    const channelsResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      mine: true,
    });

    const suggestions = (channelsResponse.data.items || []).map((c) => ({
      id: c.id || "",
      title: c.snippet?.title || "",
      description: c.snippet?.description || null,
      thumbnail:
        c.snippet?.thumbnails?.high?.url ||
        c.snippet?.thumbnails?.default?.url ||
        null,
      subscriberCount: c.statistics?.subscriberCount || "0",
      videoCount: c.statistics?.videoCount || "0",
      viewCount: c.statistics?.viewCount || "0",
    }));

    return NextResponse.json({
      hasChannels: false,
      suggestions,
      requiresGoogleOAuth: false,
    });
  } catch (error) {
    console.error("/api/channels/check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
