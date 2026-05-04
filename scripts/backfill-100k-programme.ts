// Creates the "Sub-3:30 100km Build" Programme record and links the
// 30 W1-W10 SessionTemplates I seeded yesterday to it (with weekNum +
// dayOfWeek). Also defines the default schedule slots.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROGRAMME_NAME = "Sub-3:30 100km Build";
const PROGRAMME_DESCRIPTION =
  "10-week build to ride 100km in under 3 hours 30 minutes (avg 28.6 km/h). Three bike sessions per week — Tue threshold, Thu race-pace, Sat long ride. HR-based prescriptions. Deload weeks 4 and 8.";

// Default weekly schedule for this programme. Strength assignments
// (legs/chest/back) draw from general phase-based templates rather
// than programme-specific ones.
const DEFAULT_SLOTS: Array<{ dayOfWeek: number; categoryId: string }> = [
  // Mon = Rest
  { dayOfWeek: 1, categoryId: "speed" }, // Tue
  { dayOfWeek: 2, categoryId: "legs" }, // Wed
  { dayOfWeek: 3, categoryId: "speed" }, // Thu
  { dayOfWeek: 4, categoryId: "chest" }, // Fri
  { dayOfWeek: 4, categoryId: "back" }, // Fri (combined upper)
  { dayOfWeek: 5, categoryId: "endurance" }, // Sat
  // Sun = Rest
];

const DAY_TO_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

async function main() {
  // Upsert programme.
  const existing = await prisma.programme.findUnique({
    where: { name: PROGRAMME_NAME },
  });
  const programme = existing
    ? await prisma.programme.update({
        where: { id: existing.id },
        data: {
          description: PROGRAMME_DESCRIPTION,
          totalWeeks: 10,
          isCustom: false,
        },
      })
    : await prisma.programme.create({
        data: {
          name: PROGRAMME_NAME,
          description: PROGRAMME_DESCRIPTION,
          totalWeeks: 10,
          isCustom: false,
        },
      });
  console.log(`Programme: ${programme.name} (${programme.id})`);

  // Wipe existing slots for this programme and re-seed.
  await prisma.programmeSlot.deleteMany({
    where: { programmeId: programme.id },
  });
  for (const slot of DEFAULT_SLOTS) {
    await prisma.programmeSlot.create({
      data: { ...slot, programmeId: programme.id },
    });
  }
  console.log(`Slots: ${DEFAULT_SLOTS.length} written`);

  // Link existing W1-W10 templates by parsing their names.
  const planTemplates = await prisma.sessionTemplate.findMany({
    where: { name: { startsWith: "W" } },
  });
  let linked = 0;
  for (const t of planTemplates) {
    const m = t.name.match(/^W(\d+) (Mon|Tue|Wed|Thu|Fri|Sat|Sun):/);
    if (!m) continue;
    const weekNum = Number(m[1]);
    const dayOfWeek = DAY_TO_INDEX[m[2]];
    await prisma.sessionTemplate.update({
      where: { id: t.id },
      data: {
        programmeId: programme.id,
        weekNum,
        dayOfWeek,
      },
    });
    linked++;
  }
  console.log(`Templates linked: ${linked}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
