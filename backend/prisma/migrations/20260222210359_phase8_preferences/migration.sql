-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "studyGoal" TEXT NOT NULL,
    "studyPace" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "groupPreference" TEXT NOT NULL,
    "availabilityWeekdays" JSONB NOT NULL,
    "availabilityTimeBlocks" JSONB NOT NULL,
    "topics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preference_clerkId_key" ON "Preference"("clerkId");
