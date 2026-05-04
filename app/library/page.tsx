import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, DAY_NAMES } from "@/lib/utils";
import ProgrammeCard from "@/components/programme-card";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [programmes, userState] = await Promise.all([
    prisma.programme.findMany({
      include: {
        scheduleSlots: {
          orderBy: [{ dayOfWeek: "asc" }, { categoryId: "asc" }],
        },
        _count: { select: { templates: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userState.findUnique({ where: { id: 1 } }),
  ]);

  const activeId = userState?.activeProgrammeId ?? null;

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-800 inline-block"
      >
        ← Back
      </Link>

      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
            Programmes
          </p>
          <h1 className="font-serif-display text-3xl font-black mt-1">
            Library
          </h1>
        </div>
        <Link
          href="/library/templates"
          className="text-xs font-semibold text-stone-500 hover:text-stone-800"
        >
          All templates →
        </Link>
      </header>

      {programmes.length === 0 ? (
        <p className="text-sm text-stone-500 bg-white rounded-xl px-4 py-3 shadow-sm">
          No programmes yet. (Custom programme creation coming later.)
        </p>
      ) : (
        <ul className="space-y-3">
          {programmes.map((p) => {
            // Group schedule slots by day so the card can display the
            // weekly shape concisely.
            const byDay: Record<number, string[]> = {};
            for (let d = 0; d < 7; d++) byDay[d] = [];
            for (const s of p.scheduleSlots) byDay[s.dayOfWeek].push(s.categoryId);
            const summary = Array.from({ length: 7 }, (_, d) => ({
              day: DAY_NAMES[d],
              cats: byDay[d],
            }));
            return (
              <li key={p.id}>
                <ProgrammeCard
                  id={p.id}
                  name={p.name}
                  description={p.description}
                  totalWeeks={p.totalWeeks}
                  templateCount={p._count.templates}
                  isActive={p.id === activeId}
                  schedule={summary.map((s) => ({
                    day: s.day,
                    cats: s.cats.map((c) => CATEGORY_META[c]?.label ?? c),
                    colors: s.cats.map((c) => CATEGORY_META[c]?.color ?? "#78716c"),
                  }))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
