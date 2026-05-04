"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Entry = { id: string; date: string; weightKg: number };

export default function WeightSection({
  entries: initialEntries,
}: {
  entries: Entry[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [showModal, setShowModal] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ existing: { weightKg: number } } | null>(
    null,
  );

  const sorted = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const latest = sorted[sorted.length - 1];
  const fourWeeksAgoCutoff = Date.now() - 28 * 86400_000;
  const fourWeekRef = [...sorted]
    .reverse()
    .find((e) => new Date(e.date).getTime() <= fourWeeksAgoCutoff);
  const delta =
    latest && fourWeekRef
      ? Math.round((latest.weightKg - fourWeekRef.weightKg) * 10) / 10
      : null;

  // Has the user already logged this ISO week?
  const thisWeekStart = startOfIsoWeek(new Date());
  const hasThisWeek = sorted.some(
    (e) => new Date(e.date).getTime() >= thisWeekStart.getTime(),
  );

  async function submit(overwrite = false) {
    setErr(null);
    const w = Number(weight);
    if (!w || w < 40 || w > 150) {
      setErr("Enter a weight between 40 and 150kg");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: w,
          notes: notes.trim() || null,
          overwrite,
        }),
      });
      const j = await res.json();
      if (res.status === 409 && !overwrite) {
        setConflict({ existing: j.existing });
        setSaving(false);
        return;
      }
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.id !== j.entry.id);
        return [
          ...filtered,
          {
            id: j.entry.id,
            date: j.entry.date,
            weightKg: j.entry.weightKg,
          },
        ];
      });
      setShowModal(false);
      setWeight("");
      setNotes("");
      setConflict(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs uppercase tracking-widest text-stone-500">
          Weight
        </h3>
        {!hasThisWeek && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Log this week →
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-stone-500 mt-3">
          Log your first weigh-in to start tracking trends.{" "}
          <button
            onClick={() => setShowModal(true)}
            className="text-amber-700 font-semibold underline"
          >
            Add now
          </button>
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="font-serif-display text-3xl font-black">
              {latest?.weightKg.toFixed(1)}
              <span className="text-stone-400 text-base font-normal ml-1">
                kg
              </span>
            </p>
            {delta != null && (
              <p
                className={`text-xs font-semibold ${
                  delta > 0
                    ? "text-orange-600"
                    : delta < 0
                      ? "text-emerald-700"
                      : "text-stone-500"
                }`}
              >
                {delta > 0 ? "↑" : delta < 0 ? "↓" : "·"} {Math.abs(delta)}kg
                <span className="text-stone-400 font-normal"> vs 4w ago</span>
              </p>
            )}
          </div>
          <WeightChart entries={sorted} />
          {hasThisWeek && (
            <p className="text-[11px] text-stone-400 mt-2">
              ✓ logged this week
            </p>
          )}
        </>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h3 className="font-serif-display text-2xl font-black mb-3">
            Log weight
          </h3>
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
              {err}
            </p>
          )}
          {conflict && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
              You already logged {conflict.existing.weightKg}kg today.
              Overwrite?
            </p>
          )}
          <label className="text-xs text-stone-500 block mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            autoFocus
            className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none mb-3"
          />
          <label className="text-xs text-stone-500 block mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 h-12 rounded-lg bg-stone-100 text-stone-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => submit(!!conflict)}
              disabled={saving}
              className="flex-1 h-12 rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #d97706, #ea580c)" }}
            >
              {saving ? "Saving…" : conflict ? "Overwrite" : "Save"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function WeightChart({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) return null;

  const W = 320;
  const H = 80;
  const padX = 4;
  const padY = 6;

  const dates = entries.map((e) => new Date(e.date).getTime());
  const weights = entries.map((e) => e.weightKg);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates, minDate + 1);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const wRange = Math.max(maxW - minW, 1);

  const xOf = (t: number) =>
    padX + ((t - minDate) / (maxDate - minDate || 1)) * (W - 2 * padX);
  const yOf = (w: number) =>
    padY + (1 - (w - minW) / wRange) * (H - 2 * padY);

  const points = entries.map((e) => ({
    x: xOf(new Date(e.date).getTime()),
    y: yOf(e.weightKg),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // 7-entry rolling average
  const window = 7;
  const rolling = entries
    .map((_, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = weights.slice(start, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      return {
        x: xOf(dates[i]),
        y: yOf(avg),
      };
    })
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full mt-4 overflow-visible"
      aria-label="Weight trend"
    >
      <path
        d={rolling}
        fill="none"
        stroke="#d6d3d1"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={linePath}
        fill="none"
        stroke="#d97706"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#d97706" />
      ))}
    </svg>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}
