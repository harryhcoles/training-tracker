// Removes the WeekScheduleSlot rows for the current cycle 1 so it
// reverts to the programme default (the fixed D1-D9 layout) while
// leaving cycles 2..N with their calendar-aware overrides in place.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
(async () => {
  const userState = await p.userState.findUnique({ where: { id: 1 } });
  if (!userState) {
    console.error("UserState missing");
    process.exit(1);
  }
  const meso = userState.currentMesoNum;
  const result = await p.weekScheduleSlot.deleteMany({
    where: { mesoNum: meso, weekNum: 1 },
  });
  console.log(`Meso ${meso} cycle 1: deleted ${result.count} override rows`);
  const remaining = await p.weekScheduleSlot.count({
    where: { mesoNum: meso },
  });
  console.log(`Meso ${meso} remaining override rows (cycles 2+): ${remaining}`);
  await p.$disconnect();
})();
