export type Phase = "base" | "build" | "peak";

export function getCurrentPhase(week: number): Phase {
  if (week <= 4) return "base";
  if (week <= 8) return "build";
  return "peak";
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

// Autoregulation by RPE — based on Zhang et al. 2025 NMA showing
// RPE-driven progression is second only to APRE for max strength gains.
// TODO: when user hits target consistently across 2+ sessions, prompt
// to bump the lift target rather than capping suggestions.
export function getSuggestedTarget(
  prevTopSet: PrevTopSet | null,
  liftTarget: number | null = null,
): SuggestedTarget | null {
  if (!prevTopSet || prevTopSet.weightKg == null) return null;
  const prevWeight = prevTopSet.weightKg;
  const prevRpe = prevTopSet.rpe;

  let weight: number;
  let reason: string;

  if (prevRpe == null) {
    weight = prevWeight;
    reason = "Match last session";
  } else if (prevRpe <= 7) {
    weight = prevWeight + 2.5;
    reason = "Last set RPE ≤7 — add 2.5kg";
  } else if (prevRpe >= 8 && prevRpe <= 9) {
    weight = prevWeight;
    reason = "Last set RPE 8-9 — maintain";
  } else if (prevRpe === 10) {
    weight = Math.max(prevWeight - 2.5, 0);
    reason = "Last set RPE 10 — back off 2.5kg";
  } else {
    weight = prevWeight;
    reason = "Match last session";
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
