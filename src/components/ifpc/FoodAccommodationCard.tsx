"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Utensils, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";

type Preference = "VEG" | "NON_VEG";

// Food preference + accommodation for the signed-in delegate's confirmed
// registration. Shared by the public and dashboard Event Details pages; the
// underlying APIs only act on a CONFIRMED/ATTENDED registration.
export function FoodAccommodationCard({ eventId }: { eventId: string }) {
    const { status } = useSession();
    const [confirmed, setConfirmed] = useState<boolean | null>(null);
    const [preference, setPreference] = useState<Preference | null>(null);
    const [saving, setSaving] = useState<Preference | null>(null);

    useEffect(() => {
        if (status !== "authenticated") return;
        fetch("/api/users/me/registrations")
            .then((r) => r.json())
            .then((json) => {
                const ok = json.success && Array.isArray(json.data) && json.data.some(
                    (r: { event?: { id: string }; status: string }) => r.event?.id === eventId && (r.status === "CONFIRMED" || r.status === "ATTENDED")
                );
                setConfirmed(ok);
                if (!ok) return;
                return fetch("/api/users/me/food-preference")
                    .then((r) => r.json())
                    .then((pref) => { if (pref.success) setPreference(pref.data.preference); });
            })
            .catch(() => setConfirmed(false));
    }, [status, eventId]);

    async function select(next: Preference) {
        setSaving(next);
        try {
            const res = await fetch("/api/users/me/food-preference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preference: next }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                toast.error(json?.error?.message || "Could not save your preference");
                return;
            }
            setPreference(json.data.preference);
            toast.success("Food preference saved");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSaving(null);
        }
    }

    return (
        <div className="bg-background rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Food & Accommodation</h2>
            {status === "unauthenticated" ? (
                <p className="text-sm text-muted-foreground">
                    <Link href={`/auth/login?tenant=${IFPC_TENANT_SLUG}`} className="text-primary font-medium hover:underline">Log in</Link>{" "}
                    with your registered email to choose your food preference and accommodation.
                </p>
            ) : confirmed === false ? (
                <p className="text-sm text-muted-foreground">
                    You can choose your food preference and accommodation once your registration is confirmed.
                </p>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Utensils className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Food Preference</p>
                        </div>
                        <div className="flex gap-2">
                            {(["VEG", "NON_VEG"] as const).map((p) => (
                                <Button
                                    key={p}
                                    size="sm"
                                    variant={preference === p ? "default" : "outline"}
                                    disabled={confirmed !== true || saving !== null}
                                    onClick={() => select(p)}
                                >
                                    {saving === p ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : p === "VEG" ? "Vegetarian" : "Non-Vegetarian"}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Accommodation</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Browse nearby hotels and mark where you&apos;re staying.</p>
                        <Link href="/dashboard/accommodation">
                            <Button size="sm" variant="outline">View Hotels</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
