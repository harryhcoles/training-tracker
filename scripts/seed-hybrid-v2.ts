// Hybrid v2 — drop-in 7-day weekly replacement for the 10-cycle plan.
// Same loads, same progression, accessories trimmed and remapped per
// the user's v2 spec.
//
// Weekly template:
//   Mon  legs (Squat) + conditioning (Metcon ≤15min hard)
//   Tue  chest (Bench) + speed (Z2 ride 60-75min)
//   Wed  speed (Hard bike — VO2 / Threshold per week)
//   Thu  back (Deadlift)
//   Fri  back (OHP + Weighted Pull)
//   Sat  endurance (Long ride — A session)
//   Sun  REST

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const PROGRAMME_NAME = "Hybrid 12wk — Strength + 100km";
const PROGRAMME_DESC =
  "10-week 7-day hybrid plan v2. Mon squat + ≤15min metcon. Tue Z2 ride + bench. Wed hard bike. Thu deadlift. Fri OHP + weighted pull. Sat long ride (A session). Sun rest. Two true hard days (Mon metcon + Wed bike); long ride locked to Sat. Trimmed accessories: BSS + hip thrust on squat day; SL-RDL + step-up (or box jump heavy weeks) on deadlift day. Explosive concentric intent on heavy weeks 1, 4, 7.";

const SCHEDULE_SLOTS: Array<{ dayOfWeek: number; categoryId: string }> = [
  { dayOfWeek: 0, categoryId: "legs" }, // Mon Squat
  { dayOfWeek: 0, categoryId: "conditioning" }, // Mon Metcon
  { dayOfWeek: 1, categoryId: "chest" }, // Tue Bench
  { dayOfWeek: 1, categoryId: "speed" }, // Tue Z2 ride
  { dayOfWeek: 2, categoryId: "speed" }, // Wed hard bike
  { dayOfWeek: 3, categoryId: "back" }, // Thu Deadlift
  { dayOfWeek: 4, categoryId: "back" }, // Fri OHP+Pull
  { dayOfWeek: 5, categoryId: "endurance" }, // Sat Long ride
];

const MON = 0,
  TUE = 1,
  WED = 2,
  THU = 3,
  FRI = 4,
  SAT = 5;

type StrengthEx = {
  name: string;
  sets: number;
  reps?: number | null;
  perSide?: boolean;
  note?: string | null;
};
type StrengthT = {
  weekNum: number;
  dayOfWeek: number;
  category: "legs" | "chest" | "back";
  name: string;
  description: string;
  exercises: StrengthEx[];
};
type BikeT = {
  weekNum: number;
  dayOfWeek: number;
  category: "speed" | "endurance" | "conditioning";
  name: string;
  description: string;
  durationMin: number;
  focus: string;
};

function phaseForWeek(w: number): "base" | "build" | "peak" {
  if (w <= 3) return "base";
  if (w <= 6) return "build";
  return "peak";
}

// ============================================================
// SQUAT DAY (Mon)
// Heavy weeks 1, 4, 7 carry explosive-intent cue.
// ============================================================
const EXPL = "EXPLOSIVE INTENT — drive every concentric up as fast as you can, control the lowering.";

