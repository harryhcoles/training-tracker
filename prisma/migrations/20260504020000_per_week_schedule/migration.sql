-- Per-week schedule overrides. Absence of rows for a (mesoNum, weekNum)
-- pair means "no override; fall back to ScheduleSlot defaults".
CREATE TABLE "WeekScheduleSlot" (
  "id" SERIAL NOT NULL,
  "mesoNum" INTEGER NOT NULL,
  "weekNum" INTEGER NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "categoryId" TEXT NOT NULL,
  CONSTRAINT "WeekScheduleSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeekScheduleSlot_mesoNum_weekNum_dayOfWeek_categoryId_key"
  ON "WeekScheduleSlot"("mesoNum", "weekNum", "dayOfWeek", "categoryId");

CREATE INDEX "WeekScheduleSlot_mesoNum_weekNum_idx"
  ON "WeekScheduleSlot"("mesoNum", "weekNum");
