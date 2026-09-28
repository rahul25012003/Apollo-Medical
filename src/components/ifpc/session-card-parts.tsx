import { Presentation, Flower2, Landmark, Trophy, Mic2, Clock, Timer } from "lucide-react";
import type { IfpcCardStat } from "./IfpcCard";

/** Avatar icon for a session card, chosen from what the session already is. */
export function SessionTypeIcon({ type, title }: { type: string; title: string }) {
  const t = title.toLowerCase();
  const Icon = t.includes("yoga") ? Flower2 : t.includes("tour") ? Landmark
    : type === "WORKSHOP" ? Presentation : type === "COMPETITION" ? Trophy : Mic2;
  return <Icon className="h-7 w-7" aria-hidden="true" />;
}

const minutes = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };

/** Time and length, taken from the session's own start and end. */
export function sessionStats(s: { startTime?: string | null; endTime?: string | null }): IfpcCardStat[] {
  if (!s.startTime) return [];
  const stats: IfpcCardStat[] = [{ icon: Clock, value: `${s.startTime}${s.endTime ? `–${s.endTime}` : ""}`, label: "time" }];
  if (s.endTime) {
    const mins = minutes(s.endTime) - minutes(s.startTime);
    if (mins > 0) {
      const h = Math.floor(mins / 60), m = mins % 60;
      stats.push({ icon: Timer, value: h ? `${h}${m ? `.${Math.round((m / 60) * 10)}` : ""} hr${h === 1 && !m ? "" : "s"}` : `${m} min`, label: "duration" });
    }
  }
  return stats;
}
