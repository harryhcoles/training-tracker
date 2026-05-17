import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dayOfWeekMonFirst } from "@/lib/utils";
import ScheduleEditor from "@/components/schedule-editor";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; meso?: string }>;
}) {
  const params = await searchParams;
  const userState = await prisma.userState.findUnique({ where: { id: 1 } });
  const activeProgramme = userState?.activeProgrammeId
    ? await prisma.programme.findUnique({
        where: { id: userState.activeProgrammeId },
        select: { cycleLength: true },
      })
    : null;
  const cycleLength = activeProgramme?.cycleLength ?? 7;
  const isCycleMode = cycleLength !== 7;

  // For cycle-mode programmes, "today" is the current cycleDay; for
  // 7-day programmes it's the standard Mon-first calendar index.
  let today = dayOfWeekMonFirst();
  if (isCycleMode && userState?.cycleStartedAt) {
    const elapsed = Math.max(
      0,
      Math.floor(
        (Date.now() - userState.cycleStartedAt.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );
    today = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  }

  const requestedWeek = params.week ? Number(params.week) : undefined;
  const requestedMeso = params.meso ? Number(params.meso) : undefined;

  // Mode: per-week override editor when ?week is present, otherwise the
  // programme-default editor.
  const isWeekMode =
    Number.isFinite(requestedWeek) &&
    requestedWeek != null &&
    requestedWeek >= 1;
  const mesoNum = isWeekMode
    ? (Number.isFinite(requestedMeso)
        ? (requestedMeso as number)
        : (userState?.currentMesoNum ?? 1))
    : 0;
  const weekNum = isWeekMode ? (requestedWeek as number) : 0;

  let slots: { dayOfWeek: number; categoryId: string }[];
  let usingDefault = false;
  if (isWeekMode) {
    const overrides = await prisma.weekScheduleSlot.findMany({
      where: { mesoNum, weekNum },
      orderBy: [{ dayOfWeek: "asc" }, { categoryId: "asc" }],
    });
    if (overrides.length > 0) {
      slots = overrides.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        categoryId: s.categoryId,
      }));
    } else {
      const defaults = await prisma.scheduleSlot.findMany({
        orderBy: { dayOfWeek: "asc" },
      });
      slots = defaults.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        categoryId: s.categoryId,
      }));
      usingDefault = true;
    }
  } else {
    const defaults = await prisma.scheduleSlot.findMany({
      orderBy: { dayOfWeek: "asc" },
    });
    slots = defaults.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      categoryId: s.categoryId,
    }));
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-800 inline-block"
      >
        ← Back
      </Link>

      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
          {isWeekMode
            ? `${isCycleMode ? "Cycle" : "Week"} ${weekNum} · meso ${mesoNum}`
            : "Programme default"}
        </p>
        <h1 className="font-serif-display text-3xl font-black mt-1">
          {isWeekMode
            ? `Edit ${isCycleMode ? "cycle" : "week"}`
            : "Edit default schedule"}
        </h1>
        <p className="text-xs text-stone-500 mt-2">
          {isWeekMode
            ? `Changes apply to this ${isCycleMode ? "cycle" : "week"} only. Other ${isCycleMode ? "cycles" : "weeks"} keep the programme default.`
            : `Changes apply to every ${isCycleMode ? "cycle" : "week"} of the programme by default. Per-${isCycleMode ? "cycle" : "week"} edits override these.`}
        </p>
        {isWeekMode && usingDefault && (
          <p className="text-[11px] text-amber-700 mt-1">
            This {isCycleMode ? "cycle" : "week"} is following the default. Toggling any category creates a {isCycleMode ? "cycle" : "week"}-specific override.
          </p>
        )}
      </header>

      <ScheduleEditor
        initial={slots}
        today={today}
        mode={isWeekMode ? "week" : "default"}
        mesoNum={mesoNum}
        weekNum={weekNum}
        cycleLength={cycleLength}
      />

      {isWeekMode && !usingDefault && (
        <ResetWeekToDefault mesoNum={mesoNum} weekNum={weekNum} />
      )}
    </main>
  );
}

function ResetWeekToDefault({
  mesoNum,
  weekNum,
}: {
  mesoNum: number;
  weekNum: number;
}) {
  return (
    <form
      action={`/api/schedule/week?meso=${mesoNum}&week=${weekNum}`}
      method="post"
    >
      {/* Just a small JS-free fallback if we ever need it; the actual
          handler is wired up client-side in the editor. */}
    </form>
  );
}
