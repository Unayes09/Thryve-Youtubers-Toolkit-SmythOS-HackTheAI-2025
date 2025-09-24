import { clerkClient, currentUser } from "@clerk/nextjs/server";

// Returns the Google OAuth access token for the currently signed-in Clerk user.
// Returns null if the user is unauthenticated or doesn't have Google connected.
export async function getGoogleAccessToken(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;
  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(
      user.id,
      "google"
    );
    const token = tokens?.data?.[0]?.token ?? null;
    return token || null;
  } catch (error) {
    console.error("Failed to retrieve Google access token from Clerk:", error);
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}