const SQUAT: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: MON,
    category: "legs",
    name: "W1 Mon: Squat 5×5 @ 65kg",
    description: "Heavy intro. " + EXPL,
    exercises: [
      { name: "Back Squat", sets: 5, reps: 5, note: "@65kg · EXPLOSIVE concentric" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true, note: "DBs" },
      { name: "Barbell Hip Thrust", sets: 3, reps: 10, note: "off bench" },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: MON,
    category: "legs",
    name: "W2 Mon: Squat 3×5 @ 60kg (deload)",
    description: "Relaxed deload. Pulled forward to match the fatigue you're carrying in.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 5, note: "@60kg" },
      { name: "Bulgarian Split Squat", sets: 2, reps: 8, perSide: true },
      { name: "Barbell Hip Thrust", sets: 2, reps: 10 },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: MON,
    category: "legs",
    name: "W3 Mon: Squat 4×8 @ 57.5kg",
    description: "Moderate. Controlled tempo, top set RPE 7-8.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, note: "@57.5kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
      { name: "Barbell Hip Thrust", sets: 3, reps: 10 },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: MON,
    category: "legs",
    name: "W4 Mon: Squat 4×5 @ 72.5kg + pause",
    description: "Heavy build with pause squats. " + EXPL + " If a rep slows, rack it and reset.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 5, note: "@72.5kg · EXPLOSIVE concentric" },
      { name: "Pause Squat", sets: 3, reps: 3, note: "@60kg · 2s pause in hole" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
      { name: "Barbell Hip Thrust", sets: 3, reps: 10 },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: MON,
    category: "legs",
    name: "W5 Mon: Squat 4×8 @ 62.5kg",
    description: "Moderate build. Top of moderate zone — bar speed crisp.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, note: "@62.5kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
      { name: "Barbell Hip Thrust", sets: 3, reps: 10 },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: MON,
    category: "legs",
    name: "W6 Mon: Squat 3×3 @ 65kg (deload)",
    description: "Deload triples. Light, restorative.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "@65kg" },
      { name: "Bulgarian Split Squat", sets: 2, reps: 8, perSide: true },
      { name: "Barbell Hip Thrust", sets: 2, reps: 10 },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: MON,
    category: "legs",
    name: "W7 Mon: Squat 4×3 @ 80kg (100% TM)",
    description:
      "PEAK. 100% TM triples — pure rate-of-force-development. " +
      EXPL +
      " This is the adaptation that transfers to the pedal stroke.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 3, note: "@80kg · MAX CONCENTRIC velocity" },
      { name: "Bulgarian Split Squat", sets: 2, reps: 8, perSide: true },
      { name: "Barbell Hip Thrust", sets: 2, reps: 10 },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: MON,
    category: "legs",
    name: "W8 Mon: Squat 3×6 @ 67.5kg",
    description: "Moderate peak — sharpen. Volume light to keep legs for bike.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 6, note: "@67.5kg" },
      { name: "Bulgarian Split Squat", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: MON,
    category: "legs",
    name: "W9 Mon: Squat test 3-5RM @ 85kg",
    description: "TEST. Build to 3-5RM single. Goal: 3 clean reps @ 85kg. Drive every rep fast.",
    exercises: [
      { name: "Back Squat", sets: 1, reps: 3, note: "Build to 3-5RM, target 85kg" },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: MON,
    category: "legs",
    name: "W10 Mon: Squat 3×3 @ 65kg (taper, fast)",
    description: "Taper. Light, fast bar speed. Goal ride 5 days away.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "@65kg · fast bar" },
    ],
  },
];

// ============================================================
// BENCH DAY (Tue) — paired with Tue Z2 ride
// ============================================================
const BENCH: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: TUE,
    category: "chest",
    name: "W1 Tue: Bench 5×5 @ 57.5kg",
    description: "Heavy intro. " + EXPL,
    exercises: [
      { name: "Bench Press", sets: 5, reps: 5, note: "@57.5kg · EXPLOSIVE concentric" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: TUE,
    category: "chest",
    name: "W2 Tue: Bench 3×5 @ 50kg (deload)",
    description: "Deload.",
    exercises: [{ name: "Bench Press", sets: 3, reps: 5, note: "@50kg" }],
  },
  {
    weekNum: 3,
    dayOfWeek: TUE,
    category: "chest",
    name: "W3 Tue: Bench 4×8 @ 50kg",
    description: "Moderate. Controlled tempo.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, note: "@50kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: TUE,
    category: "chest",
    name: "W4 Tue: Bench 4×5 @ 62.5kg + CG",
    description: "Heavy build + close-grip. " + EXPL,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 5, note: "@62.5kg · EXPLOSIVE concentric" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 6, note: "@55kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: TUE,
    category: "chest",
    name: "W5 Tue: Bench 4×8 @ 55kg",
    description: "Moderate build.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, note: "@55kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: TUE,
    category: "chest",
    name: "W6 Tue: Bench 3×3 @ 60kg (deload)",
    description: "Deload triples.",
    exercises: [{ name: "Bench Press", sets: 3, reps: 3, note: "@60kg" }],
  },
  {
    weekNum: 7,
    dayOfWeek: TUE,
    category: "chest",
    name: "W7 Tue: Bench 4×3 @ 70kg (100% TM)",
    description: "PEAK. " + EXPL,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 3, note: "@70kg · MAX CONCENTRIC velocity" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: TUE,
    category: "chest",
    name: "W8 Tue: Bench 3×6 @ 60kg",
    description: "Moderate peak — maintenance.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 6, note: "@60kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: TUE,
    category: "chest",
    name: "W9 Tue: Bench test 3-5RM @ 75kg",
    description: "TEST. Build to 3-5RM. Target 3 reps @ 75kg.",
    exercises: [
      { name: "Bench Press", sets: 1, reps: 3, note: "Build to 3-5RM, target 75kg" },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: TUE,
    category: "chest",
    name: "W10 Tue: Bench 3×3 @ 57.5kg (taper, fast)",
    description: "Taper. Light, fast bar.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3, note: "@57.5kg · fast bar" },
    ],
  },
];

// ============================================================
// DEADLIFT DAY (Thu)
// Box Jump on heavy weeks (1, 4, 7); DB Step-up otherwise.
// ============================================================
const DEADLIFT: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: THU,
    category: "back",
    name: "W1 Thu: Deadlift 4×5 @ 90kg",
    description: "Heavy intro. " + EXPL,
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, note: "@90kg · EXPLOSIVE concentric" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true, note: "DBs" },
      { name: "Box Jump", sets: 5, reps: 3, note: "Max height, 60s rest · RFD" },
      { name: "Pallof Press", sets: 3, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: THU,
    category: "back",
    name: "W2 Thu: Deadlift 3×5 @ 75kg (deload)",
    description: "Deload. Light pull.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 5, note: "@75kg" },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
      { name: "DB Step-up", sets: 2, reps: 8, perSide: true },
      { name: "Pallof Press", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: THU,
    category: "back",
    name: "W3 Thu: Deadlift 4×8 @ 77.5kg",
    description: "Moderate. 8s in DL are taxing — pace.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 8, note: "@77.5kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
      { name: "DB Step-up", sets: 3, reps: 8, perSide: true },
      { name: "Pallof Press", sets: 3, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: THU,
    category: "back",
    name: "W4 Thu: Deadlift 4×3 @ 97.5kg + jumps",
    description: "Heavy build. Triples + jumps for potentiation. " + EXPL,
    exercises: [
      { name: "Deadlift", sets: 4, reps: 3, note: "@97.5kg · EXPLOSIVE concentric" },
      { name: "Box Jump", sets: 5, reps: 3, note: "Max height, 60s rest" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
      { name: "Pallof Press", sets: 3, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: THU,
    category: "back",
    name: "W5 Thu: Deadlift 3×8 @ 82.5kg",
    description: "Moderate build.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 8, note: "@82.5kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
      { name: "DB Step-up", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: THU,
    category: "back",
    name: "W6 Thu: Deadlift 2×8 @ 72.5kg (deload)",
    description: "Deload — minimal volume.",
    exercises: [
      { name: "Deadlift", sets: 2, reps: 8, note: "@72.5kg" },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
      { name: "DB Step-up", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: THU,
    category: "back",
    name: "W7 Thu: Deadlift 3×3 @ 105kg + jumps",
    description:
      "PEAK. 100% TM triples. " +
      EXPL +
      " The test ride is Sat — pace this carefully, save legs.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 3, note: "@105kg · MAX CONCENTRIC" },
      { name: "Box Jump", sets: 5, reps: 3 },
      { name: "Pallof Press", sets: 3, reps: 10, perSide: true },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: THU,
    category: "back",
    name: "W8 Thu: Deadlift 3×6 @ 87.5kg",
    description: "Moderate peak. 110km Z2 ride looms Sat.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 6, note: "@87.5kg" },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: THU,
    category: "back",
    name: "W9 Thu: Deadlift single @ 115kg test",
    description: "TEST. Build to single. Target 115kg. STOP if RPE 9+ — save legs for dress rehearsal Sat.",
    exercises: [
      { name: "Deadlift", sets: 1, reps: 1, note: "Build to single, target 115kg" },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: THU,
    category: "back",
    name: "W10 Thu: Mobility only (no DL — protect goal ride)",
    description: "REST legs for goal ride. Mobility flow only. No deadlift this week.",
    exercises: [
      { name: "Mobility flow", sets: 1, reps: null, note: "15-20 min hip / hamstring / thoracic" },
    ],
  },
];

// ============================================================
// OHP + WEIGHTED PULL DAY (Fri)
// ============================================================
const UPPER: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: FRI,
    category: "back",
    name: "W1 Fri: OHP 4×5 @ 40kg + WPull 4×5 +10kg",
    description: "Heavy intro upper. " + EXPL,
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 5, note: "@40kg · explosive concentric" },
      { name: "Weighted Pull-up", sets: 4, reps: 5, note: "+10kg" },
      { name: "Pendlay Row", sets: 3, reps: 6, note: "@55kg" },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: FRI,
    category: "back",
    name: "W2 Fri: OHP 3×5 @ 30kg (deload)",
    description: "Deload upper. Light.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@30kg" },
      { name: "Pull-up", sets: 3, reps: 5, note: "Bodyweight" },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: FRI,
    category: "back",
    name: "W3 Fri: OHP 4×8 @ 30kg + Pull 4×8 BW",
    description: "Moderate. Higher-rep upper.",
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 8, note: "@30kg" },
      { name: "Pull-up", sets: 4, reps: 8, note: "Bodyweight" },
      { name: "Pendlay Row", sets: 3, reps: 8 },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: FRI,
    category: "back",
    name: "W4 Fri: OHP 4×5 @ 42.5kg + WPull 4×4 +15kg",
    description: "Heavy build. " + EXPL,
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 5, note: "@42.5kg · explosive concentric" },
      { name: "Weighted Pull-up", sets: 4, reps: 4, note: "+15kg" },
      { name: "Pendlay Row", sets: 3, reps: 6, note: "@60kg" },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: FRI,
    category: "back",
    name: "W5 Fri: OHP 4×8 @ 32.5kg",
    description: "Moderate build volume.",
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 8, note: "@32.5kg" },
      { name: "Pull-up", sets: 4, reps: 8, note: "Bodyweight" },
      { name: "Pendlay Row", sets: 3, reps: 8 },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: FRI,
    category: "back",
    name: "W6 Fri: OHP 3×5 @ 32.5kg (deload)",
    description: "Deload upper.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@32.5kg" },
      { name: "Pull-up", sets: 3, reps: 5, note: "Bodyweight" },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: FRI,
    category: "back",
    name: "W7 Fri: OHP 3×5 @ 45kg + WPull 3×3 +20kg",
    description: "PEAK. " + EXPL,
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@45kg · explosive concentric" },
      { name: "Weighted Pull-up", sets: 3, reps: 3, note: "+20kg" },
      { name: "Pendlay Row", sets: 3, reps: 5 },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: FRI,
    category: "back",
    name: "W8 Fri: OHP 3×6 + WPull 3×5 +15kg",
    description: "Moderate peak.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 6 },
      { name: "Weighted Pull-up", sets: 3, reps: 5, note: "+15kg" },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: FRI,
    category: "back",
    name: "W9 Fri: Weighted Pull-up test +20-25kg",
    description: "TEST. Build weighted pull-up to a heavy single. Target +20-25kg.",
    exercises: [
      { name: "Weighted Pull-up", sets: 1, reps: 3, note: "Build to heavy single, target +20-25kg" },
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "Supplemental" },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: FRI,
    category: "back",
    name: "W10 Fri: OHP light 3×5 (taper)",
    description: "Taper. Light upper — keep top end primed without fatigue.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@30kg" },
      { name: "Pull-up", sets: 2, reps: 5, note: "Bodyweight" },
    ],
  },
];

