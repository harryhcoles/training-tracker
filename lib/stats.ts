import type { SessionLog, ExerciseSet, SessionTemplate } from "@prisma/client";

export type LogWithSets = SessionLog & {
  sets: ExerciseSet[];
  template: SessionTemplate;
};

export function getTotalVolume(
  logs: LogWithSets[],
  categoryFilter?: string,
): number {
  let total = 0;
  for (const log of logs) {
    if (categoryFilter && log.template.category !== categoryFilter) continue;
    for (const s of log.sets) {
      if (s.weightKg != null && s.reps != null) {
        total += s.weightKg * s.reps;
      }
    }
  }
  return total;
}

export function getBikeStats(
  logs: LogWithSets[],
  type?: "speed" | "endurance",
): {
  totalKm: number;
  totalHours: number;
  count: number;
  avgPower: number | null;
  topSpeed: number | null;
} {
  const bike = logs.filter((l) => {
    if (l.template.category !== "speed" && l.template.category !== "endurance")
      return false;
    if (type && l.template.category !== type) return false;
    return true;
  });
  let totalKm = 0;
  let totalMin = 0;
  let powerSum = 0;
  let powerCount = 0;
  let topSpeed: number | null = null;
  for (const l of bike) {
    if (l.distanceKm != null) totalKm += l.distanceKm;
    if (l.durationActualMin != null) totalMin += l.durationActualMin;
    if (l.avgPower != null) {
      powerSum += l.avgPower;
      powerCount++;
    }
    if (l.distanceKm != null && l.durationActualMin != null && l.durationActualMin > 0) {
      const speed = l.distanceKm / (l.durationActualMin / 60);
      if (topSpeed == null || speed > topSpeed) topSpeed = speed;
    }
  }
  return {
    totalKm,
    totalHours: totalMin / 60,
    count: bike.length,
    avgPower: powerCount > 0 ? powerSum / powerCount : null,
    topSpeed,
  };
}

function epley1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function getPersonalRecords(
  logs: LogWithSets[],
): Array<{ exerciseName: string; e1rm: number; weight: number; reps: number }> {
  const best: Record<
    string,
    { e1rm: number; weight: number; reps: number }
  > = {};
  for (const l of logs) {
    for (const s of l.sets) {
      if (s.weightKg == null || s.reps == null) continue;
      const e = epley1rm(s.weightKg, s.reps);
      const prev = best[s.exerciseName];
      if (!prev || e > prev.e1rm) {
        best[s.exerciseName] = { e1rm: e, weight: s.weightKg, reps: s.reps };
      }
    }
  }
  return Object.entries(best)
    .map(([exerciseName, v]) => ({ exerciseName, ...v }))
    .sort((a, b) => b.e1rm - a.e1rm);
}

export function getMaxLift(
  logs: LogWithSets[],
  exerciseName: string,
): number {
  let max = 0;
  for (const l of logs) {
    for (const s of l.sets) {
      if (s.exerciseName === exerciseName && s.weightKg != null && s.weightKg > max) {
        max = s.weightKg;
      }
    }
  }
  return max;
}

export function getWeeklyVolume(
  logs: LogWithSets[],
  mesoNum: number,
): Array<{ week: number; volume: number }> {
  const buckets: number[] = Array(12).fill(0);
  for (const l of logs) {
    if (l.mesoNum !== mesoNum) continue;
    const idx = l.weekNum - 1;
    if (idx < 0 || idx >= 12) continue;
    for (const s of l.sets) {
      if (s.weightKg != null && s.reps != null) {
        buckets[idx] += s.weightKg * s.reps;
      }
    }
  }
  return buckets.map((volume, i) => ({ week: i + 1, volume }));
}

export function getWeeklyCompliance(
  logs: LogWithSets[],
  mesoNum: number,
  weekNum: number,
  totalSessionsPerWeek: number,
): { done: number; total: number } {
  const done = logs.filter(
    (l) => l.mesoNum === mesoNum && l.weekNum === weekNum,
  ).length;
  return { done, total: totalSessionsPerWeek };
}

export function getRecentSessions(
  logs: LogWithSets[],
  limit: number,
): LogWithSets[] {
  return [...logs]
    .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
    .slice(0, limit);
}
