"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import SuggestedTarget from "@/components/suggested-target";
import WarningBanner from "@/components/warning-banner";
import type { SessionWarning } from "@/lib/training-rules";

type PrevTopSet = {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
};

type Suggestion = { weight: number; reason: string };

type ExerciseDef = {
  id: number;
  name: string;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  perSide: boolean;
  note: string | null;
};

type SetInput = {
  weightKg: string;
  reps: string;
  durationSec: string;
  rpe: string;
};

type ExistingSet = {
  exerciseName: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  rpe: number | null;
};

type Existing = {
  sessionRpe: number | null;
  notes: string | null;
  durationActualMin: number | null;
  distanceKm: number | null;
  avgHr: number | null;
  avgPower: number | null;
  sets: ExistingSet[];
};

function emptySet(): SetInput {
  return { weightKg: "", reps: "", durationSec: "", rpe: "" };
}

function str(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}

export default function SessionLogForm({
  templateId,
  mesoNum,
  weekNum,
  isBike,
  exercises,
  existing,
  previousTopSets,
  suggestions,
  liftTargets,
  warnings,
}: {
  templateId: string;
  mesoNum: number;
  weekNum: number;
  isBike: boolean;
  exercises: ExerciseDef[];
  existing: Existing | null;
  previousTopSets?: Record<string, PrevTopSet>;
  suggestions?: Record<string, Suggestion>;
  liftTargets?: Record<string, number | null>;
  warnings?: SessionWarning[];
}) {
  const router = useRouter();

  const initialSets = useMemo(() => {
    const map: Record<string, SetInput[]> = {};
    for (const ex of exercises) {
      map[ex.name] = Array.from({ length: ex.sets }, () => emptySet());
    }
    if (existing) {
      for (const s of existing.sets) {
        if (!map[s.exerciseName]) continue;
        const idx = s.setNumber - 1;
        if (idx < 0 || idx >= map[s.exerciseName].length) continue;
        map[s.exerciseName][idx] = {
          weightKg: str(s.weightKg),
          reps: str(s.reps),
          durationSec: str(s.durationSec),
          rpe: str(s.rpe),
        };
      }
    }
    return map;
  }, [exercises, existing]);

  const [setsByExercise, setSetsByExercise] =
    useState<Record<string, SetInput[]>>(initialSets);
  const [sessionRpe, setSessionRpe] = useState<string>(
    str(existing?.sessionRpe),
  );
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [durationActualMin, setDurationActualMin] = useState<string>(
    str(existing?.durationActualMin),
  );
  const [distanceKm, setDistanceKm] = useState<string>(
    str(existing?.distanceKm),
  );
  const [avgHr, setAvgHr] = useState<string>(str(existing?.avgHr));
  const [avgPower, setAvgPower] = useState<string>(str(existing?.avgPower));

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    kind: "success" | "error";
  } | null>(null);

  function updateSet(exName: string, setIdx: number, field: keyof SetInput, v: string) {
    setSetsByExercise((prev) => {
      const next = { ...prev };
      next[exName] = next[exName].map((s, i) =>
        i === setIdx ? { ...s, [field]: v } : s,
      );
      return next;
    });
  }

  function showToast(msg: string, kind: "success" | "error") {
    setToast({ msg, kind });
    window.setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sets: Array<{
        exerciseName: string;
        weightKg: number | null;
        reps: number | null;
        durationSec: number | null;
        rpe: number | null;
      }> = [];
      for (const ex of exercises) {
        const arr = setsByExercise[ex.name] ?? [];
        arr.forEach((s) => {
          const w = s.weightKg.trim() === "" ? null : Number(s.weightKg);
          const r = s.reps.trim() === "" ? null : Number(s.reps);
          const d = s.durationSec.trim() === "" ? null : Number(s.durationSec);
          const rp = s.rpe.trim() === "" ? null : Number(s.rpe);
          if (w == null && r == null && d == null && rp == null) return;
          sets.push({
            exerciseName: ex.name,
            weightKg: w,
            reps: r,
            durationSec: d,
            rpe: rp,
          });
        });
      }

      const payload = {
        sessionTemplateId: templateId,
        mesoNum,
        weekNum,
        sessionRpe: sessionRpe.trim() === "" ? null : Number(sessionRpe),
        notes: notes.trim() === "" ? null : notes,
        durationActualMin:
          durationActualMin.trim() === "" ? null : Number(durationActualMin),
        distanceKm: distanceKm.trim() === "" ? null : Number(distanceKm),
        avgHr: avgHr.trim() === "" ? null : Number(avgHr),
        avgPower: avgPower.trim() === "" ? null : Number(avgPower),
        sets,
      };

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast("Session saved", "success");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast(`Save failed: ${msg}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {isBike && (
        <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-stone-500">
            Ride metrics
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Duration (min)"
              value={durationActualMin}
              onChange={setDurationActualMin}
              inputMode="decimal"
            />
            <LabeledInput
              label="Distance (km)"
              value={distanceKm}
              onChange={setDistanceKm}
              inputMode="decimal"
            />
            <LabeledInput
              label="Avg HR"
              value={avgHr}
              onChange={setAvgHr}
              inputMode="numeric"
            />
            <LabeledInput
              label="Avg Power"
              value={avgPower}
              onChange={setAvgPower}
              inputMode="numeric"
            />
          </div>
        </section>
      )}

      {exercises.map((ex) => (
        <section key={ex.id} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-stone-900">
              {ex.name}
              {ex.perSide && (
                <span className="text-xs text-stone-500 ml-2">per side</span>
              )}
            </h2>
            <p className="text-xs text-stone-500">
              {ex.sets} × {ex.reps != null ? `${ex.reps} reps` : `${ex.durationSec}s`}
            </p>
          </div>
          {ex.note && (
            <p className="text-xs text-stone-500 mt-1 italic">{ex.note}</p>
          )}
          <SuggestedTarget
            prev={previousTopSets?.[ex.name] ?? null}
            suggestion={suggestions?.[ex.name] ?? null}
            liftTarget={liftTargets?.[ex.name] ?? null}
          />
          <div className="mt-4 space-y-2">
            {setsByExercise[ex.name]?.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-8 text-xs font-semibold text-stone-400 shrink-0">
                  #{i + 1}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="kg"
                  value={s.weightKg}
                  onChange={(e) => updateSet(ex.name, i, "weightKg", e.target.value)}
                  className="flex-1 min-w-0 h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={ex.reps != null ? "reps" : "sec"}
                  value={ex.reps != null ? s.reps : s.durationSec}
                  onChange={(e) =>
                    updateSet(
                      ex.name,
                      i,
                      ex.reps != null ? "reps" : "durationSec",
                      e.target.value,
                    )
                  }
                  className="w-20 h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="RPE"
                  value={s.rpe}
                  onChange={(e) => updateSet(ex.name, i, "rpe", e.target.value)}
                  className="w-16 h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <div>
          <label className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
            Session RPE (1-10)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            value={sessionRpe}
            onChange={(e) => setSessionRpe(e.target.value)}
            className="w-24 h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
            Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-base px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </section>

      {warnings && warnings.length > 0 && <WarningBanner warnings={warnings} />}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 rounded-2xl font-serif-display font-black text-white text-lg tracking-[0.2em] shadow-lg disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #d97706, #ea580c)",
        }}
      >
        {saving ? "SAVING…" : "SAVE SESSION"}
      </button>

      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-lg shadow-lg text-sm text-white ${
            toast.kind === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode: "decimal" | "numeric";
}) {
  return (
    <div>
      <label className="text-xs text-stone-500 block mb-1">{label}</label>
      <input
        type="number"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
      />
    </div>
  );
}
