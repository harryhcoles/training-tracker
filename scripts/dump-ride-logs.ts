// Dumps recent bike logs (synced or manual) with pace so plan
// targets can be calibrated against real ride data.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

(async () => {
  const logs = await p.sessionLog.findMany({
    where: { distanceKm: { not: null } },
    orderBy: { loggedAt: "desc" },
    take: 60,
    include: { template: { select: { name: true, category: true } } },
  });
  for (const l of logs) {
    const km = l.distanceKm!;
    const min = l.durationActualMin;
    const kmh = min ? (km / (min / 60)).toFixed(1) : "?";
    console.log(
      [
        l.loggedAt.toISOString().slice(0, 10),
        `${km.toFixed(1)}km`,
        min ? `${Math.round(min)}min` : "?min",
        `${kmh}km/h`,
        l.avgHr ? `HR${l.avgHr}` : "HR-",
        l.template?.name ?? "(no template)",
        l.notes?.slice(0, 60) ?? "",
      ].join(" | "),
    );
  }
  await p.$disconnect();
})();
