// Dumps the entire active programme — every cycle, every day, with
// session details — in a readable markdown-ish format for review.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

function fmt(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

(async () => {
  const state = await p.userState.findUnique({
    where: { id: 1 },
    include: { activeProgramme: { include: { scheduleSlots: true } } },
  });
  if (!state?.activeProgramme) {
    console.log("No active programme");
    process.exit(0);
  }
  const prog = state.activeProgramme;
  const meso = state.currentMesoNum;
  const cycleLength = prog.cycleLength;
  const totalCycles = prog.totalWeeks;
  const start = state.cycleStartedAt ?? new Date();

  console.log(`# ${prog.name}`);
  console.log(``);
  console.log(prog.description ?? "");
  console.log(``);
  console.log(
    `Meso ${meso} · ${totalCycles} cycles × ${cycleLength} days · started ${fmt(start)}`,
  );
  console.log(``);

  // Programme default schedule (used by cycle 1).
  const progDefault: Record<number, string[]> = {};
  for (const s of prog.scheduleSlots) {
    (progDefault[s.dayOfWeek] ??= []).push(s.categoryId);
  }

  // Cache: programme templates and their exercises, keyed by id.
  const templates = await p.sessionTemplate.findMany({
    where: { programmeId: prog.id },
    include: { exercises: { orderBy: { orderIndex: "asc" } } },
  });
  type T = (typeof templates)[number];
  const byCycle: Record<number, T[]> = {};
  for (const t of templates) {
    if (t.weekNum != null) {
      (byCycle[t.weekNum] ??= []).push(t);
    }
  }

  // Pick template for a cycle/category, disambiguating "back" by
  // whether the slot is a double (back+speed) or solo.
  function pickTemplate(
    cycleNum: number,
    cat: string,
    dayCats: string[],
  ): T | null {
    const matches = (byCycle[cycleNum] ?? []).filter((t) => t.category === cat);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    const isDouble =
      dayCats.filter((c) => c === "back" || c === "speed").length >= 2;
    // Disambiguate by original cycleDay (slot-type identifier):
    //   back: cycleDay=5 = deadlift (solo), cycleDay=6 = OHP+pull (double)
    //   speed: cycleDay=1 = solo bike, cycleDay=6 = double bike
    if (cat === "back") {
      const wantDay = isDouble ? 6 : 5;
      return matches.find((t) => t.dayOfWeek === wantDay) ?? matches[0];
    }
    if (cat === "speed") {
      const wantDay = isDouble ? 6 : 1;
      return matches.find((t) => t.dayOfWeek === wantDay) ?? matches[0];
    }
    return matches[0];
  }

  for (let cycleNum = 1; cycleNum <= totalCycles; cycleNum++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(start.getDate() + (cycleNum - 1) * cycleLength);
    const overrides = await p.weekScheduleSlot.findMany({
      where: { mesoNum: meso, weekNum: cycleNum },
    });
    const byDay: Record<number, string[]> = {};
    for (const o of overrides) {
      (byDay[o.dayOfWeek] ??= []).push(o.categoryId);
    }
    const usingOverride = overrides.length > 0;
    const sourceLabel = usingOverride ? "calendar-aware override" : "programme default";

    console.log(`\n---\n`);
    console.log(`## Cycle ${cycleNum} — ${fmt(cycleStart)} (${sourceLabel})`);
    console.log(``);

    for (let d = 0; d < cycleLength; d++) {
      const date = new Date(cycleStart);
      date.setDate(cycleStart.getDate() + d);
      const cats = usingOverride
        ? (byDay[d] ?? [])
        : (progDefault[d] ?? []);
      const isToday =
        date.toDateString() === new Date().toDateString();
      const todayMark = isToday ? " ← TODAY" : "";

      if (cats.length === 0) {
        console.log(`### D${d + 1} · ${fmt(date)} · REST${todayMark}`);
        continue;
      }

      const catLabels = cats
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
        .join(" + ");
      console.log(`### D${d + 1} · ${fmt(date)} · ${catLabels}${todayMark}`);

      for (const cat of cats) {
        const tmpl = pickTemplate(cycleNum, cat, cats);
        if (!tmpl) {
          console.log(`  - (${cat}) — no template found`);
          continue;
        }
        const headerBits: string[] = [tmpl.name];
        if (tmpl.durationMin) headerBits.push(`${tmpl.durationMin}min`);
        if (tmpl.focus) headerBits.push(tmpl.focus);
        console.log(`  - **${headerBits.join(" · ")}**`);
        if (tmpl.description) {
          console.log(`    ${tmpl.description}`);
        }
        if (tmpl.exercises.length > 0) {
          for (const ex of tmpl.exercises) {
            const reps = ex.reps != null
              ? `× ${ex.reps}`
              : ex.durationSec != null
                ? `× ${ex.durationSec}s`
                : "";
            const ps = ex.perSide ? " per side" : "";
            const note = ex.note ? ` — ${ex.note}` : "";
            console.log(
              `      • ${ex.name}: ${ex.sets} sets ${reps}${ps}${note}`,
            );
          }
        }
      }
    }
  }
  await p.$disconnect();
})();
