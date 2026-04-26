import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, isBikeCategory } from "@/lib/utils";
import {
  getSuggestedTarget,
  liftTargetForExercise,
  type PrevTopSet,
  type SuggestedTarget,
} from "@/lib/progression";
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

  const existingLog = await prisma.sessionLog.findFirst({
    where: { sessionTemplateId: template.id, mesoNum, weekNum },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  });

  // Find previous top set per exercise (heaviest set in the most recent
  // logged session for that exercise, excluding the log we're currently
  // editing). Single query, ordered so first occurrence per exerciseName
  // is the heaviest set in their most recent log.
  const exerciseNames = template.exercises.map((e) => e.name);
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

    for (const s of allSets) {
      if (previousTopSets[s.exerciseName]) continue;
      previousTopSets[s.exerciseName] = {
        weightKg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe,
      };
    }

    if (userState) {
      for (const name of exerciseNames) {
        liftTargets[name] = liftTargetForExercise(name, userState);
        const sug = getSuggestedTarget(
          previousTopSets[name] ?? null,
          liftTargets[name],
        );
        if (sug) suggestions[name] = sug;
      }
    }
  }

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
