import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/utils";
import LibraryItem from "@/components/library-item";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = ["legs", "chest", "back", "speed", "endurance"];

export default async function LibraryPage() {
  const templates = await prisma.sessionTemplate.findMany({
    orderBy: [{ category: "asc" }, { phase: "asc" }, { name: "asc" }],
  });

  const grouped: Record<string, typeof templates> = {};
  for (const t of templates) {
    (grouped[t.category] ??= []).push(t);
  }

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
            {templates.length} sessions
          </p>
          <h1 className="font-serif-display text-3xl font-black mt-1">
            Library
          </h1>
        </div>
        <Link
          href="/library/new"
          className="bg-stone-900 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-stone-800"
        >
          + New
        </Link>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <section key={cat} className="space-y-2">
            <h2
              className="text-xs uppercase tracking-widest font-bold"
              style={{ color: meta?.color }}
            >
              {meta?.label ?? cat}
            </h2>
            <ul className="space-y-2">
              {items.map((t) => (
                <li key={t.id}>
                  <LibraryItem
                    id={t.id}
                    name={t.name}
                    phase={t.phase}
                    durationMin={t.durationMin}
                    isCustom={t.isCustom}
                    color={meta?.color ?? "#78716c"}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
