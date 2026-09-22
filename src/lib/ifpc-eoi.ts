// Expression-of-interest categories for IFPC 2026. Derived from each session's
// own data (title / type / start time), so any session an admin adds lands in
// the right group automatically — no extra field to maintain.
/** Fired on window whenever a delegate's session selections change (pick, swap, remove). */
export const INTEREST_CHANGED_EVENT = "ifpc-interest-changed";

export type EoiCategory = "tour" | "yoga" | "morningWorkshop" | "afternoonWorkshop";

export const EOI_CATEGORIES: Record<EoiCategory, { label: string; single: boolean; rule: string }> = {
  tour: { label: "NIMHANS Campus Tour", single: true, rule: "Choose one day" },
  yoga: { label: "Yoga Sessions", single: false, rule: "Choose as many as you like" },
  morningWorkshop: { label: "Morning Workshop", single: true, rule: "Choose one" },
  afternoonWorkshop: { label: "Afternoon Workshop", single: true, rule: "Choose one" },
};

export const EOI_CATEGORY_ORDER: EoiCategory[] = ["tour", "yoga", "morningWorkshop", "afternoonWorkshop"];

export interface EoiSessionLike {
  title: string;
  sessionType?: string | null;
  startTime?: string | null;
}

// ponytail: title keywords + a 13:00 cut-off; add an explicit category field if admins need to override.
export function eoiCategoryOf(s: EoiSessionLike): EoiCategory | null {
  const title = s.title.toLowerCase();
  if (title.includes("tour")) return "tour";
  if (title.includes("yoga")) return "yoga";
  if (s.sessionType === "WORKSHOP") {
    // "HH:MM" compares correctly as a string; a workshop with no time counts as morning.
    return (s.startTime ?? "00:00").padStart(5, "0") < "13:00" ? "morningWorkshop" : "afternoonWorkshop";
  }
  return null;
}

/** Session start as an instant (the conference runs in IST); null when undated. */
export function sessionStartsAt(s: { sessionDate?: string | Date | null; startTime?: string | null }): Date | null {
  if (!s.sessionDate) return null;
  const day = (typeof s.sessionDate === "string" ? s.sessionDate : s.sessionDate.toISOString()).slice(0, 10);
  const time = (s.startTime ?? "00:00").padStart(5, "0");
  const d = new Date(`${day}T${time}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface UpNextItem {
  sessionId: string;
  title: string;
  sessionDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface UpNextMessage {
  sessionId: string;
  text: string;
  tone: "now" | "soon" | "today" | "next";
}

function minutesText(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Live notices about the delegate's own selections: happening now, starting soon, later today, else the next one. */
export function upNextMessages(items: UpNextItem[], now: Date, limit = 3): UpNextMessage[] {
  const out: UpNextMessage[] = [];
  let next: { item: UpNextItem; start: Date } | null = null;
  for (const item of items) {
    const start = sessionStartsAt(item);
    if (!start) continue;
    const end = (item.endTime && sessionStartsAt({ sessionDate: item.sessionDate, startTime: item.endTime })) || new Date(start.getTime() + 60 * 60000);
    const mins = Math.ceil((start.getTime() - now.getTime()) / 60000);
    if (start <= now && now < end) out.push({ sessionId: item.sessionId, text: `${item.title} is happening now`, tone: "now" });
    else if (mins > 0 && mins <= 60) out.push({ sessionId: item.sessionId, text: `Starting ${item.title} in ${minutesText(mins)}`, tone: "soon" });
    else if (mins > 60 && mins <= 24 * 60) out.push({ sessionId: item.sessionId, text: `Starting ${item.title} in ${minutesText(mins)}`, tone: "today" });
    if (mins > 0 && (!next || start < next.start)) next = { item, start };
  }
  const order = { now: 0, soon: 1, today: 2, next: 3 };
  out.sort((a, b) => order[a.tone] - order[b.tone]);
  if (out.length === 0 && next) {
    const day = next.start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    out.push({ sessionId: next.item.sessionId, text: `Next up: ${next.item.title} — ${day}${next.item.startTime ? ` at ${next.item.startTime}` : ""}`, tone: "next" });
  }
  return out.slice(0, limit);
}
