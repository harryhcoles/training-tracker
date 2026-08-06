import { NextResponse } from "next/server";
import {
  fetchAllActivitiesAfter,
  isStravaConfigured,
  type StravaActivity,
} from "@/lib/strava";

// Returns aggregated cycling history suitable for plan design.
// GET /api/strava/history?days=365
export async function GET(request: Request) {
  try {
    if (!isStravaConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Strava not configured" },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const days = Math.max(1, Math.min(730, Number(url.searchParams.get("days") ?? "365")));
    const after = Math.floor(Date.now() / 1000) - days * 86400;

    const all = await fetchAllActivitiesAfter(after);
    const rides = all.filter(
      (a) => a.type === "Ride" || a.type === "VirtualRide",
    );

    // ?list=1 — raw per-ride list (slim), newest first. Used for
    // pace calibration when designing plan targets.
    if (url.searchParams.get("list")) {
      return NextResponse.json({
        ok: true,
        windowDays: days,
        rides: [...rides]
          .sort(
            (a, b) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime(),
          )
          .map(slim),
      });
    }

    // Totals
    const totalHours = sum(rides.map((r) => r.moving_time / 3600));
    const totalKm = sum(rides.map((r) => r.distance / 1000));
    const totalElevationM = sum(rides.map((r) => r.total_elevation_gain ?? 0));

    // Per month
    const perMonthMap = bucket(rides, (r) => r.start_date.slice(0, 7));
    const perMonth = Object.entries(perMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, list]) => ({
        month,
        rides: list.length,
        hours: round1(sum(list.map((r) => r.moving_time / 3600))),
        km: round1(sum(list.map((r) => r.distance / 1000))),
        avgWeightedPower: avgOrNull(
          list.map((r) => r.weighted_average_watts).filter(notNull),
        ),
        avgHr: avgOrNull(list.map((r) => r.average_heartrate).filter(notNull)),
      }));

    // Per ISO week (last ~12 only — keeps payload tight)
    const perWeekMap = bucket(rides, (r) => isoWeekKey(new Date(r.start_date)));
    const perWeek = Object.entries(perWeekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, list]) => ({
        week,
        rides: list.length,
        hours: round1(sum(list.map((r) => r.moving_time / 3600))),
        km: round1(sum(list.map((r) => r.distance / 1000))),
      }));

    // Recent trend: last 4 weeks vs prior 4 weeks
    const now = Date.now();
    const fourWeeksAgo = now - 28 * 86400 * 1000;
    const eightWeeksAgo = now - 56 * 86400 * 1000;
    const last4 = rides.filter(
      (r) => new Date(r.start_date).getTime() >= fourWeeksAgo,
    );
    const prior4 = rides.filter((r) => {
      const t = new Date(r.start_date).getTime();
      return t >= eightWeeksAgo && t < fourWeeksAgo;
    });
    const last4Hours = sum(last4.map((r) => r.moving_time / 3600));
    const prior4Hours = sum(prior4.map((r) => r.moving_time / 3600));
    const recentTrend = {
      last4WeeksHours: round1(last4Hours),
      prior4WeeksHours: round1(prior4Hours),
      deltaPct:
        prior4Hours > 0
          ? Math.round(((last4Hours - prior4Hours) / prior4Hours) * 100)
          : null,
      last4WeeksRides: last4.length,
      prior4WeeksRides: prior4.length,
    };

    // Power & HR
    const withPower = rides.filter((r) => r.weighted_average_watts != null);
    const withHr = rides.filter((r) => r.average_heartrate != null);

    const ftpProxy = withPower
      .filter((r) => r.moving_time >= 20 * 60) // long enough to be meaningful
      .sort(
        (a, b) =>
          (b.weighted_average_watts ?? 0) - (a.weighted_average_watts ?? 0),
      )
      .slice(0, 5);

    // Longest sessions
    const longest = {
      byKm: pickBest(rides, (r) => r.distance),
      byHours: pickBest(rides, (r) => r.moving_time),
      byElevation: pickBest(rides, (r) => r.total_elevation_gain ?? 0),
    };

    // Hardest sessions (suffer score if available, else NP)
    const hardestBySuffer = [...rides]
      .filter((r) => r.suffer_score != null)
      .sort((a, b) => (b.suffer_score ?? 0) - (a.suffer_score ?? 0))
      .slice(0, 5)
      .map(slim);

    // Type breakdown
    const types = rides.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      windowDays: days,
      totalRides: rides.length,
      totalRidesAllTypes: all.length,
      totals: {
        hours: round1(totalHours),
        km: round1(totalKm),
        elevationM: Math.round(totalElevationM),
      },
      types,
      perMonth,
      perWeek,
      recentTrend,
      power: {
        ridesWithPower: withPower.length,
        avgWeightedPower: avgOrNull(
          withPower.map((r) => r.weighted_average_watts).filter(notNull),
        ),
        topNpRides: ftpProxy.map(slim),
      },
      heartRate: {
        ridesWithHr: withHr.length,
        avgHr: avgOrNull(withHr.map((r) => r.average_heartrate).filter(notNull)),
        maxHrSeen: Math.max(0, ...withHr.map((r) => r.average_heartrate ?? 0)),
      },
      longest: {
        byKm: slim(longest.byKm),
        byHours: slim(longest.byHours),
        byElevation: slim(longest.byElevation),
      },
      hardestBySuffer,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Strava history error:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function avgOrNull(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return Math.round(sum(xs) / xs.length);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function notNull<T>(v: T | null | undefined): v is T {
  return v != null;
}

function bucket<T>(items: T[], keyFn: (x: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of items) {
    const k = keyFn(x);
    (out[k] ??= []).push(x);
  }
  return out;
}

function isoWeekKey(d: Date): string {
  // YYYY-Www. Uses ISO 8601 (week 1 = first week with Thursday).
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function pickBest(
  rides: StravaActivity[],
  by: (r: StravaActivity) => number,
): StravaActivity | null {
  if (rides.length === 0) return null;
  return rides.reduce((best, r) => (by(r) > by(best) ? r : best));
}

function slim(r: StravaActivity | null) {
  if (!r) return null;
  return {
    name: r.name,
    type: r.type,
    date: r.start_date.slice(0, 10),
    durationMin: Math.round(r.moving_time / 60),
    km: round1(r.distance / 1000),
    elevationM: Math.round(r.total_elevation_gain ?? 0),
    avgPower: r.average_watts ?? null,
    weightedPower: r.weighted_average_watts ?? null,
    avgHr: r.average_heartrate ? Math.round(r.average_heartrate) : null,
    sufferScore: r.suffer_score ?? null,
  };
}
