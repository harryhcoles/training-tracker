import { Target } from "lucide-react";

export default function SuggestedTarget({
  prev,
  suggestion,
  liftTarget,
}: {
  prev: { weightKg: number | null; reps: number | null; rpe: number | null } | null;
  suggestion: { weight: number; reason: string } | null;
  liftTarget: number | null;
}) {
  if (!prev && !liftTarget) return null;

  return (
    <div className="mt-2 space-y-0.5 text-xs">
      {prev && prev.weightKg != null && (
        <p className="text-stone-500">
          Last:{" "}
          <span className="font-semibold text-stone-700">
            {prev.weightKg}kg × {prev.reps ?? "?"}
          </span>
          {prev.rpe != null && (
            <span className="text-stone-400"> · RPE {prev.rpe}</span>
          )}
        </p>
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
