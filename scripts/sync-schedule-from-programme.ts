// Resyncs the active ScheduleSlot rows from the active programme's
// ProgrammeSlot defaults — without re-activating (so currentMesoNum
// and cycleStartedAt aren't disturbed).
//
// Used after a programme reseed that changes the default schedule
// shape but where the user shouldn't lose their current week / cycle
// position.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
(async () => {
  const us = await p.userState.findUnique({
    where: { id: 1 },
    include: { activeProgramme: { include: { scheduleSlots: true } } },
  });
  if (!us?.activeProgramme) {
    console.error("No active programme");
    process.exit(1);
  }
  await p.$transaction([
    p.scheduleSlot.deleteMany({}),
    p.scheduleSlot.createMany({
      data: us.activeProgramme.scheduleSlots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        categoryId: s.categoryId,
      })),
    }),
  ]);
  console.log(
    `Synced ${us.activeProgramme.scheduleSlots.length} ScheduleSlot rows from ${us.activeProgramme.name}`,
  );
  for (const s of us.activeProgramme.scheduleSlots) {
    console.log(`  d=${s.dayOfWeek} ${s.categoryId}`);
  }
  await p.$disconnect();
})();
