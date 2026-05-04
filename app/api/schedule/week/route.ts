import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Toggles a (mesoNum, weekNum, dayOfWeek, categoryId) override slot.
// On the first edit for a (mesoNum, weekNum), the current default
// schedule is copied into WeekScheduleSlot so the override starts
// from the same shape as defaults — then the toggle is applied.
//
// Subsequent toggles for the same week act on the override rows
// directly, so they don't disturb other weeks.
export async function POST(request: Request) {
  try {
    const { mesoNum, weekNum, dayOfWeek, categoryId } =
      (await request.json()) as {
        mesoNum: number;
        weekNum: number;
        dayOfWeek: number;
        categoryId: string;
      };
    if (
      typeof mesoNum !== "number" ||
      typeof weekNum !== "number" ||
      weekNum < 1 ||
      typeof dayOfWeek !== "number" ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !categoryId
    ) {
      return NextResponse.json(
        { ok: false, error: "Bad payload" },
        { status: 400 },
      );
    }

    // Copy defaults into overrides if no override rows exist for this
    // week yet.
    const existingForWeek = await prisma.weekScheduleSlot.count({
      where: { mesoNum, weekNum },
    });
    if (existingForWeek === 0) {
      const defaults = await prisma.scheduleSlot.findMany({});
      if (defaults.length > 0) {
        await prisma.weekScheduleSlot.createMany({
          data: defaults.map((s) => ({
            mesoNum,
            weekNum,
            dayOfWeek: s.dayOfWeek,
            categoryId: s.categoryId,
          })),
        });
      }
    }

    // Toggle the requested slot.
    const existing = await prisma.weekScheduleSlot.findFirst({
      where: { mesoNum, weekNum, dayOfWeek, categoryId },
    });
    if (existing) {
      await prisma.weekScheduleSlot.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, action: "removed" });
    }
    const created = await prisma.weekScheduleSlot.create({
      data: { mesoNum, weekNum, dayOfWeek, categoryId },
    });
    return NextResponse.json({ ok: true, action: "added", slot: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Reset a specific (mesoNum, weekNum) back to defaults by removing
// all override rows for it.
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const mesoNum = Number(url.searchParams.get("meso"));
    const weekNum = Number(url.searchParams.get("week"));
    if (
      !Number.isFinite(mesoNum) ||
      !Number.isFinite(weekNum) ||
      weekNum < 1
    ) {
      return NextResponse.json(
        { ok: false, error: "Provide ?meso=M&week=N" },
        { status: 400 },
      );
    }
    const result = await prisma.weekScheduleSlot.deleteMany({
      where: { mesoNum, weekNum },
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
