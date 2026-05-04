import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Activating a programme:
// 1. Increments currentMesoNum (treats it as a new mesocycle)
// 2. Resets currentWeek to 1
// 3. Wipes existing ScheduleSlot rows
// 4. Inserts the programme's default ProgrammeSlot rows as ScheduleSlots
// 5. Sets activeProgrammeId
// SessionLog rows are preserved — they reference templates by ID, and
// activation doesn't touch templates.
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

    const userState = await prisma.userState.findUnique({ where: { id: 1 } });
    if (!userState) {
      return NextResponse.json(
        { ok: false, error: "UserState missing" },
        { status: 500 },
      );
    }

    await prisma.$transaction([
      prisma.scheduleSlot.deleteMany({}),
      prisma.scheduleSlot.createMany({
        data: programme.scheduleSlots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          categoryId: s.categoryId,
        })),
      }),
      prisma.userState.update({
        where: { id: 1 },
        data: {
          activeProgrammeId: programme.id,
          currentMesoNum: userState.currentMesoNum + 1,
          currentWeek: 1,
          programmeStart: new Date(),
        },
      }),
    ]);

    const fresh = await prisma.userState.findUnique({ where: { id: 1 } });
    return NextResponse.json({ ok: true, state: fresh, programme });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
