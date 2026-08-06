-- CreateEnum
CREATE TYPE "ThemeClosureReason" AS ENUM ('COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ThemeClosureStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ThemeClosureRequest" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reason" "ThemeClosureReason" NOT NULL,
    "status" "ThemeClosureStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeClosureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThemeClosureRequest_themeId_status_idx" ON "ThemeClosureRequest"("themeId", "status");

-- CreateIndex
CREATE INDEX "ThemeClosureRequest_studentId_status_idx" ON "ThemeClosureRequest"("studentId", "status");

-- AddForeignKey
ALTER TABLE "ThemeClosureRequest" ADD CONSTRAINT "ThemeClosureRequest_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeClosureRequest" ADD CONSTRAINT "ThemeClosureRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
