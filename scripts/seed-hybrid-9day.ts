// Reseeds the Hybrid programme as a 10-cycle / 9-day microcycle plan,
// matching the structure the user's coaching chat actually landed on
// (Strength + Cycling + Conditioning, 9-day cycles).
//
// Cycle structure:
//   D1 = legs (squat)
//   D2 = speed (VO2 heavy / Threshold moderate)
//   D3 = chest (bench)
//   D4 = conditioning (CrossFit metcon)
//   D5 = REST
//   D6 = back (deadlift)
//   D7 = back (OHP / pull) + speed (bike, opposite of D2)
//   D8 = endurance (long ride)
//   D9 = REST
//
// 9 main cycles + 1 abbreviated taper cycle = 10 cycles, 9 days each.
// Heavy / Moderate / Deload / Test labelling per the chat tracker.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROGRAMME_NAME = "Hybrid 12wk — Strength + 100km";
const PROGRAMME_DESCRIPTION =
  "10-cycle hybrid plan (9-day microcycle): strength (squat / bench / deadlift / OHP+pull) + cycling (VO2 / Threshold / Long Z2) + conditioning. Heavy / moderate / deload rotation by cycle. D7 is a double (upper AM + bike PM). Long ride on D8 — floats vs Sat/Sun by design; slide via per-cycle override when needed. Cycle 10 is the taper into the 100km goal ride.";

// Default schedule (9 day positions). D5 and D9 = rest (no slot).
const DEFAULT_SLOTS: Array<{ dayOfWeek: number; categoryId: string }> = [
  { dayOfWeek: 0, categoryId: "legs" }, // D1
  { dayOfWeek: 1, categoryId: "speed" }, // D2
  { dayOfWeek: 2, categoryId: "chest" }, // D3
  { dayOfWeek: 3, categoryId: "conditioning" }, // D4
  // D5 = rest
  { dayOfWeek: 5, categoryId: "back" }, // D6
  { dayOfWeek: 6, categoryId: "back" }, // D7 upper (OHP/pull)
  { dayOfWeek: 6, categoryId: "speed" }, // D7 bike
  { dayOfWeek: 7, categoryId: "endurance" }, // D8 long ride
  // D9 = rest
];

const D1 = 0,
  D2 = 1,
  D3 = 2,
  D4 = 3,
  D6 = 5,
  D7 = 6,
  D8 = 7;

type Phase = "base" | "build" | "peak";
function phaseForCycle(c: number): Phase {
  if (c <= 3) return "base";
  if (c <= 6) return "build";
  return "peak";
}

