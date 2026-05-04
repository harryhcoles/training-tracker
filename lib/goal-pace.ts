// Computes goal-pace HR fields from ride averages. The manual-entry
// case has no per-second streams, so the rule is: if the whole ride
// averaged 28-30 km/h, the whole-ride avgHr counts as hrAtGoalPace
// and the full duration counts as time in goal pace.

export const GOAL_PACE_LOWER_KMH = 28;
export const GOAL_PACE_UPPER_KMH = 30;

export function computeAvgSpeed(
  distanceKm: number | null | undefined,
  durationMin: number | null | undefined,
): number | null {
  if (distanceKm == null || durationMin == null || durationMin <= 0) return null;
  return distanceKm / (durationMin / 60);
}

export function computeGoalPaceFields({
  avgHr,
  avgSpeedKmh,
  durationMin,
}: {
  avgHr: number | null;
  avgSpeedKmh: number | null;
  durationMin: number | null;
}): { hrAtGoalPace: number | null; timeInGoalPaceSec: number | null } {
  if (avgHr == null || avgSpeedKmh == null || durationMin == null) {
    return { hrAtGoalPace: null, timeInGoalPaceSec: null };
  }
  if (
    avgSpeedKmh < GOAL_PACE_LOWER_KMH ||
    avgSpeedKmh > GOAL_PACE_UPPER_KMH
  ) {
    return { hrAtGoalPace: null, timeInGoalPaceSec: null };
  }
  return {
    hrAtGoalPace: avgHr,
    timeInGoalPaceSec: Math.round(durationMin * 60),
  };
}

// ISO 8601 week key e.g. "2026-W19"
export function isoWeekKey(d: Date): string {
  const target = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  );
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  if (yearStart.getUTCDay() !== 4) {
    yearStart.setUTCMonth(0, 1 + ((4 - yearStart.getUTCDay() + 7) % 7));
  }
  const week = 1 + Math.ceil((firstThursday - yearStart.getTime()) / 604800000);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
