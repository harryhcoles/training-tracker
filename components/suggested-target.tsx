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

  return (
    <div className="mt-2 space-y-0.5 text-xs">
      {hasPrev ? (
        <p className="text-stone-500">
          Last
          {laneTag && (
            <span className="text-stone-400"> ({laneTag})</span>
          )}
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
      <div className="flex items-center gap-3 flex-wrap">
        {suggestion && (
          <p
            className="text-amber-700 font-semibold flex items-center gap-1"
            title={suggestion.reason}
          >
            <Target size={12} />
            Suggested: {suggestion.weight}kg
          </p>
        )}
        {liftTarget != null && (
          <p className="text-stone-500">
            Target:{" "}
            <span className="font-semibold text-stone-700">{liftTarget}kg</span>
          </p>
        )}
      </div>
    </div>
  );
}
