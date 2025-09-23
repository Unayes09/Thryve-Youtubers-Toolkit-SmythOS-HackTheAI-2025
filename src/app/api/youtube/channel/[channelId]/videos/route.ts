import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
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

    const { channelId } = await params;

    // Initialize YouTube API with user's OAuth token
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Get videos from the specific channel
    const videosResponse = await youtube.search.list({
      part: ["snippet"],
      channelId: channelId,
      type: ["video"],
      order: "date",
      maxResults: 20,
    });

    // Get channel details
    const channelResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      id: [channelId],
    });

    const channel = channelResponse.data.items?.[0];
    const videos = videosResponse.data.items || [];

    // Format the response
    const formattedVideos = videos.map((video) => ({
      id: video.id?.videoId,
      title: video.snippet?.title,
      description: video.snippet?.description,
      thumbnail:
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.default?.url,
      publishedAt: video.snippet?.publishedAt,
      channelTitle: video.snippet?.channelTitle,
      url: `https://www.youtube.com/watch?v=${video.id?.videoId}`,
    }));

    const response = {
      channel: {
        id: channelId,
        title: channel?.snippet?.title,
        description: channel?.snippet?.description,
        thumbnail: channel?.snippet?.thumbnails?.high?.url,
        subscriberCount: channel?.statistics?.subscriberCount || "0",
        videoCount: channel?.statistics?.videoCount || "0",
        viewCount: channel?.statistics?.viewCount || "0",
      },
      videos: formattedVideos,
      totalResults: videosResponse.data.pageInfo?.totalResults || 0,
    };

    return NextResponse.json(response);
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
