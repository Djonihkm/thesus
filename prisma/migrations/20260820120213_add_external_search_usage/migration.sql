-- CreateTable
CREATE TABLE "ExternalSearchUsage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExternalSearchUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSearchUsage_provider_day_key" ON "ExternalSearchUsage"("provider", "day");
