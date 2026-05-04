-- Programme table
CREATE TABLE "Programme" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "totalWeeks" INTEGER NOT NULL DEFAULT 12,
  "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Programme_name_key" ON "Programme"("name");

-- ProgrammeSlot table (default schedule per programme)
CREATE TABLE "ProgrammeSlot" (
  "id" SERIAL NOT NULL,
  "programmeId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "categoryId" TEXT NOT NULL,
  CONSTRAINT "ProgrammeSlot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgrammeSlot_programmeId_fkey" FOREIGN KEY ("programmeId")
    REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProgrammeSlot_programmeId_dayOfWeek_categoryId_key"
  ON "ProgrammeSlot"("programmeId", "dayOfWeek", "categoryId");

-- SessionTemplate gains programmeId + weekNum + dayOfWeek
ALTER TABLE "SessionTemplate"
  ADD COLUMN "programmeId" TEXT,
  ADD COLUMN "weekNum" INTEGER,
  ADD COLUMN "dayOfWeek" INTEGER;

ALTER TABLE "SessionTemplate"
  ADD CONSTRAINT "SessionTemplate_programmeId_fkey" FOREIGN KEY ("programmeId")
    REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SessionTemplate_programmeId_weekNum_dayOfWeek_idx"
  ON "SessionTemplate"("programmeId", "weekNum", "dayOfWeek");

-- UserState gains activeProgrammeId
ALTER TABLE "UserState"
  ADD COLUMN "activeProgrammeId" TEXT;

ALTER TABLE "UserState"
  ADD CONSTRAINT "UserState_activeProgrammeId_fkey" FOREIGN KEY ("activeProgrammeId")
    REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
