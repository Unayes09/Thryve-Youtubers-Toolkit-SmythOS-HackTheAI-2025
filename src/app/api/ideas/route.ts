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

    // Fetch video ideas for the channel
    const ideas = await prisma.videoIdeas.findMany({
      where: {
        channelId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ideas: ideas.map((idea) => ({
        id: idea.id,
        channelId: idea.channelId,
        title: idea.title,
        description: idea.description,
        script: idea.script,
        plan: idea.plan,
        tags: idea.tags,
        createdAt: idea.createdAt.toISOString(),
        updatedAt: idea.updatedAt.toISOString(),
      })),
      totalIdeas: ideas.length,
    });
  } catch (error) {
    console.error("/api/ideas GET error:", error);
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
    const { channelId, title, description, script, plan, tags } = body || {};

    if (!channelId || !title) {
      return NextResponse.json(
        { error: "channelId and title are required" },
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

    // Create new video idea
    const created = await prisma.videoIdeas.create({
      data: {
        channelId,
        title,
        description: description || null,
        script: script || null,
        plan: plan || null,
        tags: tags || null,
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      id: created.id,
    });
  } catch (error) {
    console.error("/api/ideas POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
