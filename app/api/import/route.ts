import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ImportPayload = {
  logs?: Array<{
    sessionTemplateId: string;
    mesoNum: number;
    weekNum: number;
    sessionRpe: number | null;
    notes: string | null;
    durationActualMin: number | null;
    distanceKm: number | null;
    avgHr: number | null;
    avgPower: number | null;
    loggedAt?: string;
    sets: Array<{
      exerciseName: string;
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      durationSec: number | null;
      rpe: number | null;
    }>;
  }>;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ImportPayload;

    await prisma.exerciseSet.deleteMany();
    await prisma.sessionLog.deleteMany();

    const logs = payload.logs ?? [];
    let imported = 0;
    for (const l of logs) {
      const templateExists = await prisma.sessionTemplate.findUnique({
        where: { id: l.sessionTemplateId },
      });
      if (!templateExists) continue;
      await prisma.sessionLog.create({
        data: {
          sessionTemplateId: l.sessionTemplateId,
          mesoNum: l.mesoNum,
          weekNum: l.weekNum,
          sessionRpe: l.sessionRpe,
          notes: l.notes,
          durationActualMin: l.durationActualMin,
          distanceKm: l.distanceKm,
          avgHr: l.avgHr,
          avgPower: l.avgPower,
          loggedAt: l.loggedAt ? new Date(l.loggedAt) : undefined,
          sets: {
            create: l.sets.map((s) => ({
              exerciseName: s.exerciseName,
              setNumber: s.setNumber,
              weightKg: s.weightKg,
              reps: s.reps,
              durationSec: s.durationSec,
              rpe: s.rpe,
            })),
          },
        },
      });
      imported++;
    }
    return NextResponse.json({ ok: true, imported });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
