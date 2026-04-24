import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [userState, schedule, templates, logs] = await Promise.all([
      prisma.userState.findUnique({ where: { id: 1 } }),
      prisma.scheduleSlot.findMany({ orderBy: { dayOfWeek: "asc" } }),
      prisma.sessionTemplate.findMany({
        include: { exercises: { orderBy: { orderIndex: "asc" } } },
      }),
      prisma.sessionLog.findMany({
        include: { sets: { orderBy: { setNumber: "asc" } } },
      }),
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      userState,
      schedule,
      templates,
      logs,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="training-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
