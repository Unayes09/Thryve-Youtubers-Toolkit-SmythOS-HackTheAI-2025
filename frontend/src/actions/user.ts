"use server";
import { auth } from "@clerk/nextjs/server";

export async function syncUserToBackend() {
  const session = await auth();
  if (!session || !session.sessionId)
    return { ok: false, error: "unauthorized" };
  const token = await session
    .getToken({ template: undefined })
    .catch(() => null);
  if (!token) return { ok: false, error: "no_token" };
  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/api/users/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, error: `backend_${res.status}` };
  return { ok: true };
}
