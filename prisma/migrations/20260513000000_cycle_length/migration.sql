-- Cycle length on Programme (default 7 = standard calendar week).
-- Programmes with cycleLength != 7 use a free-running microcycle —
-- e.g. the 9-day Hybrid plan. Templates' dayOfWeek field is reused
-- as 0..(cycleLength-1) in those cases (cycleDay).
ALTER TABLE "Programme"
  ADD COLUMN "cycleLength" INTEGER NOT NULL DEFAULT 7;

-- When the user's current cycle began (calendar date). NULL for users
-- who haven't yet activated any programme.
ALTER TABLE "UserState"
  ADD COLUMN "cycleStartedAt" TIMESTAMP(3);
