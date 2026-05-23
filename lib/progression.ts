export type Phase = "base" | "build" | "peak";

export function getCurrentPhase(week: number): Phase {
  if (week <= 4) return "base";
  if (week <= 8) return "build";
  return "peak";
}

// Standard wave-loading: every 4th week is a deload. Week 12 acts as a
// taper before the next mesocycle (templates already reflect this).
export function isDeloadWeek(week: number): boolean {
  return week === 4 || week === 8 || week === 12;
}

export type PrevTopSet = {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
};

export type SuggestedTarget = {
  weight: number;
  reason: string;
};

function roundTo2_5(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}

// Epley 1RM. Returns an estimate of the user's 1-rep max from any
// set (weight × reps at given RPE). Cheaply useful for scaling.
function epley1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function inverseEpley(e1rm: number, reps: number): number {
  return e1rm / (1 + reps / 30);
}

// Best-evidence picker for suggesting today's load. Caller supplies:
//   - prevSameReps: the most recent prior top set at the SAME rep count
//     as today's prescription. Strongest evidence — used verbatim with
//     RPE adjustment.
//   - prevAnyReps: the most recent prior top set at any rep count.
//     Used as fallback — we estimate 1RM from it and back-compute the
//     load for today's target rep count via Epley.
//   - targetReps: today's prescribed rep count (per the exercise
//     template). Required for scaling.
//
// Behaviour:
//   - Deload week → 70% of the same-rep-count baseline (or scaled
//     baseline if only any-rep evidence exists).
//   - prevSameReps with RPE → apply the existing RPE rule (+2.5 / 0 / -2.5).
//   - prevSameReps without RPE → "match last session".
//   - Only prevAnyReps (different rep count) → estimate e1RM, back-
//     compute for targetReps, then apply RPE rule centred on that scaled
//     baseline. Note flagged in `reason` so the user knows it's scaled.
//   - No prior data → null.
//
// Zhang et al. 2025 NMA — RPE-driven autoregulation. Epley 1RM holds
// well enough across 2-12 rep ranges for load-scaling within a phase.
export function getSuggestedTarget(
  prevSameReps: PrevTopSet | null,
  prevAnyReps: PrevTopSet | null,
  targetReps: number | null = null,
  liftTarget: number | null = null,
  isDeload: boolean = false,
): SuggestedTarget | null {
  // Resolve the baseline weight + a reason fragment describing scaling.
  let baselineWeight: number | null = null;
  let baselineRpe: number | null = null;
  let scalingNote = "";

  if (prevSameReps && prevSameReps.weightKg != null) {
    baselineWeight = prevSameReps.weightKg;
    baselineRpe = prevSameReps.rpe;
  } else if (
    prevAnyReps &&
    prevAnyReps.weightKg != null &&
    prevAnyReps.reps != null &&
    targetReps != null
  ) {
    const e1rm = epley1rm(prevAnyReps.weightKg, prevAnyReps.reps);
    baselineWeight = inverseEpley(e1rm, targetReps);
    baselineRpe = prevAnyReps.rpe;
    scalingNote = ` (scaled from ${prevAnyReps.weightKg}kg × ${prevAnyReps.reps})`;
  } else if (prevAnyReps && prevAnyReps.weightKg != null) {
    // Have a previous set but no target reps to scale to — use verbatim.
    baselineWeight = prevAnyReps.weightKg;
    baselineRpe = prevAnyReps.rpe;
  }

  if (baselineWeight == null) return null;

  // Deload override.
  if (isDeload) {
    const w = roundTo2_5(baselineWeight * 0.7);
    return {
      weight: Math.max(w, 0),
      reason: `Deload — 70% of last session${scalingNote}`,
    };
  }

  let weight: number;
  let reason: string;

  if (baselineRpe == null) {
    weight = baselineWeight;
    reason = `Match last session${scalingNote}`;
  } else if (baselineRpe <= 7) {
    weight = baselineWeight + 2.5;
    reason = `Last set RPE ≤7 — add 2.5kg${scalingNote}`;
  } else if (baselineRpe >= 8 && baselineRpe <= 9) {
    weight = baselineWeight;
    reason = `Last set RPE 8-9 — maintain${scalingNote}`;
  } else if (baselineRpe === 10) {
    weight = Math.max(baselineWeight - 2.5, 0);
    reason = `Last set RPE 10 — back off 2.5kg${scalingNote}`;
  } else {
    weight = baselineWeight;
    reason = `Match last session${scalingNote}`;
  }

  weight = roundTo2_5(weight);
  if (liftTarget != null && weight > liftTarget + 5) {
    weight = liftTarget + 5;
  }

  return { weight, reason };
}

// Maps exercise name → lift-target field on UserState. Only the three
// main lifts have a target; everything else returns null.
export function liftTargetForExercise(
  exerciseName: string,
  state: { squatTarget: number; benchTarget: number; deadliftTarget: number },
): number | null {
  if (exerciseName === "Back Squat") return state.squatTarget;
  if (exerciseName === "Bench Press") return state.benchTarget;
  if (exerciseName === "Deadlift") return state.deadliftTarget;
  return null;
}
