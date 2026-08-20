-- AlterTable
ALTER TABLE "Memoire" ADD COLUMN     "documentRoomVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "anchorFrom" TEXT,
    "anchorTo" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentComment_memoireId_createdAt_idx" ON "DocumentComment"("memoireId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentComment_parentId_idx" ON "DocumentComment"("parentId");

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