type StrengthTemplate = {
  cycleNum: number;
  cycleDay: number;
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

type BikeTemplate = {
  cycleNum: number;
  cycleDay: number;
  category: "speed" | "endurance" | "conditioning";
  name: string;
  description: string;
  durationMin: number;
  focus: string;
};

// ============================================================
// SQUAT (D1) — TM 80kg
// ============================================================
const SQUAT: StrengthTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C1 D1: Squat 5×5 @ 65kg",
    description: "Heavy (intro/rebuild). Re-acclimate after the 70.3. Top set RPE 7.",
    exercises: [
      { name: "Back Squat", sets: 5, reps: 5, note: "@65kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 8, note: "@70-80kg" },
      { name: "Walking Lunge", sets: 3, reps: 10, perSide: true, note: "20kg DBs" },
      { name: "Standing Calf Raise", sets: 3, reps: 15 },
      { name: "Plank", sets: 3, reps: null, note: "60s hold" },
    ],
  },
  {
    cycleNum: 2,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C2 D1: Squat 4×8 @ 57.5kg",
    description: "Moderate (~72% TM). Higher fatigue — bar speed crisp.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, note: "@57.5kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 8 },
      { name: "Walking Lunge", sets: 3, reps: 10, perSide: true },
      { name: "Standing Calf Raise", sets: 3, reps: 15 },
    ],
  },
  {
    cycleNum: 3,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C3 D1: Squat 3×5 @ 60kg (deload)",
    description: "Heavy-scheme deload — light loads, restorative.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 5, note: "@60kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 8, note: "@65kg" },
      { name: "Walking Lunge", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    cycleNum: 4,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C4 D1: Squat 4×5 @ 72.5kg",
    description: "Heavy (build, first real intensification). Add pause squats.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 5, note: "@72.5kg" },
      { name: "Pause Squat", sets: 3, reps: 3, note: "@60kg, 2s pause" },
      { name: "Romanian Deadlift", sets: 4, reps: 6, note: "@85kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true, note: "20kg DBs" },
    ],
  },
  {
    cycleNum: 5,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C5 D1: Squat 4×8 @ 62.5kg",
    description: "Moderate (build). Top of moderate zone — heavy legs into D2.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, note: "@62.5kg" },
      { name: "Romanian Deadlift", sets: 4, reps: 6, note: "@85kg" },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    cycleNum: 6,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C6 D1: Squat 3×3 @ 65kg (deload)",
    description: "Heavy-scheme deload (build end). Light triples.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "@65kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 6, note: "@70kg" },
    ],
  },
  {
    cycleNum: 7,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C7 D1: Squat 4×3 @ 80kg",
    description: "Heavy (peak). 100% TM triples.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 3, note: "@80kg; top 3 then 2×3 @ 72.5kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 5, note: "@90kg" },
      { name: "Walking Lunge", sets: 2, reps: 10, perSide: true },
    ],
  },
  {
    cycleNum: 8,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C8 D1: Squat 3×6 @ 67.5kg",
    description: "Moderate (peak, sharpen). Volume light to keep legs for bike.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 6, note: "@67.5kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 5, note: "@92.5kg" },
    ],
  },
  {
    cycleNum: 9,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C9 D1: Squat test 3-5RM @ 85kg",
    description: "TEST. Build to 3-5RM single. Goal: 3 clean reps @ 85kg.",
    exercises: [
      { name: "Back Squat", sets: 1, reps: 3, note: "Build to 3-5RM, target 85kg" },
      { name: "Romanian Deadlift", sets: 3, reps: 5, note: "@90kg" },
    ],
  },
  {
    cycleNum: 10,
    cycleDay: D1,
    category: "legs",
    name: "Hybrid C10 D1: Squat 3×3 @ 65kg (taper)",
    description: "Taper. Light, fast bar speed. Goal ride looms.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 3, note: "@65kg" },
    ],
  },
];

