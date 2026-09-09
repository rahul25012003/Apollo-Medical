"use client";

import { useEffect, useState } from "react";
import { Users, Loader2, CheckCircle2 } from "lucide-react";
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
}

/**
 * "I would like to attend" button + live seat counter for Workshop / Seminar /
 * Competition listings. Renders on any EventSession that has a capacity set —
 * generic by session type, not hardcoded to specific IFPC content, so any
 * new workshop/seminar/competition an admin adds gets this automatically.
 */
export function ExpressInterestButton({ sessionId, initialCount, initialCapacity }: Props) {
  const [count, setCount] = useState(initialCount ?? 0);
  const [capacity, setCapacity] = useState<number | null | undefined>(initialCapacity);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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

  const isFull = typeof capacity === "number" && count >= capacity;

  async function submit() {
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not register your interest");
        return;
      }
      setCount(json.data.count);
      setCapacity(json.data.capacity);
      setDone(true);
      toast.success(json.data.alreadyRegistered ? "You're already on the list" : "Interest registered!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-3 py-1">
        <Users className="h-3.5 w-3.5" />
        {typeof capacity === "number" ? `${count}/${capacity} seats filled` : `${count} interested`}
      </span>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDone(false); }}>
        <DialogTrigger asChild>
          <Button size="sm" variant={isFull ? "outline" : "default"} disabled={isFull}>
            {isFull ? "Session Full" : "I'd like to attend"}
          </Button>
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
                <Button onClick={submit} disabled={submitting} className="w-full">
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
