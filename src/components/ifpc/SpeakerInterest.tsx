"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";

// One request per page for all of an event's speakers, shared by every
// SpeakerInterestButton on that page.
export function useSpeakerInterests(eventId?: string) {
    const { status } = useSession();
    const [mine, setMine] = useState<Set<string>>(new Set());
    const [pending, setPending] = useState<string | null>(null);

    useEffect(() => {
        if (!eventId || status !== "authenticated") return;
        fetch(`/api/events/${eventId}/speaker-interest`)
            .then((r) => r.json())
            .then((json) => { if (json.success) setMine(new Set(json.data.mine || [])); })
            .catch(() => {});
    }, [eventId, status]);

    async function mark(speakerId: string) {
        if (!eventId) return;
        setPending(speakerId);
        try {
            const res = await fetch(`/api/events/${eventId}/speaker-interest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ speakerId }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                toast.error(json?.error?.message || "Could not save your interest");
                return;
            }
            setMine((prev) => new Set(prev).add(speakerId));
            toast.success(json.data.alreadyInterested ? "You're already interested in this speaker" : "Marked as interested");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setPending(null);
        }
    }

    return { status, mine, pending, mark };
}

export function SpeakerInterestButton({ speakerId, state }: { speakerId: string; state: ReturnType<typeof useSpeakerInterests> }) {
    if (state.status === "loading") return null;
    if (state.status !== "authenticated") {
        return (
            <Link href="/auth/login" className="text-xs text-primary font-medium hover:underline">
                Log in to mark interest
            </Link>
        );
    }
    if (state.mine.has(speakerId)) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> You&apos;re interested
            </span>
        );
    }
    return (
        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" disabled={state.pending === speakerId} onClick={() => state.mark(speakerId)}>
            {state.pending === speakerId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
            Interested
        </Button>
    );
}
