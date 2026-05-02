"use client";

import { useState } from "react";
import { CATEGORY_META, DAY_NAMES } from "@/lib/utils";

type Slot = { dayOfWeek: number; categoryId: string };

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "legs", label: "Legs" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "speed", label: "Speed" },
  { id: "endurance", label: "Endurance" },
  { id: "conditioning", label: "Cond" },
];

export default function ScheduleEditor({
  initial,
  today,
}: {
  initial: Slot[];
  today: number;
}) {
  const [slotsByDay, setSlotsByDay] = useState<Record<number, Set<string>>>(
    () => {
      const map: Record<number, Set<string>> = {};
      for (let d = 0; d < 7; d++) map[d] = new Set();
      for (const s of initial) map[s.dayOfWeek].add(s.categoryId);
      return map;
    },
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function toggle(dayOfWeek: number, categoryId: string) {
    const key = `${dayOfWeek}:${categoryId}`;
    setBusyKey(key);
    setErr(null);
    const wasSelected = slotsByDay[dayOfWeek].has(categoryId);
    setSlotsByDay((prev) => {
      const next = { ...prev };
      const set = new Set(next[dayOfWeek]);
      if (wasSelected) set.delete(categoryId);
      else set.add(categoryId);
      next[dayOfWeek] = set;
      return next;
    });
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
      // Revert.
      setSlotsByDay((prev) => {
        const next = { ...prev };
        const set = new Set(next[dayOfWeek]);
        if (wasSelected) set.add(categoryId);
        else set.delete(categoryId);
        next[dayOfWeek] = set;
        return next;
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-3">
      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {err}
        </p>
      )}
      <p className="text-xs text-stone-500">
        Tap a category to add it to that day. Tap again to remove. Days with no
        categories assigned are rest days.
      </p>
      {Array.from({ length: 7 }, (_, d) => d).map((d) => {
        const slotIds = Array.from(slotsByDay[d] ?? new Set<string>());
        const isToday = d === today;
        return (
          <div
            key={d}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${
              isToday ? "border-amber-400" : "border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900">
                  {DAY_NAMES[d]}
                </h3>
                {isToday && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-500 truncate ml-2 max-w-[60%] text-right">
                {slotIds.length === 0
                  ? "Rest"
                  : slotIds
                      .map((id) => CATEGORY_META[id]?.label ?? id)
                      .join(" · ")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const isActive = slotsByDay[d]?.has(c.id) ?? false;
                const cmeta = CATEGORY_META[c.id];
                const key = `${d}:${c.id}`;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(d, c.id)}
                    disabled={busyKey === key}
                    className={`h-11 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    } disabled:opacity-50`}
                    style={
                      isActive
                        ? { background: cmeta?.color ?? "#57534e" }
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