// ============================================================
// BENCH (D3) — TM 70kg
// ============================================================
const BENCH: StrengthTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C1 D3: Bench 5×5 @ 57.5kg",
    description: "Heavy (intro). Top set RPE 7.",
    exercises: [
      { name: "Bench Press", sets: 5, reps: 5, note: "@57.5kg" },
      { name: "Dumbbell Overhead Press", sets: 3, reps: 8, note: "@17.5kg DBs" },
      { name: "Barbell Row", sets: 4, reps: 8, note: "@55kg" },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    cycleNum: 2,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C2 D3: Bench 4×8 @ 50kg",
    description: "Moderate (~71% TM). Hypertrophy stimulus.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, note: "@50kg" },
      { name: "Dumbbell Overhead Press", sets: 3, reps: 8 },
      { name: "Barbell Row", sets: 4, reps: 8 },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    cycleNum: 3,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C3 D3: Bench 3×5 @ 50kg (deload)",
    description: "Deload. Light.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 5, note: "@50kg" },
      { name: "Dumbbell Overhead Press", sets: 2, reps: 10 },
      { name: "Face Pull", sets: 2, reps: 15 },
    ],
  },
  {
    cycleNum: 4,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C4 D3: Bench 4×5 @ 62.5kg",
    description: "Heavy (build) + close-grip.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 5, note: "@62.5kg" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 6, note: "@55kg" },
      { name: "Barbell Row", sets: 3, reps: 6, note: "@60kg" },
    ],
  },
  {
    cycleNum: 5,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C5 D3: Bench 4×8 @ 55kg",
    description: "Moderate (~78% TM).",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, note: "@55kg" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 6 },
      { name: "Barbell Row", sets: 3, reps: 6 },
    ],
  },
  {
    cycleNum: 6,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C6 D3: Bench 3×3 @ 60kg (deload)",
    description: "Deload triples.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3, note: "@60kg" },
    ],
  },
  {
    cycleNum: 7,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C7 D3: Bench 4×3 @ 70kg",
    description: "Heavy (peak). 100% TM triples.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 3, note: "@70kg" },
      { name: "Close-Grip Bench Press", sets: 3, reps: 5, note: "@57.5kg" },
      { name: "Barbell Row", sets: 3, reps: 6 },
    ],
  },
  {
    cycleNum: 8,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C8 D3: Bench 3×6 @ 60kg",
    description: "Moderate (peak). Maintenance volume.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 6, note: "@60kg" },
      { name: "Barbell Row", sets: 3, reps: 6 },
    ],
  },
  {
    cycleNum: 9,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C9 D3: Bench test 3-5RM @ 75kg",
    description: "TEST. Build to 3-5RM. Goal: 3 reps @ 75kg.",
    exercises: [
      { name: "Bench Press", sets: 1, reps: 3, note: "Build to 3-5RM, target 75kg" },
    ],
  },
  {
    cycleNum: 10,
    cycleDay: D3,
    category: "chest",
    name: "Hybrid C10 D3: Bench 3×3 @ 57.5kg (taper)",
    description: "Taper. Light, fast bar.",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 3, note: "@57.5kg" },
    ],
  },
];

// ============================================================
// CONDITIONING (D4)
// ============================================================
const COND: BikeTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C1 D4: Metcon 20min",
    description: "AMRAP 20: 10 cal bike + 10 KB swings @ 20kg + 10 DB step-ups (15kg). Avg HR 145-160.",
    durationMin: 25,
    focus: "Anaerobic",
  },
  {
    cycleNum: 2,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C2 D4: Metcon 25min",
    description: "EMOM 24: m1 — 15 cal bike. m2 — 12 wall balls. m3 — 10 burpees. Repeat ×8.",
    durationMin: 30,
    focus: "Anaerobic",
  },
  {
    cycleNum: 3,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C3 D4: Metcon 20min (deload)",
    description: "AMRAP 15: 10 cal bike + 10 KB swings @ 16kg + 10 air squats. Avg HR ≤150.",
    durationMin: 25,
    focus: "Anaerobic",
  },
  {
    cycleNum: 4,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C4 D4: Metcon 30min",
    description: "5 rounds for time: 400m row + 15 air squats + 10 push press @ 30kg + 5 pull-ups.",
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    cycleNum: 5,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C5 D4: Metcon 30min",
    description: "3 rounds: 50 cal bike + 30 wall balls + 10 burpee box jumps. Rest 2min between.",
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    cycleNum: 6,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C6 D4: Metcon 20min (deload)",
    description: "AMRAP 15 light. KB 16kg + bodyweight. Avg HR ≤145.",
    durationMin: 25,
    focus: "Anaerobic",
  },
  {
    cycleNum: 7,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C7 D4: Metcon 35min",
    description: "EMOM 30: m1 — 15 cal bike. m2 — 12 wall balls. m3 — 10 burpees. Repeat ×10.",
    durationMin: 35,
    focus: "Anaerobic",
  },
  {
    cycleNum: 8,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C8 D4: Metcon 25min",
    description: "5 rounds: 30 cal bike + 15 KB swings @ 20kg + 10 burpees. Pace it.",
    durationMin: 30,
    focus: "Anaerobic",
  },
  {
    cycleNum: 9,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C9 D4: Metcon 20min",
    description: "AMRAP 15 short and hard: 10 cal bike + 8 KB swings + 6 box jumps.",
    durationMin: 25,
    focus: "Taper",
  },
  {
    cycleNum: 10,
    cycleDay: D4,
    category: "conditioning",
    name: "Hybrid C10 D4: Easy aerobic 20min (taper)",
    description: "NO METCON near goal ride. 20min easy bike Z1-Z2. Mobility after.",
    durationMin: 20,
    focus: "Recovery",
  },
];

