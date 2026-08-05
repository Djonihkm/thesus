-- CreateEnum
CREATE TYPE "ThemeSelectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "takenByUserId" TEXT;

-- CreateTable
CREATE TABLE "ThemeSelection" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ThemeSelectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThemeSelection_themeId_status_idx" ON "ThemeSelection"("themeId", "status");

-- CreateIndex
CREATE INDEX "ThemeSelection_studentId_status_idx" ON "ThemeSelection"("studentId", "status");

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_takenByUserId_fkey" FOREIGN KEY ("takenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeSelection" ADD CONSTRAINT "ThemeSelection_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeSelection" ADD CONSTRAINT "ThemeSelection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
