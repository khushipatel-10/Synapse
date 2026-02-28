/*
  Warnings:

  - You are about to drop the `Preference` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Preference";

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "studyPace" TEXT NOT NULL,
    "studyMode" TEXT NOT NULL,
    "learningStyle" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "subjectInterests" JSONB NOT NULL,
    "preferredGroupSize" TEXT NOT NULL,
    "availability" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_clerkUserId_key" ON "UserPreferences"("clerkUserId");