// ============================================================
// DEADLIFT (D6) — TM 110kg, lower volume to spare D8 long ride
// ============================================================
const DEADLIFT: StrengthTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C1 D6: Deadlift 4×5 @ 90kg",
    description: "Heavy. Fresh CNS for primary pull.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, note: "@90kg" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@55kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    cycleNum: 2,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C2 D6: Deadlift 4×8 @ 77.5kg",
    description: "Moderate (~70% TM). 8s in DL are taxing — pace.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 8, note: "@77.5kg" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@55kg" },
      { name: "Single Leg RDL", sets: 3, reps: 8, perSide: true },
    ],
  },
  {
    cycleNum: 3,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C3 D6: Deadlift 3×5 @ 75kg (deload)",
    description: "Deload. Light.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 5, note: "@75kg" },
      { name: "Single Leg RDL", sets: 2, reps: 8, perSide: true },
    ],
  },
  {
    cycleNum: 4,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C4 D6: Deadlift 4×3 @ 97.5kg",
    description: "Heavy (build). Triples + jumps for potentiation.",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 3, note: "@97.5kg" },
      { name: "Box Jump", sets: 5, reps: 3, note: "Max height, 60s rest" },
      { name: "Front Squat", sets: 3, reps: 5, note: "@60kg" },
    ],
  },
  {
    cycleNum: 5,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C5 D6: Deadlift 3×8 @ 82.5kg",
    description: "Moderate (~75% TM).",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 8, note: "@82.5kg" },
      { name: "Box Jump", sets: 4, reps: 3 },
    ],
  },
  {
    cycleNum: 6,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C6 D6: Deadlift 2×8 @ 72.5kg (deload)",
    description: "Deload — minimal volume.",
    exercises: [
      { name: "Deadlift", sets: 2, reps: 8, note: "@72.5kg" },
    ],
  },
  {
    cycleNum: 7,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C7 D6: Deadlift 3×3 @ 105kg",
    description: "Heavy (peak). Cycling test on D8 — pace this carefully.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 3, note: "@105kg" },
      { name: "Box Jump", sets: 5, reps: 3 },
    ],
  },
  {
    cycleNum: 8,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C8 D6: Deadlift 3×6 @ 87.5kg",
    description: "Moderate (peak).",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 6, note: "@87.5kg" },
    ],
  },
  {
    cycleNum: 9,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C9 D6: Deadlift single @ 115kg test",
    description: "TEST. Build to single. Target 115kg. Stop if RPE 9+.",
    exercises: [
      { name: "Deadlift", sets: 1, reps: 1, note: "Build to single, target 115kg" },
    ],
  },
  {
    cycleNum: 10,
    cycleDay: D6,
    category: "back",
    name: "Hybrid C10 D6: Mobility only (taper)",
    description: "REST legs for goal ride. Mobility only — no deadlift.",
    exercises: [
      { name: "Mobility flow", sets: 1, reps: null, note: "15-20 min hip / hamstring / thoracic" },
    ],
  },
];

