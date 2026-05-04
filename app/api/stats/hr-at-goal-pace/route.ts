import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isoWeekKey } from "@/lib/goal-pace";

const MIN_RIDE_GOAL_PACE_SEC = 300;
const HIGH_CONFIDENCE_WEEK_SEC = 15 * 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weeks = Math.max(
      1,
      Math.min(52, Number(url.searchParams.get("weeks") ?? "12")),
    );
    const since = new Date(Date.now() - weeks * 7 * 86400_000);

    const rides = await prisma.sessionLog.findMany({
      where: {
        loggedAt: { gte: since },
        hrAtGoalPace: { not: null },
        timeInGoalPaceSec: { gte: MIN_RIDE_GOAL_PACE_SEC },
      },
      select: {
        loggedAt: true,
        hrAtGoalPace: true,
        timeInGoalPaceSec: true,
      },
    });

    type Bucket = { sumWeightedHr: number; sumSec: number; rideCount: number };
    const byWeek: Record<string, Bucket> = {};
    for (const r of rides) {
      const key = isoWeekKey(r.loggedAt);
      const b = (byWeek[key] ??= {
        sumWeightedHr: 0,
        sumSec: 0,
        rideCount: 0,
      });
      const sec = r.timeInGoalPaceSec ?? 0;
      const hr = r.hrAtGoalPace ?? 0;
      b.sumWeightedHr += hr * sec;
      b.sumSec += sec;
      b.rideCount += 1;
    }

    const series = Object.entries(byWeek)
      .map(([week, b]) => ({
        week,
        avgHr: b.sumSec > 0 ? Math.round(b.sumWeightedHr / b.sumSec) : null,
        totalGoalPaceMin: Math.round(b.sumSec / 60),
        rideCount: b.rideCount,
        lowConfidence: b.sumSec < HIGH_CONFIDENCE_WEEK_SEC,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({ ok: true, series });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
