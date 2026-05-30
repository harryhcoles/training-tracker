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

// Extract a prescribed-weight value (in kg) from a free-form exercise
// note. The templates embed prescriptions as "@65kg", "@72.5kg",
// "@30kg DBs", "@60kg, 2s pause" etc. Returns null when no @Xkg
// pattern is present (accessory work, mobility, etc).
export function parsePrescribedWeight(
  note: string | null | undefined,
): number | null {
  if (!note) return null;
  const match = note.match(/@\s*(\d+(?:\.\d+)?)\s*kg/i);
  if (!match) return null;
  const v = Number(match[1]);
  return Number.isFinite(v) ? v : null;
}

// Best-evidence picker for suggesting today's load.
//
// PRECEDENCE:
// 1. If the exercise template carries a prescribed weight (@Xkg in the
//    note), use THAT as the baseline. Prior RPE history only nudges it
//    up/down when prior evidence is at comparable load (±10%). This
//    means a deload week's lighter set doesn't drag the next heavy
//    week's suggestion down — the programme's prescribed weight wins.
// 2. Otherwise fall back to the old "use most recent prior set" logic
//    with same-reps preferred, any-reps scaled via Epley, RPE
//    adjustment applied.
//
// Deload weeks: if the prescribed weight is set, just trust it (it's
// already a deload prescription). Else fall back to 70% of last
// session.
//
// Zhang et al. 2025 NMA — RPE-driven autoregulation. Epley 1RM holds
// well enough across 2-12 rep ranges for load-scaling within a phase.
export function getSuggestedTarget(
  prevSameReps: PrevTopSet | null,
  prevAnyReps: PrevTopSet | null,
  targetReps: number | null = null,
  liftTarget: number | null = null,
  isDeload: boolean = false,
  prescribedWeightKg: number | null = null,
): SuggestedTarget | null {
  // Branch 1: prescribed weight is the baseline.
  if (prescribedWeightKg != null) {
    const baseline = prescribedWeightKg;
    let weight = baseline;
    let reason = "Programme prescription";

    if (isDeload) {
      // Already a deload prescription — trust it verbatim.
      return { weight: roundTo2_5(baseline), reason: "Deload week — follow programme" };
    }

    // Only let RPE history adjust if the prior set was at a COMPARABLE
    // load (±10% of today's prescription). This stops deload sets
    // from polluting heavy/peak suggestions.
    const tolerance = baseline * 0.1;
    const comparable =
      prevSameReps &&
      prevSameReps.weightKg != null &&
      Math.abs(prevSameReps.weightKg - baseline) <= tolerance
        ? prevSameReps
        : null;

    if (comparable && comparable.rpe != null) {
      const rpe = comparable.rpe;
      if (rpe <= 7) {
        weight = baseline + 2.5;
        reason = "Programme +2.5kg — last comparable set was RPE ≤7";
      } else if (rpe >= 8 && rpe <= 9) {
        weight = baseline;
        reason = "Programme weight — last comparable set was RPE 8-9";
      } else if (rpe === 10) {
        weight = Math.max(baseline - 2.5, 0);
        reason = "Programme -2.5kg — last comparable set was RPE 10";
      }
    }

    weight = roundTo2_5(weight);
    if (liftTarget != null && weight > liftTarget + 5) {
      weight = liftTarget + 5;
    }
    return { weight, reason };
  }

  // Branch 2 (fallback): no prescribed weight on the template — use
  // prior-set heuristics. (Accessory work, mobility, anything without
  // an @Xkg note.)
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
    baselineWeight = prevAnyReps.weightKg;
    baselineRpe = prevAnyReps.rpe;
  }

  if (baselineWeight == null) return null;

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
