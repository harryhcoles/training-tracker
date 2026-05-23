import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { layoutCycle } from "@/lib/cycle-layout";

// Activating a programme:
// 1. Increments currentMesoNum (treats it as a new mesocycle)
// 2. Resets currentWeek to 1
// 3. Wipes existing ScheduleSlot rows
// 4. Inserts the programme's default ProgrammeSlot rows as ScheduleSlots
// 5. Sets activeProgrammeId + cycleStartedAt
// 6. For cycle-mode programmes (cycleLength != 7): pre-computes per-
//    cycle calendar-aware layouts respecting the user's constraints
//    (long ride Sat/Sun, conditioning Mon/Wed/Fri) and writes them as
//    WeekScheduleSlot rows for cycles 1..totalWeeks. The user can edit
//    these per-cycle from home → "Edit cycle N →".
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

    const cycleStart = new Date();
    const newMesoNum = userState.currentMesoNum + 1;

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
          currentMesoNum: newMesoNum,
          currentWeek: 1,
          programmeStart: cycleStart,
          cycleStartedAt: cycleStart,
        },
      }),
    ]);

    let cycleSlotsWritten = 0;
    if (programme.cycleLength !== 7) {
      // Clear any stale overrides for this meso, then pre-compute layouts
      // for every cycle of the programme based on calendar.
      await prisma.weekScheduleSlot.deleteMany({
        where: { mesoNum: newMesoNum },
      });
      for (let cycleNum = 1; cycleNum <= programme.totalWeeks; cycleNum++) {
        const cycleStartDate = new Date(cycleStart);
        cycleStartDate.setDate(
          cycleStart.getDate() + (cycleNum - 1) * programme.cycleLength,
        );
        const layout = layoutCycle(cycleStartDate, programme.cycleLength);
        const rows: Array<{
          mesoNum: number;
          weekNum: number;
          dayOfWeek: number;
          categoryId: string;
        }> = [];
        for (const day of layout) {
          for (const cat of day.categories) {
            rows.push({
              mesoNum: newMesoNum,
              weekNum: cycleNum,
              dayOfWeek: day.cycleDay,
              categoryId: cat,
            });
          }
        }
        if (rows.length > 0) {
          await prisma.weekScheduleSlot.createMany({ data: rows });
          cycleSlotsWritten += rows.length;
        }
      }
    }

    const fresh = await prisma.userState.findUnique({ where: { id: 1 } });
    return NextResponse.json({
      ok: true,
      state: fresh,
      programme,
      cycleSlotsWritten,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
