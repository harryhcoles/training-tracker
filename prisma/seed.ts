import { PrismaClient } from "@prisma/client";
import { BIKE_SESSIONS, STRENGTH_SESSIONS } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.userState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Default schedule: one category per day where applicable. Rest days
  // (Fri, Sun) are represented by absence of any slot. Multiple slots
  // per day are supported but not seeded by default.
  const defaultSchedule: Array<[number, string]> = [
    [0, "legs"],
    [1, "speed"],
    [2, "chest"],
    [3, "back"],
    [5, "endurance"],
  ];

  for (const [dayOfWeek, categoryId] of defaultSchedule) {
    const existing = await prisma.scheduleSlot.findFirst({
      where: { dayOfWeek, categoryId },
    });
    if (!existing) {
      await prisma.scheduleSlot.create({ data: { dayOfWeek, categoryId } });
    }
  }

  const existingNonCustom = await prisma.sessionTemplate.count({
    where: { isCustom: false },
  });
  if (existingNonCustom > 0) {
    console.log(
      `Removing ${existingNonCustom} existing non-custom templates to re-seed`,
    );
    const nonCustomIds = (
      await prisma.sessionTemplate.findMany({
        where: { isCustom: false },
        select: { id: true },
      })
    ).map((t) => t.id);
    await prisma.sessionLog.deleteMany({
      where: { sessionTemplateId: { in: nonCustomIds } },
    });
    await prisma.sessionTemplate.deleteMany({ where: { isCustom: false } });
  }

  for (const s of STRENGTH_SESSIONS) {
    await prisma.sessionTemplate.create({
      data: {
        category: s.category,
        phase: s.phase,
        name: s.name,
        description: s.description,
        isCustom: false,
        exercises: {
          create: s.exercises.map((e, i) => ({
            orderIndex: i,
            name: e.name,
            sets: e.sets,
            reps: e.reps ?? null,
            durationSec: e.durationSec ?? null,
            perSide: e.perSide ?? false,
            note: e.note ?? null,
          })),
        },
      },
    });
  }

  for (const b of BIKE_SESSIONS) {
    await prisma.sessionTemplate.create({
      data: {
        category: b.category,
        phase: b.phase,
        name: b.name,
        description: b.description,
        durationMin: b.durationMin,
        focus: b.focus,
        isCustom: false,
      },
    });
  }

  const total =
    STRENGTH_SESSIONS.length + BIKE_SESSIONS.length;
  console.log(
    `Seed complete — ${STRENGTH_SESSIONS.length} strength + ${BIKE_SESSIONS.length} bike = ${total} templates`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
