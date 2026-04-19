-- CreateTable for AIStudySession and AIScore if they don't exist yet
CREATE TABLE IF NOT EXISTS "AIStudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "pdfName" TEXT,
    "pdfUrl" TEXT,
    "pdfText" TEXT,
    "messages" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIStudySession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AIScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "comprehensionScore" INTEGER NOT NULL,
    "implementationScore" INTEGER NOT NULL,
    "integrationScore" INTEGER NOT NULL,
    "conceptGaps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIScore_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'AIStudySession_userId_fkey'
    ) THEN
        ALTER TABLE "AIStudySession" ADD CONSTRAINT "AIStudySession_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'AIStudySession_courseId_fkey'
    ) THEN
        ALTER TABLE "AIStudySession" ADD CONSTRAINT "AIStudySession_courseId_fkey"
            FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'AIScore_sessionId_fkey'
    ) THEN
        ALTER TABLE "AIScore" ADD CONSTRAINT "AIScore_sessionId_fkey"
            FOREIGN KEY ("sessionId") REFERENCES "AIStudySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

-- Add new columns to AIStudySession if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='AIStudySession' AND column_name='pdfText'
    ) THEN
        ALTER TABLE "AIStudySession" ADD COLUMN "pdfText" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='AIStudySession' AND column_name='messages'
    ) THEN
        ALTER TABLE "AIStudySession" ADD COLUMN "messages" JSONB;
    END IF;
END$$;
