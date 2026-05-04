import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Hard reset: wipes all per-week overrides AND replaces the global
// ScheduleSlot rows with the programme's ProgrammeSlot defaults.
// After this the user is back to as-activated state without changing
// currentWeek / currentMesoNum.
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const programme = await prisma.programme.findUnique({
      where: { id },
      include: { scheduleSlots: true },
    });
    if (!programme) {
      return NextResponse.json(
        { ok: false, error: "Programme not found" },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.weekScheduleSlot.deleteMany({}),
      prisma.scheduleSlot.deleteMany({}),
      prisma.scheduleSlot.createMany({
        data: programme.scheduleSlots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          categoryId: s.categoryId,
        })),
      }),
    ]);

    return NextResponse.json({
      ok: true,
      restoredSlots: programme.scheduleSlots.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
