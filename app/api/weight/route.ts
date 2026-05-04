import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weeks = Math.max(
      1,
      Math.min(52, Number(url.searchParams.get("weeks") ?? "12")),
    );
    const since = new Date(Date.now() - weeks * 7 * 86400_000);
    const entries = await prisma.weightEntry.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
      select: { id: true, date: true, weightKg: true, notes: true },
    });
    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: string;
      weightKg?: number;
      notes?: string | null;
      overwrite?: boolean;
    };
    const { weightKg, notes } = body;
    if (typeof weightKg !== "number" || weightKg < 40 || weightKg > 150) {
      return NextResponse.json(
        { ok: false, error: "weightKg must be 40-150" },
        { status: 400 },
      );
    }
    const date = body.date ? new Date(body.date) : new Date();
    if (date.getTime() > Date.now() + 60_000) {
      return NextResponse.json(
        { ok: false, error: "Date cannot be in the future" },
        { status: 400 },
      );
    }
    const dayKey = startOfDay(date);

    const existing = await prisma.weightEntry.findUnique({
      where: { date: dayKey },
    });
    if (existing && !body.overwrite) {
      return NextResponse.json(
        {
          ok: false,
          error: "Entry exists for this day",
          existing: { id: existing.id, weightKg: existing.weightKg },
        },
        { status: 409 },
      );
    }
    const entry = existing
      ? await prisma.weightEntry.update({
          where: { id: existing.id },
          data: { weightKg, notes: notes ?? null },
        })
      : await prisma.weightEntry.create({
          data: { date: dayKey, weightKg, notes: notes ?? null },
        });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
