-- Programmes can now declare their own deload weeks. Default stays
-- [4, 8, 12] for the original 12-week cycle plans; the Hybrid v2
-- plan overrides to [2, 6].
ALTER TABLE "Programme"
  ADD COLUMN "deloadWeeks" INTEGER[] NOT NULL DEFAULT ARRAY[4, 8, 12]::INTEGER[];
