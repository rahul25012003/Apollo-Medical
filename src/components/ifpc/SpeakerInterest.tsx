"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { InterestToggle, INTEREST_BUTTON_CLASS } from "./InterestToggle";
import { INTEREST_CHANGED_EVENT } from "@/lib/ifpc-eoi";

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
        // Show the selected state immediately; undo it if saving fails.
        setMine((prev) => new Set(prev).add(speakerId));
        const undo = () => setMine((prev) => { const next = new Set(prev); next.delete(speakerId); return next; });
        try {
            const res = await fetch(`/api/events/${eventId}/speaker-interest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ speakerId }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                undo();
                toast.error(json?.error?.message || "Could not save your interest");
                return;
            }
            toast.success(json.data.alreadyInterested ? "You're already interested in this speaker" : "Interest saved");
            window.dispatchEvent(new Event(INTEREST_CHANGED_EVENT));
        } catch {
            undo();
            toast.error("Something went wrong. Please try again.");
        } finally {
            setPending(null);
        }
    }

    async function remove(speakerId: string) {
        if (!eventId) return;
        setPending(speakerId);
        // Hide the selected state immediately; restore it if the delete fails.
        setMine((prev) => { const next = new Set(prev); next.delete(speakerId); return next; });
        const undo = () => setMine((prev) => new Set(prev).add(speakerId));
        try {
            const res = await fetch(`/api/events/${eventId}/speaker-interest?speakerId=${encodeURIComponent(speakerId)}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                undo();
                toast.error(json?.error?.message || "Could not remove your interest");
                return;
            }
            toast.success("Removed from your interests");
            window.dispatchEvent(new Event(INTEREST_CHANGED_EVENT));
        } catch {
            undo();
            toast.error("Something went wrong. Please try again.");
        } finally {
            setPending(null);
        }
    }

    return { status, mine, pending, mark, remove };
}

export function SpeakerInterestButton({ speakerId, state }: { speakerId: string; state: ReturnType<typeof useSpeakerInterests> }) {
    if (state.status === "loading") return null;
    if (state.status !== "authenticated") {
        return (
            <Link href="/auth/login" className={INTEREST_BUTTON_CLASS} title="Log in to mark your interest">
                <Heart className="h-4 w-4" /> Interested? Log in
            </Link>
        );
    }
    return (
        <InterestToggle
            selected={state.mine.has(speakerId)}
            pending={state.pending === speakerId}
            label="Interested?"
            selectedLabel="You're interested"
            onSelect={() => state.mark(speakerId)}
            onRemove={() => state.remove(speakerId)}
        />
    );
}
