/**
 * When delegates may still change their choices — session/workshop interests,
 * accommodation, food. The cut-off is the event's registration deadline, not
 * the conference date: once registration closes the organising team needs the
 * numbers to stop moving, but everything stays editable right up to it.
 *
 * A null deadline means no cut-off has been set, so choices stay open. That is
 * the current state of IFPC 2026 — setting the date on the event turns this on.
 */
export type ChoicesWindow = {
  open: boolean;
  /** ISO instant the window closes, or null when no deadline is set. */
  closesAt: string | null;
};

export const OPEN_FOREVER: ChoicesWindow = { open: true, closesAt: null };

export function choicesWindow(deadline: Date | string | null | undefined, now = new Date()): ChoicesWindow {
  if (!deadline) return OPEN_FOREVER;
  const closes = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (Number.isNaN(closes.getTime())) return OPEN_FOREVER;
  return { open: now <= closes, closesAt: closes.toISOString() };
}

/** Human date for messages and banners, in the conference's own timezone. */
export function formatClosesAt(closesAt: string | null): string | null {
  if (!closesAt) return null;
  return new Date(closesAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

export function closedMessage(closesAt: string | null): string {
  const on = formatClosesAt(closesAt);
  return on
    ? `Changes closed when registration closed on ${on}. Contact the organising team if you need to change this.`
    : "Changes are closed. Contact the organising team if you need to change this.";
}