// ============================================================
// TUESDAY Z2 RIDE (speed, paired with Bench)
// Same 60-75min Z2 every week — simple and consistent.
// ============================================================
const TUE_Z2: BikeT[] = Array.from({ length: 10 }, (_, i) => ({
  weekNum: i + 1,
  dayOfWeek: TUE,
  category: "speed" as const,
  name: `W${i + 1} Tue: Z2 ride 60-75min`,
  description:
    "Easy spin to flush Mon's legs. STRICT Z2 — conversational, nose-breathing if possible. Do NOT let this drift into tempo or it becomes fatigue with no payoff.",
  durationMin: 70,
  focus: "Z2",
}));

// ============================================================
// WEDNESDAY HARD BIKE (speed)
// ============================================================
const WED_BIKE: BikeT[] = [
  {
    weekNum: 1,
    dayOfWeek: WED,
    category: "speed",
    name: "W1 Wed: VO₂ 3×4min",
    description: "Helgerud 4×4 intro. 15min wu → 3×4min @ Z4-low Z5 (160-175 bpm) with 3min easy → 10min cd.",
    durationMin: 50,
    focus: "VO2max",
  },
  {
    weekNum: 2,
    dayOfWeek: WED,
    category: "speed",
    name: "W2 Wed: VO₂ 3×3min (short, deload)",
    description: "Deload. 15min wu → 3×3min @ Z4 → 10min cd. Stop short.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    weekNum: 3,
    dayOfWeek: WED,
    category: "speed",
    name: "W3 Wed: Threshold 3×10min",
    description: "15min wu → 3×10min @ Z3-low Z4 (150-160 bpm) with 5min easy → 10min cd.",
    durationMin: 60,
    focus: "Threshold",
  },
  {
    weekNum: 4,
    dayOfWeek: WED,
    category: "speed",
    name: "W4 Wed: VO₂ 5×4min",
    description: "Heavy build. 15min wu → 5×4min @ Z4-Z5 with 3min easy → 10min cd.",
    durationMin: 60,
    focus: "VO2max",
  },
  {
    weekNum: 5,
    dayOfWeek: WED,
    category: "speed",
    name: "W5 Wed: Threshold 3×15min sweetspot",
    description: "15min wu → 3×15min sweet spot (88-94% FTP, 148-155 bpm) with 5min easy → 10min cd.",
    durationMin: 75,
    focus: "Sweetspot",
  },
  {
    weekNum: 6,
    dayOfWeek: WED,
    category: "speed",
    name: "W6 Wed: VO₂ 3×3min (short, deload)",
    description: "Deload. 15min wu → 3×3min @ Z4 → 10min cd.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    weekNum: 7,
    dayOfWeek: WED,
    category: "speed",
    name: "W7 Wed: VO₂ 4×5min (longest)",
    description: "PEAK. Longest VO₂ block of the plan. 15min wu → 4×5min @ Z4-Z5 with 4min easy → 10min cd.",
    durationMin: 65,
    focus: "VO2max",
  },
  {
    weekNum: 8,
    dayOfWeek: WED,
    category: "speed",
    name: "W8 Wed: Threshold sharpener 4×4min",
    description: "Sharpening. 15min wu → 4×4min @ Z4 with 2min easy → 10min cd.",
    durationMin: 55,
    focus: "Threshold",
  },
  {
    weekNum: 9,
    dayOfWeek: WED,
    category: "speed",
    name: "W9 Wed: VO₂ 3×3min openers",
    description: "Test cycle. Short sharp efforts. 15min wu → 3×3min @ Z5 → 10min cd.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    weekNum: 10,
    dayOfWeek: WED,
    category: "speed",
    name: "W10 Wed: Sharpener 2×2min surges",
    description: "Taper. 3 days before goal ride. 15min wu → 2×2min @ race-pace surge → 10min cd.",
    durationMin: 35,
    focus: "Taper",
  },
];

