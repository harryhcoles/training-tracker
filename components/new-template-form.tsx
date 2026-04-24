"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Category = "legs" | "chest" | "back" | "speed" | "endurance";
type Phase = "base" | "build" | "peak" | "any";

type ExerciseRow = {
  name: string;
  sets: string;
  reps: string;
  durationSec: string;
  perSide: boolean;
  note: string;
};

const BIKE_FOCUSES = [
  "VO2max",
  "Sprint",
  "Threshold",
  "Z2",
  "Sweetspot",
  "Recovery",
  "Race-pace",
  "Anaerobic",
  "Cadence",
  "Openers",
  "Taper",
];

function emptyExercise(): ExerciseRow {
  return {
    name: "",
    sets: "3",
    reps: "10",
    durationSec: "",
    perSide: false,
    note: "",
  };
}

export default function NewTemplateForm() {
  const router = useRouter();

  const [category, setCategory] = useState<Category>("legs");
  const [phase, setPhase] = useState<Phase>("base");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState("60");
  const [focus, setFocus] = useState(BIKE_FOCUSES[0]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([emptyExercise()]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isBike = category === "speed" || category === "endurance";

  function updateExercise(i: number, patch: Partial<ExerciseRow>) {
    setExercises((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );
  }

  async function handleSave() {
    setErr(null);
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    if (!isBike && exercises.every((e) => !e.name.trim())) {
      setErr("Add at least one exercise");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category,
        phase,
        name: name.trim(),
        description: description.trim() || null,
        durationMin: isBike ? Number(durationMin) || null : null,
        focus: isBike ? focus : null,
        exercises: isBike
          ? []
          : exercises
              .filter((e) => e.name.trim())
              .map((e) => ({
                name: e.name.trim(),
                sets: Number(e.sets) || 1,
                reps: e.reps.trim() === "" ? null : Number(e.reps),
                durationSec:
                  e.durationSec.trim() === "" ? null : Number(e.durationSec),
                perSide: e.perSide,
                note: e.note.trim() || null,
              })),
      };
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      router.push("/library");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {err}
        </p>
      )}

      <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <div>
          <label className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
          >
            <option value="legs">Legs</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="speed">Speed (bike)</option>
            <option value="endurance">Endurance (bike)</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
            Phase
          </label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
            className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
          >
            <option value="base">Base</option>
            <option value="build">Build</option>
            <option value="peak">Peak</option>
            <option value="any">Any</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-base px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </section>

      {isBike ? (
        <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-stone-500">
            Bike session
          </h2>
          <div>
            <label className="text-xs text-stone-500 block mb-1">
              Duration (min)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Focus</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
            >
              {BIKE_FOCUSES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-stone-500">
              Exercises
            </h2>
            <button
              onClick={() =>
                setExercises((prev) => [...prev, emptyExercise()])
              }
              className="flex items-center gap-1 text-sm text-amber-700 font-semibold"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {exercises.map((ex, i) => (
            <div
              key={i}
              className="border border-stone-200 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, { name: e.target.value })}
                  className="flex-1 min-w-0 h-11 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
                {exercises.length > 1 && (
                  <button
                    onClick={() =>
                      setExercises((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-stone-400 hover:text-red-600 p-2 shrink-0"
                    aria-label="Remove exercise"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Sets</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, { sets: e.target.value })}
                    className="w-full h-11 text-base px-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Reps</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, { reps: e.target.value })}
                    className="w-full h-11 text-base px-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ex.durationSec}
                    onChange={(e) =>
                      updateExercise(i, { durationSec: e.target.value })
                    }
                    className="w-full h-11 text-base px-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={ex.perSide}
                    onChange={(e) =>
                      updateExercise(i, { perSide: e.target.checked })
                    }
                  />
                  Per side
                </label>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={ex.note}
                onChange={(e) => updateExercise(i, { note: e.target.value })}
                className="w-full h-11 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          ))}
        </section>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 rounded-2xl font-serif-display font-black text-white text-lg tracking-[0.2em] shadow-lg disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #d97706, #ea580c)" }}
      >
        {saving ? "SAVING…" : "SAVE TEMPLATE"}
      </button>
    </div>
  );
}
