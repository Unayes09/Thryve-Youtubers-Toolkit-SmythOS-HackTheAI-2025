import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { POST as syncUserToBackend } from "@/app/api/users/sync/route";

export default async function Page() {
  const session = await auth();
  if (!session || !session.userId) {
    redirect("/sign-in?error=not_authenticated");
  }

  const res = await (await syncUserToBackend()).json();
  if (!res.ok) {
    redirect(
      "/sign-in?error=" + encodeURIComponent(res.error || "sync_failed")
    );
  }

  redirect("/dashboard");
}
