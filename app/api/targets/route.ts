import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { squatTarget, benchTarget, deadliftTarget } =
      (await request.json()) as {
        squatTarget?: number;
        benchTarget?: number;
        deadliftTarget?: number;
      };
    const data: Record<string, number> = {};
    if (typeof squatTarget === "number") data.squatTarget = squatTarget;
    if (typeof benchTarget === "number") data.benchTarget = benchTarget;
    if (typeof deadliftTarget === "number") data.deadliftTarget = deadliftTarget;
    const updated = await prisma.userState.update({
      where: { id: 1 },
      data,
    });
    return NextResponse.json({ ok: true, state: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
