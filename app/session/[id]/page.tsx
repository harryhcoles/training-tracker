import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, isBikeCategory } from "@/lib/utils";
import {
  getSuggestedTarget,
  isDeloadWeek,
  liftTargetForExercise,
  type PrevTopSet,
  type SuggestedTarget,
} from "@/lib/progression";
import { getSessionWarnings } from "@/lib/training-rules";
import SessionLogForm from "@/components/session-log-form";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [template, userState] = await Promise.all([
    prisma.sessionTemplate.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { orderIndex: "asc" } },
      },
    }),
    prisma.userState.findUnique({ where: { id: 1 } }),
  ]);

  if (!template) notFound();

  const mesoNum = userState?.currentMesoNum ?? 1;
  const weekNum = userState?.currentWeek ?? 1;

  // Prefill from today's log of this template (if any). Logs from earlier
  // in the week stay as separate entries — re-opening a template later in
  // the week shows an empty form, not the previous session's numbers.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const existingLog = await prisma.sessionLog.findFirst({
    where: {
      sessionTemplateId: template.id,
      loggedAt: { gte: startOfToday, lte: endOfToday },
    },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  });

  // Previous top sets per exercise. We collect TWO entries per exercise:
  //   - prevSameReps: most recent set at the exercise's prescribed rep
  //     count (used verbatim with RPE rule)
  //   - prevAnyReps: most recent set at any rep count (used for Epley
  //     scaling when no same-rep history exists)
  // The query orders by log date desc + weight desc, so the first
  // occurrence per (exercise, reps) is the heaviest set in the most
  // recent log at that rep count.
  const exerciseNames = template.exercises.map((e) => e.name);
  // Picker-facing PrevTopSet shown in the UI — uses same-rep evidence
  // when available, else any-rep evidence (without scaling).
  const previousTopSets: Record<string, PrevTopSet> = {};
  const suggestions: Record<string, SuggestedTarget> = {};
  const liftTargets: Record<string, number | null> = {};

  if (exerciseNames.length > 0) {
    const allSets = await prisma.exerciseSet.findMany({
      where: {
        exerciseName: { in: exerciseNames },
        weightKg: { not: null },
        ...(existingLog ? { sessionLogId: { not: existingLog.id } } : {}),
      },
      include: { log: { select: { id: true, loggedAt: true } } },
      orderBy: [{ log: { loggedAt: "desc" } }, { weightKg: "desc" }],
    });

    // Build (exerciseName, reps) → first occurrence map for same-rep
    // lookup, plus (exerciseName) → first occurrence for any-rep.
    const sameRepBest: Record<string, PrevTopSet> = {};
    const anyRepBest: Record<string, PrevTopSet> = {};
    for (const s of allSets) {
      const anyKey = s.exerciseName;
      if (!anyRepBest[anyKey]) {
        anyRepBest[anyKey] = {
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
        };
      }
      if (s.reps != null) {
        const sameKey = `${s.exerciseName}::${s.reps}`;
        if (!sameRepBest[sameKey]) {
          sameRepBest[sameKey] = {
            weightKg: s.weightKg,
            reps: s.reps,
            rpe: s.rpe,
          };
        }
      }
    }

    if (userState) {
      const deload = isDeloadWeek(weekNum);
      for (const ex of template.exercises) {
        liftTargets[ex.name] = liftTargetForExercise(ex.name, userState);
        const targetReps = ex.reps;
        const sameKey = targetReps != null ? `${ex.name}::${targetReps}` : null;
        const prevSame = sameKey ? (sameRepBest[sameKey] ?? null) : null;
        const prevAny = anyRepBest[ex.name] ?? null;
        // For the "Last:" display, show same-rep evidence if available
        // (most truthful), else any-rep evidence.
        const displayPrev = prevSame ?? prevAny;
        if (displayPrev) previousTopSets[ex.name] = displayPrev;
        const sug = getSuggestedTarget(
          prevSame,
          prevAny,
          targetReps,
          liftTargets[ex.name],
          deload,
        );
        if (sug) suggestions[ex.name] = sug;
      }
    }
  }

  // Recent logs for the warning system. 7 days covers the
  // weekly-intensity rule; the same-day and yesterday rules are still
  // satisfied by the same query.
  const todayDate = new Date();
  const sevenDaysAgo = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentLogs = await prisma.sessionLog.findMany({
    where: { loggedAt: { gte: sevenDaysAgo } },
    include: {
      template: { select: { name: true, category: true, focus: true } },
    },
    orderBy: { loggedAt: "desc" },
  });

  const isEditingTodayLog = !!(
    existingLog &&
    existingLog.loggedAt.getFullYear() === todayDate.getFullYear() &&
    existingLog.loggedAt.getMonth() === todayDate.getMonth() &&
    existingLog.loggedAt.getDate() === todayDate.getDate()
  );

  const warnings = getSessionWarnings(
    template,
    todayDate,
    recentLogs.map((l) => ({ loggedAt: l.loggedAt, template: l.template })),
    isEditingTodayLog,
  );

  const meta = CATEGORY_META[template.category];
  const isBike = isBikeCategory(template.category);

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-800 inline-block"
      >
        ← Back
      </Link>

      <header
        className="rounded-2xl p-6 text-white shadow-lg"
        style={{
          background: meta
            ? `linear-gradient(135deg, ${meta.color}, #d97706)`
            : "linear-gradient(135deg, #57534e, #292524)",
        }}
      >
        <p className="text-xs uppercase tracking-widest opacity-80">
          {meta?.label ?? template.category} · Week {weekNum}
        </p>
        <h1 className="font-serif-display text-2xl font-black mt-1">
          {template.name}
        </h1>
        {template.description && (
          <p className="text-sm opacity-90 mt-2">{template.description}</p>
        )}
      </header>

      <SessionLogForm
        templateId={template.id}
        mesoNum={mesoNum}
        weekNum={weekNum}
        isBike={isBike}
        exercises={template.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          durationSec: e.durationSec,
          perSide: e.perSide,
          note: e.note,
        }))}
        previousTopSets={previousTopSets}
        suggestions={suggestions}
        liftTargets={liftTargets}
        warnings={warnings}
        existing={
          existingLog
            ? {
                sessionRpe: existingLog.sessionRpe,
                notes: existingLog.notes,
                durationActualMin: existingLog.durationActualMin,
                distanceKm: existingLog.distanceKm,
                avgHr: existingLog.avgHr,
                avgPower: existingLog.avgPower,
                sets: existingLog.sets.map((s) => ({
                  exerciseName: s.exerciseName,
                  setNumber: s.setNumber,
                  weightKg: s.weightKg,
                  reps: s.reps,
                  durationSec: s.durationSec,
                  rpe: s.rpe,
                })),
              }
            : null
        }
      />
    </main>
  );
}
