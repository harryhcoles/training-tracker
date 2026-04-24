"use client";

import { useState } from "react";
import { CATEGORY_META, DAY_NAMES } from "@/lib/utils";

type Slot = { dayOfWeek: number; categoryId: string | null };

const CATEGORIES: Array<{ id: string | null; label: string }> = [
  { id: null, label: "Rest" },
  { id: "legs", label: "Legs" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "speed", label: "Speed" },
  { id: "endurance", label: "Endurance" },
];

export default function ScheduleEditor({
  initial,
  today,
}: {
  initial: Slot[];
  today: number;
}) {
  const [slots, setSlots] = useState<Slot[]>(() => {
    const byDay: Record<number, Slot> = {};
    for (const s of initial) byDay[s.dayOfWeek] = s;
    return Array.from({ length: 7 }, (_, d) => byDay[d] ?? { dayOfWeek: d, categoryId: null });
  });
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function setDay(dayOfWeek: number, categoryId: string | null) {
    setSavingDay(dayOfWeek);
    setErr(null);
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, categoryId } : s)),
    );
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, categoryId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingDay(null);
    }
  }

  return (
    <div className="space-y-3">
      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {err}
        </p>
      )}
      {slots.map((s) => {
        const meta = s.categoryId ? CATEGORY_META[s.categoryId] : null;
        const isToday = s.dayOfWeek === today;
        return (
          <div
            key={s.dayOfWeek}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${
              isToday ? "border-amber-400" : "border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900">
                  {DAY_NAMES[s.dayOfWeek]}
                </h3>
                {isToday && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold" style={{ color: meta?.color ?? "#78716c" }}>
                {meta?.label ?? "Rest"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const isActive = (s.categoryId ?? null) === (c.id ?? null);
                const cmeta = c.id ? CATEGORY_META[c.id] : null;
                return (
                  <button
                    key={c.id ?? "rest"}
                    onClick={() => setDay(s.dayOfWeek, c.id ?? null)}
                    disabled={savingDay === s.dayOfWeek}
                    className={`h-11 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    } disabled:opacity-50`}
                    style={
                      isActive
                        ? {
                            background: cmeta?.color ?? "#57534e",
                          }
                        : undefined
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
