-- Add email and username fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Unique index on username (partial — only enforced when non-null)
DO $$ BEGIN
  CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- PeerStudySession table
CREATE TABLE IF NOT EXISTS "PeerStudySession" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "threadId"    TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeerStudySession_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PeerStudySession"
    ADD CONSTRAINT "PeerStudySession_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PeerStudySession"
    ADD CONSTRAINT "PeerStudySession_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
