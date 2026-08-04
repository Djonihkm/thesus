-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentThemeId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentThemeId_fkey" FOREIGN KEY ("currentThemeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
