import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dayOfWeekMonFirst } from "@/lib/utils";
import ScheduleEditor from "@/components/schedule-editor";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const slots = await prisma.scheduleSlot.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  const today = dayOfWeekMonFirst();

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
          Weekly template
        </p>
        <h1 className="font-serif-display text-3xl font-black mt-1">
          Schedule
        </h1>
      </header>

      <ScheduleEditor
        initial={slots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          categoryId: s.categoryId,
        }))}
        today={today}
      />
    </main>
  );
}
