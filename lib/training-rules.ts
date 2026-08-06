import type { SessionTemplate } from "@prisma/client";

export type Severity = "warn" | "info";

export type SessionWarning = {
  rule: string;
  severity: Severity;
  message: string;
  citation: string;
};

export type RecentLog = {
  loggedAt: Date;
  template: { name: string; category: string; focus?: string | null };
};

const BIKE_CATS = ["speed", "endurance", "conditioning"];
const STRENGTH = ["legs", "chest", "back"];
const HARD_BIKE_FOCUSES = new Set([
  "VO2max",
  "Sprint",
  "Threshold",
  "Anaerobic",
  "Race-pace",
  "Race",
  "Sweetspot",
]);
const HARD_STRENGTH_NAME = /heavy|max|peak|power/i;

// True if the session is high-intensity glycolytic / threshold work
// that should be limited to ~2-3 sessions per week per polarised
// training research (Seiler 2010, Esteve-Lanao 2007).
export function isHardSession(s: {
  category: string;
  name: string;
  focus?: string | null;
}): boolean {
  if (s.category === "conditioning") return true;
  if (s.category === "speed") {
    // Speed bike: hard unless explicitly recovery/openers/cadence
    if (s.focus && !HARD_BIKE_FOCUSES.has(s.focus)) return false;
    return true;
  }
  if (s.category === "endurance") {
    // Endurance is generally easy unless the focus says otherwise —
    // sweetspot, threshold, and race/race-pace long rides are all
    // high-load days that must count toward the weekly hard total.
    return s.focus != null && HARD_BIKE_FOCUSES.has(s.focus);
  }
  if (STRENGTH.includes(s.category)) {
    return HARD_STRENGTH_NAME.test(s.name);
  }
  return false;
}

