"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { isDeloadWeek } from "@/lib/progression";

export default function WeekTimeline({
  currentWeek,
  currentMeso,
  totalWeeks = 12,
}: {
  currentWeek: number;
  currentMeso: number;
  totalWeeks?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticWeek, setOptimisticWeek] = useState(currentWeek);
  const [err, setErr] = useState<string | null>(null);

  const displayWeek = pending ? optimisticWeek : currentWeek;
  const displayPhase =
    displayWeek <= 4 ? "base" : displayWeek <= 8 ? "build" : "peak";
  const displayDeload = isDeloadWeek(displayWeek);

  async function setWeek(week: number) {
    if (week === currentWeek) return;
    setErr(null);
    setOptimisticWeek(week);
    startTransition(async () => {
      try {
        const res = await fetch("/api/meso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-week", week }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Update failed");
        setOptimisticWeek(currentWeek);
      }
    });
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          Week {displayWeek}/{totalWeeks} · {displayPhase}
          {displayDeload && (
            <span className="ml-2 text-amber-700 font-bold">· Deload</span>
          )}
        </p>
        <p className="text-xs text-stone-500">Meso {currentMeso}</p>
      </div>
      <div className="flex gap-1 mt-3">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => {
          const isPast = w < displayWeek;
          const isCurrent = w === displayWeek;
          const isDeload = isDeloadWeek(w);
          let bg: string;
          if (isCurrent) {
            bg = isDeload ? "bg-amber-300" : "bg-amber-400";
          } else if (isPast) {
            bg = isDeload ? "bg-amber-700" : "bg-amber-600";
          } else {
            bg = isDeload ? "bg-stone-300" : "bg-stone-200";
          }
          return (
            <button
              key={w}
              type="button"
              onClick={() => setWeek(w)}
              disabled={pending}
              aria-label={`Go to week ${w}${isDeload ? " (deload)" : ""}`}
              className="flex-1 h-7 rounded-full transition-all relative group disabled:opacity-60"
            >
              <span
                className={`absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full group-hover:opacity-80 ${bg} ${
                  isDeload ? "h-1" : "h-2"
                }`}
              />
            </button>
          );
        })}
      </div>
      {err && (
        <p className="text-xs text-red-600 mt-2">{err}</p>
      )}
    </section>
  );
}
