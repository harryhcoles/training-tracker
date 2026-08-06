"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
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
  laneTag,
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
  laneTag?: "heavy" | "deload";
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
  // A set counts as "done" when it has any value — pre-marks rows
  // when re-opening today's log.
  const [doneByExercise, setDoneByExercise] = useState<
    Record<string, boolean[]>
  >(() => {
    const map: Record<string, boolean[]> = {};
    for (const [name, sets] of Object.entries(initialSets)) {
      map[name] = sets.map(
        (s) =>
          s.weightKg !== "" ||
          s.reps !== "" ||
          s.durationSec !== "" ||
          s.rpe !== "",
      );
    }
    return map;
  });

  // Rest timer — starts when a set is marked done. Heavy work
  // (≤5 reps) gets 3min, everything else 90s.
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(0);
  useEffect(() => {
    if (restEndsAt == null) return;
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [restEndsAt]);
  const restRemaining =
    restEndsAt != null ? Math.max(0, Math.ceil((restEndsAt - nowTs) / 1000)) : null;
  const restExpired = restEndsAt != null && restRemaining === 0;
  useEffect(() => {
    if (!restExpired) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(200);
    }
    const t = window.setTimeout(() => setRestEndsAt(null), 5000);
    return () => window.clearTimeout(t);
  }, [restExpired]);

  function toggleDone(ex: ExerciseDef, setIdx: number) {
    const isDone = doneByExercise[ex.name]?.[setIdx] ?? false;
    if (!isDone) {
      // Fill empty fields: weight from the suggestion (or the row
      // above, or the last logged top set), reps/secs from the target.
      setSetsByExercise((prev) => {
        const rows = prev[ex.name] ?? [];
        const row = rows[setIdx];
        if (!row) return prev;
        const above = setIdx > 0 ? rows[setIdx - 1] : null;
        const fillWeight =
          row.weightKg !== ""
            ? row.weightKg
            : above && above.weightKg !== ""
              ? above.weightKg
              : suggestions?.[ex.name]
                ? String(suggestions[ex.name].weight)
                : previousTopSets?.[ex.name]?.weightKg != null
                  ? String(previousTopSets[ex.name].weightKg)
                  : "";
        const fillReps =
          row.reps !== ""
            ? row.reps
            : ex.reps != null
              ? String(ex.reps)
              : "";
        const fillSecs =
          row.durationSec !== ""
            ? row.durationSec
            : ex.durationSec != null
              ? String(ex.durationSec)
              : "";
        const next = { ...prev };
        next[ex.name] = rows.map((s, i) =>
          i === setIdx
            ? { ...s, weightKg: fillWeight, reps: fillReps, durationSec: fillSecs }
            : s,
        );
        return next;
      });
      const restSecs = ex.reps != null && ex.reps <= 5 ? 180 : 90;
      setRestEndsAt(Date.now() + restSecs * 1000);
    }
    setDoneByExercise((prev) => {
      const arr = [
        ...(prev[ex.name] ?? Array.from({ length: ex.sets }, () => false)),
      ];
      arr[setIdx] = !isDone;
      return { ...prev, [ex.name]: arr };
    });
  }
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
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<string>("");

  const distanceNum = distanceKm.trim() === "" ? null : Number(distanceKm);
  const durationNum =
    durationActualMin.trim() === "" ? null : Number(durationActualMin);
  const explicitSpeed =
    avgSpeedKmh.trim() === "" ? null : Number(avgSpeedKmh);
  const derivedSpeed =
    distanceNum != null && durationNum != null && durationNum > 0
      ? distanceNum / (durationNum / 60)
      : null;
  const effectiveSpeed = explicitSpeed ?? derivedSpeed;
  const inGoalPace =
    effectiveSpeed != null &&
    effectiveSpeed >= 28 &&
    effectiveSpeed <= 30;

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
        durationActualMin: durationNum,
        distanceKm: distanceNum,
        avgHr: avgHr.trim() === "" ? null : Number(avgHr),
        avgPower: avgPower.trim() === "" ? null : Number(avgPower),
        avgSpeedKmh: effectiveSpeed,
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
              label="Avg HR (bpm)"
              value={avgHr}
              onChange={setAvgHr}
              inputMode="numeric"
            />
            <LabeledInput
              label="Avg speed (km/h)"
              value={avgSpeedKmh}
              onChange={setAvgSpeedKmh}
              inputMode="decimal"
            />
            <LabeledInput
              label="Avg Power"
              value={avgPower}
              onChange={setAvgPower}
              inputMode="numeric"
            />
          </div>
          {effectiveSpeed != null && (
            <p
              className={`text-xs ${
                inGoalPace ? "text-emerald-700" : "text-stone-500"
              }`}
            >
              {inGoalPace
                ? `✓ Counts toward goal-pace HR trend (${effectiveSpeed.toFixed(1)} km/h)`
                : `Avg speed ${effectiveSpeed.toFixed(1)} km/h — outside the 28-30 km/h goal-pace band`}
            </p>
          )}
          {explicitSpeed == null && derivedSpeed == null && (
            <p className="text-[11px] text-stone-400">
              Enter avg speed (or distance + duration) to count toward goal-pace
              trend.
            </p>
          )}
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
            laneTag={laneTag}
            targetReps={ex.reps}
            exerciseName={ex.name}
          />
          <div className="mt-4 space-y-2">
            {setsByExercise[ex.name]?.map((s, i) => {
              const done = doneByExercise[ex.name]?.[i] ?? false;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-semibold text-stone-400 shrink-0">
                    #{i + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    aria-label={`${ex.name} set ${i + 1} weight in kg`}
                    value={s.weightKg}
                    onChange={(e) => updateSet(ex.name, i, "weightKg", e.target.value)}
                    className={`flex-1 min-w-0 h-12 text-base px-3 rounded-lg border focus:bg-white focus:border-amber-500 focus:outline-none ${
                      done
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-stone-200 bg-stone-50"
                    }`}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={ex.reps != null ? "reps" : "sec"}
                    aria-label={`${ex.name} set ${i + 1} ${ex.reps != null ? "reps" : "seconds"}`}
                    value={ex.reps != null ? s.reps : s.durationSec}
                    onChange={(e) =>
                      updateSet(
                        ex.name,
                        i,
                        ex.reps != null ? "reps" : "durationSec",
                        e.target.value,
                      )
                    }
                    className={`w-16 h-12 text-base px-3 rounded-lg border focus:bg-white focus:border-amber-500 focus:outline-none ${
                      done
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-stone-200 bg-stone-50"
                    }`}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="RPE"
                    aria-label={`${ex.name} set ${i + 1} RPE`}
                    value={s.rpe}
                    onChange={(e) => updateSet(ex.name, i, "rpe", e.target.value)}
                    className={`w-14 h-12 text-base px-3 rounded-lg border focus:bg-white focus:border-amber-500 focus:outline-none ${
                      done
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-stone-200 bg-stone-50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDone(ex, i)}
                    aria-label={`Mark ${ex.name} set ${i + 1} ${done ? "not done" : "done"}`}
                    className={`w-11 h-12 shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
                      done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-stone-200 text-stone-300 hover:border-emerald-300 hover:text-emerald-400"
                    }`}
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              );
            })}
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

      {restEndsAt != null && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-20 z-20 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 text-sm font-semibold text-white ${
            restExpired ? "bg-emerald-600" : "bg-stone-900"
          }`}
          role="timer"
          aria-live="polite"
        >
          {restExpired ? (
            <span>GO — next set</span>
          ) : (
            <>
              <span className="tabular-nums">
                Rest {Math.floor(restRemaining! / 60)}:
                {String(restRemaining! % 60).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => setRestEndsAt((t) => (t ?? Date.now()) + 30_000)}
                className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-xs"
              >
                +30s
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setRestEndsAt(null)}
            aria-label="Dismiss rest timer"
            className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-xs"
          >
            ✕
          </button>
        </div>
      )}

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