export function getSessionWarnings(
  currentSession: Pick<SessionTemplate, "category" | "name" | "focus">,
  todayDate: Date,
  recentLogs: RecentLog[],
  isEditingExisting: boolean,
): SessionWarning[] {
  const warnings: SessionWarning[] = [];
  if (isEditingExisting) return warnings;

  const currentCat = currentSession.category;

  // Rule A: Same-day session already completed within 6 hours.
  // Interference only applies when the bike work is HARD — an easy Z2
  // spin after lifting is low-conflict, and lifting-then-riding is
  // actually the favourable order (Murlasits et al. 2018 meta; Eddens
  // et al. 2018). Molecular basis for the 3-6h window: Fyfe et al.
  // 2014 (AMPK-mTOR competition).
  const todayLogs = recentLogs.filter((l) => isSameDay(l.loggedAt, todayDate));
  if (todayLogs.length > 0) {
    const lastLog = todayLogs.reduce((latest, l) =>
      new Date(l.loggedAt) > new Date(latest.loggedAt) ? l : latest,
    );
    const last = {
      category: lastLog.template.category,
      name: lastLog.template.name,
      focus: lastLog.template.focus ?? null,
    };
    const hoursSince =
      (todayDate.getTime() - new Date(lastLog.loggedAt).getTime()) / 3600000;
    const isInterference =
      (isHardBike(currentSession) && STRENGTH.includes(last.category)) ||
      (STRENGTH.includes(currentCat) && isHardBike(last)) ||
      (isHardBike(currentSession) && isHardBike(last));
    if (isInterference && hoursSince < 6) {
      warnings.push({
        rule: "same-day-interference",
        severity: "warn",
        message: `You logged ${lastLog.template.name} ${hoursSince.toFixed(1)}h ago. Separating hard sessions by 6+ hours improves adaptations to both; if stacking is unavoidable, lift first.`,
        citation: "Fyfe et al. 2014; Murlasits et al. 2018",
      });
    }
  }

  // Rule B: consecutive hard days, in two evidence-backed flavours.
  const yesterdayLogs = recentLogs.filter((l) =>
    isYesterday(l.loggedAt, todayDate),
  );
  if (yesterdayLogs.length > 0) {
    const tpl = (l: RecentLog) => ({
      category: l.template.category,
      name: l.template.name,
      focus: l.template.focus ?? null,
    });
    // B1: hard bike yesterday, hard anything today.
    const yesterdayHardBike = yesterdayLogs.some((l) => isHardBike(tpl(l)));
    const todayIsHard =
      isHardBike(currentSession) || isHeavyLowerBody(currentSession);
    if (yesterdayHardBike && todayIsHard) {
      warnings.push({
        rule: "back-to-back-hard",
        severity: "info",
        message: `Yesterday was a hard session. Two consecutive high-intensity days can compromise quality. If you feel fatigued, consider easing today's intensity.`,
        citation: "Polarized training research, Seiler 2010",
      });
    }
    // B2: heavy lower-body lifting yesterday, hard bike today.
    // Neuromuscular deficits from a heavy lower-body bout persist
    // 24-48h (resolving by ~72h) and degrade subsequent endurance
    // quality (Doma & Deakin 2017, Sports Medicine).
    const yesterdayHeavyLower = yesterdayLogs.some((l) =>
      isHeavyLowerBody(tpl(l)),
    );
    if (yesterdayHeavyLower && isHardBike(currentSession)) {
      warnings.push({
        rule: "heavy-legs-before-hard-bike",
        severity: "info",
        message: `Heavy lower-body lifting was less than 24h ago — leg fatigue persists 24-48h and can blunt today's high-intensity quality. Expect reduced numbers, or swap with an easier day.`,
        citation: "Doma & Deakin 2017, Sports Medicine",
      });
    }
  }

  // Rule C: Weekly intensity overload. If today's session is hard and
  // 2+ hard sessions have already been logged in the last 7 days,
  // adding this would push to 3+ hard sessions/week — above Seiler's
  // ~2 hard sessions/week polarised guideline.
  const todayIsHard = isHardSession({
    category: currentCat,
    name: currentSession.name,
    focus: currentSession.focus,
  });
  if (todayIsHard) {
    const sevenDaysAgo = todayDate.getTime() - 7 * 24 * 60 * 60 * 1000;
    const hardLast7 = recentLogs.filter(
      (l) =>
        new Date(l.loggedAt).getTime() >= sevenDaysAgo &&
        isHardSession({
          category: l.template.category,
          name: l.template.name,
          focus: l.template.focus ?? null,
        }),
    );
    if (hardLast7.length >= 2) {
      // Softened from a hard warning: the "~2 hard sessions/week"
      // figure is Seiler's observation of elite training, not a
      // validated ceiling — and for recreational athletes a pyramidal
      // mix is as effective as strict polarised (Rosenblat et al.
      // 2025, Sports Med network meta-analysis). The real rule is
      // keeping easy days genuinely easy.
      warnings.push({
        rule: "weekly-intensity-high",
        severity: "info",
        message: `This would be hard session ${hardLast7.length + 1} in 7 days. Most trained athletes settle around 2-3 quality sessions a week — fine if you're recovering well, but make sure the easy days stay genuinely easy.`,
        citation: "Seiler 2010; Rosenblat et al. 2025, Sports Medicine",
      });
    }
  }

  // Stack: warn before info.
  warnings.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "warn" ? -1 : 1;
  });
  return warnings;
}

// Counts hard sessions in a given list of (category, name, focus)
// tuples — useful for pre-flighting a week's schedule before any
// session is logged.
export function countHardSessions(
  sessions: Array<{
    category: string;
    name: string;
    focus?: string | null;
  }>,
): number {
  return sessions.filter(isHardSession).length;
}

// A bike/metcon session that's actually hard — category alone isn't
// enough (a Z2 recovery spin is category "speed" but not hard).
function isHardBike(s: {
  category: string;
  name: string;
  focus?: string | null;
}): boolean {
  return BIKE_CATS.includes(s.category) && isHardSession(s);
}

// Heavy lower-body strength work — squat/deadlift days (category
// legs or back) that aren't deload/taper/mobility sessions. Used for
// the 24-48h neuromuscular-recovery rule (Doma & Deakin 2017).
function isHeavyLowerBody(
  s: Pick<SessionTemplate, "category" | "name">,
): boolean {
  if (s.category !== "legs" && s.category !== "back") return false;
  if (/deload|taper|mobility/i.test(s.name)) return false;
  return /squat|deadlift/i.test(s.name) || HARD_STRENGTH_NAME.test(s.name);
}

function isSameDay(a: Date | string, b: Date): boolean {
  const da = typeof a === "string" ? new Date(a) : a;
  return (
    da.getFullYear() === b.getFullYear() &&
    da.getMonth() === b.getMonth() &&
    da.getDate() === b.getDate()
  );
}

function isYesterday(a: Date | string, today: Date): boolean {
  const da = typeof a === "string" ? new Date(a) : a;
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  return isSameDay(da, y);
}
