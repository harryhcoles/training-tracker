-- AlterTable
ALTER TABLE "SessionLog" ADD COLUMN "stravaActivityId" BIGINT,
                        ADD COLUMN "stravaStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "SessionLog_stravaActivityId_key" ON "SessionLog"("stravaActivityId");
