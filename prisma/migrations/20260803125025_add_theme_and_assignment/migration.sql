-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('PROPOSED', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('SUGGESTED', 'VALIDATED');

-- AlterTable
ALTER TABLE "Memoire" ADD COLUMN     "themeId" TEXT;

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "ThemeStatus" NOT NULL DEFAULT 'PROPOSED',
    "institutionId" TEXT NOT NULL,
    "proposedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoireAssignment" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "juryId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'SUGGESTED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoireAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoireAssignment_memoireId_assignedAt_idx" ON "MemoireAssignment"("memoireId", "assignedAt");

-- AddForeignKey
ALTER TABLE "Memoire" ADD CONSTRAINT "Memoire_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoireAssignment" ADD CONSTRAINT "MemoireAssignment_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoireAssignment" ADD CONSTRAINT "MemoireAssignment_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
