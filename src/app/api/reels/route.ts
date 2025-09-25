import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

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

    // Fetch reels for the channel with their assets
    const reels = await prisma.reels.findMany({
      where: {
        channelId,
      },
      include: {
        reelAssets: {
          orderBy: {
            createdAt: "asc",
          },
        },
        videoIdea: {
          select: {
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      reels: reels.map((reel) => ({
        id: reel.id,
        generatorId: reel.generatorId,
        status: reel.status,
        channelId: reel.channelId,
        title: reel.title,
        description: reel.description,
        url: reel.url,
        videoIdeaId: reel.videoIdeaId,
        videoIdea: reel.videoIdea,
        reelAssets: reel.reelAssets.map((asset) => ({
          id: asset.id,
          generatorId: asset.generatorId,
          status: asset.status,
          url: asset.url,
          assetType: asset.assetType,
          createdAt: asset.createdAt.toISOString(),
          updatedAt: asset.updatedAt.toISOString(),
        })),
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString(),
      })),
      totalReels: reels.length,
    });
  } catch (error) {
    console.error("/api/reels GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { channelId, title, description, videoIdeaId, context, images } =
      body || {};

    if (!channelId || !title) {
      return NextResponse.json(
        { error: "channelId and title are required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const channel = await prisma.channels.findUnique({ where: { channelId } });
    if (!channel || channel.userId !== userId) {
      return NextResponse.json({ error: "Invalid channelId" }, { status: 404 });
    }

    // Create the reel
    const createdReel = await prisma.reels.create({
      data: {
        generatorId: `reel_${crypto.randomUUID()}`,
        status: "PROCESSING",
        channelId,
        title,
        description,
        videoIdeaId: videoIdeaId || null,
      },
      select: { id: true, generatorId: true },
    });

    // Create reel assets for uploaded media
    if (images && images.length > 0) {
      const reelAssets = images.map((mediaUrl: string) => {
        // Determine asset type based on URL extension
        const isVideo =
          mediaUrl.includes(".mp4") ||
          mediaUrl.includes(".webm") ||
          mediaUrl.includes(".mov") ||
          mediaUrl.includes(".avi");

        return {
          reelId: createdReel.id,
          generatorId: `reel_asset_${crypto.randomUUID()}`,
          status: "PROCESSING" as const,
          url: mediaUrl,
          assetType: isVideo ? "mp4" : "image",
        };
      });

      await prisma.reelAssets.createMany({
        data: reelAssets,
      });
    }

    return NextResponse.json({
      id: createdReel.id,
      generatorId: createdReel.generatorId,
    });
  } catch (error) {
    console.error("/api/reels POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
