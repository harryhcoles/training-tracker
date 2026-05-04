import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const programmes = await prisma.programme.findMany({
      include: {
        scheduleSlots: { orderBy: [{ dayOfWeek: "asc" }, { categoryId: "asc" }] },
        _count: { select: { templates: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const userState = await prisma.userState.findUnique({ where: { id: 1 } });
    return NextResponse.json({
      ok: true,
      activeProgrammeId: userState?.activeProgrammeId ?? null,
      programmes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
