import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, DAY_NAMES, dayOfWeekMonFirst } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [userState, schedule, templates] = await Promise.all([
    prisma.userState.findUnique({ where: { id: 1 } }),
    prisma.scheduleSlot.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.sessionTemplate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const today = dayOfWeekMonFirst();
  const todaySlot = schedule.find((s) => s.dayOfWeek === today);
  const todayCategory = todaySlot?.categoryId ?? null;

  const todayTemplate = todayCategory
    ? templates.find(
        (t) => t.category === todayCategory && t.phase === "base",
      ) ?? templates.find((t) => t.category === todayCategory) ?? null
    : null;

  const meta = todayCategory ? CATEGORY_META[todayCategory] : null;

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <header className="pt-2">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
          Crit Programme · 12wk
        </p>
        <h1 className="font-serif-display text-4xl font-black mt-1">
          Training Log
        </h1>
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
            </p>
            <Link
              href={`/session/${todayTemplate.id}`}
              className="mt-4 inline-block bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Start session →
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

      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-widest text-stone-500">
            Current week
          </p>
          <p className="font-serif-display text-2xl font-black">
            {userState?.currentWeek ?? 1}
            <span className="text-stone-400 text-base">/12</span>
          </p>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Mesocycle {userState?.currentMesoNum ?? 1}
        </p>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-3">
          All sessions
        </h3>
        <ul className="space-y-2">
          {templates.map((t) => {
            const m = CATEGORY_META[t.category];
            return (
              <li key={t.id}>
                <Link
                  href={`/session/${t.id}`}
                  className="block bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {m?.label ?? t.category} · {t.phase}
                        {t.durationMin ? ` · ${t.durationMin}min` : ""}
                      </p>
                    </div>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: m?.color ?? "#78716c" }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
