export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CATEGORY_META: Record<
  string,
  { label: string; color: string; textColor: string }
> = {
  legs: { label: "Legs", color: "#059669", textColor: "text-emerald-600" },
  chest: { label: "Chest", color: "#ea580c", textColor: "text-orange-600" },
  back: { label: "Back", color: "#7c3aed", textColor: "text-violet-600" },
  speed: { label: "Speed", color: "#d97706", textColor: "text-amber-600" },
  endurance: { label: "Endurance", color: "#2563eb", textColor: "text-blue-600" },
};

// JS Date.getDay() returns 0=Sun..6=Sat. Convert to 0=Mon..6=Sun.
export function dayOfWeekMonFirst(d: Date = new Date()): number {
  const js = d.getDay();
  return (js + 6) % 7;
}
