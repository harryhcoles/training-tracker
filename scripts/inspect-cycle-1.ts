// Diagnostic — show what the active programme schedules for each of
// the first two cycles, so I can sanity-check the calendar-aware layout
// vs the programme default.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
(async () => {
  const userState = await p.userState.findUnique({
    where: { id: 1 },
    include: { activeProgramme: { include: { scheduleSlots: true } } },
  });
  if (!userState || !userState.activeProgramme) {
    console.log("No active programme");
    process.exit(0);
  }
  const meso = userState.currentMesoNum;
  const start = userState.cycleStartedAt ?? new Date();
  const cycleLength = userState.activeProgramme.cycleLength;
  const programmeDefaults: Record<number, string[]> = {};
  for (const s of userState.activeProgramme.scheduleSlots) {
    (programmeDefaults[s.dayOfWeek] ??= []).push(s.categoryId);
  }

  for (const cycleNum of [1, 2]) {
    const overrides = await p.weekScheduleSlot.findMany({
      where: { mesoNum: meso, weekNum: cycleNum },
      orderBy: [{ dayOfWeek: "asc" }, { categoryId: "asc" }],
    });
    const byDay: Record<number, string[]> = {};
    for (const o of overrides) {
      (byDay[o.dayOfWeek] ??= []).push(o.categoryId);
    }
    const cycleStart = new Date(start);
    cycleStart.setDate(start.getDate() + (cycleNum - 1) * cycleLength);
    const source = overrides.length > 0 ? "OVERRIDE" : "DEFAULT";
    console.log(
      `\nCycle ${cycleNum} [${source}] (starts ${cycleStart
        .toISOString()
        .slice(0, 10)}):`,
    );
    for (let d = 0; d < cycleLength; d++) {
      const date = new Date(cycleStart);
      date.setDate(cycleStart.getDate() + d);
      const dayLabel = date.toLocaleDateString("en-GB", { weekday: "short" });
      const cats =
        overrides.length > 0 ? byDay[d] ?? [] : programmeDefaults[d] ?? [];
      console.log(
        `  D${d + 1} (${dayLabel} ${date.toISOString().slice(5, 10)}): ${
          cats.join(", ") || "REST"
        }`,
      );
    }
  }
  await p.$disconnect();
})();
