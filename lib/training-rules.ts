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

const HARD_BIKE = ["speed", "conditioning"];
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
    // Endurance is generally easy unless it's a sweetspot session.
    return s.focus === "Sweetspot";
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
  // Schumann et al. 2022 (Sports Medicine) — concurrent training
  // impairs explosive strength when sessions are stacked too close;
  // 6h separation is conservative based on glycogen restoration data.
  const todayLogs = recentLogs.filter((l) => isSameDay(l.loggedAt, todayDate));
  if (todayLogs.length > 0) {
    const lastLog = todayLogs.reduce((latest, l) =>
      new Date(l.loggedAt) > new Date(latest.loggedAt) ? l : latest,
    );
    const lastCat = lastLog.template.category;
    const hoursSince =
      (todayDate.getTime() - new Date(lastLog.loggedAt).getTime()) / 3600000;
    const isInterference =
      (HARD_BIKE.includes(currentCat) && STRENGTH.includes(lastCat)) ||
      (STRENGTH.includes(currentCat) && HARD_BIKE.includes(lastCat)) ||
      (HARD_BIKE.includes(currentCat) && HARD_BIKE.includes(lastCat));
    if (isInterference && hoursSince < 6) {
      warnings.push({
        rule: "same-day-interference",
        severity: "warn",
        message: `You logged ${lastLog.template.name} ${hoursSince.toFixed(1)}h ago. Research shows separating hard sessions by 6+ hours improves adaptations to both.`,
        citation: "Schumann et al. 2022, Sports Medicine",
      });
    }
  }

  // Rule B: Yesterday hard, today hard.
  const yesterdayLogs = recentLogs.filter((l) =>
    isYesterday(l.loggedAt, todayDate),
  );
  if (yesterdayLogs.length > 0) {
    const yesterdayWasHard = yesterdayLogs.some((l) =>
      HARD_BIKE.includes(l.template.category),
    );
    const todayIsHard =
      HARD_BIKE.includes(currentCat) || isHeavyLegs(currentSession);
    if (yesterdayWasHard && todayIsHard) {
      warnings.push({
        rule: "back-to-back-hard",
        severity: "info",
        message: `Yesterday was a hard session. Two consecutive high-intensity days can compromise quality. If you feel fatigued, consider easing today's intensity.`,
        citation: "Polarized training research, Seiler 2010",
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
      warnings.push({
        rule: "weekly-intensity-high",
        severity: "warn",
        message: `${hardLast7.length} hard sessions already in the last 7 days. This would make ${hardLast7.length + 1}. Polarised training data suggests ~80% easy / ~20% hard — consider easing this one or swapping for Z2 / recovery.`,
        citation: "Seiler 2010, Polarized training; Esteve-Lanao 2007",
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

function isHeavyLegs(s: Pick<SessionTemplate, "category" | "name">): boolean {
  return s.category === "legs" && /heavy|max|peak|power/i.test(s.name);
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
