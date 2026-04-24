import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { action } = (await request.json()) as {
      action: "next-week" | "prev-week" | "next-meso" | "reset";
    };
    const state = await prisma.userState.findUnique({ where: { id: 1 } });
    if (!state) {
      return NextResponse.json(
        { ok: false, error: "UserState missing" },
        { status: 500 },
      );
    }

    if (action === "next-week") {
      const next = Math.min(12, state.currentWeek + 1);
      await prisma.userState.update({
        where: { id: 1 },
        data: { currentWeek: next },
      });
    } else if (action === "prev-week") {
      const prev = Math.max(1, state.currentWeek - 1);
      await prisma.userState.update({
        where: { id: 1 },
        data: { currentWeek: prev },
      });
    } else if (action === "next-meso") {
      if (state.currentWeek < 12) {
        return NextResponse.json(
          { ok: false, error: "Finish week 12 first" },
          { status: 400 },
        );
      }
      await prisma.userState.update({
        where: { id: 1 },
        data: {
          currentMesoNum: state.currentMesoNum + 1,
          currentWeek: 1,
        },
      });
    } else if (action === "reset") {
      await prisma.exerciseSet.deleteMany();
      await prisma.sessionLog.deleteMany();
      await prisma.userState.update({
        where: { id: 1 },
        data: {
          currentMesoNum: 1,
          currentWeek: 1,
          programmeStart: new Date(),
        },
      });
    } else {
      return NextResponse.json(
        { ok: false, error: "Unknown action" },
        { status: 400 },
      );
    }
    const fresh = await prisma.userState.findUnique({ where: { id: 1 } });
    return NextResponse.json({ ok: true, state: fresh });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