// ============================================================
// SATURDAY LONG RIDE (endurance)
// ============================================================
const SAT_LONG: BikeT[] = [
  {
    weekNum: 1,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W1 Sat: Long Z2 — 60km",
    description: "Z2 throughout (125-145 bpm). RPE 5-6/10. Don't chase speed. Eat early.",
    durationMin: 120,
    focus: "Z2",
  },
  {
    weekNum: 2,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W2 Sat: 50km easy (deload)",
    description: "Deload long ride. Z1-low Z2. Café ride is fine.",
    durationMin: 100,
    focus: "Recovery",
  },
  {
    weekNum: 3,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W3 Sat: Long Z2 — 70km",
    description: "Z2 (125-145 bpm). Practice fuelling — 60-90g carbs/hr.",
    durationMin: 140,
    focus: "Z2",
  },
  {
    weekNum: 4,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W4 Sat: Long Z2 — 80km",
    description: "Z2 (130-145 bpm). Last 30min lifted to high Z2 / low Z3 if legs allow.",
    durationMin: 165,
    focus: "Z2",
  },
  {
    weekNum: 5,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W5 Sat: Long Z2 — 90km",
    description: "Z2. Practice exact race-day breakfast + bottles.",
    durationMin: 190,
    focus: "Z2",
  },
  {
    weekNum: 6,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W6 Sat: 60km easy (deload)",
    description: "Deload. Z1-Z2 recovery ride.",
    durationMin: 130,
    focus: "Recovery",
  },
  {
    weekNum: 7,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W7 Sat: 100km TEST (race pace)",
    description:
      "TEST. 100km at goal race-pace effort. Aim 30 kph avg. Note avg HR, avg speed, last-25km HR drift. KEY DATA POINT for calibrating the rest of the plan.",
    durationMin: 200,
    focus: "Race",
  },
  {
    weekNum: 8,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W8 Sat: 110km Z2 (fuel practice)",
    description: "Longest ride of the plan. Z2 throughout, race-day fuelling exactly as planned (75-90g carbs/hr).",
    durationMin: 220,
    focus: "Z2",
  },
  {
    weekNum: 9,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W9 Sat: 80km dress rehearsal",
    description: "Dress rehearsal. First 40km Z2. Last 40km at goal 30 kph pace. Exact race kit, bottles, breakfast, route style.",
    durationMin: 165,
    focus: "Race-pace",
  },
  {
    weekNum: 10,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W10 Sat: 100km GOAL RIDE",
    description:
      "RACE DAY. 100km sub-3:30 attempt (avg 28.6+ kph). Pacing: first 30km feel TOO easy (28-29 kph), middle 40km at goal pace (29-30 kph), last 30km empty the tank. 75-90g carbs/hr from 20min in. Don't chase early speed.",
    durationMin: 210,
    focus: "Race",
  },
];

