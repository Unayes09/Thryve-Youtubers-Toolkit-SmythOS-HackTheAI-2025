import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { POST as syncUserToBackend } from "@/app/api/users/sync/route";

export default async function Page() {
  const session = await auth();
  if (!session || !session.userId) {
    redirect("/sign-in?error=not_authenticated");
  }

  const res = await syncUserToBackend();
  if (!res.ok) {
    const error = await res.json();
    redirect(
      "/sign-in?error=" + encodeURIComponent(error.error || "sync_failed")
    );
  }

  redirect("/dashboard");
}
