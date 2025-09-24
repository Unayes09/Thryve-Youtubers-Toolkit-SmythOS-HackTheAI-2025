import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAccessToken } from "@/lib/clerk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing query parameter 'q'" },
        { status: 400 }
      );
    }

    // Prefer user's Google OAuth token if available (higher quota context), but allow API key only search too
    const token = await getGoogleAccessToken();

    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q,
      type: ["channel"],
      maxResults: 10,
    });

    const items = searchResponse.data.items || [];
    const ids = items.map((it) => it.id?.channelId).filter(Boolean) as string[];

    let statsMap: Record<
      string,
      { subscriberCount: string; videoCount: string; viewCount: string }
    > = {};
    if (ids.length > 0) {
      const details = await youtube.channels.list({
        part: ["statistics"],
        id: ids,
      });
      for (const c of details.data.items || []) {
        const id = c.id as string;
        statsMap[id] = {
          subscriberCount: c.statistics?.subscriberCount || "0",
          videoCount: c.statistics?.videoCount || "0",
          viewCount: c.statistics?.viewCount || "0",
        };
      }
    }

    const results = items.map((it) => {
      const id = it.id?.channelId || "";
      const stats = statsMap[id] || {
        subscriberCount: "0",
        videoCount: "0",
        viewCount: "0",
      };
      return {
        id,
        title: it.snippet?.title || "",
        description: it.snippet?.description || null,
        thumbnail:
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.default?.url ||
          null,
        subscriberCount: stats.subscriberCount,
        videoCount: stats.videoCount,
        viewCount: stats.viewCount,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("/api/youtube/channels/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
