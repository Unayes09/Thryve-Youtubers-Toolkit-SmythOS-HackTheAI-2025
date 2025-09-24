-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "credits" BIGINT NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "public"."Channels" (
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "subscriberCount" BIGINT NOT NULL,
    "videoCount" BIGINT NOT NULL,
    "viewCount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channels_pkey" PRIMARY KEY ("userId","channelId")
);

-- CreateTable
CREATE TABLE "public"."SimilarChannels" (
    "ownerChannelId" TEXT NOT NULL,
    "similarChannelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimilarChannels_pkey" PRIMARY KEY ("ownerChannelId","similarChannelId")
);

-- CreateTable
CREATE TABLE "public"."Assests" (
    "id" TEXT NOT NULL,
    "generatorId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'PROCESSING',
    "channelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoIdeas" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "script" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoIdeas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Thumbnails" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "generatorId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'PROCESSING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoIdeaId" TEXT NOT NULL,

    CONSTRAINT "Thumbnails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reels" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "generatorId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'PROCESSING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoIdeaId" TEXT NOT NULL,

    CONSTRAINT "Reels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelAssets" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "generatorId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'PROCESSING',
    "url" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReelAssets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channels_userId_key" ON "public"."Channels"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Channels_channelId_key" ON "public"."Channels"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Assests_generatorId_key" ON "public"."Assests"("generatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Assests_channelId_key" ON "public"."Assests"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Thumbnails_generatorId_key" ON "public"."Thumbnails"("generatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Reels_generatorId_key" ON "public"."Reels"("generatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReelAssets_generatorId_key" ON "public"."ReelAssets"("generatorId");

-- AddForeignKey
ALTER TABLE "public"."Channels" ADD CONSTRAINT "Channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SimilarChannels" ADD CONSTRAINT "SimilarChannels_ownerChannelId_fkey" FOREIGN KEY ("ownerChannelId") REFERENCES "public"."Channels"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SimilarChannels" ADD CONSTRAINT "SimilarChannels_similarChannelId_fkey" FOREIGN KEY ("similarChannelId") REFERENCES "public"."Channels"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assests" ADD CONSTRAINT "Assests_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channels"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoIdeas" ADD CONSTRAINT "VideoIdeas_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channels"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Thumbnails" ADD CONSTRAINT "Thumbnails_videoIdeaId_fkey" FOREIGN KEY ("videoIdeaId") REFERENCES "public"."VideoIdeas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Thumbnails" ADD CONSTRAINT "Thumbnails_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channels"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reels" ADD CONSTRAINT "Reels_videoIdeaId_fkey" FOREIGN KEY ("videoIdeaId") REFERENCES "public"."VideoIdeas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reels" ADD CONSTRAINT "Reels_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channels"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelAssets" ADD CONSTRAINT "ReelAssets_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
