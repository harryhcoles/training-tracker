"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type State = {
  squatTarget: number;
  benchTarget: number;
  deadliftTarget: number;
  currentMesoNum: number;
  currentWeek: number;
};

export default function SettingsForm({
  initial,
  stravaConfigured,
}: {
  initial: State;
  stravaConfigured: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stravaResult, setStravaResult] = useState<
    | { kind: "success"; synced: number; skipped: number; created: { name: string; id: string }[] }
    | { kind: "error"; message: string }
    | null
  >(null);

  async function syncStrava() {
    setBusy(true);
    setErr(null);
    setStravaResult(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setStravaResult({
        kind: "success",
        synced: j.synced,
        skipped: j.skipped,
        created: j.created,
      });
      router.refresh();
    } catch (e) {
      setStravaResult({
        kind: "error",
        message: e instanceof Error ? e.message : "Sync failed",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveTarget(field: keyof State, value: number) {
    setErr(null);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function mesoAction(action: string) {
    if (action === "reset") {
      if (
        !confirm(
          "Reset all data? This deletes every logged session and restarts mesocycle 1 from week 1. Cannot be undone.",
        )
      )
        return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/meso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setState((prev) => ({
        ...prev,
        currentMesoNum: j.state.currentMesoNum,
        currentWeek: j.state.currentWeek,
      }));
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function doImport(file: File) {
    if (
      !confirm(
        "Import data? This WIPES all current logs and replaces them. Cannot be undone.",
      )
    )
      return;
    setBusy(true);
    setErr(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      alert(`Imported ${j.imported} logs`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
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
        <h2 className="text-xs uppercase tracking-widest text-stone-500">
          Lift targets (kg)
        </h2>
        {(["squatTarget", "benchTarget", "deadliftTarget"] as const).map(
          (field) => (
            <div key={field}>
              <label className="text-xs text-stone-500 block mb-1 capitalize">
                {field.replace("Target", "")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={state[field]}
                onChange={(e) =>
                  setState({ ...state, [field]: Number(e.target.value) || 0 })
                }
                onBlur={(e) => saveTarget(field, Number(e.target.value) || 0)}
                className="w-full h-12 text-base px-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          ),
        )}
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-500">
          Mesocycle
        </h2>
        <p className="text-sm text-stone-700">
          Meso <span className="font-bold">{state.currentMesoNum}</span> · Week{" "}
          <span className="font-bold">{state.currentWeek}</span>/12
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => mesoAction("prev-week")}
            disabled={busy || state.currentWeek <= 1}
            className="h-12 rounded-lg bg-stone-100 text-stone-700 font-semibold disabled:opacity-40"
          >
            ← Prev week
          </button>
          <button
            onClick={() => mesoAction("next-week")}
            disabled={busy || state.currentWeek >= 12}
            className="h-12 rounded-lg bg-stone-100 text-stone-700 font-semibold disabled:opacity-40"
          >
            Next week →
          </button>
        </div>
        <button
          onClick={() => mesoAction("next-meso")}
          disabled={busy || state.currentWeek !== 12}
          className="w-full h-12 rounded-lg bg-amber-600 text-white font-semibold disabled:opacity-40"
        >
          Start next mesocycle
        </button>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-500">
          Strava sync
        </h2>
        {stravaConfigured ? (
          <>
            <p className="text-xs text-stone-500">
              Pull recent rides from Strava and create logs for them.
              Won&apos;t duplicate already-synced activities.
            </p>
            <button
              onClick={syncStrava}
              disabled={busy}
              className="w-full h-12 rounded-lg text-white font-semibold disabled:opacity-40"
              style={{ background: "#fc4c02" }}
            >
              {busy ? "Syncing…" : "Sync from Strava"}
            </button>
            {stravaResult?.kind === "success" && (
              <div className="text-sm bg-emerald-50 border border-emerald-200 rounded px-3 py-2 text-emerald-800">
                Synced {stravaResult.synced} · skipped {stravaResult.skipped}
                {stravaResult.created.length > 0 && (
                  <ul className="mt-1 list-disc ml-5 text-xs">
                    {stravaResult.created.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {stravaResult?.kind === "error" && (
              <p className="text-sm bg-red-50 border border-red-200 rounded px-3 py-2 text-red-800">
                {stravaResult.message}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-stone-500">
            Strava not configured. See README for one-time setup
            (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN env
            vars on Vercel).
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-500">
          Data
        </h2>
        <a
          href="/api/export"
          className="block text-center h-12 leading-[3rem] rounded-lg bg-stone-100 text-stone-700 font-semibold hover:bg-stone-200"
          download
        >
          Export data (JSON)
        </a>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="w-full h-12 rounded-lg bg-stone-100 text-stone-700 font-semibold hover:bg-stone-200 disabled:opacity-40"
        >
          Import data (JSON)
        </button>
        <button
          onClick={() => mesoAction("reset")}
          disabled={busy}
          className="w-full h-12 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-40"
        >
          Reset all data
        </button>
      </section>
    </div>
  );
}
