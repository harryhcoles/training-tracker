import { Target } from "lucide-react";

export default function SuggestedTarget({
  prev,
  suggestion,
  liftTarget,
  laneTag,
  targetReps,
}: {
  prev: { weightKg: number | null; reps: number | null; rpe: number | null } | null;
  suggestion: { weight: number; reason: string } | null;
  liftTarget: number | null;
  laneTag?: "heavy" | "deload";
  targetReps?: number | null;
}) {
  if (!prev && !suggestion && !liftTarget) return null;

  const hasPrev = prev && prev.weightKg != null;
  // Delta vs last comparable set — the one-glance answer to "am I
  // going up, down, or holding?"
  const delta =
    hasPrev && suggestion ? suggestion.weight - prev!.weightKg! : null;

  return (
    <div className="mt-2 space-y-1 text-xs">
      {hasPrev ? (
        <p className="text-stone-500">
          Last
          {laneTag && <span className="text-stone-400"> ({laneTag})</span>}
          :{" "}
          <span className="font-semibold text-stone-700">
            {prev!.weightKg}kg × {prev!.reps ?? "?"}
          </span>
          {prev!.rpe != null && (
            <span className="text-stone-400"> · RPE {prev!.rpe}</span>
          )}
        </p>
      ) : (
        suggestion && (
          <p className="text-stone-400 italic">
            No prior{laneTag ? ` ${laneTag}` : ""}
            {targetReps != null ? ` ${targetReps}-rep` : ""} set yet
          </p>
        )
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {suggestion && (
          <p className="text-amber-700 font-semibold flex items-center gap-1">
            <Target size={12} />
            Suggested: {suggestion.weight}kg
          </p>
        )}
        {delta != null && (
          <span
            className={`px-1.5 py-0.5 rounded-full font-semibold ${
              delta > 0
                ? "bg-emerald-50 text-emerald-700"
                : delta < 0
                  ? "bg-red-50 text-red-700"
                  : "bg-stone-100 text-stone-600"
            }`}
          >
            {delta > 0
              ? `↑ +${delta}kg vs last`
              : delta < 0
                ? `↓ ${delta}kg vs last`
                : "= same as last"}
          </span>
        )}
        {liftTarget != null && (
          <p className="text-stone-500">
            Target:{" "}
            <span className="font-semibold text-stone-700">{liftTarget}kg</span>
          </p>
        )}
      </div>
      {suggestion && (
        <p className="text-[11px] text-stone-400 leading-snug">
          {suggestion.reason}
        </p>
      )}
    </div>
  );
}