// ============================================================
// D7 Upper (OHP / Pull) — Strength category=back since pull-focused
// ============================================================
const D7_UPPER: StrengthTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C1 D7: OHP+Pull (intro)",
    description: "AM session of D7 double. OHP + weighted pulls. Bike PM is separate.",
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 5, note: "@40kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 5, note: "+10kg" },
      { name: "Pendlay Row", sets: 3, reps: 6, note: "@55kg" },
      { name: "Pallof Press", sets: 3, reps: 10, perSide: true },
    ],
  },
  {
    cycleNum: 2,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C2 D7: OHP+Pull (moderate)",
    description: "Higher-rep upper.",
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 8, note: "@30kg" },
      { name: "Pull-up", sets: 4, reps: 8, note: "Bodyweight" },
      { name: "Pendlay Row", sets: 3, reps: 8 },
    ],
  },
  {
    cycleNum: 3,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C3 D7: OHP+Pull (deload)",
    description: "Light upper. Restorative.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@30kg" },
      { name: "Pull-up", sets: 3, reps: 5 },
    ],
  },
  {
    cycleNum: 4,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C4 D7: OHP+Pull (heavy)",
    description: "Heavy upper. Add weighted pull-up volume.",
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 5, note: "@42.5kg" },
      { name: "Weighted Pull-up", sets: 4, reps: 4, note: "+15kg" },
      { name: "Pendlay Row", sets: 3, reps: 6, note: "@60kg" },
    ],
  },
  {
    cycleNum: 5,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C5 D7: OHP+Pull (moderate)",
    description: "Moderate volume push/pull.",
    exercises: [
      { name: "Standing Overhead Press", sets: 4, reps: 8, note: "@32.5kg" },
      { name: "Pull-up", sets: 4, reps: 8 },
      { name: "Pendlay Row", sets: 3, reps: 8 },
    ],
  },
  {
    cycleNum: 6,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C6 D7: OHP+Pull (deload)",
    description: "Deload upper.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@32.5kg" },
      { name: "Pull-up", sets: 3, reps: 5 },
    ],
  },
  {
    cycleNum: 7,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C7 D7: OHP+Pull (peak)",
    description: "Peak heavy upper. Test prep.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 5, note: "@45kg" },
      { name: "Weighted Pull-up", sets: 3, reps: 3, note: "+20kg" },
      { name: "Pendlay Row", sets: 3, reps: 5 },
    ],
  },
  {
    cycleNum: 8,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C8 D7: OHP+Pull (moderate)",
    description: "Moderate peak.",
    exercises: [
      { name: "Standing Overhead Press", sets: 3, reps: 6 },
      { name: "Weighted Pull-up", sets: 3, reps: 5, note: "+15kg" },
    ],
  },
  {
    cycleNum: 9,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C9 D7: OHP+Pull test",
    description: "TEST. Build weighted pull-up to a heavy single +20-25kg.",
    exercises: [
      { name: "Weighted Pull-up", sets: 1, reps: 3, note: "Build to heavy single, target +20-25kg" },
      { name: "Standing Overhead Press", sets: 3, reps: 5 },
    ],
  },
  {
    cycleNum: 10,
    cycleDay: D7,
    category: "back",
    name: "Hybrid C10 D7: Light upper (taper)",
    description: "Light upper. Keep top end primed without fatigue.",
    exercises: [
      { name: "Standing Overhead Press", sets: 2, reps: 5, note: "@30kg" },
      { name: "Pull-up", sets: 2, reps: 5 },
    ],
  },
];

