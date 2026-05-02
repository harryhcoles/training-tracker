-- Drop NULL-category rows; rest days are now represented by absence of a slot.
DELETE FROM "ScheduleSlot" WHERE "categoryId" IS NULL;

-- Drop the dayOfWeek-only unique constraint to allow multiple slots per day.
DROP INDEX IF EXISTS "ScheduleSlot_dayOfWeek_key";

-- Tighten categoryId to NOT NULL.
ALTER TABLE "ScheduleSlot" ALTER COLUMN "categoryId" SET NOT NULL;

-- Composite unique so the same category can't be assigned twice on the same day.
CREATE UNIQUE INDEX "ScheduleSlot_dayOfWeek_categoryId_key"
  ON "ScheduleSlot"("dayOfWeek", "categoryId");
