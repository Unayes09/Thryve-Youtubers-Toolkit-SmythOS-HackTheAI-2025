import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { title, description, script, plan, tags } = body || {};

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Verify idea exists and belongs to user
    const idea = await prisma.videoIdeas.findUnique({
      where: { id: params.id },
      include: { channel: true },
    });

    if (!idea || idea.channel.userId !== userId) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Update video idea
    const updated = await prisma.videoIdeas.update({
      where: { id: params.id },
      data: {
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
      id: updated.id,
    });
  } catch (error) {
    console.error("/api/ideas/[id] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    // Verify idea exists and belongs to user
    const idea = await prisma.videoIdeas.findUnique({
      where: { id: params.id },
      include: { channel: true },
    });

    if (!idea || idea.channel.userId !== userId) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Delete video idea
    await prisma.videoIdeas.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("/api/ideas/[id] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