// ============================================================
// BIKE D2 (speed) — VO2 on heavy cycles, Threshold on moderate
// Heavy cycles: 1, 3, 4, 6, 7, 9 (3 and 6 deload)
// Moderate cycles: 2, 5, 8
// ============================================================
const BIKE_D2: BikeTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C1 D2: VO₂ 3×4min",
    description: "Heavy. Helgerud 4×4 intro. 15min wu → 3×4min @ Z4-low Z5 (160-175 bpm) with 3min easy → 10min cd.",
    durationMin: 50,
    focus: "VO2max",
  },
  {
    cycleNum: 2,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C2 D2: Threshold 3×10min",
    description: "Moderate (flipped). 15min wu → 3×10min @ Z3-low Z4 (150-160 bpm) with 5min easy → 10min cd.",
    durationMin: 60,
    focus: "Threshold",
  },
  {
    cycleNum: 3,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C3 D2: VO₂ 3×3min (deload)",
    description: "Heavy deload. 15min wu → 3×3min @ Z4 (mid) → 10min cd. Stop short.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    cycleNum: 4,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C4 D2: VO₂ 5×4min",
    description: "Heavy build. 15min wu → 5×4min @ Z4-Z5 with 3min easy → 10min cd.",
    durationMin: 60,
    focus: "VO2max",
  },
  {
    cycleNum: 5,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C5 D2: Threshold 3×15min",
    description: "Moderate (flipped). 15min wu → 3×15min sweet spot (Z3-Z4) with 5min easy → 10min cd.",
    durationMin: 75,
    focus: "Sweetspot",
  },
  {
    cycleNum: 6,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C6 D2: VO₂ 3×3min (deload)",
    description: "Heavy deload. 15min wu → 3×3min @ Z4 → 10min cd.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    cycleNum: 7,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C7 D2: VO₂ 4×5min",
    description: "Heavy peak. Longest VO₂. 15min wu → 4×5min @ Z4-Z5 with 4min easy → 10min cd.",
    durationMin: 65,
    focus: "VO2max",
  },
  {
    cycleNum: 8,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C8 D2: Threshold sharpener 4×4min",
    description: "Moderate sharpening (flipped). 15min wu → 4×4min @ Z4 → 10min cd.",
    durationMin: 55,
    focus: "Threshold",
  },
  {
    cycleNum: 9,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C9 D2: VO₂ 3×3min (test cycle openers)",
    description: "Heavy test cycle. Short sharp efforts. 15min wu → 3×3min @ Z5 → 10min cd.",
    durationMin: 45,
    focus: "VO2max",
  },
  {
    cycleNum: 10,
    cycleDay: D2,
    category: "speed",
    name: "Hybrid C10 D2: Sharpener 2×2min (taper)",
    description: "Taper. 5 days before goal ride. 15min wu → 2×2min @ race-pace surge → 10min cd.",
    durationMin: 35,
    focus: "Taper",
  },
];

// ============================================================
// BIKE D7 PM (speed) — Threshold on heavy cycles, VO2 on moderate
// ============================================================
const BIKE_D7: BikeTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C1 D7 PM: Threshold 3×10min",
    description: "Heavy. PM session after AM upper. 15min wu → 3×10min @ Z3-Z4 with 5min easy → 10min cd.",
    durationMin: 60,
    focus: "Threshold",
  },
  {
    cycleNum: 2,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C2 D7 PM: VO₂ 4×4min",
    description: "Moderate (flipped). 15min wu → 4×4min @ Z4-Z5 → 10min cd.",
    durationMin: 55,
    focus: "VO2max",
  },
  {
    cycleNum: 3,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C3 D7 PM: Easy Z2 (deload)",
    description: "Deload. 45min easy Z2 spin.",
    durationMin: 45,
    focus: "Z2",
  },
  {
    cycleNum: 4,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C4 D7 PM: Threshold 2×20min",
    description: "Heavy build. 15min wu → 2×20min @ Z3-Z4 with 5min easy → 10min cd.",
    durationMin: 75,
    focus: "Threshold",
  },
  {
    cycleNum: 5,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C5 D7 PM: VO₂ 6×3min",
    description: "Moderate (flipped). 15min wu → 6×3min @ Z5 → 10min cd.",
    durationMin: 65,
    focus: "VO2max",
  },
  {
    cycleNum: 6,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C6 D7 PM: Easy Z2 (deload)",
    description: "Deload. 45min easy Z2.",
    durationMin: 45,
    focus: "Z2",
  },
  {
    cycleNum: 7,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C7 D7 PM: Sweetspot 2×25min",
    description: "Heavy peak. 15min wu → 2×25min sweet spot → 10min cd.",
    durationMin: 80,
    focus: "Sweetspot",
  },
  {
    cycleNum: 8,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C8 D7 PM: Race-pace 3×20min",
    description: "Moderate peak. 15min wu → 3×20min @ goal 100km pace (145-152 bpm) → 10min cd.",
    durationMin: 90,
    focus: "Race-pace",
  },
  {
    cycleNum: 9,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C9 D7 PM: Race-pace 1×45min",
    description: "Test cycle. Sustained race-pace block. 15min wu → 45min @ goal pace → 10min cd.",
    durationMin: 75,
    focus: "Race-pace",
  },
  {
    cycleNum: 10,
    cycleDay: D7,
    category: "speed",
    name: "Hybrid C10 D7 PM: Openers 2×15min (taper)",
    description: "Taper opener. 1-2 days before goal ride. 15min wu → 2×15min @ Z3 → 10min cd.",
    durationMin: 55,
    focus: "Openers",
  },
];

