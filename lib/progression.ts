export type Phase = "base" | "build" | "peak";

export function getCurrentPhase(week: number): Phase {
  if (week <= 4) return "base";
  if (week <= 8) return "build";
  return "peak";
}
