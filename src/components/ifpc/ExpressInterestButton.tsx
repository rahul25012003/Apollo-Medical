"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Loader2, CheckCircle2, Heart } from "lucide-react";
import { InterestToggle, INTEREST_BUTTON_CLASS } from "./InterestToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  sessionId: string;
  /** initial values so the counter renders instantly without a fetch waterfall */
  initialCount?: number;
  initialCapacity?: number | null;
  /** called after an interest is saved (e.g. to refresh a "your interests" list) */
  onInterested?: () => void;
}

/**
 * "I would like to attend" button + live seat counter for Workshop / Seminar /
 * Competition listings. Renders on any EventSession that has a capacity set —
 * generic by session type, not hardcoded to specific IFPC content, so any
 * new workshop/seminar/competition an admin adds gets this automatically.
 *
 * Logged-in delegates get a one-click flow (no name/email form — their
 * account already has that) and see whether they're already on the list.
 * Signed-out visitors get the original name/email/phone dialog.
 */
export function ExpressInterestButton({ sessionId, initialCount, initialCapacity, onInterested }: Props) {
  const { data: authSession } = useSession();
  const isLoggedIn = !!authSession?.user;

  const [count, setCount] = useState(initialCount ?? 0);
  const [capacity, setCapacity] = useState<number | null | undefined>(initialCapacity);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isInterested, setIsInterested] = useState(false);
  const [checkingMine, setCheckingMine] = useState(isLoggedIn);

  useEffect(() => {
    if (initialCount !== undefined && initialCapacity !== undefined) return;
    fetch(`/api/sessions/${sessionId}/interest`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCount(json.data.count);
          setCapacity(json.data.capacity);
        }
      })
      .catch(() => {});
  }, [sessionId, initialCount, initialCapacity]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCheckingMine(false);
      return;
    }
    setCheckingMine(true);
    fetch(`/api/sessions/${sessionId}/interest?mine=1`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setIsInterested(json.data.isInterested);
      })
      .catch(() => {})
      .finally(() => setCheckingMine(false));
  }, [sessionId, isLoggedIn]);

  const isFull = typeof capacity === "number" && count >= capacity;

  async function submit(nameOverride?: string, emailOverride?: string): Promise<boolean> {
    const submitName = nameOverride ?? name;
    const submitEmail = emailOverride ?? email;
    if (!submitName.trim() || !submitEmail.trim()) {
      toast.error("Please enter your name and email");
      return false;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: submitName, email: submitEmail, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not register your interest");
        return false;
      }
      setCount(json.data.count);
      setCapacity(json.data.capacity);
      setDone(true);
      setIsInterested(true);
      toast.success(json.data.alreadyRegistered ? "You're already on the list" : "Interest saved — you're on the list");
      onInterested?.();
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  // Show the selected state immediately; undo it if saving fails.
  async function selectAsLoggedIn() {
    setIsInterested(true);
    const ok = await submit(authSession!.user!.name || "", authSession!.user!.email || "");
    if (!ok) setIsInterested(false);
  }

  // Logged-in delegate: one-click, no dialog — we already know who they are.
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-3 py-1">
          <Users className="h-3.5 w-3.5" />
          {typeof capacity === "number" ? `${count}/${capacity} seats filled` : `${count} interested`}
        </span>
        <InterestToggle
          selected={isInterested}
          pending={submitting}
          disabled={(isFull && !isInterested) || checkingMine}
          label={isFull ? "Session Full" : "I'd like to attend"}
          selectedLabel="You're interested"
          onSelect={selectAsLoggedIn}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-3 py-1">
        <Users className="h-3.5 w-3.5" />
        {typeof capacity === "number" ? `${count}/${capacity} seats filled` : `${count} interested`}
      </span>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDone(false); }}>
        <DialogTrigger asChild>
          <button type="button" className={INTEREST_BUTTON_CLASS} disabled={isFull}>
            <Heart className="h-4 w-4" /> {isFull ? "Session Full" : "I'd like to attend"}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          {done ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">You're on the list!</p>
              <p className="text-sm text-slate-500 mt-1">We've noted your interest in this session.</p>
              <Button size="sm" className="mt-4" onClick={() => setOpen(false)}>Close</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Express Interest</DialogTitle>
                <DialogDescription>Let us know you'd like to attend — this reserves you a spot on the interest list.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="ei-name">Full Name</Label>
                  <Input id="ei-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" />
                </div>
                <div>
                  <Label htmlFor="ei-email">Email</Label>
                  <Input id="ei-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
                </div>
                <div>
                  <Label htmlFor="ei-phone">Phone (optional)</Label>
                  <Input id="ei-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => submit()} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Interest"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