// ============================================================
// LONG RIDE D8 (endurance)
// ============================================================
const LONG: BikeTemplate[] = [
  {
    cycleNum: 1,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C1 D8: Long Z2 — 60km",
    description: "Z2 throughout (125-145 bpm). RPE 5-6/10. Don't chase speed. Eat early.",
    durationMin: 120,
    focus: "Z2",
  },
  {
    cycleNum: 2,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C2 D8: Long Z2 — 70km",
    description: "Z2 (125-145 bpm). Practice fuelling.",
    durationMin: 140,
    focus: "Z2",
  },
  {
    cycleNum: 3,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C3 D8: Long Z2 — 50km easy (deload)",
    description: "Deload long ride. Z1-low Z2. Café ride is fine.",
    durationMin: 100,
    focus: "Recovery",
  },
  {
    cycleNum: 4,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C4 D8: Long Z2 — 80km",
    description: "Z2 (130-145 bpm). Last 30min lifted to high Z2 / low Z3.",
    durationMin: 165,
    focus: "Z2",
  },
  {
    cycleNum: 5,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C5 D8: Long Z2 — 90km",
    description: "Z2. Practice exact race-day breakfast + bottles.",
    durationMin: 190,
    focus: "Z2",
  },
  {
    cycleNum: 6,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C6 D8: Long Z2 — 60km easy (deload)",
    description: "Deload. Z1-Z2 recovery.",
    durationMin: 130,
    focus: "Recovery",
  },
  {
    cycleNum: 7,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C7 D8: 100km TEST ride",
    description: "TEST. 100km at race-pace effort. Aim 30 kph avg. Note avg HR, avg speed, last-25km HR drift. KEY DATA POINT.",
    durationMin: 200,
    focus: "Race",
  },
  {
    cycleNum: 8,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C8 D8: 110km — practice fuelling",
    description: "110km Z2 with race-day fuelling exactly as planned. Longest ride of the plan.",
    durationMin: 220,
    focus: "Z2",
  },
  {
    cycleNum: 9,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C9 D8: 80km dress rehearsal",
    description: "Dress rehearsal. First 40km Z2. Last 40km at goal 30 kph pace. Race kit, bottles, breakfast.",
    durationMin: 165,
    focus: "Race-pace",
  },
  {
    cycleNum: 10,
    cycleDay: D8,
    category: "endurance",
    name: "Hybrid C10 D8: 100km GOAL RIDE",
    description: "RACE DAY. 100km sub-3:30 attempt (avg 28.6+ kph). Pacing: first 30km feel TOO easy, middle 40km at goal pace, last 30km empty the tank. 75-90g carbs/hr.",
    durationMin: 210,
    focus: "Race",
  },
];

const ALL_STRENGTH = [...SQUAT, ...BENCH, ...DEADLIFT, ...D7_UPPER];
const ALL_BIKE = [...BIKE_D2, ...BIKE_D7, ...LONG, ...COND];

