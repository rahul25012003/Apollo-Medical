// Expression-of-interest categories for IFPC 2026. Derived from each session's
// own data (title / type / start time), so any session an admin adds lands in
// the right group automatically — no extra field to maintain.
/** Fired on window whenever a delegate's session selections change (pick, swap, remove). */
export const INTEREST_CHANGED_EVENT = "ifpc-interest-changed";

/**
 * Selection groups:
 *   "workshop:<YYYY-MM-DD>:am|pm" — one pick per day per half-day, among the
 *                                   Audi 1/2/3 workshops in that slot
 *   "yoga"                        — any number of the daily yoga sessions
 *   "tour"                        — exactly one of the campus tour slots
 */
export type EoiCategory = string;

export interface EoiRule {
  label: string;
  single: boolean;
  rule: string;
  /** Sort key: workshops by day then slot, then yoga, then the tour. */
  order: string;
}

/** Day 1 of IFPC 2026. Workshop and feedback labels count days from here. */
export const IFPC_DAY_ONE = "2026-11-02";

export function conferenceDay(date: string): number {
  const ms = Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${IFPC_DAY_ONE}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

export interface EoiSessionLike {
  title: string;
  sessionType?: string | null;
  sessionDate?: string | Date | null;
  startTime?: string | null;
}

const dayOf = (d: string | Date | null | undefined) =>
  d ? (typeof d === "string" ? d : d.toISOString()).slice(0, 10) : null;

// ponytail: title keywords + a 13:00 cut-off; add an explicit category field if admins need to override.
export function eoiCategoryOf(s: EoiSessionLike): EoiCategory | null {
  const title = s.title.toLowerCase();
  if (title.includes("tour")) return "tour";
  if (title.includes("yoga")) return "yoga";
  if (s.sessionType === "WORKSHOP") {
    // "HH:MM" compares correctly as a string; a workshop with no time counts as morning.
    const half = (s.startTime ?? "00:00").padStart(5, "0") < "13:00" ? "am" : "pm";
    return `workshop:${dayOf(s.sessionDate) ?? "tba"}:${half}`;
  }
  return null;
}

export function eoiRule(cat: EoiCategory): EoiRule {
  if (cat === "tour") return { label: "NIMHANS Campus Tour", single: true, rule: "Choose one slot", order: "3" };
  if (cat === "yoga") return { label: "Yoga Sessions", single: false, rule: "Choose as many as you like", order: "2" };
  const [, date, half] = cat.split(":");
  const slot = half === "pm" ? "Afternoon" : "Morning";
  const label = date === "tba" ? `${slot} Workshop` : `Day ${conferenceDay(date)} ${slot} Workshop`;
  return { label, single: true, rule: "Choose one", order: `1:${date}:${half}` };
}

/** Stable display order for a set of categories. */
export function sortEoiCategories(cats: EoiCategory[]): EoiCategory[] {
  return [...cats].sort((a, b) => eoiRule(a).order.localeCompare(eoiRule(b).order));
}

export interface TimedSession {
  sessionDate?: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * True when two sessions share any minute on the same day. Used to stop a
 * delegate choosing, say, the morning campus tour and a morning workshop on
 * the same day. A session without an end time is treated as one hour long.
 */
export function sessionsOverlap(a: TimedSession, b: TimedSession): boolean {
  const da = dayOf(a.sessionDate), db = dayOf(b.sessionDate);
  if (!da || !db || da !== db || !a.startTime || !b.startTime) return false;
  const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  const as = mins(a.startTime), bs = mins(b.startTime);
  const ae = a.endTime ? mins(a.endTime) : as + 60;
  const be = b.endTime ? mins(b.endTime) : bs + 60;
  return as < be && bs < ae;
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
