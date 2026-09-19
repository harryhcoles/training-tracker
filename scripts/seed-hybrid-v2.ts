// Hybrid v3 — push/pull/legs + upper, machine gym, 7-day week.
//
// Weekly template:
//   Mon  legs (LEGS — squat, leg press, SL RDL, machines)
//   Tue  chest (PUSH — bench heavy) + speed (Z2 ride 60-75min)
//   Wed  speed (Hard bike — VO2 / Threshold per week)
//   Thu  back (PULL — deadlift heavy)
//   Fri  chest (UPPER — hypertrophy, machine-led)
//   Sat  endurance (Long ride — A session)
//   Sun  REST
//
// Metcon templates are still seeded (available in the library) but
// no longer hold a schedule slot — three rides a week already cover
// conditioning, and the Monday metcon was eating recovery.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const PROGRAMME_NAME = "Hybrid 12wk — Strength + 100km";
const PROGRAMME_DESC =
  "17-week 7-day hybrid plan v3. Push/pull/legs + upper: Mon legs, Tue push + Z2 ride, Wed hard bike, Thu pull (deadlift), Fri upper hypertrophy, Sat long ride, Sun rest. Tue/Thu heavy, Fri hypertrophy, Mon alternates — legs still trained heavy twice a week for cycling economy. W1-10 strength + 100km goal-ride build. W11-17: background endurance base, Sat Z2 rides climb 120→180km, deloads W11 (post-goal) and W15. Strength for W11+ arrives with the post-goal block programme.";

