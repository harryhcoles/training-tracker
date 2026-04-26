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
  template: { name: string; category: string };
};

const HARD_BIKE = ["speed", "conditioning"];
const STRENGTH = ["legs", "chest", "back"];

export function getSessionWarnings(
  currentSession: Pick<SessionTemplate, "category" | "name">,
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

  // Stack: warn before info.
  warnings.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "warn" ? -1 : 1;
  });
  return warnings;
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
