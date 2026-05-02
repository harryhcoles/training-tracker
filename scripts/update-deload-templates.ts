// One-off: rewrite week-4 and week-8 strength templates in the live DB
// to match the new deload definitions. Updates in place so SessionLog
// rows that reference these templates stay attached.

import { PrismaClient } from "@prisma/client";
import { STRENGTH_SESSIONS } from "../lib/seed-data";

const prisma = new PrismaClient();

// Old names that need to be replaced with the new deload contents.
const RENAMES: Array<{
  oldName: string;
  newName: string;
  category: "legs" | "chest" | "back";
}> = [
  { oldName: "Max Effort Lower", newName: "Deload Lower", category: "legs" },
  {
    oldName: "Max Volume",
    newName: "Deload Lower (mid-meso)",
    category: "legs",
  },
  { oldName: "Bench Strength", newName: "Deload Bench", category: "chest" },
  {
    oldName: "Max Bench",
    newName: "Deload Bench (mid-meso)",
    category: "chest",
  },
  { oldName: "Pull Strength", newName: "Deload Pull", category: "back" },
  { oldName: "Max Pull", newName: "Deload Pull (mid-meso)", category: "back" },
];

async function main() {
  for (const r of RENAMES) {
    const tmpl = await prisma.sessionTemplate.findFirst({
      where: { name: r.oldName, category: r.category },
    });
    if (!tmpl) {
      console.log(`Skipping ${r.oldName} — not found`);
      continue;
    }
    const def = STRENGTH_SESSIONS.find(
      (s) => s.name === r.newName && s.category === r.category,
    );
    if (!def) {
      console.log(`Skipping ${r.oldName} — no seed def for ${r.newName}`);
      continue;
    }

    await prisma.exerciseTemplate.deleteMany({
      where: { sessionTemplateId: tmpl.id },
    });

    await prisma.sessionTemplate.update({
      where: { id: tmpl.id },
      data: {
        name: def.name,
        description: def.description,
        phase: def.phase,
        exercises: {
          create: def.exercises.map((e, i) => ({
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

    console.log(`Updated: ${r.oldName} → ${def.name} (${tmpl.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
