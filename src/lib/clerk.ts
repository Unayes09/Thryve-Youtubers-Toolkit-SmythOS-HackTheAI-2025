import { auth } from "@clerk/nextjs/server";

export async function getClerkJwt(): Promise<string | null> {
  const session = await auth();
  if (!session || !session.sessionId) return null;
  // Clerk provides a session token for backend verification
  const { sessionClaims } = session;
  if (!sessionClaims) return null;
  // In Next 15 Clerk, use getToken on client; here we keep a server util placeholder
  return null;
}
