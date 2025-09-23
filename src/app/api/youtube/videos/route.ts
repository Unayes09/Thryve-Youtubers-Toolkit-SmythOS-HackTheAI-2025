import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const user = await currentUser();
    const token = (
      await (
        await clerkClient()
      ).users.getUserOauthAccessToken(user?.id as string, "google")
    ).data[0].token;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in with Google OAuth" },
        { status: 401 }
      );
    }

    // Initialize YouTube API with user's OAuth token
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Get user's channels
    const channelsResponse = await youtube.channels.list({
      part: ["snippet", "statistics", "contentDetails"],
      mine: true,
    });

    if (
      !channelsResponse.data.items ||
      channelsResponse.data.items.length === 0
    ) {
      return NextResponse.json(
        { error: "No channels found for this user" },
        { status: 404 }
      );
    }

    // Format the response with all user channels
    const channels = channelsResponse.data.items.map((channel) => ({
      id: channel.id,
      title: channel.snippet?.title,
      description: channel.snippet?.description,
      thumbnail:
        channel.snippet?.thumbnails?.high?.url ||
        channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.subscriberCount || "0",
      videoCount: channel.statistics?.videoCount || "0",
      viewCount: channel.statistics?.viewCount || "0",
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
    }));

    return NextResponse.json({
      channels: channels,
      totalChannels: channels.length,
    });
  } catch (error) {
    console.error("YouTube API Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `YouTube API Error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
