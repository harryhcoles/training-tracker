import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Toggle a (dayOfWeek, categoryId) slot — create if missing, delete if
// present. With ScheduleSlot now allowing multiple rows per day, "Rest"
// is just the absence of any slots for that day.
export async function POST(request: Request) {
  try {
    const { dayOfWeek, categoryId } = (await request.json()) as {
      dayOfWeek: number;
      categoryId: string;
    };
    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { ok: false, error: "Invalid dayOfWeek" },
        { status: 400 },
      );
    }
    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing categoryId" },
        { status: 400 },
      );
    }

    const existing = await prisma.scheduleSlot.findFirst({
      where: { dayOfWeek, categoryId },
    });

    if (existing) {
      await prisma.scheduleSlot.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, action: "removed" });
    }

    const created = await prisma.scheduleSlot.create({
      data: { dayOfWeek, categoryId },
    });
    return NextResponse.json({ ok: true, action: "added", slot: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
