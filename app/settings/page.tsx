import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isStravaConfigured } from "@/lib/strava";
import SettingsForm from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const state = await prisma.userState.findUnique({ where: { id: 1 } });
  if (!state) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6">
        <p>UserState missing — run seed.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-800 inline-block"
      >
        ← Back
      </Link>
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
          Programme controls
        </p>
        <h1 className="font-serif-display text-3xl font-black mt-1">
          Settings
        </h1>
      </header>
      <SettingsForm
        initial={{
          squatTarget: state.squatTarget,
          benchTarget: state.benchTarget,
          deadliftTarget: state.deadliftTarget,
          currentMesoNum: state.currentMesoNum,
          currentWeek: state.currentWeek,
        }}
        stravaConfigured={isStravaConfigured()}
      />
    </main>
  );
}
