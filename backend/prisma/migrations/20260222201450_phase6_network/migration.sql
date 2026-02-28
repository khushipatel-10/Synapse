-- CreateTable
CREATE TABLE "CourseSnapshot" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEdge" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "complementarityScore" DOUBLE PRECISION NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseSnapshot_courseId_weekIndex_key" ON "CourseSnapshot"("courseId", "weekIndex");

-- CreateIndex
CREATE INDEX "NetworkEdge_snapshotId_idx" ON "NetworkEdge"("snapshotId");

-- CreateIndex
CREATE INDEX "NetworkEdge_courseId_idx" ON "NetworkEdge"("courseId");

-- CreateIndex
CREATE INDEX "NetworkEdge_userAId_idx" ON "NetworkEdge"("userAId");

-- CreateIndex
CREATE INDEX "NetworkEdge_userBId_idx" ON "NetworkEdge"("userBId");

-- AddForeignKey
ALTER TABLE "CourseSnapshot" ADD CONSTRAINT "CourseSnapshot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEdge" ADD CONSTRAINT "NetworkEdge_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CourseSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEdge" ADD CONSTRAINT "NetworkEdge_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEdge" ADD CONSTRAINT "NetworkEdge_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEdge" ADD CONSTRAINT "NetworkEdge_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
