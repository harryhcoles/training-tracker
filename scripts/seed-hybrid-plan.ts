// Seeds the 12-Week Hybrid plan (strength + cycling + conditioning)
// as a new Programme with its own default schedule + 12 weeks of
// per-day templates. Idempotent by template name.
//
// Default schedule (long ride locked to Sat per the user's constraint):
//   Mon = legs (squat)
//   Tue = speed (Bike VO2 heavy / Threshold moderate)
//   Wed = chest (bench) AM + conditioning PM
//   Thu = rest
//   Fri = back (deadlift) AM + speed (Bike Threshold heavy / VO2 moderate) PM
//   Sat = endurance (long ride)
//   Sun = rest
//
// Heavy weeks: 1, 3, 5, 7, 9, 11 (low reps, high intensity)
// Moderate weeks: 2, 6, 10 (higher reps, mid intensity)
// Deload weeks: 4, 8 (light loads — moderate scheme)
// Test week: 11 (work to 3-5RM on main lifts; bike race-pace 1x45min)
// Taper week: 12 (drop volume into goal 100km ride on Sat)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROGRAMME_NAME = "Hybrid 12wk — Strength + 100km";
const PROGRAMME_DESCRIPTION =
  "12-week concurrent build: 3 strength sessions (squat / bench / deadlift focus) + 3 bike sessions (VO2 / Threshold / Long Z2) + 1 conditioning metcon. Heavy / moderate rep rotation on main lifts (1-5 reps odd weeks, 6-12 reps even weeks). Doubles on Wed (bench AM + metcon PM) and Fri (deadlift AM + bike PM). Long ride Sat. Thu + Sun rest. Build to a sub-3:30 100km on the final Sat.";

// Default schedule slots — strength categories use AM, bike/conditioning
// use PM. The app's home picker will choose templates per (week, day,
// category) so weekly progression handles itself.
const DEFAULT_SLOTS: Array<{ dayOfWeek: number; categoryId: string }> = [
  { dayOfWeek: 0, categoryId: "legs" }, // Mon AM
  { dayOfWeek: 1, categoryId: "speed" }, // Tue PM
  { dayOfWeek: 2, categoryId: "chest" }, // Wed AM
  { dayOfWeek: 2, categoryId: "conditioning" }, // Wed PM
  { dayOfWeek: 4, categoryId: "back" }, // Fri AM
  { dayOfWeek: 4, categoryId: "speed" }, // Fri PM
  { dayOfWeek: 5, categoryId: "endurance" }, // Sat
];

type Phase = "base" | "build" | "peak";
function phaseForWeek(w: number): Phase {
  if (w <= 4) return "base";
  if (w <= 8) return "build";
  return "peak";
}

const MON = 0,
  TUE = 1,
  WED = 2,
  FRI = 4,
  SAT = 5;

type Strength = {
  weekNum: number;
  dayOfWeek: number;
  category: "legs" | "chest" | "back";
  name: string;
  description: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps?: number | null;
    perSide?: boolean;
    note?: string | null;
  }>;
};

type Bike = {
  weekNum: number;
  dayOfWeek: number;
  category: "speed" | "endurance" | "conditioning";
  name: string;
  description: string;
  durationMin: number;
  focus: string;
};

