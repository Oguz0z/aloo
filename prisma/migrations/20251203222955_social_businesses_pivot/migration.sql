/*
  Warnings:

  - You are about to drop the `LlmModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepurposeVideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedSearch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedSearchResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Script` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Search` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `YouTubeConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'called', 'proposal_sent', 'negotiating', 'won', 'lost', 'not_interested');

-- DropForeignKey
ALTER TABLE "RepurposeVideo" DROP CONSTRAINT "RepurposeVideo_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedItem" DROP CONSTRAINT "SavedItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedSearch" DROP CONSTRAINT "SavedSearch_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedSearchResult" DROP CONSTRAINT "SavedSearchResult_savedSearchId_fkey";

-- DropForeignKey
ALTER TABLE "Script" DROP CONSTRAINT "Script_repurposeVideoId_fkey";

-- DropForeignKey
ALTER TABLE "Script" DROP CONSTRAINT "Script_userId_fkey";

-- DropForeignKey
ALTER TABLE "Search" DROP CONSTRAINT "Search_userId_fkey";

-- DropForeignKey
ALTER TABLE "SearchResult" DROP CONSTRAINT "SearchResult_searchId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "YouTubeConfig" DROP CONSTRAINT "YouTubeConfig_userId_fkey";

-- DropTable
DROP TABLE "LlmModel";

-- DropTable
DROP TABLE "RepurposeVideo";

-- DropTable
DROP TABLE "SavedItem";

-- DropTable
DROP TABLE "SavedSearch";

-- DropTable
DROP TABLE "SavedSearchResult";

-- DropTable
DROP TABLE "Script";

-- DropTable
DROP TABLE "Search";

-- DropTable
DROP TABLE "SearchResult";

-- DropTable
DROP TABLE "UserSettings";

-- DropTable
DROP TABLE "YouTubeConfig";

-- DropEnum
DROP TYPE "Platform";

-- CreateTable
CREATE TABLE "BusinessSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'au',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSearchResult" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "types" TEXT[],
    "photoUrl" TEXT,
    "mapsUrl" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessSearchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "industryType" TEXT NOT NULL DEFAULT 'other',
    "photoUrl" TEXT,
    "mapsUrl" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "scoreBreakdown" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "opportunities" TEXT[],
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessSearch_userId_idx" ON "BusinessSearch"("userId");

-- CreateIndex
CREATE INDEX "BusinessSearch_createdAt_idx" ON "BusinessSearch"("createdAt");

-- CreateIndex
CREATE INDEX "BusinessSearchResult_searchId_idx" ON "BusinessSearchResult"("searchId");

-- CreateIndex
CREATE INDEX "BusinessSearchResult_placeId_idx" ON "BusinessSearchResult"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSearchResult_searchId_placeId_key" ON "BusinessSearchResult"("searchId", "placeId");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_leadScore_idx" ON "Lead"("leadScore");

-- CreateIndex
CREATE INDEX "Lead_savedAt_idx" ON "Lead"("savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_userId_placeId_key" ON "Lead"("userId", "placeId");

-- CreateIndex
CREATE INDEX "ContactLog_leadId_idx" ON "ContactLog"("leadId");

-- CreateIndex
CREATE INDEX "ContactLog_createdAt_idx" ON "ContactLog"("createdAt");

-- AddForeignKey
ALTER TABLE "BusinessSearch" ADD CONSTRAINT "BusinessSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSearchResult" ADD CONSTRAINT "BusinessSearchResult_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "BusinessSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
