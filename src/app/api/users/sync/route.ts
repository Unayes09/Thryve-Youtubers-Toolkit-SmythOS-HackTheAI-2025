import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const primaryEmail =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null;
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const imageUrl = user.imageUrl || null;

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: primaryEmail, name: fullName, imageUrl },
      create: { id: user.id, email: primaryEmail, name: fullName, imageUrl },
    });

    return NextResponse.json({ ok: true, user: dbUser });
  } catch (err) {
    console.error("User sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