// ============================================================
// SQUAT (Mon legs) — TM 80kg
// ============================================================
const SQUAT: Strength[] = [
  {
    weekNum: 1,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W1 Mon: Squat 5×5 @ 65kg",
    description:
      "Heavy week (re-acclimate). Top set RPE 7. Drop 5-10% if loads feel above RPE 8.",
    exercises: [
      { name: "Back Squat", sets: 5, reps: 5, note: "@65kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 8, note: "@70-80kg" },
      { name: "Walking Lunge", sets: 3, reps: 10, perSide: true, note: "20kg DBs" },
      { name: "Standing Calf Raise", sets: 3, reps: 15 },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W2 Mon: Squat 4×8 @ 57.5kg",
    description:
      "Moderate week (~72% TM). Higher fatigue cost — keep bar speed crisp.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, note: "@57.5kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 8, note: "@70-80kg" },
      { name: "Walking Lunge", sets: 3, reps: 10, perSide: true },
      { name: "Standing Calf Raise", sets: 3, reps: 15 },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W3 Mon: Squat 5×5 @ 70kg",
    description: "Heavy week. Should feel like RPE 7-8 on last set.",
    exercises: [
      { name: "Back Squat", sets: 5, reps: 5, note: "@70kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 8, note: "@75-85kg" },
      { name: "Walking Lunge", sets: 3, reps: 10, perSide: true },
      { name: "Standing Calf Raise", sets: 3, reps: 15 },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W4 Mon: Squat 3×8 @ 52.5kg (deload)",
    description: "Deload — light moderate-rep work. CNS recovery.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 8, note: "@52.5kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 8, note: "@65kg" },
      { name: "Walking Lunge", sets: 2, reps: 10, perSide: true },
      { name: "Standing Calf Raise", sets: 2, reps: 15 },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W5 Mon: Squat 4×5 @ 72.5kg",
    description:
      "Heavy week + pause squats. First real intensification of the build block.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 5, note: "@72.5kg" },
      { name: "Pause Squat", sets: 3, reps: 3, note: "@60kg, 2s pause in the hole" },
      { name: "Romanian Deadlift", sets: 4, reps: 6, note: "@85kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true, note: "20kg DBs" },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W6 Mon: Squat 4×8 @ 62.5kg",
    description:
      "Moderate week (~78% TM). Top end of the 6-12 zone — expect leg fatigue into Tue.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, note: "@62.5kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 6, note: "@85kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
      { name: "Pause Squat", sets: 2, reps: 5, note: "@55kg" },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W7 Mon: Squat 4×5 @ 77.5kg",
    description: "Heavy week — biggest week so far. Top set should be RPE 8.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 5, note: "@77.5kg" },
      { name: "Pause Squat", sets: 3, reps: 3, note: "@62.5kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 6, note: "@90kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W8 Mon: Squat 3×3 @ 65kg (deload)",
    description: "Deload — keep CNS primed but reduce load + volume.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "@65kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 6, note: "@70kg" },
      { name: "Bulgarian Split Squat", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W9 Mon: Squat 4×3 @ 80kg",
    description: "Peak block intensification. Triples at 100% TM.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 3, note: "@80kg, top 3 then 2×3 @ 72.5kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 5, note: "@90kg" },
      { name: "Walking Lunge", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W10 Mon: Squat 3×6 @ 67.5kg",
    description: "Moderate week within peak. Bike sessions will be the priority.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 6, note: "@67.5kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 5, note: "@92.5kg" },
      { name: "Walking Lunge", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 11,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W11 Mon: Squat test 3-5RM @ 85kg",
    description:
      "TEST. Build to 3-5RM single. Log the heaviest set in the log. Goal: 3 clean reps @ 85kg.",
    exercises: [
      {
        name: "Back Squat",
        sets: 1,
        reps: 3,
        note: "Build to 3-5RM. Target 85kg, settle for 82.5 if bar speed slows.",
      },
      { name: "Romanian Deadlift", sets: 3, reps: 5, note: "@90kg" },
      { name: "Walking Lunge", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 12,
    dayOfWeek: MON,
    category: "legs",
    name: "Hybrid W12 Mon: Squat 3×3 @ 65kg (taper)",
    description: "Taper into Sat goal ride. Light, sharp.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "@65kg, fast bar speed" },
      { name: "Romanian Deadlift", sets: 2, reps: 5, note: "@70kg, light" },
    ],
  },
];

// ============================================================
// BENCH (Wed chest) — TM 70kg
// ============================================================
const BENCH: Strength[] = [
  {
    weekNum: 1,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W1 Wed: Bench 5×5 @ 57.5kg",
    description: "Heavy week (re-acclimate). Top set RPE 7.",
    exercises: [
      { name: "Bench Press", sets: 5, reps: 5, note: "@57.5kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 5, note: "+10kg" },
      { name: "Dumbbell Overhead Press", sets: 3, reps: 8, note: "@17.5kg DBs" },
      { name: "Barbell Row", sets: 4, reps: 8, note: "@55kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W2 Wed: Bench 4×8 @ 50kg",
    description: "Moderate week (~71% TM). Hypertrophy stimulus.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, note: "@50kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 5, note: "+10kg" },
      { name: "Dumbbell Overhead Press", sets: 3, reps: 8 },
      { name: "Barbell Row", sets: 4, reps: 8, note: "@55kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W3 Wed: Bench 5×5 @ 60kg",
    description: "Heavy week.",
    exercises: [
      { name: "Bench Press", sets: 5, reps: 5, note: "@60kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 5, note: "+12.5kg" },
      { name: "Dumbbell Overhead Press", sets: 3, reps: 8 },
      { name: "Barbell Row", sets: 4, reps: 8 },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W4 Wed: Bench 3×8 @ 45kg (deload)",
    description: "Deload — light moderate work.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 8, note: "@45kg" },
      { name: "Pull-up", sets: 3, reps: 5, note: "Bodyweight" },
      { name: "Dumbbell Overhead Press", sets: 2, reps: 10 },
      { name: "Face Pull", sets: 2, reps: 15 },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W5 Wed: Bench 4×5 @ 62.5kg",
    description: "Heavy week + close-grip bench added.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 5, note: "@62.5kg" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 6, note: "@55kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 4, note: "+15kg" },
      { name: "Standing Overhead Press", sets: 4, reps: 5, note: "@42.5kg" },
      { name: "Pendlay Row", sets: 3, reps: 6, note: "@60kg" },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W6 Wed: Bench 4×8 @ 55kg",
    description: "Moderate (~78% TM).",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, note: "@55kg" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 6, note: "@55kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 4, note: "+15kg" },
      { name: "Standing Overhead Press", sets: 4, reps: 5 },
      { name: "Pendlay Row", sets: 3, reps: 6 },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W7 Wed: Bench 4×5 @ 67.5kg",
    description: "Heavy week — toward bodyweight bench.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 5, note: "@67.5kg" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 6, note: "@57.5kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 4, note: "+15kg" },
      { name: "Standing Overhead Press", sets: 4, reps: 5 },
      { name: "Pendlay Row", sets: 3, reps: 6 },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W8 Wed: Bench 3×3 @ 60kg (deload)",
    description: "Deload — light triples.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3, note: "@60kg" },
      { name: "Pull-up", sets: 3, reps: 5 },
      { name: "Standing Overhead Press", sets: 2, reps: 5 },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W9 Wed: Bench 4×3 @ 70kg",
    description: "Peak intensification. 100% TM triples.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 3, note: "@70kg" },
      { name: "Weighted Pull-up", sets: 3, reps: 3, note: "+20kg" },
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@45kg" },
      { name: "Barbell Row", sets: 3, reps: 6 },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W10 Wed: Bench 3×6 @ 60kg",
    description: "Moderate within peak. Maintenance volume.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 6, note: "@60kg" },
      { name: "Weighted Pull-up", sets: 3, reps: 3, note: "+20kg" },
      { name: "Standing Overhead Press", sets: 3, reps: 5 },
      { name: "Barbell Row", sets: 3, reps: 6 },
    ],
  },
  {
    weekNum: 11,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W11 Wed: Bench test 3-5RM @ 75kg",
    description: "TEST. Build to 3-5RM single. Goal: 3 reps @ 75kg.",
    exercises: [
      {
        name: "Bench Press",
        sets: 1,
        reps: 3,
        note: "Build to 3-5RM. Target 75kg.",
      },
      {
        name: "Weighted Pull-up",
        sets: 1,
        reps: 3,
        note: "Test +20-25kg single",
      },
      { name: "Standing Overhead Press", sets: 3, reps: 5 },
    ],
  },
  {
    weekNum: 12,
    dayOfWeek: WED,
    category: "chest",
    name: "Hybrid W12 Wed: Bench 3×3 @ 57.5kg (taper)",
    description: "Taper. Light, fast bar.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3, note: "@57.5kg" },
      { name: "Pull-up", sets: 2, reps: 5, note: "Bodyweight" },
    ],
  },
];

// ============================================================
// DEADLIFT (Fri back) — TM 110kg, lower volume on Fri to spare Sat
// ============================================================
const DEADLIFT: Strength[] = [
  {
    weekNum: 1,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W1 Fri: Deadlift 4×5 @ 90kg",
    description: "Heavy week. Fresh CNS for primary pull.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, note: "@90kg" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@55kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
      { name: "Hanging Leg Raise", sets: 3, reps: 10 },
      { name: "Pallof Press", sets: 3, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W2 Fri: Deadlift 4×8 @ 77.5kg",
    description: "Moderate week (~70% TM). 8s in deadlift are taxing — pace carefully.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 8, note: "@77.5kg" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@55kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
      { name: "Hanging Leg Raise", sets: 3, reps: 10 },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W3 Fri: Deadlift 4×5 @ 95kg",
    description: "Heavy week.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, note: "@95kg" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@57.5kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
      { name: "Hanging Leg Raise", sets: 3, reps: 10 },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W4 Fri: Deadlift 3×8 @ 70kg (deload)",
    description: "Deload. Restore tissue, low CNS draw.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 8, note: "@70kg" },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
      { name: "Pallof Press", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W5 Fri: Deadlift 4×3 @ 97.5kg",
    description:
      "Heavy week — drop reps to 3s from here. Add explosive jumps (potentiation).",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 3, note: "@97.5kg" },
      { name: "Box Jump", sets: 5, reps: 3, note: "Max height, 60s rest" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@60kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W6 Fri: Deadlift 3×8 @ 82.5kg",
    description: "Moderate week (~75% TM).",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 8, note: "@82.5kg" },
      { name: "Box Jump", sets: 4, reps: 3 },
      { name: "Front Squat", sets: 3, reps: 5 },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W7 Fri: Deadlift 4×3 @ 102.5kg",
    description: "Heavy week. Cycling test on Sat — pace deadlift carefully.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 3, note: "@102.5kg" },
      { name: "Box Jump", sets: 5, reps: 3 },
      { name: "Front Squat", sets: 3, reps: 5 },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W8 Fri: Deadlift 2×8 @ 72.5kg (deload)",
    description: "Deload. Minimal volume.",
    exercises: [
      { name: "Deadlift", sets: 2, reps: 8, note: "@72.5kg" },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W9 Fri: Deadlift 3×3 @ 105kg",
    description: "Peak block. Heavy triples + jumps.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 3, note: "@105kg" },
      { name: "Box Jump", sets: 5, reps: 3 },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W10 Fri: Deadlift 3×6 @ 87.5kg",
    description: "Moderate within peak. Drop jumps if legs heavy.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 6, note: "@87.5kg" },
      { name: "Single Leg RDL", sets: 3, reps: 6, perSide: true },
    ],
  },
  {
    weekNum: 11,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W11 Fri: Deadlift single @ 115kg test",
    description: "TEST. Build to a single @ 115kg if bar speed allows. Stop if RPE 9+.",
    exercises: [
      {
        name: "Deadlift",
        sets: 1,
        reps: 1,
        note: "Build to single. Target 115kg, drop to 110 if bar speed slows.",
      },
    ],
  },
  {
    weekNum: 12,
    dayOfWeek: FRI,
    category: "back",
    name: "Hybrid W12 Fri: Mobility only (taper)",
    description:
      "REST legs for the Sat goal ride. Mobility / hip flexors / band pull-aparts only. No deadlift.",
    exercises: [
      {
        name: "Mobility flow",
        sets: 1,
        reps: null,
        note: "15-20 min hip / hamstring / thoracic mobility. No load.",
      },
    ],
  },
];

// ============================================================
// BIKE Tue (speed) — VO2 heavy weeks / Threshold moderate weeks
// ============================================================
const BIKE_TUE: Bike[] = [
  {
    weekNum: 1,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W1 Tue: VO₂ 3×4min",
    description:
      "Heavy week. Helgerud 4×4 protocol (intro). 15min wu Z1-Z2 → 3×4min @ Z4-low Z5 (160-175 bpm) with 3min easy spin → 10min cd.",
    durationMin: 50,
    focus: "VO2max",
  },
  {
    weekNum: 2,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W2 Tue: Threshold 3×10min",
    description:
      "Moderate week — flipped order (threshold Tue, VO₂ Fri). 15min wu → 3×10min @ Z3-low Z4 (150-160 bpm) with 5min easy → 10min cd.",
    durationMin: 60,
    focus: "Threshold",
  },
  {
    weekNum: 3,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W3 Tue: VO₂ 5×4min",
    description: "Heavy week. 15min wu → 5×4min @ Z4-Z5 with 3min easy → 10min cd.",
    durationMin: 60,
    focus: "VO2max",
  },
  {
    weekNum: 4,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W4 Tue: Threshold 2×10min (deload)",
    description: "Deload — keep stimulus low. 15min wu → 2×10min @ Z3 → 10min cd.",
    durationMin: 50,
    focus: "Threshold",
  },
  {
    weekNum: 5,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W5 Tue: VO₂ 5×4min",
    description:
      "Heavy week. 15min wu → 5×4min @ Z4-Z5 (push 170+ bpm in last 30s) → 10min cd.",
    durationMin: 60,
    focus: "VO2max",
  },
  {
    weekNum: 6,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W6 Tue: Threshold 3×15min",
    description:
      "Moderate week (flipped). 15min wu → 3×15min @ Z3-Z4 (sweet spot) with 5min easy → 10min cd. Big session.",
    durationMin: 75,
    focus: "Sweetspot",
  },
  {
    weekNum: 7,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W7 Tue: VO₂ 4×5min",
    description:
      "Heavy week. Longest VO₂ intervals. 15min wu → 4×5min @ Z4-Z5 with 4min easy → 10min cd.",
    durationMin: 65,
    focus: "VO2max",
  },
  {
    weekNum: 8,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W8 Tue: Threshold 2×12min (deload)",
    description: "Deload. 15min wu → 2×12min @ Z3-low Z4 → 10min cd.",
    durationMin: 50,
    focus: "Threshold",
  },
  {
    weekNum: 9,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W9 Tue: VO₂ 5×4min",
    description:
      "Heavy week — last hard VO₂ block. 15min wu → 5×4min @ Z4-Z5 → 10min cd.",
    durationMin: 60,
    focus: "VO2max",
  },
  {
    weekNum: 10,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W10 Tue: VO₂ sharpener 4×3min",
    description:
      "Moderate week (sharpening). 15min wu → 4×3min @ high Z5 (172+ bpm) with 3min easy → 10min cd.",
    durationMin: 50,
    focus: "VO2max",
  },
  {
    weekNum: 11,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W11 Tue: VO₂ 3×3min openers",
    description:
      "Heavy week — openers, not workout. 15min wu → 3×3min @ Z5 → 10min cd.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    weekNum: 12,
    dayOfWeek: TUE,
    category: "speed",
    name: "Hybrid W12 Tue: 2×2min sharpeners (taper)",
    description:
      "Taper. 3 days out from goal ride. 15min wu → 2×2min @ race-pace surge → 10min cd. Keep it short.",
    durationMin: 35,
    focus: "Taper",
  },
];

// ============================================================
// BIKE Fri PM (speed) — Threshold heavy weeks / VO2 moderate weeks
// ============================================================
const BIKE_FRI: Bike[] = [
  {
    weekNum: 1,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W1 Fri: Threshold 3×10min",
    description:
      "Heavy week, PM session (after AM deadlift). 15min wu → 3×10min @ Z3-low Z4 with 5min easy → 10min cd.",
    durationMin: 60,
    focus: "Threshold",
  },
  {
    weekNum: 2,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W2 Fri: VO₂ 4×4min",
    description: "Moderate week (flipped). 15min wu → 4×4min @ Z4-Z5 → 10min cd.",
    durationMin: 55,
    focus: "VO2max",
  },
  {
    weekNum: 3,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W3 Fri: Threshold 2×20min sweet spot",
    description: "Heavy week. 15min wu → 2×20min @ sweet spot (Z3-Z4) → 10min cd.",
    durationMin: 75,
    focus: "Sweetspot",
  },
  {
    weekNum: 4,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W4 Fri: Easy Z2 (deload)",
    description: "Deload. 45min easy Z2 spin.",
    durationMin: 45,
    focus: "Z2",
  },
  {
    weekNum: 5,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W5 Fri: Threshold 2×20min",
    description: "Heavy week. 15min wu → 2×20min @ Z3-Z4 with 5min easy → 10min cd.",
    durationMin: 75,
    focus: "Threshold",
  },
  {
    weekNum: 6,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W6 Fri: VO₂ 6×3min",
    description: "Moderate week (flipped). 15min wu → 6×3min @ Z5 → 10min cd.",
    durationMin: 65,
    focus: "VO2max",
  },
  {
    weekNum: 7,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W7 Fri: Threshold 2×25min sweet spot",
    description: "Heavy week. Long sweet spot session. 15min wu → 2×25min → 10min cd.",
    durationMin: 80,
    focus: "Sweetspot",
  },
  {
    weekNum: 8,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W8 Fri: Easy Z2 (deload)",
    description: "Deload. 45min easy Z2.",
    durationMin: 45,
    focus: "Z2",
  },
  {
    weekNum: 9,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W9 Fri: Race-pace 2×30min",
    description:
      "Peak block specificity. 15min wu → 2×30min @ goal 100km pace (~140-150 bpm, ~30 kph effort) with 5min easy → 10min cd.",
    durationMin: 90,
    focus: "Race-pace",
  },
  {
    weekNum: 10,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W10 Fri: Race-pace 3×20min",
    description:
      "15min wu → 3×20min @ goal pace with 5min easy → 10min cd. Practice fuelling.",
    durationMin: 90,
    focus: "Race-pace",
  },
  {
    weekNum: 11,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W11 Fri: Race-pace 1×45min",
    description:
      "Final sustained block. 15min wu → 45min continuous @ goal pace → 10min cd.",
    durationMin: 75,
    focus: "Race-pace",
  },
  {
    weekNum: 12,
    dayOfWeek: FRI,
    category: "speed",
    name: "Hybrid W12 Fri: Openers 2×15min (taper)",
    description:
      "Taper. 4 days before goal ride. 15min wu → 2×15min @ Z3 openers → 10min cd.",
    durationMin: 55,
    focus: "Openers",
  },
];

// ============================================================
// LONG RIDE Sat (endurance)
// ============================================================
const BIKE_SAT: Bike[] = [
  {
    weekNum: 1,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W1 Sat: Long Z2 — 60km (~2:00)",
    description:
      "Z2 throughout (125-145 bpm). RPE 5-6/10. Don't chase speed. Eat early.",
    durationMin: 120,
    focus: "Z2",
  },
  {
    weekNum: 2,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W2 Sat: Long Z2 — 70km",
    description: "Z2 (125-145 bpm). Practice fuelling.",
    durationMin: 140,
    focus: "Z2",
  },
  {
    weekNum: 3,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W3 Sat: Long Z2 — 80km",
    description: "Z2 (125-145 bpm). Eat 60-90g carbs/hour from 20min in.",
    durationMin: 160,
    focus: "Z2",
  },
  {
    weekNum: 4,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W4 Sat: Long Z2 — 50km easy (deload)",
    description: "Deload long ride. Z1-low Z2 only. Café ride fine.",
    durationMin: 100,
    focus: "Recovery",
  },
  {
    weekNum: 5,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W5 Sat: Long Z2 — 80km",
    description: "Z2 (130-145 bpm). Last 30min lifted to high Z2 / low Z3.",
    durationMin: 165,
    focus: "Z2",
  },
  {
    weekNum: 6,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W6 Sat: Long Z2 — 90km",
    description: "Z2. Practice exact race-day breakfast + bottles.",
    durationMin: 190,
    focus: "Z2",
  },
  {
    weekNum: 7,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W7 Sat: 100km TEST ride",
    description:
      "TEST. 100km at race-pace effort. Aim 30 kph avg. Note avg HR, avg speed, last-25km HR drift. KEY DATA POINT for the rest of the plan.",
    durationMin: 200,
    focus: "Race",
  },
  {
    weekNum: 8,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W8 Sat: Long Z2 — 60km easy (deload)",
    description: "Deload. Z1-Z2 only. Recover from W7 test ride.",
    durationMin: 130,
    focus: "Recovery",
  },
  {
    weekNum: 9,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W9 Sat: 100km — first 75 Z2 / last 25 goal pace",
    description:
      "Race specificity. First 75km Z2 (130-140 bpm). Last 25km lifted to goal 30 kph pace (HR ~145-152). Full fuelling.",
    durationMin: 200,
    focus: "Race-pace",
  },
  {
    weekNum: 10,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W10 Sat: 110km — practice fuelling",
    description:
      "110km Z2 with race-day fuelling exactly as planned. Longest ride of the plan.",
    durationMin: 220,
    focus: "Z2",
  },
  {
    weekNum: 11,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W11 Sat: 80km — last 40 at goal pace (dress rehearsal)",
    description:
      "Dress rehearsal. First 40km Z2. Last 40km at goal 30 kph pace. Race kit, race bottles, race breakfast.",
    durationMin: 165,
    focus: "Race-pace",
  },
  {
    weekNum: 12,
    dayOfWeek: SAT,
    category: "endurance",
    name: "Hybrid W12 Sat: 100km GOAL RIDE",
    description:
      "RACE DAY. 100km sub-3:30 attempt (avg 28.6+ kph). Pacing: first 30km feel TOO easy, middle 40km at goal pace, last 30km empty the tank. 75-90g carbs/hr. Don't chase early speed.",
    durationMin: 210,
    focus: "Race",
  },
];

// ============================================================
// CONDITIONING Wed PM (metcon)
// ============================================================
const COND: Bike[] = [
  {
    weekNum: 1,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W1 Wed: Metcon 20min",
    description:
      'AMRAP 20: 10 cal bike + 10 KB swings @ 20kg + 10 DB step-ups (15kg each hand). Avg HR target 145-160. Spikes to Z4-Z5 in work intervals. Keep muscular load moderate.',
    durationMin: 25,
    focus: "Anaerobic",
  },
  {
    weekNum: 2,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W2 Wed: Metcon 25min",
    description:
      'EMOM 24: min 1 — 15 cal bike. min 2 — 12 wall balls @ 6kg. min 3 — 10 burpees. Repeat ×8 rounds. Avg HR 150-160.',
    durationMin: 30,
    focus: "Anaerobic",
  },
  {
    weekNum: 3,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W3 Wed: Metcon 30min",
    description:
      '5 rounds for time: 400m row + 15 air squats + 10 push press @ 30kg + 5 pull-ups. Typically 14-18min total work.',
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    weekNum: 4,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W4 Wed: Metcon 20min (deload)",
    description:
      "Deload metcon. AMRAP 15: 10 cal bike + 10 KB swings @ 16kg + 10 air squats. Avg HR ≤150. Keep load light.",
    durationMin: 25,
    focus: "Anaerobic",
  },
  {
    weekNum: 5,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W5 Wed: Metcon 30min",
    description:
      '3 rounds: 50 cal bike + 30 wall balls + 10 burpee box jumps. Rest 2min between rounds.',
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    weekNum: 6,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W6 Wed: Metcon 30min",
    description:
      "21-15-9 for time: Cal row + KB swings @ 24kg + box jumps 24\". Then 10min easy spin cd.",
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    weekNum: 7,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W7 Wed: Metcon 35min",
    description:
      'EMOM 30: min 1 — 15 cal bike. min 2 — 12 wall balls. min 3 — 10 burpees. Repeat ×10. Followed by 5min easy.',
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    weekNum: 8,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W8 Wed: Metcon 20min (deload)",
    description: "Deload. AMRAP 15 with KB 16kg + light bodyweight. Keep avg HR ≤145.",
    durationMin: 25,
    focus: "Anaerobic",
  },
  {
    weekNum: 9,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W9 Wed: Metcon 30min",
    description:
      "Peak metcon. AMRAP 20: 10 cal bike + 10 KB swings @ 24kg + 10 DB push-press @ 15kg each. Then 8min spin cd.",
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    weekNum: 10,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W10 Wed: Metcon 25min",
    description:
      "5 rounds: 30 cal bike + 15 KB swings @ 20kg + 10 burpees. Pace conservatively — Sat is 110km.",
    durationMin: 30,
    focus: "Anaerobic",
  },
  {
    weekNum: 11,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W11 Wed: Metcon 15-20min (short)",
    description:
      "Taper start. Short and sharp. AMRAP 12: 10 cal bike + 8 KB swings + 6 box jumps. Stop EARLY.",
    durationMin: 20,
    focus: "Taper",
  },
  {
    weekNum: 12,
    dayOfWeek: WED,
    category: "conditioning",
    name: "Hybrid W12 Wed: Easy aerobic 20min (taper)",
    description:
      "Taper. NO METCON 3 days before goal ride. Replace with 20min easy bike or rowing Z1-Z2. Mobility flow afterwards.",
    durationMin: 20,
    focus: "Recovery",
  },
];

const ALL_STRENGTH = [...SQUAT, ...BENCH, ...DEADLIFT];
const ALL_BIKE = [...BIKE_TUE, ...BIKE_FRI, ...BIKE_SAT, ...COND];

async function main() {
  // Upsert programme.
  const existing = await prisma.programme.findUnique({
    where: { name: PROGRAMME_NAME },
  });
  const programme = existing
    ? await prisma.programme.update({
        where: { id: existing.id },
        data: {
          description: PROGRAMME_DESCRIPTION,
          totalWeeks: 12,
          isCustom: false,
        },
      })
    : await prisma.programme.create({
        data: {
          name: PROGRAMME_NAME,
          description: PROGRAMME_DESCRIPTION,
          totalWeeks: 12,
          isCustom: false,
        },
      });
  console.log(`Programme: ${programme.name} (${programme.id})`);

  // Wipe and re-seed default slots.
  await prisma.programmeSlot.deleteMany({
    where: { programmeId: programme.id },
  });
  for (const slot of DEFAULT_SLOTS) {
    await prisma.programmeSlot.create({
      data: { ...slot, programmeId: programme.id },
    });
  }
  console.log(`Slots: ${DEFAULT_SLOTS.length} written`);

  // Strength templates with exercises.
  let strengthCreated = 0;
  let strengthUpdated = 0;
  for (const s of ALL_STRENGTH) {
    const existingT = await prisma.sessionTemplate.findFirst({
      where: { name: s.name },
    });
    if (existingT) {
      await prisma.exerciseTemplate.deleteMany({
        where: { sessionTemplateId: existingT.id },
      });
      await prisma.sessionTemplate.update({
        where: { id: existingT.id },
        data: {
          category: s.category,
          phase: phaseForWeek(s.weekNum),
          description: s.description,
          programmeId: programme.id,
          weekNum: s.weekNum,
          dayOfWeek: s.dayOfWeek,
          isCustom: false,
          exercises: {
            create: s.exercises.map((e, i) => ({
              orderIndex: i,
              name: e.name,
              sets: e.sets,
              reps: e.reps ?? null,
              perSide: e.perSide ?? false,
              note: e.note ?? null,
            })),
          },
        },
      });
      strengthUpdated++;
    } else {
      await prisma.sessionTemplate.create({
        data: {
          name: s.name,
          category: s.category,
          phase: phaseForWeek(s.weekNum),
          description: s.description,
          programmeId: programme.id,
          weekNum: s.weekNum,
          dayOfWeek: s.dayOfWeek,
          isCustom: false,
          exercises: {
            create: s.exercises.map((e, i) => ({
              orderIndex: i,
              name: e.name,
              sets: e.sets,
              reps: e.reps ?? null,
              perSide: e.perSide ?? false,
              note: e.note ?? null,
            })),
          },
        },
      });
      strengthCreated++;
    }
  }
  console.log(`Strength: ${strengthCreated} created, ${strengthUpdated} updated`);

  // Bike + conditioning templates (no exercises).
  let bikeCreated = 0;
  let bikeUpdated = 0;
  for (const b of ALL_BIKE) {
    const existingT = await prisma.sessionTemplate.findFirst({
      where: { name: b.name },
    });
    if (existingT) {
      await prisma.sessionTemplate.update({
        where: { id: existingT.id },
        data: {
          category: b.category,
          phase: phaseForWeek(b.weekNum),
          description: b.description,
          durationMin: b.durationMin,
          focus: b.focus,
          programmeId: programme.id,
          weekNum: b.weekNum,
          dayOfWeek: b.dayOfWeek,
          isCustom: false,
        },
      });
      bikeUpdated++;
    } else {
      await prisma.sessionTemplate.create({
        data: {
          name: b.name,
          category: b.category,
          phase: phaseForWeek(b.weekNum),
          description: b.description,
          durationMin: b.durationMin,
          focus: b.focus,
          programmeId: programme.id,
          weekNum: b.weekNum,
          dayOfWeek: b.dayOfWeek,
          isCustom: false,
        },
      });
      bikeCreated++;
    }
  }
  console.log(`Bike/Cond: ${bikeCreated} created, ${bikeUpdated} updated`);

  const total = ALL_STRENGTH.length + ALL_BIKE.length;
  console.log(
    `\nDone — ${total} templates total (${ALL_STRENGTH.length} strength + ${ALL_BIKE.length} bike/cond)`,
  );
  console.log(`Programme ID: ${programme.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