// ============================================================
// MONDAY METCON (conditioning) — short + hard ≤15min
// Heavy squat weeks (4, 7): no extra squat/box jumps.
// Deload weeks (2, 6): light AMRAP 10 ≤145 bpm.
// Test (9) + Taper (10): skip the metcon — protect tests + goal ride.
// ============================================================
const METCON: BikeT[] = [
  {
    weekNum: 1,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W1 Mon: AMRAP 12 — bike + KB + burpees",
    description: "AMRAP 12: 10 cal bike + 10 KB swings @20kg + 10 burpees. Truly hard — Z5. HR 160-180 in work, avg 145-160.",
    durationMin: 15,
    focus: "Anaerobic",
  },
  {
    weekNum: 2,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W2 Mon: Light AMRAP 10 (deload, or skip)",
    description: "Deload metcon — AMRAP 10 at ≤145 bpm. 6 cal bike + 6 KB swings @16kg + 6 air squats. Or skip entirely.",
    durationMin: 12,
    focus: "Recovery",
  },
  {
    weekNum: 3,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W3 Mon: EMOM 14 — bike / wall balls",
    description: "EMOM 14: min 1 — 15 cal bike. Min 2 — 12 wall balls @9kg. Repeat ×7. Z5 in work intervals.",
    durationMin: 14,
    focus: "Anaerobic",
  },
  {
    weekNum: 4,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W4 Mon: AMRAP 12 — NO SQUATTING (heavy squat day)",
    description:
      "Heavy squat day already — bias to bike + KB + burpees, no extra leg load. AMRAP 12: 12 cal bike + 8 KB swings @20kg + 6 burpees.",
    durationMin: 15,
    focus: "Anaerobic",
  },
  {
    weekNum: 5,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W5 Mon: 5 rounds for time — row + push press + pull-ups",
    description: "5 rounds for time: 250m row + 10 push press @30kg + 5 pull-ups. Pace it — sub 15 min.",
    durationMin: 15,
    focus: "Anaerobic",
  },
  {
    weekNum: 6,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W6 Mon: Light AMRAP 10 (deload, or skip)",
    description: "Deload. AMRAP 10 light @ ≤145 bpm. 6 cal bike + 6 KB swings @16kg + 6 push-ups. Or skip.",
    durationMin: 12,
    focus: "Recovery",
  },
  {
    weekNum: 7,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W7 Mon: AMRAP 10 — NO SQUATTING (peak squat day)",
    description:
      "Peak squat day — no extra leg load. AMRAP 10: 8 cal bike + 8 KB swings @20kg + 6 burpees. Pace controlled.",
    durationMin: 12,
    focus: "Anaerobic",
  },
  {
    weekNum: 8,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W8 Mon: AMRAP 10 — bike + KB + box jumps",
    description: "AMRAP 10: 8 cal bike + 8 KB swings @20kg + 6 box jumps. Last metcon before the test.",
    durationMin: 12,
    focus: "Anaerobic",
  },
  {
    weekNum: 9,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W9 Mon: SKIP metcon (test week)",
    description:
      "SKIP. Strength tests Tue/Thu/Fri + dress rehearsal Sat — protect them. Use Mon as a light mobility / 20min Z1 spin only.",
    durationMin: 20,
    focus: "Recovery",
  },
  {
    weekNum: 10,
    dayOfWeek: MON,
    category: "conditioning",
    name: "W10 Mon: SKIP metcon (taper)",
    description:
      "SKIP. Goal ride is Sat — no metcon. Optional 20min easy Z1 bike + mobility.",
    durationMin: 20,
    focus: "Recovery",
  },
];