const SCHEDULE_SLOTS: Array<{ dayOfWeek: number; categoryId: string }> = [
  { dayOfWeek: 0, categoryId: "legs" }, // Mon LEGS
  { dayOfWeek: 1, categoryId: "chest" }, // Tue PUSH
  { dayOfWeek: 1, categoryId: "speed" }, // Tue Z2 ride
  { dayOfWeek: 2, categoryId: "speed" }, // Wed hard bike
  { dayOfWeek: 3, categoryId: "back" }, // Thu PULL
  { dayOfWeek: 4, categoryId: "chest" }, // Fri UPPER
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
// PUSH / PULL / LEGS + UPPER  (v3 — machine gym)
//
//   Mon  LEGS   knee-dominant + hinge (squat, leg press, SL RDL)
//   Tue  PUSH   heavy (bench) + Z2 ride
//   Thu  PULL   heavy (deadlift)
//   Fri  UPPER  hypertrophy, machine-led — 2nd frequency for upper
//
// Within-week undulation: Tue/Thu heavy (3-6 reps, RPE 8), Fri
// hypertrophy (10-20 reps near failure). Mon alternates heavy
// (W1/4/7) and hypertrophy (W3/5/8) because there is only one
// leg day. Deloads W2/W6, test W9, taper W10.
//
// Legs still get two heavy sessions a week — Mon knee-dominant,
// Thu hip-dominant via the deadlift — which is the dose shown to
// improve cycling economy and TT performance. Mon sits 48h before
// Wed's intervals and Thu 48h before the Sat long ride, clearing
// the 24-48h neuromuscular recovery window.
//
// No prescribed weights anywhere: every suggestion comes from
// logged history via the app's last-lift + RPE rule.
// ============================================================
const EXPL =
  "EXPLOSIVE INTENT — drive every concentric up as fast as you can, control the lowering.";
const SLRDL =
  "Slow eccentric, hips back, chase the hamstring stretch. Balance is part of the lift — don't rush it.";
const SEATED_CURL = "Seated — hip flexed keeps the hamstring under stretch.";
const LEG_EXT = "Rectus femoris — the quad head squats barely reach.";
const OH_TRI = "Overhead — triceps long head trained at length.";
// Deliberately makes no "long head" claim: the best-controlled trial
// on shoulder angle and elbow-flexor growth (Attarieh et al. 2025)
// came back null. It's a good curl; arm position is preference.
const INC_CURL = "Strict — no swing, control the lowering.";

// Friday is identical week to week (bar deload/test/taper) so the
// suggestion engine always has same-rep history to compare against.
const UPPER_HYP: StrengthEx[] = [
  { name: "Machine Chest Press", sets: 3, reps: 12 },
  { name: "Wide-Grip Lat Pulldown", sets: 3, reps: 12 },
  { name: "Cable Fly", sets: 3, reps: 15, note: "Full range — big stretch at the bottom" },
  { name: "Seated Machine Row", sets: 3, reps: 12 },
  { name: "Cable Lateral Raise", sets: 3, reps: 20 },
  { name: "Incline DB Curl", sets: 3, reps: 12, note: INC_CURL },
  { name: "Overhead Cable Triceps Extension", sets: 3, reps: 15, note: OH_TRI },
];
const UPPER_DELOAD: StrengthEx[] = [
  { name: "Machine Chest Press", sets: 2, reps: 12 },
  { name: "Wide-Grip Lat Pulldown", sets: 2, reps: 12 },
  { name: "Cable Lateral Raise", sets: 2, reps: 15 },
  { name: "Incline DB Curl", sets: 2, reps: 12 },
  { name: "Overhead Cable Triceps Extension", sets: 2, reps: 12 },
];

// ============================================================
// MONDAY — LEGS
// ============================================================
const LEGS: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: MON,
    category: "legs",
    name: "W1 Mon: Legs — heavy (squat 4×5)",
    description:
      "Heavy leg day. " +
      EXPL +
      " Leg press carries the quad volume without piling more load on the spine before Wednesday's intervals.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 5, note: "EXPLOSIVE concentric" },
      { name: "Leg Press", sets: 3, reps: 8 },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 3, reps: 10, note: SEATED_CURL },
      { name: "Leg Extension", sets: 3, reps: 12, note: LEG_EXT },
      { name: "Standing Calf Raise", sets: 3, reps: 12 },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: MON,
    category: "legs",
    name: "W2 Mon: Legs — deload",
    description:
      "Deload. Keep every pattern, cut the volume. Leave 3-4 reps in reserve on everything — this week is for absorbing, not pushing.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 5 },
      { name: "Leg Press", sets: 2, reps: 10 },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 2, reps: 12 },
      { name: "Standing Calf Raise", sets: 2, reps: 15 },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: MON,
    category: "legs",
    name: "W3 Mon: Legs — hypertrophy",
    description:
      "Hypertrophy leg day. Every working set to RPE 8-9 — one or two reps left, no more. Controlled eccentrics, full depth.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 8 },
      { name: "Hack Squat", sets: 4, reps: 10, note: "Leg press if the hack squat is busy" },
      { name: "Single Leg RDL", sets: 3, reps: 10, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 3, reps: 12, note: SEATED_CURL },
      { name: "Leg Extension", sets: 3, reps: 15, note: LEG_EXT },
      { name: "Standing Calf Raise", sets: 4, reps: 15, note: "Pause in the stretched position" },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: MON,
    category: "legs",
    name: "W4 Mon: Legs — heavy (squat 4×5)",
    description:
      "Heavy leg day. " + EXPL + " If a rep slows badly, rack it and reset — quality over grinding.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 5, note: "EXPLOSIVE concentric" },
      { name: "Leg Press", sets: 4, reps: 8 },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 3, reps: 10, note: SEATED_CURL },
      { name: "Leg Extension", sets: 3, reps: 12, note: LEG_EXT },
      { name: "Standing Calf Raise", sets: 3, reps: 12 },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: MON,
    category: "legs",
    name: "W5 Mon: Legs — hypertrophy",
    description:
      "Hypertrophy. Chase the stretch on every rep — that's where the growth signal is strongest. RPE 8-9 on working sets.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 8 },
      { name: "Hack Squat", sets: 4, reps: 10 },
      { name: "Single Leg RDL", sets: 3, reps: 10, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 3, reps: 12, note: SEATED_CURL },
      { name: "Leg Extension", sets: 3, reps: 15, note: LEG_EXT },
      { name: "Standing Calf Raise", sets: 4, reps: 15 },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: MON,
    category: "legs",
    name: "W6 Mon: Legs — deload",
    description: "Deload triples. Light and restorative — bar speed fast, effort low.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3 },
      { name: "Leg Press", sets: 2, reps: 8 },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 2, reps: 12 },
      { name: "Standing Calf Raise", sets: 2, reps: 15 },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: MON,
    category: "legs",
    name: "W7 Mon: Legs — peak (squat 4×3)",
    description:
      "PEAK. Triples at maximum concentric velocity — this is the rate-of-force-development work that transfers to the pedal stroke. " +
      EXPL,
    exercises: [
      { name: "Back Squat", sets: 4, reps: 3, note: "MAX CONCENTRIC velocity" },
      { name: "Leg Press", sets: 3, reps: 6 },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 3, reps: 10, note: SEATED_CURL },
      { name: "Leg Extension", sets: 2, reps: 12 },
      { name: "Standing Calf Raise", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: MON,
    category: "legs",
    name: "W8 Mon: Legs — hypertrophy (trimmed)",
    description:
      "Hypertrophy, volume trimmed. Saturday is the 110km — leave enough in the legs to ride it properly.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 6 },
      { name: "Hack Squat", sets: 3, reps: 10 },
      { name: "Single Leg RDL", sets: 3, reps: 10, perSide: true, note: SLRDL },
      { name: "Seated Leg Curl", sets: 3, reps: 12, note: SEATED_CURL },
      { name: "Leg Extension", sets: 3, reps: 15 },
      { name: "Standing Calf Raise", sets: 3, reps: 15 },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: MON,
    category: "legs",
    name: "W9 Mon: Squat test 3-5RM",
    description:
      "TEST. Build to a 3-5RM — the app's Last/Suggested line sets the target from your recent top sets. Drive every rep fast. Accessories light: don't pre-fatigue Thursday's pull.",
    exercises: [
      { name: "Back Squat", sets: 1, reps: 3, note: "Build to 3-5RM" },
      { name: "Seated Leg Curl", sets: 2, reps: 10 },
      { name: "Standing Calf Raise", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: MON,
    category: "legs",
    name: "W10 Mon: Legs — taper (fast bar)",
    description:
      "Taper. Light, fast bar speed. The goal ride is five days out — this primes the legs, it does not fatigue them.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "Fast bar, stop well short" },
      { name: "Leg Extension", sets: 2, reps: 12 },
      { name: "Standing Calf Raise", sets: 2, reps: 12 },
    ],
  },
];

