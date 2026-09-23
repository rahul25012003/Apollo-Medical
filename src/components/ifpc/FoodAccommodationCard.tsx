"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Building2, Loader2, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChoicesWindow, OPEN_FOREVER, formatClosesAt } from "@/lib/ifpc-deadline";
import "./food-preference.css";
import { toast } from "sonner";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { VENUE_TRAVEL } from "@/content/ifpc-2026";

type Preference = "VEG" | "NON_VEG";

// Food preference + accommodation for the signed-in delegate's confirmed
// registration. Shared by the public and dashboard Event Details pages; the
// underlying APIs only act on a CONFIRMED/ATTENDED registration.
export function FoodAccommodationCard({ eventId }: { eventId: string }) {
    const { status } = useSession();
    const [confirmed, setConfirmed] = useState<boolean | null>(null);
    const [preference, setPreference] = useState<Preference | null>(null);
    const [saving, setSaving] = useState<Preference | null>(null);
    const [hotel, setHotel] = useState<string | null>(null);
    const [pickedHotel, setPickedHotel] = useState("");
    const [savingHotel, setSavingHotel] = useState(false);
    // Food stays changeable until registration closes, like every other choice.
    const [foodWindow, setFoodWindow] = useState<ChoicesWindow>(OPEN_FOREVER);

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
                return Promise.all([
                    fetch("/api/users/me/food-preference").then((r) => r.json()),
                    fetch("/api/users/me/accommodation").then((r) => r.json()),
                ]).then(([pref, acc]) => {
                    if (pref.success) {
                        setPreference(pref.data.preference);
                        if (pref.data.choices) setFoodWindow(pref.data.choices);
                    }
                    if (acc.success) setHotel(acc.data.choice);
                });
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

    async function saveHotel() {
        if (!pickedHotel) return;
        setSavingHotel(true);
        try {
            const res = await fetch("/api/users/me/accommodation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelName: pickedHotel }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                toast.error(json?.error?.message || "Could not save your accommodation");
                return;
            }
            setHotel(json.data.choice);
            setPickedHotel("");
            toast.success(`Saved — you're marked as staying at ${json.data.choice}`);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSavingHotel(false);
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
                        <div className="flex flex-wrap gap-2">
                            {(["VEG", "NON_VEG"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={cn("ifpc-food", p === "NON_VEG" && "ifpc-food--nonveg")}
                                    data-selected={preference === p}
                                    aria-pressed={preference === p}
                                    disabled={confirmed !== true || saving !== null || !foodWindow.open}
                                    onClick={() => select(p)}
                                >
                                    {saving === p
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <span className="ifpc-food-mark" aria-hidden="true" />}
                                    {p === "VEG" ? "Vegetarian" : "Non-Vegetarian"}
                                </button>
                            ))}
                        </div>
                        {!foodWindow.open && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3 shrink-0" />
                                Final{formatClosesAt(foodWindow.closesAt) ? ` since ${formatClosesAt(foodWindow.closesAt)}` : ""}
                            </p>
                        )}
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Accommodation</p>
                        </div>
                        {hotel && (
                            <p className="text-xs text-emerald-700 mb-2 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Staying at <strong className="truncate">{hotel}</strong>
                            </p>
                        )}
                        <div className="flex gap-2">
                            <Select value={pickedHotel} onValueChange={setPickedHotel} disabled={confirmed !== true || savingHotel}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={hotel ? "Change hotel" : "Choose a hotel"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {VENUE_TRAVEL.accommodation.hotels.map((h) => (
                                        <SelectItem key={h.name} value={h.name}>{h.name} · {h.distance}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={saveHotel} disabled={!pickedHotel || savingHotel} className="shrink-0">
                                {savingHotel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                        <Link href="/dashboard/accommodation" className="text-xs text-primary hover:underline mt-2 inline-block">
                            See prices &amp; distances
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
