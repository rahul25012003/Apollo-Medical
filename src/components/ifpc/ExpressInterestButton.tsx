"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, Heart, CircleDot, ListChecks, Lock, Clock } from "lucide-react";
import { InterestToggle, INTEREST_BUTTON_CLASS } from "./InterestToggle";
import { formatClosesAt } from "@/lib/ifpc-deadline";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { toast } from "sonner";
import { INTEREST_CHANGED_EVENT } from "@/lib/ifpc-eoi";

interface Props {
  sessionId: string;
  /** initial values so the counter renders instantly without a fetch waterfall */
  initialCount?: number;
  initialCapacity?: number | null;
  /** called after an interest is saved or removed (e.g. to refresh a "your interests" list) */
  onInterested?: () => void;
  /** hide the "Choose one" rule chip where the page already shows it */
  showRule?: boolean;
}

interface SelectionRule { category: string; label: string; single: boolean; rule: string }

function RuleChip({ rule }: { rule: SelectionRule }) {
  return (
    <span
      title={rule.single ? `${rule.label}: only one can be chosen — a new choice replaces the old one` : `${rule.label}: choose as many as you like`}
      className={
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border " +
        (rule.single ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50" : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50")
      }
    >
      {rule.single ? <CircleDot className="h-3.5 w-3.5" /> : <ListChecks className="h-3.5 w-3.5" />}
      {rule.label}: {rule.rule.toLowerCase()}
    </span>
  );
}

/**
 * "I would like to attend" button + live seat counter for Workshop / Seminar /
 * Competition listings. Renders on any EventSession that has a capacity set —
 * generic by session type, not hardcoded to specific IFPC content, so any
 * new workshop/seminar/competition an admin adds gets this automatically.
 *
 * Logged-in delegates get a one-click flow (no name/email form — their
 * account already has that) and see whether they're already on the list.
 * Signed-out visitors see the seat counter and a way to log in: an interest
 * always belongs to a delegate's account.
 */
export function ExpressInterestButton({ sessionId, initialCount, initialCapacity, onInterested, showRule = true }: Props) {
  const { data: authSession } = useSession();
  const isLoggedIn = !!authSession?.user;

  const [count, setCount] = useState(initialCount ?? 0);
  const [capacity, setCapacity] = useState<number | null | undefined>(initialCapacity);
  const [submitting, setSubmitting] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [checkingMine, setCheckingMine] = useState(isLoggedIn);
  const [rule, setRule] = useState<SelectionRule | null>(null);
  // Null until the server tells us; choices stay open until registration closes.
  const [closedOn, setClosedOn] = useState<string | null | undefined>(undefined);
  // Title of a pick this one would clash with in time, if any.
  const [clash, setClash] = useState<string | null>(null);
  // Bumped when any interest on the page changes — a pick-one swap clears another button's selection.
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const onChange = () => setRefreshTick((t) => t + 1);
    window.addEventListener(INTEREST_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(INTEREST_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (refreshTick === 0 && initialCount !== undefined && initialCapacity !== undefined) return;
    fetch(`/api/sessions/${sessionId}/interest`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCount(json.data.count);
          setCapacity(json.data.capacity);
          setRule(json.data.rule ?? null);
        }
      })
      .catch(() => {});
  }, [sessionId, initialCount, initialCapacity, refreshTick]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCheckingMine(false);
      return;
    }
    setCheckingMine(true);
    fetch(`/api/sessions/${sessionId}/interest?mine=1`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        setIsInterested(json.data.isInterested);
        setClash(json.data.clash ?? null);
        const w = json.data.choices;
        setClosedOn(w && !w.open ? (formatClosesAt(w.closesAt) ?? "") : null);
      })
      .catch(() => {})
      .finally(() => setCheckingMine(false));
  }, [sessionId, isLoggedIn, refreshTick]);

  const isFull = typeof capacity === "number" && count >= capacity;

  // Show the selected state immediately; undo it if saving fails. The server
  // takes the name and email from the signed-in account.
  async function selectAsLoggedIn() {
    setIsInterested(true);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/interest`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not register your interest");
        setIsInterested(false);
        return;
      }
      setCount(json.data.count);
      setCapacity(json.data.capacity);
      const replaced: string[] = json.data.replaced ?? [];
      toast.success(
        json.data.alreadyRegistered
          ? "You're already on the list"
          : replaced.length
            ? `${json.message} — replaced "${replaced.join(", ")}"`
            : "Interest saved — you're on the list"
      );
      window.dispatchEvent(new Event(INTEREST_CHANGED_EVENT));
      onInterested?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsInterested(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeAsLoggedIn() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/interest`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not remove your choice");
        return;
      }
      setCount(json.data.count);
      setIsInterested(false);
      toast.success(json.message || "Removed from your choices");
      window.dispatchEvent(new Event(INTEREST_CHANGED_EVENT));
      onInterested?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const seats = (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-full px-3 py-1">
      <Users className="h-3.5 w-3.5" />
      {typeof capacity === "number" ? `${count}/${capacity} seats filled` : `${count} interested`}
    </span>
  );

  // Logged-in delegate: one-click, no dialog — we already know who they are.
  if (isLoggedIn) {
    // Once registration closes the choice is final, so the control stops
    // offering an action it cannot carry out and says why instead.
    const closed = typeof closedOn === "string";
    const clashes = !isInterested && !!clash;
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {seats}
        {showRule && rule && <RuleChip rule={rule} />}
        <InterestToggle
          selected={isInterested}
          pending={submitting}
          disabled={closed || clashes || (isFull && !isInterested) || checkingMine}
          label={clashes ? "Time clash" : isFull ? "Session Full" : "I'd like to attend"}
          selectedLabel="You're interested"
          onSelect={selectAsLoggedIn}
          onRemove={closed ? undefined : removeAsLoggedIn}
        />
        {clashes && !closed && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3 shrink-0" /> Same time as {clash}
          </span>
        )}
        {closed && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Final{closedOn ? ` since ${closedOn}` : ""}
          </span>
        )}
      </div>
    );
  }

  // Signed out: nothing is saved without an account, so the button leads to sign-in.
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {seats}
      {showRule && rule && <RuleChip rule={rule} />}
      {isFull ? (
        <button type="button" className={INTEREST_BUTTON_CLASS} disabled>
          <Heart className="h-4 w-4" /> Session Full
        </button>
      ) : (
        <Link href={`/auth/login?tenant=${IFPC_TENANT_SLUG}`} className={INTEREST_BUTTON_CLASS} title="Log in to express interest">
          <Heart className="h-4 w-4" /> Interested? Log in
        </Link>
      )}
    </div>
  );
}
