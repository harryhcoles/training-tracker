import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const defaultSchedule: Array<[number, string | null]> = [
    [0, "legs"],
    [1, "speed"],
    [2, "chest"],
    [3, "back"],
    [4, null],
    [5, "endurance"],
    [6, null],
  ];

  for (const [dayOfWeek, categoryId] of defaultSchedule) {
    await prisma.scheduleSlot.upsert({
      where: { dayOfWeek },
      update: { categoryId },
      create: { dayOfWeek, categoryId },
    });
  }

  const existingTemplates = await prisma.sessionTemplate.count({
    where: { isCustom: false },
  });
  if (existingTemplates > 0) {
    console.log(`Skipping seed templates — ${existingTemplates} already exist`);
    return;
  }

  await prisma.sessionTemplate.create({
    data: {
      category: "legs",
      phase: "base",
      name: "Heavy Squat Foundation",
      description: "Week 1 foundation squat session — build the base.",
      exercises: {
        create: [
          { orderIndex: 0, name: "Back Squat", sets: 4, reps: 6 },
          { orderIndex: 1, name: "Romanian Deadlift", sets: 3, reps: 8 },
          { orderIndex: 2, name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
          { orderIndex: 3, name: "Standing Calf Raise", sets: 3, reps: 12 },
        ],
      },
    },
  });

  await prisma.sessionTemplate.create({
    data: {
      category: "chest",
      phase: "base",
      name: "Bench Foundation",
      description: "Week 1 foundation bench session.",
      exercises: {
        create: [
          { orderIndex: 0, name: "Bench Press", sets: 4, reps: 6 },
          { orderIndex: 1, name: "Incline Dumbbell Press", sets: 3, reps: 8 },
          { orderIndex: 2, name: "Dips", sets: 3, reps: 8 },
          { orderIndex: 3, name: "Lateral Raise", sets: 3, reps: 12 },
        ],
      },
    },
  });

  await prisma.sessionTemplate.create({
    data: {
      category: "speed",
      phase: "base",
      name: "Cadence Spin-ups",
      description: "60min Z2 with 4x1min at 110+rpm. Train leg speed for crit attacks.",
      durationMin: 60,
      focus: "Cadence",
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
