// Seeds the 10-week sub-3:30 100km plan as bike SessionTemplates.
// Each session is added as a non-custom template named "Wn Day: Title"
// so they sort sensibly in the library by week. Existing bike templates
// are left alone — the user can delete the old crit-focused ones from
// the library page if they want.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Plan = {
  week: number;
  day: "Tue" | "Thu" | "Sat";
  category: "speed" | "endurance";
  phase: "base" | "build" | "peak";
  title: string;
  durationMin: number;
  focus: string;
  description: string;
};

const SESSIONS: Plan[] = [
  // Week 1 — Base Build
  {
    week: 1,
    day: "Tue",
    category: "speed",
    phase: "base",
    title: "Sweet Spot 2x15",
    durationMin: 60,
    focus: "Sweetspot",
    description:
      "15min warmup easy → 2x15min @ Sweet Spot (88-93% FTP, ~148-152 bpm) with 5min easy between → 10min cooldown. Quality > volume — if legs are blown drop to 2x12min.",
  },
  {
    week: 1,
    day: "Thu",
    category: "speed",
    phase: "base",
    title: "Steady tempo 90min",
    durationMin: 90,
    focus: "Tempo",
    description:
      "90min steady riding at high Z2/low Z3 (138-145 bpm), target ~28-29 km/h on rolling terrain. No stopping at lights if avoidable — practice continuous effort.",
  },
  {
    week: 1,
    day: "Sat",
    category: "endurance",
    phase: "base",
    title: "Long Z2 — 2hr",
    durationMin: 120,
    focus: "Z2",
    description:
      "2hr conversational pace, fully Z2 (130-140 bpm). Eat early and often — practice race fuelling at 60-90g carbs/hr.",
  },

  // Week 2 — Base Build
  {
    week: 2,
    day: "Tue",
    category: "speed",
    phase: "base",
    title: "Sweet Spot 2x18",
    durationMin: 65,
    focus: "Sweetspot",
    description:
      "15min warmup → 2x18min @ Sweet Spot (88-93% FTP, 148-152 bpm) with 5min easy between → 10min cooldown. Same effort as W1, slightly longer. Should feel hard at the end.",
  },
  {
    week: 2,
    day: "Thu",
    category: "speed",
    phase: "base",
    title: "Steady tempo 90min",
    durationMin: 90,
    focus: "Tempo",
    description:
      "90min steady, target 28-29 km/h average (138-145 bpm). Pick a route you know — chase a steady average.",
  },
  {
    week: 2,
    day: "Sat",
    category: "endurance",
    phase: "base",
    title: "Long Z2 — 2.5hr",
    durationMin: 150,
    focus: "Z2",
    description:
      "2.5hr conversational Z2 (130-140 bpm). Bring 2 bottles + 3 gels minimum.",
  },

  // Week 3 — Base Build / Test Week
  {
    week: 3,
    day: "Tue",
    category: "speed",
    phase: "base",
    title: "Sweet Spot 3x12",
    durationMin: 70,
    focus: "Sweetspot",
    description:
      "15min warmup → 3x12min @ Sweet Spot (148-152 bpm) with 4min easy between → 10min cooldown. Higher density of work. Last interval should be a fight.",
  },
  {
    week: 3,
    day: "Thu",
    category: "speed",
    phase: "base",
    title: "30km Benchmark TT",
    durationMin: 75,
    focus: "Threshold",
    description:
      "CRITICAL DATA POINT. 20min warmup → 30km flat continuous at perceived 100k race pace → 10min cooldown. Goal: avg ≥28.6 km/h. Log avg HR + avg speed in app — this calibrates the rest of the plan.",
  },
  {
    week: 3,
    day: "Sat",
    category: "endurance",
    phase: "base",
    title: "Long Z2 — 3hr",
    durationMin: 180,
    focus: "Z2",
    description:
      "3hr Z2 conversational (130-140 bpm). Last 20min lift to high Z2/low Z3 if legs feel good.",
  },

  // Week 4 — Recovery
  {
    week: 4,
    day: "Tue",
    category: "endurance",
    phase: "base",
    title: "Easy spin 60min",
    durationMin: 60,
    focus: "Recovery",
    description:
      "60min Z1/Z2 very easy (120-135 bpm). Legs should feel fresher by end. Spin, don't grind.",
  },
  {
    week: 4,
    day: "Thu",
    category: "endurance",
    phase: "base",
    title: "Easy spin 60min",
    durationMin: 60,
    focus: "Recovery",
    description:
      "60min easy Z2 (125-138 bpm). Skip if fatigued — recovery is the work this week.",
  },
  {
    week: 4,
    day: "Sat",
    category: "endurance",
    phase: "base",
    title: "Easy long ride 90min",
    durationMin: 90,
    focus: "Z2",
    description:
      "90min easy Z2 (130-140 bpm). No time pressure. Café ride is fine.",
  },

  // Week 5 — Threshold Block
  {
    week: 5,
    day: "Tue",
    category: "speed",
    phase: "build",
    title: "Threshold 2x15",
    durationMin: 65,
    focus: "Threshold",
    description:
      "15min warmup → 2x15min @ Threshold (95-100% FTP, 152-160 bpm) with 8min easy between → 10min cooldown. Headline session. Brutal but biggest fitness driver. If legs day was Mon, swap to Wed.",
  },
  {
    week: 5,
    day: "Thu",
    category: "speed",
    phase: "build",
    title: "Goal-pace 3x10",
    durationMin: 105,
    focus: "Race-pace",
    description:
      "20min warmup → 3x10min at goal race pace (target 29-30 km/h, 145-152 bpm) with 5min easy between → 30min steady Z2 → 10min cooldown. Rolling terrain ideal. Practice holding pace on small rises.",
  },
  {
    week: 5,
    day: "Sat",
    category: "endurance",
    phase: "build",
    title: "Long Z2 — 3hr",
    durationMin: 180,
    focus: "Z2",
    description:
      "3hr Z2 conversational (130-145 bpm), last 30min lifted to tempo if legs allow. Practice race-day breakfast and bottle strategy.",
  },

  // Week 6 — Threshold Block
  {
    week: 6,
    day: "Tue",
    category: "speed",
    phase: "build",
    title: "Threshold 2x18",
    durationMin: 70,
    focus: "Threshold",
    description:
      "15min warmup → 2x18min @ Threshold (152-160 bpm) with 8min easy between → 10min cooldown. Same intensity, longer duration. Pace it — don't blow the second one.",
  },
  {
    week: 6,
    day: "Thu",
    category: "speed",
    phase: "build",
    title: "Goal-pace 3x12",
    durationMin: 110,
    focus: "Race-pace",
    description:
      "20min warmup → 3x12min at goal race pace with 5min easy between → 25min steady Z2 → 10min cooldown. Aim for 29.5-30 km/h. Builds confidence in the target pace.",
  },
  {
    week: 6,
    day: "Sat",
    category: "endurance",
    phase: "build",
    title: "Long Z2 — 3.5hr",
    durationMin: 210,
    focus: "Z2",
    description:
      "3.5hr Z2 (130-145 bpm), last 45min lifted to tempo. Closest you've been to race duration. Trust the fuelling plan.",
  },

  // Week 7 — Threshold Block / Peak
  {
    week: 7,
    day: "Tue",
    category: "speed",
    phase: "build",
    title: "Threshold 2x20",
    durationMin: 75,
    focus: "Threshold",
    description:
      "15min warmup → 2x20min @ Threshold (152-160 bpm) with 10min easy between → 10min cooldown. The classic 2x20. If you nail this you'll nail the 100k. Go in fresh.",
  },
  {
    week: 7,
    day: "Thu",
    category: "speed",
    phase: "build",
    title: "Sustained 2x20 race pace",
    durationMin: 110,
    focus: "Race-pace",
    description:
      "20min warmup → 2x20min at goal race pace (145-152 bpm) with 8min easy between → 20min steady Z2 → 10min cooldown. Closest race simulation yet.",
  },
  {
    week: 7,
    day: "Sat",
    category: "endurance",
    phase: "build",
    title: "Long Z2 — 4hr",
    durationMin: 240,
    focus: "Z2",
    description:
      "4hr Z2 with last 60min lifted to tempo / high Z3 (130-148 bpm). Above race duration. If you can do this comfortably the 100k is in the bag. Full race fuelling.",
  },

  // Week 8 — Recovery
  {
    week: 8,
    day: "Tue",
    category: "endurance",
    phase: "build",
    title: "Easy spin 60min",
    durationMin: 60,
    focus: "Recovery",
    description:
      "60min Z1/Z2 easy (120-135 bpm). Legs may feel awful early in the week — that's normal.",
  },
  {
    week: 8,
    day: "Thu",
    category: "speed",
    phase: "build",
    title: "Easy + 3 short openers",
    durationMin: 70,
    focus: "Openers",
    description:
      "60min easy Z2 + 3x1min @ threshold spaced through the ride. Mostly 130-140 bpm with brief spikes to 155+. Keeps top end alive without taxing recovery.",
  },
  {
    week: 8,
    day: "Sat",
    category: "endurance",
    phase: "build",
    title: "Easy long ride 90min",
    durationMin: 90,
    focus: "Z2",
    description:
      "90min Z2 easy (130-140 bpm). By Sunday you should feel snappy. If not, take Mon W9 fully off too.",
  },

  // Week 9 — Sharpening
  {
    week: 9,
    day: "Tue",
    category: "speed",
    phase: "peak",
    title: "VO2 4x6",
    durationMin: 65,
    focus: "VO2max",
    description:
      "20min warmup → 4x6min @ VO2 (105-115% FTP, push to 160+ bpm) with 4min easy between → 10min cooldown. Sharpens top end so threshold feels easy. Painful but short.",
  },
  {
    week: 9,
    day: "Thu",
    category: "speed",
    phase: "peak",
    title: "Goal-pace 60min",
    durationMin: 90,
    focus: "Race-pace",
    description:
      "20min warmup → 60min continuous at goal race pace (28.6+ km/h on rolling terrain, no stops, 145-152 bpm) → 10min cooldown. Final pace check. Should feel solid, not desperate.",
  },
  {
    week: 9,
    day: "Sat",
    category: "endurance",
    phase: "peak",
    title: "80km dress rehearsal",
    durationMin: 165,
    focus: "Race",
    description:
      "THE benchmark ride. 80km continuous at goal race pace, full race fuelling and pacing (145-152 bpm avg). If you average 28.6+ km/h here, the 100k attempt is on. Use exact race kit, bottles, gels, route style.",
  },

  // Week 10 — Taper + Test
  {
    week: 10,
    day: "Tue",
    category: "speed",
    phase: "peak",
    title: "Short threshold openers",
    durationMin: 50,
    focus: "Threshold",
    description:
      "15min warmup → 3x5min @ threshold (152-160 bpm) with 5min easy between → 10min cooldown. Short and sharp. Keeps the engine primed without fatigue.",
  },
  {
    week: 10,
    day: "Thu",
    category: "speed",
    phase: "peak",
    title: "Pre-test spin + openers",
    durationMin: 60,
    focus: "Taper",
    description:
      "45min Z2 + 3x2min @ race pace + 10min easy. Mostly 130-140 bpm. Legs should feel ready to fire. Eat well, hydrate, sleep.",
  },
  {
    week: 10,
    day: "Sat",
    category: "endurance",
    phase: "peak",
    title: "100km sub-3:30 attempt",
    durationMin: 210,
    focus: "Race",
    description:
      "RACE DAY. 100km continuous at goal pace. Target avg ≥28.6 km/h, HR 145-155 bpm sustained. Pacing: first 30km feel TOO easy (28-29 km/h), middle 40km sit at 29-30 km/h, last 30km empty the tank. Eat 60-90g carbs/hr from 20min in. Don't chase early speed.",
  },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const s of SESSIONS) {
    const name = `W${s.week} ${s.day}: ${s.title}`;
    const existing = await prisma.sessionTemplate.findFirst({
      where: { name },
    });
    if (existing) {
      await prisma.sessionTemplate.update({
        where: { id: existing.id },
        data: {
          category: s.category,
          phase: s.phase,
          description: s.description,
          durationMin: s.durationMin,
          focus: s.focus,
          isCustom: false,
        },
      });
      skipped++;
      console.log(`Updated: ${name}`);
      continue;
    }
    await prisma.sessionTemplate.create({
      data: {
        name,
        category: s.category,
        phase: s.phase,
        description: s.description,
        durationMin: s.durationMin,
        focus: s.focus,
        isCustom: false,
      },
    });
    created++;
    console.log(`Created: ${name}`);
  }
  console.log(`\nDone — ${created} created, ${skipped} updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
