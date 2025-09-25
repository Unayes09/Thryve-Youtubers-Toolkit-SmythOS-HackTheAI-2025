-- DropForeignKey
ALTER TABLE "public"."Reels" DROP CONSTRAINT "Reels_videoIdeaId_fkey";

-- AlterTable
ALTER TABLE "public"."Reels" ALTER COLUMN "videoIdeaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Reels" ADD CONSTRAINT "Reels_videoIdeaId_fkey" FOREIGN KEY ("videoIdeaId") REFERENCES "public"."VideoIdeas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