async function main() {
  // Find or create the programme.
  const existing = await prisma.programme.findUnique({
    where: { name: PROGRAMME_NAME },
  });
  const programme = existing
    ? await prisma.programme.update({
        where: { id: existing.id },
        data: {
          description: PROGRAMME_DESCRIPTION,
          totalWeeks: 10,
          cycleLength: 9,
          isCustom: false,
        },
      })
    : await prisma.programme.create({
        data: {
          name: PROGRAMME_NAME,
          description: PROGRAMME_DESCRIPTION,
          totalWeeks: 10,
          cycleLength: 9,
          isCustom: false,
        },
      });
  console.log(
    `Programme: ${programme.name} (cycleLength=${programme.cycleLength}, totalCycles=${programme.totalWeeks})`,
  );

  // Detach any old templates from this programme (preserving any logs).
  // Then delete those that have no logs; keep + orphan the rest.
  const oldTemplates = await prisma.sessionTemplate.findMany({
    where: { programmeId: programme.id },
    include: { _count: { select: { logs: true } } },
  });
  let detachedKept = 0;
  let deleted = 0;
  for (const t of oldTemplates) {
    if (t._count.logs > 0) {
      await prisma.sessionTemplate.update({
        where: { id: t.id },
        data: { programmeId: null, weekNum: null, dayOfWeek: null },
      });
      detachedKept++;
    } else {
      await prisma.exerciseTemplate.deleteMany({
        where: { sessionTemplateId: t.id },
      });
      await prisma.sessionTemplate.delete({ where: { id: t.id } });
      deleted++;
    }
  }
  console.log(`Old templates: ${deleted} deleted, ${detachedKept} kept+detached (had logs)`);

  // Wipe and re-seed default schedule slots.
  await prisma.programmeSlot.deleteMany({
    where: { programmeId: programme.id },
  });
  for (const slot of DEFAULT_SLOTS) {
    await prisma.programmeSlot.create({
      data: { ...slot, programmeId: programme.id },
    });
  }
  console.log(`Default slots: ${DEFAULT_SLOTS.length} written`);

  // Strength templates with exercises.
  let strengthCreated = 0;
  let strengthUpdated = 0;
  for (const s of ALL_STRENGTH) {
    const existingT = await prisma.sessionTemplate.findFirst({
      where: { name: s.name },
    });
    const data = {
      category: s.category,
      phase: phaseForCycle(s.cycleNum),
      description: s.description,
      programmeId: programme.id,
      weekNum: s.cycleNum,
      dayOfWeek: s.cycleDay,
      isCustom: false,
    } as const;
    if (existingT) {
      await prisma.exerciseTemplate.deleteMany({
        where: { sessionTemplateId: existingT.id },
      });
      await prisma.sessionTemplate.update({
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
      strengthUpdated++;
    } else {
      await prisma.sessionTemplate.create({
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
      strengthCreated++;
    }
  }
  console.log(
    `Strength templates: ${strengthCreated} created, ${strengthUpdated} updated`,
  );

  // Bike + conditioning templates.
  let bikeCreated = 0;
  let bikeUpdated = 0;
  for (const b of ALL_BIKE) {
    const existingT = await prisma.sessionTemplate.findFirst({
      where: { name: b.name },
    });
    const data = {
      category: b.category,
      phase: phaseForCycle(b.cycleNum),
      description: b.description,
      durationMin: b.durationMin,
      focus: b.focus,
      programmeId: programme.id,
      weekNum: b.cycleNum,
      dayOfWeek: b.cycleDay,
      isCustom: false,
    } as const;
    if (existingT) {
      await prisma.sessionTemplate.update({
        where: { id: existingT.id },
        data,
      });
      bikeUpdated++;
    } else {
      await prisma.sessionTemplate.create({
        data: { name: b.name, ...data },
      });
      bikeCreated++;
    }
  }
  console.log(`Bike/Cond templates: ${bikeCreated} created, ${bikeUpdated} updated`);

  const total = ALL_STRENGTH.length + ALL_BIKE.length;
  console.log(
    `\nDone — ${total} templates (${ALL_STRENGTH.length} strength + ${ALL_BIKE.length} bike/cond)`,
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
