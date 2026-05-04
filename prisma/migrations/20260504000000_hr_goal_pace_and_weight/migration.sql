-- Add goal-pace + speed fields to SessionLog
ALTER TABLE "SessionLog"
  ADD COLUMN "avgSpeedKmh" DOUBLE PRECISION,
  ADD COLUMN "hrAtGoalPace" INTEGER,
  ADD COLUMN "timeInGoalPaceSec" INTEGER;

-- New WeightEntry table — single-user, one row per day max.
CREATE TABLE "WeightEntry" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeightEntry_date_key" ON "WeightEntry"("date");
