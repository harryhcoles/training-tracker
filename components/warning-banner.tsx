"use client";

import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import type { SessionWarning } from "@/lib/training-rules";

export default function WarningBanner({
  warnings,
}: {
  warnings: SessionWarning[];
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = warnings.filter((w) => !dismissed.has(w.rule));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((w) => {
        const isWarn = w.severity === "warn";
        const bg = isWarn ? "bg-amber-50" : "bg-blue-50";
        const border = isWarn ? "border-amber-300" : "border-blue-300";
        const iconColor = isWarn ? "text-amber-700" : "text-blue-700";
        const textColor = isWarn ? "text-amber-900" : "text-blue-900";
        return (
          <div
            key={w.rule}
            className={`${bg} ${border} border rounded-2xl p-4 flex gap-3`}
          >
            <AlertCircle size={20} className={`${iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`${textColor} font-bold text-sm`}>{w.message}</p>
              <p className={`${textColor} italic text-xs opacity-70 mt-1`}>
                {w.citation}
              </p>
            </div>
            <button
              onClick={() =>
                setDismissed((prev) => {
                  const next = new Set(prev);
                  next.add(w.rule);
                  return next;
                })
              }
              className={`${iconColor} hover:opacity-70 shrink-0 p-1 -m-1`}
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
