"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DaySummary = {
  day: string;
  cats: string[];
  colors: string[];
};

export default function ProgrammeCard({
  id,
  name,
  description,
  totalWeeks,
  templateCount,
  isActive,
  schedule,
}: {
  id: string;
  name: string;
  description: string | null;
  totalWeeks: number;
  templateCount: number;
  isActive: boolean;
  schedule: DaySummary[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function activate() {
    if (
      !confirm(
        `Activate "${name}"? This starts a new mesocycle from week 1 and replaces your current weekly schedule with this programme's default. Your logged sessions are preserved.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/programmes/${id}/activate`, {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      router.push("/");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Activation failed");
      setBusy(false);
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm border ${
        isActive ? "border-amber-400" : "border-transparent"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif-display text-xl font-black text-stone-900 flex-1 min-w-0">
          {name}
        </h2>
        {isActive && (
          <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
            Active
          </span>
        )}
      </div>
      <p className="text-xs text-stone-500 mt-1">
        {totalWeeks} weeks · {templateCount} templates
      </p>
      {description && (
        <p className="text-sm text-stone-700 mt-3">{description}</p>
      )}

      <div className="mt-4 grid grid-cols-7 gap-1">
        {schedule.map((s) => (
          <div key={s.day} className="text-center">
            <p className="text-[10px] text-stone-400 mb-1">{s.day}</p>
            <div className="space-y-0.5">
              {s.cats.length === 0 ? (
                <span
                  className="block w-full h-2 rounded-full"
                  style={{ background: "#e7e5e4" }}
                />
              ) : (
                s.colors.map((c, i) => (
                  <span
                    key={i}
                    className="block w-full h-2 rounded-full"
                    style={{ background: c }}
                    title={s.cats[i]}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {err && <p className="text-xs text-red-600 mt-3">{err}</p>}

      {isActive ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            ✓ Currently active
          </p>
          <Link
            href="/schedule"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Edit default schedule →
          </Link>
        </div>
      ) : (
        <button
          onClick={activate}
          disabled={busy}
          className="w-full h-12 mt-4 rounded-lg text-white font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #d97706, #ea580c)" }}
        >
          {busy ? "Activating…" : "Activate · start new mesocycle"}
        </button>
      )}
    </div>
  );
}
