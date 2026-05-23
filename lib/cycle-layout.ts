// Calendar-aware placement for an N-day cycle. Given a cycle start
// date, returns an array of cycleDay → categoryIds[] respecting the
// hard constraints the user enforces:
//
//   - "conditioning" only ever lands on Mon / Wed / Fri
//   - "endurance" (long ride) only ever lands on Sat / Sun
//
// Other strength + bike sessions are placed around those anchors with
// best-effort recovery spacing. The cycle still progresses by cycleNum
// for periodisation purposes (load + intensity).
//
// Output is per-cycle so the front-end can render the actual calendar
// shape rather than a fixed D1..D9 template that drifts week-to-week.

export type CycleDayPlacement = {
  cycleDay: number;
  weekday: number; // 0=Mon..6=Sun (Mon-first)
  categories: string[]; // empty = rest day
};

const MON = 0,
  WED = 2,
  FRI = 4,
  SAT = 5,
  SUN = 6;

function monFirst(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function layoutCycle(
  startDate: Date,
  cycleLength: number,
): CycleDayPlacement[] {
  // Calendar weekday for each cycle day.
  const weekdays: number[] = [];
  for (let d = 0; d < cycleLength; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    weekdays.push(monFirst(date));
  }

  const slots: string[][] = Array.from({ length: cycleLength }, () => []);
  const taken = (d: number) => slots[d].length > 0;

  // 1) Long ride: latest Sat in the cycle; fall back to latest Sun.
  let lrDay = -1;
  for (let d = cycleLength - 1; d >= 0; d--) {
    if (weekdays[d] === SAT) {
      lrDay = d;
      break;
    }
  }
  if (lrDay === -1) {
    for (let d = cycleLength - 1; d >= 0; d--) {
      if (weekdays[d] === SUN) {
        lrDay = d;
        break;
      }
    }
  }
  if (lrDay !== -1) slots[lrDay].push("endurance");

  // 2) Conditioning: Mon/Wed/Fri that is at least 2 days away from the
  //    long ride. Prefer one that's also not adjacent to cycle day 0
  //    (often the squat day) so we don't double-stack leg fatigue.
  let condDay = -1;
  const isMWF = (w: number) => w === MON || w === WED || w === FRI;
  const condCandidates: number[] = [];
  for (let d = 0; d < cycleLength; d++) {
    if (taken(d)) continue;
    if (!isMWF(weekdays[d])) continue;
    if (lrDay !== -1 && Math.abs(d - lrDay) <= 1) continue;
    condCandidates.push(d);
  }
  if (condCandidates.length > 0) {
    // Prefer one that's at least 2 days from cycle start (squat will
    // anchor there). If all are too close, just take the earliest.
    condDay = condCandidates.find((d) => d >= 2) ?? condCandidates[0];
  } else {
    // Last-resort fallback — any M/W/F even if adjacent to long ride.
    for (let d = 0; d < cycleLength; d++) {
      if (!taken(d) && isMWF(weekdays[d])) {
        condDay = d;
        break;
      }
    }
  }
  if (condDay !== -1) slots[condDay].push("conditioning");

  // 3) OHP+pull + Threshold (double, back+speed): the day before the
  //    long ride. Acts as openers + posterior chain pump.
  if (lrDay - 1 >= 0 && !taken(lrDay - 1)) {
    slots[lrDay - 1].push("back");
    slots[lrDay - 1].push("speed");
  }

  // 4) Deadlift (back, solo): 2-3 days before the long ride.
  for (const offset of [2, 3]) {
    const d = lrDay - offset;
    if (d >= 0 && !taken(d)) {
      slots[d].push("back");
      break;
    }
  }

  // 5) Squat (legs): first empty slot that isn't adjacent to conditioning
  //    (so the metcon doesn't land 24h after heavy squats).
  for (let d = 0; d < cycleLength; d++) {
    if (taken(d)) continue;
    if (condDay !== -1 && Math.abs(d - condDay) <= 1) continue;
    slots[d].push("legs");
    break;
  }
  // Fallback if no slot satisfied the adjacency rule.
  if (!slots.some((s) => s.includes("legs"))) {
    for (let d = 0; d < cycleLength; d++) {
      if (!taken(d)) {
        slots[d].push("legs");
        break;
      }
    }
  }

  // 6) Bench (chest): 2 days after squat ideally; otherwise next empty.
  const squatDay = slots.findIndex((s) => s.includes("legs"));
  let benchPlaced = false;
  for (const offset of [2, 3, 1, 4]) {
    const d = squatDay + offset;
    if (d < cycleLength && !taken(d)) {
      slots[d].push("chest");
      benchPlaced = true;
      break;
    }
  }
  if (!benchPlaced) {
    for (let d = 0; d < cycleLength; d++) {
      if (!taken(d)) {
        slots[d].push("chest");
        break;
      }
    }
  }

  // 7) VO2 bike (speed, solo): between squat and the long-ride double.
  //    Should sit 24h+ from squat and 24h+ from conditioning.
  let voPlaced = false;
  for (let d = 0; d < cycleLength; d++) {
    if (taken(d)) continue;
    if (squatDay !== -1 && Math.abs(d - squatDay) < 1) continue;
    if (condDay !== -1 && Math.abs(d - condDay) <= 1) continue;
    slots[d].push("speed");
    voPlaced = true;
    break;
  }
  if (!voPlaced) {
    for (let d = 0; d < cycleLength; d++) {
      if (!taken(d)) {
        slots[d].push("speed");
        break;
      }
    }
  }

  return slots.map((cats, d) => ({
    cycleDay: d,
    weekday: weekdays[d],
    categories: cats,
  }));
}
