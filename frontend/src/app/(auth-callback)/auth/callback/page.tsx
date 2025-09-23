import { syncUserToBackend } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function Page() {
  await syncUserToBackend();
  redirect("/dashboard");
}
