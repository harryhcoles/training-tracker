import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { dayOfWeek, categoryId } = (await request.json()) as {
      dayOfWeek: number;
      categoryId: string | null;
    };
    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { ok: false, error: "Invalid dayOfWeek" },
        { status: 400 },
      );
    }
    const updated = await prisma.scheduleSlot.upsert({
      where: { dayOfWeek },
      update: { categoryId },
      create: { dayOfWeek, categoryId },
    });
    return NextResponse.json({ ok: true, slot: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