const ALL_STRENGTH: StrengthT[] = [...SQUAT, ...BENCH, ...DEADLIFT, ...UPPER];
const ALL_BIKE: BikeT[] = [...TUE_Z2, ...WED_BIKE, ...SAT_LONG, ...METCON];

async function main() {
  const existing = await p.programme.findUnique({
    where: { name: PROGRAMME_NAME },
  });
  if (!existing) {
    console.error("Programme not found — expected", PROGRAMME_NAME);
    process.exit(1);
  }
  const programme = await p.programme.update({
    where: { id: existing.id },
    data: {
      description: PROGRAMME_DESC,
      totalWeeks: 10,
      cycleLength: 7,
    },
  });
  console.log(
    `Programme: ${programme.name} (cycleLength=${programme.cycleLength}, totalWeeks=${programme.totalWeeks})`,
  );

  // Detach old templates, deleting the ones with no log references.
  const oldTemplates = await p.sessionTemplate.findMany({
    where: { programmeId: programme.id },
    include: { _count: { select: { logs: true } } },
  });
  let detachedKept = 0;
  let deleted = 0;
  for (const t of oldTemplates) {
    if (t._count.logs > 0) {
      await p.sessionTemplate.update({
        where: { id: t.id },
        data: { programmeId: null, weekNum: null, dayOfWeek: null },
      });
      detachedKept++;
    } else {
      await p.exerciseTemplate.deleteMany({
        where: { sessionTemplateId: t.id },
      });
      await p.sessionTemplate.delete({ where: { id: t.id } });
      deleted++;
    }
  }
  console.log(`Old templates: ${deleted} deleted, ${detachedKept} kept+detached`);

  // Wipe and re-seed programme default schedule.
  await p.programmeSlot.deleteMany({ where: { programmeId: programme.id } });
  for (const s of SCHEDULE_SLOTS) {
    await p.programmeSlot.create({
      data: { ...s, programmeId: programme.id },
    });
  }
  console.log(`Default slots: ${SCHEDULE_SLOTS.length} written`);

  // Sync the *active* ScheduleSlot rows from the new programme default
  // — without re-activating. Activation increments currentMesoNum and
  // resets currentWeek which we don't want on a structure reseed.
  await p.$transaction([
    p.scheduleSlot.deleteMany({}),
    p.scheduleSlot.createMany({
      data: SCHEDULE_SLOTS.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        categoryId: s.categoryId,
      })),
    }),
  ]);
  console.log(`Active ScheduleSlot synced (${SCHEDULE_SLOTS.length} rows)`);

  // Wipe per-cycle/week overrides for the current meso — they were
  // sized for the 9-day cycle and aren't compatible with the 7-day v2.
  const userState = await p.userState.findUnique({ where: { id: 1 } });
  if (userState) {
    const wiped = await p.weekScheduleSlot.deleteMany({
      where: { mesoNum: userState.currentMesoNum },
    });
    console.log(`WeekScheduleSlot for meso ${userState.currentMesoNum}: ${wiped.count} wiped`);
  }

  // Seed strength templates.
  let strCreated = 0,
    strUpdated = 0;
  for (const s of ALL_STRENGTH) {
    const data = {
      category: s.category,
      phase: phaseForWeek(s.weekNum),
      description: s.description,
      programmeId: programme.id,
      weekNum: s.weekNum,
      dayOfWeek: s.dayOfWeek,
      isCustom: false,
    } as const;
    const existingT = await p.sessionTemplate.findFirst({
      where: { name: s.name },
    });
    if (existingT) {
      await p.exerciseTemplate.deleteMany({
        where: { sessionTemplateId: existingT.id },
      });
      await p.sessionTemplate.update({
        where: { id: existingT.id },
        data: {
          ...data,
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
      strUpdated++;
    } else {
      await p.sessionTemplate.create({
        data: {
          name: s.name,
          ...data,
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
      strCreated++;
    }
  }
  console.log(`Strength: ${strCreated} created, ${strUpdated} updated`);

  // Seed bike/conditioning templates.
  let bikeCreated = 0,
    bikeUpdated = 0;
  for (const b of ALL_BIKE) {
    const data = {
      category: b.category,
      phase: phaseForWeek(b.weekNum),
      description: b.description,
      durationMin: b.durationMin,
      focus: b.focus,
      programmeId: programme.id,
      weekNum: b.weekNum,
      dayOfWeek: b.dayOfWeek,
      isCustom: false,
    } as const;
    const existingT = await p.sessionTemplate.findFirst({
      where: { name: b.name },
    });
    if (existingT) {
      await p.sessionTemplate.update({
        where: { id: existingT.id },
        data,
      });
      bikeUpdated++;
    } else {
      await p.sessionTemplate.create({ data: { name: b.name, ...data } });
      bikeCreated++;
    }
  }
  console.log(`Bike/Cond: ${bikeCreated} created, ${bikeUpdated} updated`);

  console.log(
    `\nDone — ${ALL_STRENGTH.length + ALL_BIKE.length} templates total`,
  );
  console.log(`(${ALL_STRENGTH.length} strength + ${ALL_BIKE.length} bike/cond)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });

