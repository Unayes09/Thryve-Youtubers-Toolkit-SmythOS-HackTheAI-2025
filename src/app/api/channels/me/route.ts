import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

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
      orderBy: { createdAt: "desc" },
      select: {
        channelId: true,
        title: true,
        description: true,
        thumbnail: true,
        subscriberCount: true,
        videoCount: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("/api/channels/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
