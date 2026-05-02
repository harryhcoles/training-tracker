import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchRecentActivities,
  isStravaConfigured,
  stravaActivityToLogData,
} from "@/lib/strava";

export async function GET() {
  return NextResponse.json({ configured: isStravaConfigured() });
}

export async function POST() {
  try {
    if (!isStravaConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Strava env vars not configured" },
        { status: 400 },
      );
    }

    // Get most recent synced activity time, default to 14 days ago.
    const lastSynced = await prisma.sessionLog.findFirst({
      where: { stravaActivityId: { not: null } },
      orderBy: { stravaStartDate: "desc" },
      select: { stravaStartDate: true },
    });
    const afterTimestamp = lastSynced?.stravaStartDate
      ? Math.floor(lastSynced.stravaStartDate.getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 14 * 86400;

    const activities = await fetchRecentActivities(afterTimestamp, 30);
    const userState = await prisma.userState.findUnique({ where: { id: 1 } });
    if (!userState) {
      return NextResponse.json(
        { ok: false, error: "UserState not found" },
        { status: 500 },
      );
    }

    let synced = 0;
    let skipped = 0;
    const created: Array<{ name: string; id: string }> = [];

    for (const activity of activities) {
      const logData = stravaActivityToLogData(activity);
      if (!logData) {
        skipped++;
        continue;
      }

      const existing = await prisma.sessionLog.findFirst({
        where: { stravaActivityId: BigInt(activity.id) },
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Pick the template whose durationMin is closest to the actual
      // ride length, restricted to the day's scheduled category if there
      // is one (else any bike category). Falls back to the closest
      // endurance template, then to any bike template.
      const activityDate = new Date(activity.start_date);
      const dayOfWeek = (activityDate.getDay() + 6) % 7;
      const daysSlots = await prisma.scheduleSlot.findMany({
        where: { dayOfWeek },
      });
      const activityMinutes = activity.moving_time / 60;
      // Of the day's scheduled bike-style slots, prefer endurance over
      // speed/conditioning since Strava rides are usually steady-state.
      const bikeCats = daysSlots
        .map((s) => s.categoryId)
        .filter(
          (c) => c === "speed" || c === "endurance" || c === "conditioning",
        );
      const scheduledBikeCat =
        bikeCats.find((c) => c === "endurance") ?? bikeCats[0] ?? null;

      const pickClosest = async (where: {
        category?: string | { in: string[] };
        isCustom?: boolean;
      }) => {
        const candidates = await prisma.sessionTemplate.findMany({
          where: { ...where, durationMin: { not: null } },
        });
        if (candidates.length === 0) return null;
        return candidates.reduce((best, t) => {
          const bestDiff = Math.abs((best.durationMin ?? 0) - activityMinutes);
          const tDiff = Math.abs((t.durationMin ?? 0) - activityMinutes);
          return tDiff < bestDiff ? t : best;
        });
      };

      let sessionTemplate = null;
      if (scheduledBikeCat) {
        sessionTemplate = await pickClosest({
          category: scheduledBikeCat,
          isCustom: false,
        });
      }
      if (!sessionTemplate) {
        sessionTemplate = await pickClosest({
          category: "endurance",
          isCustom: false,
        });
      }
      if (!sessionTemplate) {
        sessionTemplate = await pickClosest({
          category: { in: ["endurance", "speed"] },
        });
      }
      if (!sessionTemplate) {
        skipped++;
        continue;
      }

      const log = await prisma.sessionLog.create({
        data: {
          sessionTemplateId: sessionTemplate.id,
          mesoNum: userState.currentMesoNum,
          weekNum: userState.currentWeek,
          loggedAt: new Date(activity.start_date),
          durationActualMin: logData.durationActualMin,
          distanceKm: logData.distanceKm,
          avgHr: logData.avgHr,
          avgPower: logData.avgPower,
          notes: logData.notes,
          stravaActivityId: BigInt(activity.id),
          stravaStartDate: new Date(activity.start_date),
        },
      });
      created.push({ name: activity.name, id: log.id });
      synced++;
    }

    return NextResponse.json({ ok: true, synced, skipped, created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Strava sync error:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
