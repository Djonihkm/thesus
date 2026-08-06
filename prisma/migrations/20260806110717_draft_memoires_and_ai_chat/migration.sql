-- CreateEnum
CREATE TYPE "MemoireSource" AS ENUM ('UPLOADED', 'DRAFTED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "Memoire" ADD COLUMN     "source" "MemoireSource" NOT NULL DEFAULT 'UPLOADED',
ALTER COLUMN "fileUrl" DROP NOT NULL,
ALTER COLUMN "fileType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiChatMessage_memoireId_createdAt_idx" ON "AiChatMessage"("memoireId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
