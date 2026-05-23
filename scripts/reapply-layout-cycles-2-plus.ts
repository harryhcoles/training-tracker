// Re-runs the (now-improved) layoutCycle for cycles 2..N of the user's
// active programme. Wipes the existing WeekScheduleSlot rows for those
// cycles and replaces them with the freshly computed layouts.
//
// Leaves cycle 1 untouched (it deliberately has no override and falls
// back to the programme default per the user's request).

import { PrismaClient } from "@prisma/client";
import { layoutCycle } from "../lib/cycle-layout";

const p = new PrismaClient();
(async () => {
  const userState = await p.userState.findUnique({
    where: { id: 1 },
    include: { activeProgramme: true },
  });
  if (!userState || !userState.activeProgramme) {
    console.error("No active programme");
    process.exit(1);
  }
  const meso = userState.currentMesoNum;
  const cycleLength = userState.activeProgramme.cycleLength;
  const start = userState.cycleStartedAt ?? new Date();
  const totalCycles = userState.activeProgramme.totalWeeks;
  console.log(
    `Active: ${userState.activeProgramme.name} (cycleLength=${cycleLength}, cycles=${totalCycles})`,
  );
  console.log(`Meso ${meso}, cycleStartedAt ${start.toISOString()}`);

  for (let cycleNum = 2; cycleNum <= totalCycles; cycleNum++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(start.getDate() + (cycleNum - 1) * cycleLength);
    // Wipe old overrides for this cycle.
    await p.weekScheduleSlot.deleteMany({
      where: { mesoNum: meso, weekNum: cycleNum },
    });
    const layout = layoutCycle(cycleStart, cycleLength);
    const rows: Array<{
      mesoNum: number;
      weekNum: number;
      dayOfWeek: number;
      categoryId: string;
    }> = [];
    for (const day of layout) {
      for (const cat of day.categories) {
        rows.push({
          mesoNum: meso,
          weekNum: cycleNum,
          dayOfWeek: day.cycleDay,
          categoryId: cat,
        });
      }
    }
    if (rows.length > 0) {
      await p.weekScheduleSlot.createMany({ data: rows });
    }
    const summary = layout
      .map((d, i) => {
        const date = new Date(cycleStart);
        date.setDate(cycleStart.getDate() + i);
        const dayLabel = date.toLocaleDateString("en-GB", { weekday: "short" });
        return `D${i + 1} ${dayLabel}: ${d.categories.join("+") || "REST"}`;
      })
      .join(" | ");
    console.log(`\nCycle ${cycleNum} (${cycleStart.toISOString().slice(0, 10)}):`);
    console.log(`  ${summary}`);
  }

  await p.$disconnect();
})();
