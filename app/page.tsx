import Link from "next/link";
import { Calendar, Library, Settings as SettingsIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, DAY_NAMES, dayOfWeekMonFirst } from "@/lib/utils";
import { getCurrentPhase, isDeloadWeek } from "@/lib/progression";
import WeekTimeline from "@/components/week-timeline";
import WeightSection from "@/components/weight-section";
import HrAtGoalPaceChart from "@/components/hr-at-goal-pace-chart";
import { isoWeekKey } from "@/lib/goal-pace";
import { isHardSession } from "@/lib/training-rules";
import {
  getBikeStats,
  getPersonalRecords,
  getRecentSessions,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sinceForWeight = new Date(Date.now() - 12 * 7 * 86400_000);
  const sinceForHr = new Date(Date.now() - 12 * 7 * 86400_000);
  const userStateForLookup = await prisma.userState.findUnique({
    where: { id: 1 },
  });
  const lookupMeso = userStateForLookup?.currentMesoNum ?? 1;
  const lookupWeek = userStateForLookup?.currentWeek ?? 1;
  const [
    userState,
    defaultSchedule,
    weekOverrides,
    templates,
    logs,
    weightEntries,
    hrRides,
  ] = await Promise.all([
    Promise.resolve(userStateForLookup),
    prisma.scheduleSlot.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.weekScheduleSlot.findMany({
      where: { mesoNum: lookupMeso, weekNum: lookupWeek },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.sessionTemplate.findMany({
      orderBy: [{ category: "asc" }, { phase: "asc" }, { name: "asc" }],
    }),
    prisma.sessionLog.findMany({
      include: { sets: true, template: true },
    }),
    prisma.weightEntry.findMany({
      where: { date: { gte: sinceForWeight } },
      orderBy: { date: "asc" },
      select: { id: true, date: true, weightKg: true },
    }),
    prisma.sessionLog.findMany({
      where: {
        loggedAt: { gte: sinceForHr },
        hrAtGoalPace: { not: null },
        timeInGoalPaceSec: { gte: 300 },
      },
      select: {
        loggedAt: true,
        hrAtGoalPace: true,
        timeInGoalPaceSec: true,
      },
    }),
  ]);

  // The "schedule" used by the rest of the home page: prefer per-week
  // overrides for the current (mesoNum, weekNum); fall back to defaults.
  const schedule = weekOverrides.length > 0 ? weekOverrides : defaultSchedule;
  const isWeekOverridden = weekOverrides.length > 0;

  // Aggregate HR-at-goal-pace by ISO week (server-side; mirrors the
  // /api/stats/hr-at-goal-pace endpoint logic).
  const hrByWeek: Record<
    string,
    { sumWeightedHr: number; sumSec: number; rideCount: number }
  > = {};
  for (const r of hrRides) {
    const key = isoWeekKey(r.loggedAt);
    const b = (hrByWeek[key] ??= {
      sumWeightedHr: 0,
      sumSec: 0,
      rideCount: 0,
    });
    const sec = r.timeInGoalPaceSec ?? 0;
    const hr = r.hrAtGoalPace ?? 0;
    b.sumWeightedHr += hr * sec;
    b.sumSec += sec;
    b.rideCount += 1;
  }
  const hrSeries = Object.entries(hrByWeek)
    .map(([week, b]) => ({
      week,
      avgHr: b.sumSec > 0 ? Math.round(b.sumWeightedHr / b.sumSec) : null,
      totalGoalPaceMin: Math.round(b.sumSec / 60),
      rideCount: b.rideCount,
      lowConfidence: b.sumSec < 15 * 60,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const calendarToday = dayOfWeekMonFirst();
  const dayLabel = (d: number, mode: "cycle" | "week") =>
    mode === "cycle" ? `D${d + 1}` : (DAY_NAMES[d] ?? `D${d + 1}`);
  const currentWeek = userState?.currentWeek ?? 1;
  const currentMeso = userState?.currentMesoNum ?? 1;
  const currentPhase = getCurrentPhase(currentWeek);
  const onDeload = isDeloadWeek(currentWeek);
  const activeProgrammeId = userState?.activeProgrammeId ?? null;

  // Look up the active programme's name + cycleLength for the header
  // and for deciding whether to render a 7-day calendar or an N-day
  // cycle view.
  const activeProgramme = activeProgrammeId
    ? await prisma.programme.findUnique({
        where: { id: activeProgrammeId },
        select: { name: true, totalWeeks: true, cycleLength: true },
      })
    : null;

  const cycleLength = activeProgramme?.cycleLength ?? 7;
  const isCycleMode = cycleLength !== 7;

  // For cycle-mode programmes, "today" is a cycle-day index 0..(cycleLength-1)
  // derived from the calendar date elapsed since cycleStartedAt. For
  // 7-day programmes, "today" is the standard Mon-first calendar index.
  function daysBetween(a: Date, b: Date) {
    const ms = b.getTime() - a.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  }
  let today = calendarToday;
  let cycleStartedAt: Date | null = null;
  if (isCycleMode && userState?.cycleStartedAt) {
    cycleStartedAt = userState.cycleStartedAt;
    const elapsed = Math.max(0, daysBetween(cycleStartedAt, new Date()));
    today = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  }

  // Picker: when a programme is active, prefer a programme template
  // matching (programmeId, weekNum, dayOfWeek, category). Otherwise
  // (or if no programme template exists for that slot — e.g. strength
  // categories under a bike-only programme), fall back to the existing
  // phase-based picker.
  //
  // For cycle-mode programmes whose schedule has been reshuffled to
  // match calendar constraints (long ride Sat/Sun, conditioning M/W/F),
  // template.dayOfWeek no longer corresponds to the slot's calendar
  // position. In that case we pick by (programme, cycle, category)
  // ignoring dayOfWeek, and disambiguate the 'back' category — which
  // has two templates per cycle (deadlift + OHP+pull) — by checking
  // whether the slot is a double day (back + speed → OHP+pull) or solo
  // (just back → deadlift).
  function templateForCategoryAndPhase(
    cat: string | null | undefined,
    forDayOfWeek: number,
    slotDayCats: string[] = [],
  ) {
    if (!cat) return null;
    if (activeProgrammeId) {
      if (isCycleMode) {
        const matches = templates.filter(
          (t) =>
            t.programmeId === activeProgrammeId &&
            t.weekNum === currentWeek &&
            t.category === cat,
        );
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) {
          // For programmes that seed multiple templates per (cycle, category)
          // — e.g. the Hybrid plan has back×2 (deadlift + OHP+pull) and
          // speed×2 (solo VO2/Threshold + the bike-PM half of the D7
          // double) — disambiguate via the template's original cycleDay,
          // which acts as a stable "slot type" identifier:
          //   back: cycleDay=5 = deadlift (solo), cycleDay=6 = OHP+pull (double)
          //   speed: cycleDay=1 = solo bike, cycleDay=6 = double bike
          const isDouble =
            slotDayCats.filter((c) => c === "back" || c === "speed").length >=
            2;
          if (cat === "back") {
            const wantDayOfWeek = isDouble ? 6 : 5;
            return (
              matches.find((t) => t.dayOfWeek === wantDayOfWeek) ?? matches[0]
            );
          }
          if (cat === "speed") {
            const wantDayOfWeek = isDouble ? 6 : 1;
            return (
              matches.find((t) => t.dayOfWeek === wantDayOfWeek) ?? matches[0]
            );
          }
          return matches[0];
        }
      } else {
        const programmeMatch = templates.find(
          (t) =>
            t.programmeId === activeProgrammeId &&
            t.weekNum === currentWeek &&
            t.dayOfWeek === forDayOfWeek &&
            t.category === cat,
        );
        if (programmeMatch) return programmeMatch;
      }
    }
    return (
      templates.find(
        (t) =>
          t.programmeId == null &&
          t.category === cat &&
          t.phase === currentPhase,
      ) ??
      templates.find(
        (t) =>
          t.programmeId == null && t.category === cat && t.phase === "any",
      ) ??
      templates.find((t) => t.programmeId == null && t.category === cat) ??
      null
    );
  }

  // Multiple slots per day are now supported. For cycle-mode programmes
  // the "day" index spans 0..(cycleLength-1) rather than 0..6.
  const slotsByDay: Record<number, string[]> = {};
  for (let d = 0; d < cycleLength; d++) slotsByDay[d] = [];
  for (const s of schedule) {
    if (s.dayOfWeek >= 0 && s.dayOfWeek < cycleLength) {
      slotsByDay[s.dayOfWeek].push(s.categoryId);
    }
  }

  const todayCategories = slotsByDay[today] ?? [];
  const todayPrimary = todayCategories[0] ?? null;
  const todayTemplate = templateForCategoryAndPhase(
    todayPrimary,
    today,
    todayCategories,
  );
  const todayExtras = todayCategories.slice(1);
  const meta = todayPrimary ? CATEGORY_META[todayPrimary] : null;

  // Pre-flight intensity check: classify each scheduled session in
  // the current week / cycle, count hard ones. ≥3 fires the banner.
  let scheduledHardCount = 0;
  let scheduledTotalCount = 0;
  for (let d = 0; d < cycleLength; d++) {
    const dCats = slotsByDay[d] ?? [];
    for (const cat of dCats) {
      const tmpl = templateForCategoryAndPhase(cat, d, dCats);
      if (!tmpl) continue;
      scheduledTotalCount++;
      if (
        isHardSession({
          category: tmpl.category,
          name: tmpl.name,
          focus: tmpl.focus,
        })
      ) {
        scheduledHardCount++;
      }
    }
  }
  const intensityHigh = scheduledHardCount >= 3;

  const bikeStats = getBikeStats(logs);
  const prs = getPersonalRecords(logs).slice(0, 5);
  const recent = getRecentSessions(logs, 5);

  const medalColors = ["#fbbf24", "#94a3b8", "#b45309"];

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header className="pt-2 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
            {activeProgramme
              ? `${activeProgramme.name} · ${activeProgramme.totalWeeks}wk`
              : "Training Tracker"}
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
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest opacity-80">
            {dayLabel(today, isCycleMode ? "cycle" : "week")} · Today
          </p>
          {onDeload && (
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/30 rounded px-2 py-0.5">
              Deload
            </span>
          )}
        </div>
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
            {todayExtras.length > 0 && (
              <p className="text-xs opacity-80 mt-3">
                Also today:{" "}
                {todayExtras
                  .map((c) => CATEGORY_META[c]?.label ?? c)
                  .join(" · ")}
              </p>
            )}
          </>
        ) : todayPrimary ? (
          <>
            <h2 className="font-serif-display text-3xl font-black mt-1">
              {meta?.label ?? todayPrimary}
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

      <WeekTimeline
        currentWeek={currentWeek}
        currentMeso={currentMeso}
        totalWeeks={activeProgramme?.totalWeeks ?? 12}
        isCycleMode={isCycleMode}
      />

      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest text-stone-500">
            This week
            {isWeekOverridden && (
              <span className="ml-2 text-[10px] font-bold text-amber-700">
                · custom
              </span>
            )}
          </h3>
          <Link
            href={`/schedule?meso=${currentMeso}&week=${currentWeek}`}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Edit {isCycleMode ? "cycle" : "week"} {currentWeek} →
          </Link>
        </div>
        {intensityHigh && (
          <div className="mb-3 bg-amber-50 border border-amber-300 rounded-xl p-3 flex gap-2">
            <span className="text-amber-700 shrink-0">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-900">
                {scheduledHardCount} hard sessions scheduled this {isCycleMode ? "cycle" : "week"}
                {scheduledTotalCount > 0
                  ? ` (${scheduledHardCount}/${scheduledTotalCount} active days)`
                  : ""}
              </p>
              <p className="text-[11px] text-amber-800 italic mt-0.5">
                Polarised training (Seiler 2010) suggests ~80% easy / ~20%
                hard. Drop one of the harder sessions to a Z2 or recovery if
                you start feeling cooked.
              </p>
            </div>
          </div>
        )}
        <ul className="space-y-1.5">
          {Array.from({ length: cycleLength }, (_, d) => {
            const cats = slotsByDay[d] ?? [];
            const isToday = d === today;
            const label = dayLabel(d, isCycleMode ? "cycle" : "week");
            if (cats.length === 0) {
              return (
                <li key={d}>
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
                      {label}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#d6d3d1" }}
                    />
                    <span className="flex-1 min-w-0 truncate text-sm text-stone-700">
                      Rest
                    </span>
                  </div>
                </li>
              );
            }
            return (
              <li key={d} className={isToday ? "bg-amber-50 rounded-lg" : ""}>
                <ul>
                  {cats.map((cat, idx) => {
                    const tmpl = templateForCategoryAndPhase(cat, d, cats);
                    const m = CATEGORY_META[cat];
                    const lineLabel = tmpl ? tmpl.name : (m?.label ?? cat);
                    const content = (
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span
                          className={`w-10 text-xs font-bold ${
                            isToday && idx === 0
                              ? "text-amber-700"
                              : "text-stone-400"
                          }`}
                        >
                          {idx === 0 ? label : ""}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: m?.color ?? "#d6d3d1" }}
                        />
                        <span className="flex-1 min-w-0 truncate text-sm text-stone-700">
                          {lineLabel}
                        </span>
                      </div>
                    );
                    return (
                      <li key={cat}>
                        {tmpl ? (
                          <Link href={`/session/${tmpl.id}`}>{content}</Link>
                        ) : (
                          content
                        )}
                      </li>
                    );
                  })}
                </ul>
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

      <HrAtGoalPaceChart series={hrSeries} />

      <WeightSection
        entries={weightEntries.map((e) => ({
          id: e.id,
          date: e.date.toISOString(),
          weightKg: e.weightKg,
        }))}
      />

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

