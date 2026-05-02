import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingSet = {
  exerciseName: string;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  rpe: number | null;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      sessionTemplateId,
      mesoNum,
      weekNum,
      sessionRpe,
      notes,
      durationActualMin,
      distanceKm,
      avgHr,
      avgPower,
      sets,
    } = data as {
      sessionTemplateId: string;
      mesoNum: number;
      weekNum: number;
      sessionRpe: number | null;
      notes: string | null;
      durationActualMin: number | null;
      distanceKm: number | null;
      avgHr: number | null;
      avgPower: number | null;
      sets: IncomingSet[] | null;
    };

    if (!sessionTemplateId || !mesoNum || !weekNum) {
      return NextResponse.json(
        { ok: false, error: "Missing sessionTemplateId / mesoNum / weekNum" },
        { status: 400 },
      );
    }

    const setRows = (sets ?? []).map((s, i) => ({
      exerciseName: s.exerciseName,
      setNumber: i + 1,
      weightKg: s.weightKg,
      reps: s.reps,
      durationSec: s.durationSec,
      rpe: s.rpe,
    }));

    // Upsert key is (template, today's date) so logging the same template
    // twice in a week (e.g. Bench on Wed and again on Sat) creates two
    // separate logs. Re-saving the same day's log just updates it.
    const now = new Date();
    const existing = await prisma.sessionLog.findFirst({
      where: {
        sessionTemplateId,
        loggedAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    });

    if (existing) {
      await prisma.exerciseSet.deleteMany({
        where: { sessionLogId: existing.id },
      });
      const updated = await prisma.sessionLog.update({
        where: { id: existing.id },
        data: {
          sessionRpe,
          notes,
          durationActualMin,
          distanceKm,
          avgHr,
          avgPower,
          sets: { create: setRows },
        },
        include: { sets: true },
      });
      return NextResponse.json({ ok: true, log: updated });
    }

    const created = await prisma.sessionLog.create({
      data: {
        sessionTemplateId,
        mesoNum,
        weekNum,
        sessionRpe,
        notes,
        durationActualMin,
        distanceKm,
        avgHr,
        avgPower,
        sets: { create: setRows },
      },
      include: { sets: true },
    });
    return NextResponse.json({ ok: true, log: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
