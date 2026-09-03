-- DropForeignKey
ALTER TABLE "Memoire" DROP CONSTRAINT "Memoire_institutionId_fkey";

-- AlterTable
ALTER TABLE "Memoire" ALTER COLUMN "institutionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Memoire" ADD CONSTRAINT "Memoire_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