// ============================================================
// TUESDAY — PUSH (heavy) — paired with the Z2 ride
// ============================================================
const PUSH: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: TUE,
    category: "chest",
    name: "W1 Tue: Push — heavy (bench 4×5)",
    description:
      "Heavy push. " + EXPL + " Lift before the Z2 ride — strength-first is the better order for both.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 5, note: "EXPLOSIVE concentric" },
      { name: "Incline Machine Chest Press", sets: 3, reps: 8 },
      { name: "Machine Shoulder Press", sets: 3, reps: 8 },
      { name: "Cable Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 3, reps: 10, note: OH_TRI },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: TUE,
    category: "chest",
    name: "W2 Tue: Push — deload",
    description: "Deload push. Keep the patterns, drop the volume.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 5 },
      { name: "Machine Shoulder Press", sets: 2, reps: 8 },
      { name: "Cable Lateral Raise", sets: 2, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: TUE,
    category: "chest",
    name: "W3 Tue: Push — heavy (bench 4×6)",
    description: "Heavy push, slightly higher reps. Top set at RPE 8 — one or two left.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 6 },
      { name: "Incline Machine Chest Press", sets: 3, reps: 8 },
      { name: "Machine Shoulder Press", sets: 3, reps: 8 },
      { name: "Cable Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 3, reps: 10, note: OH_TRI },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: TUE,
    category: "chest",
    name: "W4 Tue: Push — heavy (bench 4×5)",
    description: "Heavy push. " + EXPL,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 5, note: "EXPLOSIVE concentric" },
      { name: "Incline Machine Chest Press", sets: 3, reps: 8 },
      { name: "Machine Shoulder Press", sets: 3, reps: 6 },
      { name: "Cable Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 3, reps: 10, note: OH_TRI },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: TUE,
    category: "chest",
    name: "W5 Tue: Push — heavy (bench 4×6)",
    description: "Heavy push. Controlled tempo down, crisp speed up.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 6 },
      { name: "Incline Machine Chest Press", sets: 3, reps: 10 },
      { name: "Machine Shoulder Press", sets: 3, reps: 8 },
      { name: "Cable Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 3, reps: 12, note: OH_TRI },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: TUE,
    category: "chest",
    name: "W6 Tue: Push — deload",
    description: "Deload triples. Fast bar, low effort.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3 },
      { name: "Machine Shoulder Press", sets: 2, reps: 8 },
      { name: "Cable Lateral Raise", sets: 2, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: TUE,
    category: "chest",
    name: "W7 Tue: Push — peak (bench 4×3)",
    description: "PEAK. " + EXPL,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 3, note: "MAX CONCENTRIC velocity" },
      { name: "Incline Machine Chest Press", sets: 3, reps: 6 },
      { name: "Machine Shoulder Press", sets: 3, reps: 6 },
      { name: "Cable Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 3, reps: 10, note: OH_TRI },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: TUE,
    category: "chest",
    name: "W8 Tue: Push — moderate (bench 3×6)",
    description: "Moderate push — sharpen, don't dig a hole.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 6 },
      { name: "Incline Machine Chest Press", sets: 3, reps: 10 },
      { name: "Machine Shoulder Press", sets: 3, reps: 8 },
      { name: "Cable Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 3, reps: 12, note: OH_TRI },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: TUE,
    category: "chest",
    name: "W9 Tue: Bench test 3-5RM",
    description: "TEST. Build to a 3-5RM — target set by your recent top sets.",
    exercises: [
      { name: "Bench Press", sets: 1, reps: 3, note: "Build to 3-5RM" },
      { name: "Cable Lateral Raise", sets: 2, reps: 15 },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: TUE,
    category: "chest",
    name: "W10 Tue: Push — taper (fast bar)",
    description: "Taper. Light, fast bar. Minimal accessories — stay fresh for the goal ride.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3, note: "Fast bar" },
      { name: "Cable Lateral Raise", sets: 2, reps: 15 },
      { name: "Overhead Cable Triceps Extension", sets: 2, reps: 12 },
    ],
  },
];

// ============================================================
// THURSDAY — PULL (heavy)
// ============================================================
const PULL: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: THU,
    category: "back",
    name: "W1 Thu: Pull — heavy (deadlift 4×5)",
    description:
      "Heavy pull. " +
      EXPL +
      " Chest-supported rowing keeps the lower back fresh for Saturday's long ride.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, note: "EXPLOSIVE concentric" },
      { name: "Chest-Supported Row", sets: 4, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 8 },
      { name: "Face Pull", sets: 3, reps: 15 },
      { name: "Cable Curl", sets: 3, reps: 10 },
      { name: "Hammer Curl", sets: 3, reps: 12, note: "Brachialis and grip — pays off on long rides" },
    ],
  },
  {
    weekNum: 2,
    dayOfWeek: THU,
    category: "back",
    name: "W2 Thu: Pull — deload",
    description: "Deload pull. Light off the floor, nothing near failure.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 5 },
      { name: "Chest-Supported Row", sets: 2, reps: 8 },
      { name: "Lat Pulldown", sets: 2, reps: 10 },
      { name: "Face Pull", sets: 2, reps: 15 },
      { name: "Cable Curl", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 3,
    dayOfWeek: THU,
    category: "back",
    name: "W3 Thu: Pull — heavy (deadlift 4×8)",
    description: "Moderate-heavy. Eights on the deadlift are taxing — pace them and reset every rep.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 8 },
      { name: "Chest-Supported Row", sets: 4, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 10 },
      { name: "Face Pull", sets: 3, reps: 15 },
      { name: "Cable Curl", sets: 3, reps: 12 },
      { name: "Hammer Curl", sets: 3, reps: 12 },
    ],
  },
  {
    weekNum: 4,
    dayOfWeek: THU,
    category: "back",
    name: "W4 Thu: Pull — heavy (deadlift 4×3)",
    description: "Heavy triples. " + EXPL,
    exercises: [
      { name: "Deadlift", sets: 4, reps: 3, note: "EXPLOSIVE concentric" },
      { name: "Chest-Supported Row", sets: 4, reps: 6 },
      { name: "Lat Pulldown", sets: 3, reps: 8 },
      { name: "Face Pull", sets: 3, reps: 15 },
      { name: "Cable Curl", sets: 3, reps: 10 },
      { name: "Hammer Curl", sets: 3, reps: 12 },
    ],
  },
  {
    weekNum: 5,
    dayOfWeek: THU,
    category: "back",
    name: "W5 Thu: Pull — heavy (deadlift 3×8)",
    description: "Moderate build. Strong position every rep — no rounding as it gets hard.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 8 },
      { name: "Chest-Supported Row", sets: 4, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 10 },
      { name: "Face Pull", sets: 3, reps: 15 },
      { name: "Cable Curl", sets: 3, reps: 12 },
      { name: "Hammer Curl", sets: 3, reps: 12 },
    ],
  },
  {
    weekNum: 6,
    dayOfWeek: THU,
    category: "back",
    name: "W6 Thu: Pull — deload",
    description: "Deload — minimal volume off the floor.",
    exercises: [
      { name: "Deadlift", sets: 2, reps: 8 },
      { name: "Chest-Supported Row", sets: 2, reps: 8 },
      { name: "Lat Pulldown", sets: 2, reps: 10 },
      { name: "Face Pull", sets: 2, reps: 15 },
      { name: "Cable Curl", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 7,
    dayOfWeek: THU,
    category: "back",
    name: "W7 Thu: Pull — peak (deadlift 3×3)",
    description:
      "PEAK. " + EXPL + " The 100km calibration ride is Saturday — pace this carefully and save the legs.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 3, note: "MAX CONCENTRIC velocity" },
      { name: "Chest-Supported Row", sets: 3, reps: 6 },
      { name: "Lat Pulldown", sets: 3, reps: 8 },
      { name: "Face Pull", sets: 3, reps: 15 },
      { name: "Cable Curl", sets: 3, reps: 10 },
    ],
  },
  {
    weekNum: 8,
    dayOfWeek: THU,
    category: "back",
    name: "W8 Thu: Pull — moderate (deadlift 3×6)",
    description: "Moderate. The 110km Z2 ride looms on Saturday — leave something in the tank.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 6 },
      { name: "Chest-Supported Row", sets: 3, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 10 },
      { name: "Face Pull", sets: 3, reps: 15 },
      { name: "Cable Curl", sets: 3, reps: 12 },
      { name: "Hammer Curl", sets: 3, reps: 12 },
    ],
  },
  {
    weekNum: 9,
    dayOfWeek: THU,
    category: "back",
    name: "W9 Thu: Deadlift single test",
    description:
      "TEST. Build to a heavy single — target set by your recent top sets. STOP at RPE 9+; Saturday's dress rehearsal matters more than this number.",
    exercises: [
      { name: "Deadlift", sets: 1, reps: 1, note: "Build to a heavy single" },
      { name: "Lat Pulldown", sets: 2, reps: 10 },
      { name: "Face Pull", sets: 2, reps: 15 },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: THU,
    category: "back",
    name: "W10 Thu: Pull — taper (no deadlift)",
    description:
      "No deadlift this week — protect the goal ride. Upper pulling only, then mobility.",
    exercises: [
      { name: "Lat Pulldown", sets: 2, reps: 10 },
      { name: "Face Pull", sets: 2, reps: 15 },
      { name: "Cable Curl", sets: 2, reps: 12 },
      { name: "Mobility flow", sets: 1, reps: null, note: "15-20 min hip / hamstring / thoracic" },
    ],
  },
];

// ============================================================
// FRIDAY — UPPER (hypertrophy, machine-led)
// ============================================================
const UPPER: StrengthT[] = [
  {
    weekNum: 1,
    dayOfWeek: FRI,
    category: "chest",
    name: "W1 Fri: Upper — hypertrophy",
    description:
      "The hypertrophy half of the week's upper work. Every working set to RPE 8-9 — one or two reps left. Machines let you push that close safely.",
    exercises: UPPER_HYP,
  },
  {
    weekNum: 2,
    dayOfWeek: FRI,
    category: "chest",
    name: "W2 Fri: Upper — deload",
    description: "Deload. Half the sets, nothing near failure.",
    exercises: UPPER_DELOAD,
  },
  {
    weekNum: 3,
    dayOfWeek: FRI,
    category: "chest",
    name: "W3 Fri: Upper — hypertrophy",
    description:
      "Hypertrophy. Same session as last time — beat it by a rep or a small load bump, that's the whole game.",
    exercises: UPPER_HYP,
  },
  {
    weekNum: 4,
    dayOfWeek: FRI,
    category: "chest",
    name: "W4 Fri: Upper — hypertrophy",
    description: "Hypertrophy. RPE 8-9 on working sets, full range, controlled eccentrics.",
    exercises: UPPER_HYP,
  },
  {
    weekNum: 5,
    dayOfWeek: FRI,
    category: "chest",
    name: "W5 Fri: Upper — hypertrophy",
    description: "Hypertrophy. Chase the stretched position on the fly, curl and triceps extension.",
    exercises: UPPER_HYP,
  },
  {
    weekNum: 6,
    dayOfWeek: FRI,
    category: "chest",
    name: "W6 Fri: Upper — deload",
    description: "Deload. Half the sets, nothing near failure.",
    exercises: UPPER_DELOAD,
  },
  {
    weekNum: 7,
    dayOfWeek: FRI,
    category: "chest",
    name: "W7 Fri: Upper — hypertrophy (capped)",
    description:
      "Hypertrophy, but cap it at RPE 8 this week — Saturday is the 100km calibration ride and it matters more.",
    exercises: UPPER_HYP,
  },
  {
    weekNum: 8,
    dayOfWeek: FRI,
    category: "chest",
    name: "W8 Fri: Upper — hypertrophy",
    description: "Hypertrophy. Upper work costs the legs nothing — push this one.",
    exercises: UPPER_HYP,
  },
  {
    weekNum: 9,
    dayOfWeek: FRI,
    category: "chest",
    name: "W9 Fri: Upper — light (test week)",
    description:
      "Light. Three tests already this week — this session is maintenance, not stimulus.",
    exercises: [
      { name: "Machine Chest Press", sets: 2, reps: 12 },
      { name: "Wide-Grip Lat Pulldown", sets: 2, reps: 12 },
      { name: "Cable Lateral Raise", sets: 2, reps: 15 },
      { name: "Incline DB Curl", sets: 2, reps: 12 },
    ],
  },
  {
    weekNum: 10,
    dayOfWeek: FRI,
    category: "chest",
    name: "W10 Fri: Upper — taper",
    description: "Taper. Move, don't fatigue. Goal ride is tomorrow.",
    exercises: [
      { name: "Machine Chest Press", sets: 2, reps: 12 },
      { name: "Wide-Grip Lat Pulldown", sets: 2, reps: 12 },
      { name: "Cable Lateral Raise", sets: 2, reps: 15 },
    ],
  },
];

// ============================================================
// TUESDAY Z2 RIDE (speed, paired with Bench)
// Same 60-75min Z2 every week — simple and consistent.
// ============================================================
const TUE_Z2: BikeT[] = Array.from({ length: 17 }, (_, i) => ({
  weekNum: i + 1,
  dayOfWeek: TUE,
  category: "speed" as const,
  name: `W${i + 1} Tue: Z2 ride 60-75min`,
  description:
    "Easy spin to flush Mon's legs. STRICT Z2 — for you that's 20-23 km/h solo (HR 125-140, conversational). Your Strava shows 'Z2' rides drifting to 25 km/h @ HR 136 — that's tempo, and it steals from Wed. Slower is correct here.",
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
    name: "W2 Sat: 50km easy (cycle restart wk 1)",
    description:
      "CYCLING RESET — week 1 of the rebuilt 9-week arc. Absorb the 2 Aug 100km race effort (26.7 km/h, untrained — that's the new baseline). Z1-low Z2, 20-22 km/h. Café ride is fine.",
    durationMin: 100,
    focus: "Recovery",
  },
  {
    weekNum: 3,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W3 Sat: 80km + 2×15min @ 27",
    description:
      "Z2 base (20-23 km/h, 125-145 bpm) with 2×15min blocks @ 27 km/h — just above your proven 100km pace of 26.7 — in the middle third, 10min Z2 between. Race position in the blocks. Practice fuelling — 60-90g carbs/hr.",
    durationMin: 165,
    focus: "Race-pace",
  },
  {
    weekNum: 4,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W4 Sat: 90km + 2×20min @ 27-28",
    description:
      "Z2 base with 2×20min @ 27-28 km/h, 10min Z2 between — second block in the final third, on tired legs. Race position throughout the blocks.",
    durationMin: 190,
    focus: "Race-pace",
  },
  {
    weekNum: 5,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W5 Sat: 100km + 3×15min @ 27-28",
    description:
      "Z2 base with 3×15min @ 27-28 km/h spread through the ride — last block starts after 80km, when it counts. Practice exact race-day breakfast + bottles.",
    durationMin: 210,
    focus: "Race-pace",
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
    name: "W7 Sat: 100km TEST (calibration)",
    description:
      "TEST. 100km at the hardest pace you can hold STEADY — target 27.5-28.5 km/h. You rode 26.7 untrained on 2 Aug; five trained weeks should buy ~1-1.5 km/h. WEAR THE HR STRAP — avg HR, avg speed and last-25km drift from this ride set the W9/W10 targets.",
    durationMin: 200,
    focus: "Race",
  },
  {
    weekNum: 8,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W8 Sat: 110km Z2 + fast finish",
    description:
      "Longest ride of the plan. Z2 (20-23 km/h) for durability, race-day fuelling exactly as planned (75-90g carbs/hr). Final 25min at 27-28 km/h — training the finish on empty legs is the most race-specific work there is.",
    durationMin: 220,
    focus: "Z2",
  },
  {
    weekNum: 9,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W9 Sat: 80km dress rehearsal",
    description:
      "Dress rehearsal. First 40km Z2. Last 40km at the pace the W7 test proved sustainable. Exact race kit, bottles, breakfast, route style.",
    durationMin: 165,
    focus: "Race-pace",
  },
  {
    weekNum: 10,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W10 Sat: 100km GOAL RIDE",
    description:
      "RACE DAY. Target 28.0 km/h (3:34) — stretch sub-3:30 (28.6) if the W7 test and W9 rehearsal back it. Baseline: 26.7 untrained on 2 Aug; 8 trained weeks buy the difference. Pacing: first 30km @ ~27 (feels TOO easy), middle 40km at target, last 30km empty the tank. 75-90g carbs/hr from 20min in.",
    durationMin: 210,
    focus: "Race",
  },
  // ---- Background endurance base: 100 → 180km ----
  // Post-goal arc. Longest-ride jumps held to ~9-12% per week
  // (single-ride spikes, not weekly totals, carry the injury risk —
  // Buist et al. 2008 showed the classic 10%-per-week rule itself is
  // unvalidated). Deloads at W11 (absorb the goal ride) and W15.
  {
    weekNum: 11,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W11 Sat: 70km easy (post-goal recovery)",
    description:
      "DELOAD. Absorb the goal ride — Z1-low Z2 (20-22 km/h), flat route, café stop encouraged. The 180km base build starts next week.",
    durationMin: 200,
    focus: "Recovery",
  },
  {
    weekNum: 12,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W12 Sat: Long Z2 — 120km",
    description:
      "Base build 1 of 5. STRICT Z2 (20-23 km/h, 125-145 bpm) — the point is hours, not pace. 60-90g carbs/hr from the first hour. Wear the HR strap: last-hour HR drift is the durability signal to watch across this block.",
    durationMin: 335,
    focus: "Z2",
  },
  {
    weekNum: 13,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W13 Sat: Long Z2 — 135km",
    description:
      "Base build 2 of 5. Z2 throughout. Practice eating real food on the bike — gels alone won't carry 180km.",
    durationMin: 375,
    focus: "Z2",
  },
  {
    weekNum: 14,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W14 Sat: Long Z2 — 150km",
    description:
      "Base build 3 of 5. Z2. Longest since the March 180. Sort saddle/contact-point comfort now — position problems compound past 5 hours.",
    durationMin: 415,
    focus: "Z2",
  },
  {
    weekNum: 15,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W15 Sat: 80km easy (deload)",
    description: "DELOAD. Z1-low Z2. Half the distance, all the recovery.",
    durationMin: 225,
    focus: "Recovery",
  },
  {
    weekNum: 16,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W16 Sat: Long Z2 — 165km",
    description:
      "Base build 4 of 5. Z2. Full fuelling rehearsal — 75-90g carbs/hr, electrolytes, real food.",
    durationMin: 455,
    focus: "Z2",
  },
  {
    weekNum: 17,
    dayOfWeek: SAT,
    category: "endurance",
    name: "W17 Sat: Long Z2 — 180km 🎯",
    description:
      "Base build 5 of 5 — the 180. Z2 discipline the whole way (you did 180.6km in March at 23.1 km/h; this one should feel more controlled). Compare last-hour HR drift vs W12 — that delta is the durability gain from this block.",
    durationMin: 490,
    focus: "Z2",
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

// Strip prescribed weights from titles and exercise notes. The arrays
// above keep the original design loads for reference, but the app
// must not show or parse them — suggestions are driven purely by the
// user's own logged history (last comparable lift + RPE rule). The
// paper prescriptions assumed training maxes ~12kg below the user's
// actual lifts, so prescription-as-baseline produced nonsense jumps.
function stripKg(s: string): string {
  return s
    .replace(/\s*[@+]\s*\d+(?:\.\d+)?\s*kg\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function tidyNote(s: string): string | null {
  const t = s
    .replace(/^\s*·\s*/, "")
    .replace(/\s*·\s*$/, "")
    .replace(/·\s*·/g, "·")
    .trim();
  return t.length > 0 ? t : null;
}

const ALL_STRENGTH: StrengthT[] = [...LEGS, ...PUSH, ...PULL, ...UPPER].map(
  (t) => ({
    ...t,
    name: stripKg(t.name),
    exercises: t.exercises.map((e) => ({
      ...e,
      note: e.note ? tidyNote(stripKg(e.note)) : e.note,
    })),
  }),
);
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
      totalWeeks: 17,
      cycleLength: 7,
      deloadWeeks: [2, 6, 11, 15],
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

