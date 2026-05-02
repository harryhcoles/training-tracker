import Link from "next/link";
import { Calendar, Library, Settings as SettingsIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, DAY_NAMES, dayOfWeekMonFirst } from "@/lib/utils";
import { getCurrentPhase } from "@/lib/progression";
import WeekTimeline from "@/components/week-timeline";
import {
  getBikeStats,
  getPersonalRecords,
  getRecentSessions,
  getTotalVolume,
  getWeeklyVolume,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [userState, schedule, templates, logs] = await Promise.all([
    prisma.userState.findUnique({ where: { id: 1 } }),
    prisma.scheduleSlot.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.sessionTemplate.findMany({
      orderBy: [{ category: "asc" }, { phase: "asc" }, { name: "asc" }],
    }),
    prisma.sessionLog.findMany({
      include: {
        sets: true,
        template: true,
      },
    }),
  ]);

  const today = dayOfWeekMonFirst();
  const currentWeek = userState?.currentWeek ?? 1;
  const currentMeso = userState?.currentMesoNum ?? 1;
  const currentPhase = getCurrentPhase(currentWeek);

  function templateForCategoryAndPhase(cat: string | null | undefined) {
    if (!cat) return null;
    return (
      templates.find((t) => t.category === cat && t.phase === currentPhase) ??
      templates.find((t) => t.category === cat && t.phase === "any") ??
      templates.find((t) => t.category === cat) ??
      null
    );
  }

  const todaySlot = schedule.find((s) => s.dayOfWeek === today);
  const todayTemplate = templateForCategoryAndPhase(todaySlot?.categoryId);
  const meta = todaySlot?.categoryId
    ? CATEGORY_META[todaySlot.categoryId]
    : null;

  const totalVolume = getTotalVolume(logs);
  const bikeStats = getBikeStats(logs);
  const prs = getPersonalRecords(logs).slice(0, 5);
  const weeklyVolume = getWeeklyVolume(logs, currentMeso);
  const maxWeekVol = Math.max(1, ...weeklyVolume.map((w) => w.volume));
  const sessionsDone = logs.filter(
    (l) => l.mesoNum === currentMeso && l.weekNum === currentWeek,
  ).length;
  const topE1rm = prs[0]?.e1rm ?? 0;
  const recent = getRecentSessions(logs, 5);

  const medalColors = ["#fbbf24", "#94a3b8", "#b45309"];

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header className="pt-2 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
            Crit Programme · 12wk
          </p>
          <h1 className="font-serif-display text-4xl font-black mt-1">
            Training Log
          </h1>
        </div>
        <div className="flex gap-1">
          <Link
            href="/schedule"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            aria-label="Schedule"
          >
            <Calendar size={20} />
          </Link>
          <Link
            href="/library"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            aria-label="Library"
          >
            <Library size={20} />
          </Link>
          <Link
            href="/settings"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </Link>
        </div>
      </header>

      <section
        className="rounded-2xl p-6 text-white shadow-lg"
        style={{
          background: meta
            ? `linear-gradient(135deg, ${meta.color}, #d97706)`
            : "linear-gradient(135deg, #57534e, #292524)",
        }}
      >
        <p className="text-xs uppercase tracking-widest opacity-80">
          {DAY_NAMES[today]} · Today
        </p>
        {todayTemplate ? (
          <>
            <h2 className="font-serif-display text-3xl font-black mt-1">
              {todayTemplate.name}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              {meta?.label}
              {todayTemplate.durationMin
                ? ` · ${todayTemplate.durationMin}min`
                : ""}
              {` · ${currentPhase}`}
            </p>
            <Link
              href={`/session/${todayTemplate.id}`}
              className="mt-4 inline-block bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Start session →
            </Link>
          </>
        ) : todaySlot?.categoryId ? (
          <>
            <h2 className="font-serif-display text-3xl font-black mt-1">
              {meta?.label ?? todaySlot.categoryId}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              No template yet — create one in the library.
            </p>
            <Link
              href="/library/new"
              className="mt-4 inline-block bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              + Create session →
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-serif-display text-3xl font-black mt-1">
              Rest day
            </h2>
            <p className="text-sm opacity-90 mt-1">No session scheduled</p>
          </>
        )}
      </section>

      <WeekTimeline currentWeek={currentWeek} currentMeso={currentMeso} />

      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest text-stone-500">
            This week
          </h3>
          <Link
            href="/schedule"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Edit schedule →
          </Link>
        </div>
        <ul className="space-y-1.5">
          {Array.from({ length: 7 }, (_, d) => {
            const slot = schedule.find((s) => s.dayOfWeek === d);
            const tmpl = templateForCategoryAndPhase(slot?.categoryId);
            const m = slot?.categoryId ? CATEGORY_META[slot.categoryId] : null;
            const isToday = d === today;
            const content = (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isToday ? "bg-amber-50" : ""
                }`}
              >
                <span
                  className={`w-10 text-xs font-bold ${
                    isToday ? "text-amber-700" : "text-stone-400"
                  }`}
                >
                  {DAY_NAMES[d]}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: m?.color ?? "#d6d3d1" }}
                />
                <span className="flex-1 min-w-0 truncate text-sm text-stone-700">
                  {tmpl
                    ? tmpl.name
                    : slot?.categoryId
                      ? (m?.label ?? slot.categoryId)
                      : "Rest"}
                </span>
              </div>
            );
            return (
              <li key={d}>
                {tmpl ? (
                  <Link href={`/session/${tmpl.id}`}>{content}</Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-stone-500">
          Lift targets
        </h3>
        {[
          { name: "Squat", target: userState?.squatTarget ?? 0, exerciseName: "Back Squat" },
          { name: "Bench", target: userState?.benchTarget ?? 0, exerciseName: "Bench Press" },
          { name: "Deadlift", target: userState?.deadliftTarget ?? 0, exerciseName: "Deadlift" },
        ].map((t) => {
          const pr = prs.find((p) => p.exerciseName === t.exerciseName);
          const current = pr?.weight ?? 0;
          const pct = t.target > 0 ? Math.min(100, (current / t.target) * 100) : 0;
          return (
            <div key={t.name}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="text-xs text-stone-500">
                  {current}kg / {t.target}kg
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #d97706, #ea580c)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Total volume" value={`${Math.round(totalVolume).toLocaleString()}`} unit="kg" />
        <StatCard label="Bike km" value={`${Math.round(bikeStats.totalKm)}`} unit="km" />
        <StatCard label="This week" value={`${sessionsDone}`} unit="sessions" />
        <StatCard label="Top e1RM" value={`${Math.round(topE1rm)}`} unit="kg" />
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-3">
          Weekly volume · Meso {currentMeso}
        </h3>
        <div className="flex items-end gap-1 h-28">
          {weeklyVolume.map((w) => {
            const h = (w.volume / maxWeekVol) * 100;
            const isCurrent = w.week === currentWeek;
            return (
              <div key={w.week} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${
                    isCurrent ? "bg-amber-600" : "bg-stone-300"
                  }`}
                  style={{ height: `${Math.max(h, 2)}%` }}
                />
                <span className="text-[10px] text-stone-400 mt-1">{w.week}</span>
              </div>
            );
          })}
        </div>
      </section>

      {bikeStats.count > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-3">
            Bike stats
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-serif-display text-xl font-black">
                {bikeStats.topSpeed ? bikeStats.topSpeed.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-stone-500">top km/h</p>
            </div>
            <div>
              <p className="font-serif-display text-xl font-black">
                {Math.round(bikeStats.totalKm)}
              </p>
              <p className="text-xs text-stone-500">total km</p>
            </div>
            <div>
              <p className="font-serif-display text-xl font-black">
                {bikeStats.avgPower ? Math.round(bikeStats.avgPower) : "—"}
              </p>
              <p className="text-xs text-stone-500">avg W</p>
            </div>
          </div>
        </section>
      )}

      {prs.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-3">
            Personal records
          </h3>
          <ul className="space-y-2">
            {prs.map((p, i) => (
              <li key={p.exerciseName} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                  style={{
                    background:
                      i < 3
                        ? `linear-gradient(135deg, ${medalColors[i]}, ${medalColors[i]}cc)`
                        : "#e7e5e4",
                    color: i < 3 ? "white" : "#78716c",
                  }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {p.exerciseName}
                </span>
                <span className="text-sm text-stone-600">
                  {p.weight}kg × {p.reps}
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {Math.round(p.e1rm)}kg
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-3">
            Recent
          </h3>
          <ul className="space-y-2">
            {recent.map((l) => {
              const m = CATEGORY_META[l.template.category];
              return (
                <li key={l.id}>
                  <Link
                    href={`/session/${l.template.id}`}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="w-2 h-8 rounded-full shrink-0"
                      style={{ background: m?.color ?? "#78716c" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate flex items-center gap-2">
                        <span className="truncate">{l.template.name}</span>
                        {l.stravaActivityId != null && (
                          <span
                            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: "#fc4c02" }}
                          >
                            STRAVA
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        W{l.weekNum} · {new Date(l.loggedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {l.sessionRpe && (
                      <span className="text-xs text-stone-500">
                        RPE {l.sessionRpe}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-3">
          Browse programme
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORY_META).map(([cat, m]) => (
            <Link
              key={cat}
              href={`/library#${cat}`}
              className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow-md"
            >
              <span
                className="w-2 h-8 rounded-full"
                style={{ background: m.color }}
              />
              <span className="font-semibold text-sm">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-stone-500">
        {label}
      </p>
      <p className="font-serif-display text-2xl font-black mt-1">
        {value}
        <span className="text-stone-400 text-sm font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
}
