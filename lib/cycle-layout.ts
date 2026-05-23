// Calendar-aware placement for an N-day cycle.
//
// Hard constraints:
//   - "conditioning" only ever lands on Mon / Wed / Fri
//   - "endurance" (long ride) only ever lands on Sat / Sun
//
// Recovery objectives (scored, not enforced):
//   - 48h+ between squat and deadlift (heavy CNS spacing)
//   - VO2 24h+ from the long ride (long-ride recovery)
//   - Rest days distributed (one mid-cycle, one post-long-ride)
//   - Conditioning not adjacent to squat or deadlift (no double leg fatigue)
//   - OHP+pull+threshold sits day-before long ride (openers)
//
// The function evaluates multiple candidate placements (each pairing
// of a long-ride day × conditioning day) and returns the highest-
// scoring layout. Fallback heuristics handle pathological cycles where
// no constraint set has both anchors available.

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

function computeWeekdays(startDate: Date, cycleLength: number): number[] {
  const out: number[] = [];
  for (let d = 0; d < cycleLength; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    out.push(monFirst(date));
  }
  return out;
}

// Pick the best long-ride candidate (Sat preferred, then Sun) and
// the best conditioning candidate (M/W/F not adjacent to long ride),
// then place strength + bike sessions around them with intentional
// recovery placement.
function placeAround(
  cycleLength: number,
  weekdays: number[],
  lrDay: number,
  condDay: number,
): string[][] {
  const slots: string[][] = Array.from({ length: cycleLength }, () => []);
  const taken = (d: number) => slots[d].length > 0;

  // Long ride anchor.
  if (lrDay >= 0) slots[lrDay].push("endurance");
  // Conditioning anchor.
  if (condDay >= 0) slots[condDay].push("conditioning");

  // Day-before long ride = OHP+pull + threshold (openers double).
  if (lrDay - 1 >= 0 && !taken(lrDay - 1)) {
    slots[lrDay - 1].push("back");
    slots[lrDay - 1].push("speed");
  }

  // Day-after long ride = intentional REST (don't place anything).
  // We track which days we WANT to keep empty so the rest of the
  // placement skips them.
  const reservedRest = new Set<number>();
  if (lrDay + 1 < cycleLength) reservedRest.add(lrDay + 1);
  // Day after conditioning (if there's a strength block coming) =
  // intentional REST. Place mid-cycle break here.
  if (condDay + 1 < cycleLength && condDay + 1 !== lrDay) {
    reservedRest.add(condDay + 1);
  }

  // Deadlift: 2-3 days before long ride, not adjacent to conditioning.
  let dlPlaced = false;
  for (const offset of [2, 3]) {
    const d = lrDay - offset;
    if (
      d >= 0 &&
      !taken(d) &&
      !reservedRest.has(d) &&
      Math.abs(d - condDay) >= 2
    ) {
      slots[d].push("back");
      dlPlaced = true;
      break;
    }
  }
  if (!dlPlaced) {
    // Soften: allow adjacent to conditioning if needed.
    for (const offset of [2, 3]) {
      const d = lrDay - offset;
      if (d >= 0 && !taken(d) && !reservedRest.has(d)) {
        slots[d].push("back");
        dlPlaced = true;
        break;
      }
    }
  }
  const dlDay = slots.findIndex((s, i) => s.length === 1 && s[0] === "back" && i !== lrDay - 1);

  // Squat: first empty day at start, not adjacent to conditioning,
  // not adjacent to deadlift, not in reserved rest.
  let squatPlaced = false;
  for (let d = 0; d < cycleLength; d++) {
    if (taken(d) || reservedRest.has(d)) continue;
    if (Math.abs(d - condDay) <= 1) continue;
    if (dlDay !== -1 && Math.abs(d - dlDay) <= 1) continue;
    slots[d].push("legs");
    squatPlaced = true;
    break;
  }
  // Fallback: relax adjacency to conditioning.
  if (!squatPlaced) {
    for (let d = 0; d < cycleLength; d++) {
      if (taken(d) || reservedRest.has(d)) continue;
      if (dlDay !== -1 && Math.abs(d - dlDay) <= 1) continue;
      slots[d].push("legs");
      squatPlaced = true;
      break;
    }
  }
  // Last resort: any free day.
  if (!squatPlaced) {
    for (let d = 0; d < cycleLength; d++) {
      if (!taken(d)) {
        slots[d].push("legs");
        break;
      }
    }
  }
  const squatDay = slots.findIndex((s) => s.includes("legs"));

  // VO2 bike: 24-48h after squat ideally; avoid being within 24h of
  // long ride (the worst placement) and within 24h of conditioning
  // (similar energy system).
  let voPlaced = false;
  const voOffsets = [1, 2, 3, 4];
  for (const off of voOffsets) {
    const d = squatDay + off;
    if (d >= cycleLength) continue;
    if (taken(d) || reservedRest.has(d)) continue;
    if (Math.abs(d - lrDay) <= 1) continue; // never adjacent to long ride
    if (condDay !== -1 && Math.abs(d - condDay) <= 1) continue;
    slots[d].push("speed");
    voPlaced = true;
    break;
  }
  // Fallback: relax conditioning adjacency.
  if (!voPlaced) {
    for (let d = 0; d < cycleLength; d++) {
      if (taken(d) || reservedRest.has(d)) continue;
      if (Math.abs(d - lrDay) <= 1) continue;
      slots[d].push("speed");
      voPlaced = true;
      break;
    }
  }
  // Last resort.
  if (!voPlaced) {
    for (let d = 0; d < cycleLength; d++) {
      if (!taken(d)) {
        slots[d].push("speed");
        break;
      }
    }
  }

  // Bench: 24-48h after squat, before/after deadlift, not back-to-back
  // with squat ideally.
  let benchPlaced = false;
  for (const off of [2, 3, 1, 4]) {
    const d = squatDay + off;
    if (d >= cycleLength) continue;
    if (taken(d) || reservedRest.has(d)) continue;
    slots[d].push("chest");
    benchPlaced = true;
    break;
  }
  if (!benchPlaced) {
    // Allow placement before squat as a fallback.
    for (let d = 0; d < cycleLength; d++) {
      if (taken(d) || reservedRest.has(d)) continue;
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

  return slots;
}

// Score a layout by how well it respects recovery objectives.
function scoreLayout(
  slots: string[][],
  weekdays: number[],
): number {
  let score = 0;
  const cycleLength = slots.length;
  const lrDay = slots.findIndex((s) => s.includes("endurance"));
  const condDay = slots.findIndex((s) => s.includes("conditioning"));
  const squatDay = slots.findIndex((s) => s.includes("legs"));
  // Deadlift day = the cycleDay that has "back" alone (no speed).
  const dlDay = slots.findIndex(
    (s) => s.includes("back") && !s.includes("speed"),
  );
  const voDay = slots.findIndex(
    (s) => s.includes("speed") && !s.includes("back") && !s.includes("endurance"),
  );
  // OHP+pull+threshold day = "back" + "speed" together.
  const ohpDay = slots.findIndex(
    (s) => s.includes("back") && s.includes("speed"),
  );

  // Squat ↔ deadlift gap.
  if (squatDay >= 0 && dlDay >= 0) {
    const gap = Math.abs(squatDay - dlDay);
    if (gap >= 2) score += 20;
    else score -= 10;
  }

  // VO2 distance from long ride.
  if (voDay >= 0 && lrDay >= 0) {
    const gap = Math.abs(voDay - lrDay);
    if (gap <= 1) score -= 30;
    else score += 10;
  }

  // VO2 24-48h after squat is the ideal placement.
  if (voDay >= 0 && squatDay >= 0) {
    const gap = voDay - squatDay;
    if (gap === 1 || gap === 2) score += 15;
    else if (gap < 0) score -= 5;
  }

  // OHP+pull+threshold should sit day-before long ride.
  if (ohpDay >= 0 && lrDay >= 0 && ohpDay === lrDay - 1) score += 15;

  // Conditioning not adjacent to squat or deadlift.
  if (condDay >= 0 && squatDay >= 0 && Math.abs(condDay - squatDay) >= 2)
    score += 10;
  if (condDay >= 0 && dlDay >= 0 && Math.abs(condDay - dlDay) >= 2)
    score += 10;

  // Rest day distribution: prefer rest days that are NOT adjacent to
  // each other (clustered rests waste recovery time).
  const restDays: number[] = [];
  for (let d = 0; d < cycleLength; d++) {
    if (slots[d].length === 0) restDays.push(d);
  }
  if (restDays.length >= 2) {
    let minGap = Infinity;
    for (let i = 1; i < restDays.length; i++) {
      const g = restDays[i] - restDays[i - 1];
      if (g < minGap) minGap = g;
    }
    if (minGap >= 3) score += 20;
    else if (minGap === 2) score += 10;
    else score -= 10; // adjacent rests
  }

  // Post-long-ride rest is a strong signal.
  if (lrDay + 1 < cycleLength && slots[lrDay + 1].length === 0) score += 15;

  // Squat near cycle start.
  if (squatDay >= 0 && squatDay <= 2) score += 5;
  // Long ride near end of cycle (the original plan's intent).
  if (lrDay >= 0 && lrDay >= cycleLength - 3) score += 5;

  return score;
}

export function layoutCycle(
  startDate: Date,
  cycleLength: number,
): CycleDayPlacement[] {
  const weekdays = computeWeekdays(startDate, cycleLength);

  // Long-ride candidates: any Sat or Sun in the cycle.
  const lrCandidates: number[] = [];
  for (let d = cycleLength - 1; d >= 0; d--) {
    if (weekdays[d] === SAT || weekdays[d] === SUN) lrCandidates.push(d);
  }
  if (lrCandidates.length === 0) lrCandidates.push(cycleLength - 2); // fallback

  // Conditioning candidates: any M/W/F not adjacent to long ride.
  const condCandidatesFor = (lr: number): number[] => {
    const out: number[] = [];
    for (let d = 0; d < cycleLength; d++) {
      if (d === lr) continue;
      if (weekdays[d] !== MON && weekdays[d] !== WED && weekdays[d] !== FRI)
        continue;
      if (Math.abs(d - lr) <= 1) continue;
      out.push(d);
    }
    return out;
  };

  let bestLayout: string[][] | null = null;
  let bestScore = -Infinity;

  for (const lr of lrCandidates) {
    const condCands = condCandidatesFor(lr);
    if (condCands.length === 0) continue;
    for (const cond of condCands) {
      const layout = placeAround(cycleLength, weekdays, lr, cond);
      const score = scoreLayout(layout, weekdays);
      if (score > bestScore) {
        bestScore = score;
        bestLayout = layout;
      }
    }
  }

  // Last-resort fallback: relax the conditioning constraint.
  if (!bestLayout) {
    for (const lr of lrCandidates) {
      for (let cond = 0; cond < cycleLength; cond++) {
        if (
          weekdays[cond] !== MON &&
          weekdays[cond] !== WED &&
          weekdays[cond] !== FRI
        )
          continue;
        if (cond === lr) continue;
        const layout = placeAround(cycleLength, weekdays, lr, cond);
        const score = scoreLayout(layout, weekdays);
        if (score > bestScore) {
          bestScore = score;
          bestLayout = layout;
        }
      }
    }
  }

  const final = bestLayout ?? Array.from({ length: cycleLength }, () => []);
  return final.map((cats, d) => ({
    cycleDay: d,
    weekday: weekdays[d],
    categories: cats,
  }));
}
