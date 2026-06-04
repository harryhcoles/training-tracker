// Dumps every strength + bike + conditioning template for the active
// programme, organised by day-of-week so it's easy to see the
// heavy/moderate rotation across weeks.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

(async () => {
  const us = await p.userState.findUnique({
    where: { id: 1 },
    include: { activeProgramme: true },
  });
  if (!us?.activeProgramme) {
    console.error("No active programme");
    process.exit(1);
  }
  const programme = us.activeProgramme;
  const totalWeeks = programme.totalWeeks;
  const deloads = new Set(programme.deloadWeeks);

  // Group templates by dayOfWeek.
  const templates = await p.sessionTemplate.findMany({
    where: { programmeId: programme.id },
    include: { exercises: { orderBy: { orderIndex: "asc" } } },
    orderBy: [{ dayOfWeek: "asc" }, { weekNum: "asc" }, { category: "asc" }],
  });

  const byDay: Record<number, typeof templates> = {};
  for (const t of templates) {
    if (t.dayOfWeek == null) continue;
    (byDay[t.dayOfWeek] ??= []).push(t);
  }

  for (let d = 0; d < 7; d++) {
    const dayTemplates = byDay[d] ?? [];
    if (dayTemplates.length === 0) {
      console.log(`\n## ${DAY_NAMES[d]} — REST\n`);
      continue;
    }
    console.log(`\n## ${DAY_NAMES[d]}\n`);
    // Group templates per week (a day can have multiple — e.g. Mon
    // legs + conditioning, Tue chest + speed).
    const byWeek: Record<number, typeof templates> = {};
    for (const t of dayTemplates) {
      if (t.weekNum == null) continue;
      (byWeek[t.weekNum] ??= []).push(t);
    }
    for (let w = 1; w <= totalWeeks; w++) {
      const wTemplates = byWeek[w] ?? [];
      if (wTemplates.length === 0) continue;
      const dl = deloads.has(w) ? " · DELOAD" : "";
      console.log(`### Week ${w}${dl}`);
      for (const t of wTemplates) {
        const headerBits: string[] = [t.name];
        if (t.durationMin) headerBits.push(`${t.durationMin}min`);
        if (t.focus) headerBits.push(t.focus);
        console.log(`- **${headerBits.join(" · ")}**`);
        if (t.exercises.length > 0) {
          for (const ex of t.exercises) {
            const reps =
              ex.reps != null
                ? `× ${ex.reps}`
                : ex.durationSec != null
                  ? `× ${ex.durationSec}s`
                  : "";
            const ps = ex.perSide ? " per side" : "";
            const note = ex.note ? ` — ${ex.note}` : "";
            console.log(`  - ${ex.name}: ${ex.sets} sets ${reps}${ps}${note}`);
          }
        }
      }
      console.log("");
    }
  }
  await p.$disconnect();
})();
