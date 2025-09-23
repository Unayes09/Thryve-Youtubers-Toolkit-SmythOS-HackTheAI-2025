import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { requireAuth, getAuth, clerkClient } from "@clerk/express";
import { prisma } from "./prisma";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get(
  "/api/secure/ping",
  requireAuth(),
  async (req: Request, res: Response) => {
    const auth = getAuth(req);
    res.json({ ok: true, userId: auth.userId });
  }
);

app.post(
  "/api/users/sync",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const user = await clerkClient.users.getUser(userId);
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
        where: { id: userId },
        update: { email: primaryEmail, name: fullName, imageUrl },
        create: { id: userId, email: primaryEmail, name: fullName, imageUrl },
      });

      res.json({ ok: true, user: dbUser });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
