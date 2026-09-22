"use client";

import { useEffect, useState } from "react";
import { EOI_CATEGORIES, INTEREST_CHANGED_EVENT, eoiCategoryOf, sessionStartsAt, upNextMessages, type UpNextMessage } from "@/lib/ifpc-eoi";

export interface MySessionInterest {
  sessionId: string;
  title: string;
  sessionType: string;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  hall: string | null;
}

export interface MySelection extends MySessionInterest {
  label: string;
  startsAt: Date | null;
}

export function sortSelections(items: MySelection[], now = new Date()): MySelection[] {
  const rank = (s: MySelection) => (!s.startsAt ? 1 : s.startsAt >= now ? 0 : 2);
  return [...items].sort((a, b) => rank(a) - rank(b) || (a.startsAt?.getTime() ?? 0) - (b.startsAt?.getTime() ?? 0));
}

/** The signed-in IFPC delegate's session selections, soonest first (undated next, finished last). */
export function useMySelections(enabled = true) {
  const [items, setItems] = useState<MySelection[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const load = () =>
      fetch("/api/users/me/interests", { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => {
          const rows: MySessionInterest[] = json.success ? json.data.sessions : [];
          setItems(sortSelections(rows.map((s) => {
            const cat = eoiCategoryOf(s);
            return { ...s, label: cat ? EOI_CATEGORIES[cat].label : s.sessionType.charAt(0) + s.sessionType.slice(1).toLowerCase(), startsAt: sessionStartsAt(s) };
          })));
        })
        .catch(() => setItems((prev) => prev ?? []));
    load();
    window.addEventListener(INTEREST_CHANGED_EVENT, load);
    return () => window.removeEventListener(INTEREST_CHANGED_EVENT, load);
  }, [enabled]);
  return items;
}

/** "Starting X in 20 min"-style notices for the delegate's own picks, re-evaluated every 30 s. */
export function useUpNextMessages(items: MySelection[] | null): UpNextMessage[] {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return items ? upNextMessages(items, now) : [];
}
