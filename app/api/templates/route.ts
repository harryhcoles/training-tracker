import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingExercise = {
  name: string;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  perSide: boolean;
  note: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      category: string;
      phase: string;
      name: string;
      description: string | null;
      durationMin: number | null;
      focus: string | null;
      exercises: IncomingExercise[];
    };
    const { category, phase, name, description, durationMin, focus, exercises } =
      body;

    if (!category || !phase || !name) {
      return NextResponse.json(
        { ok: false, error: "Missing category / phase / name" },
        { status: 400 },
      );
    }

    const isBike = category === "speed" || category === "endurance";

    const created = await prisma.sessionTemplate.create({
      data: {
        category,
        phase,
        name,
        description,
        durationMin: isBike ? durationMin : null,
        focus: isBike ? focus : null,
        isCustom: true,
        exercises: isBike
          ? undefined
          : {
              create: (exercises ?? []).map((e, i) => ({
                orderIndex: i,
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                durationSec: e.durationSec,
                perSide: e.perSide,
                note: e.note,
              })),
            },
      },
    });
    return NextResponse.json({ ok: true, template: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string };
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 },
      );
    }
    const tmpl = await prisma.sessionTemplate.findUnique({ where: { id } });
    if (!tmpl) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
      );
    }
    if (!tmpl.isCustom) {
      return NextResponse.json(
        { ok: false, error: "Cannot delete built-in templates" },
        { status: 400 },
      );
    }
    await prisma.sessionLog.deleteMany({ where: { sessionTemplateId: id } });
    await prisma.sessionTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
