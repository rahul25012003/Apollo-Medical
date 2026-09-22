"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { useTenant } from "@/lib/tenant/context";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Utensils, Info, CheckCircle2, Loader2, BedDouble } from "lucide-react";
import { IFPC_TENANT_SLUG, ACCOMMODATION_SHARING, sharingLabel } from "@/lib/ifpc-constants";
import { VENUE_TRAVEL, REGISTRATION } from "@/content/ifpc-2026";
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

type Tier = "Budget" | "Mid-Range" | "Premium";

function tierOf(priceRange: string): Tier {
  // "₹16,000 – 22,000" -> first number token -> lower bound
  const match = priceRange.match(/[\d,]+/);
  const lower = match ? Number(match[0].replace(/,/g, "")) : 0;
  if (lower < 10000) return "Budget";
  if (lower < 20000) return "Mid-Range";
  return "Premium";
}

type AccommodationState = {
  registered?: boolean;
  choice?: string | null;
  required?: boolean | null;
  sharing?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  remarks?: string | null;
  eventStart?: string | null;
  eventEnd?: string | null;
};

function shiftDay(iso: string | null, days: number): string | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const TIER_ORDER: Tier[] = ["Budget", "Mid-Range", "Premium"];
const TIER_STYLES: Record<Tier, string> = {
  Budget: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Mid-Range": "bg-blue-50 text-blue-700 border-blue-200",
  Premium: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AccommodationPage() {
  // IFPC (apollo-medical) only — this page doesn't exist for other tenants.
  const ifpcCheck = useIsIfpcDashboard();
  if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();
  const { sidebarCollapsed } = useUIStore();
  const { tenant, isLoading } = useTenant();

  const isIfpc = tenant?.slug === IFPC_TENANT_SLUG;

  const [choice, setChoice] = useState<string | null>(null);
  const [loadingChoice, setLoadingChoice] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Accommodation expression of interest (saved separately from the hotel pick)
  const [registered, setRegistered] = useState(true);
  const [pref, setPref] = useState<{ required: boolean | null; sharing: string | null; checkIn: string; checkOut: string; remarks: string }>({
    required: null, sharing: null, checkIn: "", checkOut: "", remarks: "",
  });
  const [eventRange, setEventRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [savedPref, setSavedPref] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  function applyServerState(d: AccommodationState) {
    setRegistered(d.registered !== false);
    setChoice(d.choice ?? null);
    setPref({ required: d.required ?? null, sharing: d.sharing ?? null, checkIn: d.checkIn ?? "", checkOut: d.checkOut ?? "", remarks: d.remarks ?? "" });
    setSavedPref(d.required != null);
    if (d.eventStart !== undefined) setEventRange({ start: d.eventStart ?? null, end: d.eventEnd ?? null });
  }

  useEffect(() => {
    if (!isIfpc) {
      setLoadingChoice(false);
      return;
    }
    fetch("/api/users/me/accommodation")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) applyServerState(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingChoice(false));
  }, [isIfpc]);

  // Allowed stay window: a few days either side of the conference.
  const minDate = shiftDay(eventRange.start, -3);
  const maxDate = shiftDay(eventRange.end, 3);

  async function savePreference() {
    if (pref.required == null) {
      toast.error("Please tell us whether you need accommodation");
      return;
    }
    if (pref.required && !pref.sharing) {
      toast.error("Please choose a sharing preference");
      return;
    }
    if (pref.required && pref.checkIn && pref.checkOut && pref.checkOut <= pref.checkIn) {
      toast.error("Check-out must be after check-in");
      return;
    }
    setSavingPref(true);
    try {
      const res = await fetch("/api/users/me/accommodation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          required: pref.required,
          ...(pref.required ? { sharing: pref.sharing, checkIn: pref.checkIn || null, checkOut: pref.checkOut || null } : {}),
          remarks: pref.remarks.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not save your preference");
        return;
      }
      applyServerState(json.data);
      toast.success("Accommodation preference saved");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingPref(false);
    }
  }

  async function selectHotel(hotelName: string) {
    setSaving(hotelName);
    try {
      const res = await fetch("/api/users/me/accommodation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelName }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not save your selection");
        return;
      }
      applyServerState(json.data);
      toast.success(`Saved — you're marked as staying at ${hotelName}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  const grouped: Record<Tier, typeof VENUE_TRAVEL.accommodation.hotels> = {
    Budget: [],
    "Mid-Range": [],
    Premium: [],
  };
  for (const hotel of VENUE_TRAVEL.accommodation.hotels) {
    grouped[tierOf(hotel.price)].push(hotel);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar />
      <Header title="Accommodation" subtitle="Hotels near the conference venue" />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20"><AiimsLoader /></div>
          ) : !isIfpc ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                No accommodation information has been configured for this event yet.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-0 shadow-sm bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p>{VENUE_TRAVEL.venue.name}, {VENUE_TRAVEL.venue.address}</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Utensils className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p>{REGISTRATION.intro}</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>{VENUE_TRAVEL.accommodation.intro}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BedDouble className="h-4 w-4 text-primary" /> Your accommodation requirement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {loadingChoice ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : !registered ? (
                    <p className="text-sm text-muted-foreground">Once your registration is confirmed you can tell us about your accommodation needs here.</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Do you need accommodation?</Label>
                        <div className="flex flex-wrap gap-2">
                          {[{ v: true, l: "Yes, I need a room" }, { v: false, l: "No, not required" }].map((o) => (
                            <Button
                              key={o.l}
                              type="button"
                              variant={pref.required === o.v ? "default" : "outline"}
                              aria-pressed={pref.required === o.v}
                              className="h-11 sm:h-9"
                              onClick={() => setPref((p) => ({ ...p, required: o.v }))}
                            >
                              {pref.required === o.v && <CheckCircle2 className="mr-1.5 h-4 w-4" />}{o.l}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {pref.required && (
                        <>
                          <div className="space-y-2">
                            <Label>Preferred sharing</Label>
                            <div className="flex flex-wrap gap-2">
                              {ACCOMMODATION_SHARING.map((o) => (
                                <Button
                                  key={o.value}
                                  type="button"
                                  variant={pref.sharing === o.value ? "default" : "outline"}
                                  aria-pressed={pref.sharing === o.value}
                                  className="h-11 sm:h-9"
                                  onClick={() => setPref((p) => ({ ...p, sharing: o.value }))}
                                >
                                  {pref.sharing === o.value && <CheckCircle2 className="mr-1.5 h-4 w-4" />}{o.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="acc-in">Check-in date</Label>
                              <Input id="acc-in" type="date" min={minDate} max={maxDate} value={pref.checkIn} onChange={(e) => setPref((p) => ({ ...p, checkIn: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="acc-out">Check-out date</Label>
                              <Input id="acc-out" type="date" min={pref.checkIn || minDate} max={maxDate} value={pref.checkOut} onChange={(e) => setPref((p) => ({ ...p, checkOut: e.target.value }))} />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor="acc-remarks">Special requirements / remarks (optional)</Label>
                        <Textarea
                          id="acc-remarks"
                          rows={3}
                          maxLength={1000}
                          placeholder="e.g. ground-floor room, accessibility needs, travelling with family"
                          value={pref.remarks}
                          onChange={(e) => setPref((p) => ({ ...p, remarks: e.target.value }))}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" onClick={savePreference} disabled={savingPref} className="h-11 sm:h-9">
                          {savingPref && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save preference
                        </Button>
                        {savedPref && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            {pref.required
                              ? `Saved: ${sharingLabel(pref.sharing) ?? "room needed"}${pref.checkIn ? `, ${pref.checkIn} → ${pref.checkOut || "?"}` : ""}`
                              : "Saved: no accommodation needed"}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {pref.required !== false && (
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preferred hotel (optional)</p>
              )}

              {choice && (
                <Card className="border-0 shadow-sm bg-emerald-50 border border-emerald-200">
                  <CardContent className="py-4 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <p className="text-sm">You&apos;re marked as staying at <strong>{choice}</strong>. This is visible to the organizing team.</p>
                  </CardContent>
                </Card>
              )}

              {pref.required !== false && TIER_ORDER.filter((t) => grouped[t].length > 0).map((tier) => (
                <Card key={tier} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", TIER_STYLES[tier])}>
                        {tier}
                      </span>
                      <span className="text-muted-foreground font-normal text-sm">{grouped[tier].length} option(s)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {grouped[tier].map((hotel) => {
                        const isSelected = choice === hotel.name;
                        return (
                          <div
                            key={hotel.name}
                            className={cn(
                              "p-3 rounded-lg border flex items-center justify-between gap-3",
                              isSelected ? "border-emerald-400 bg-emerald-50" : "bg-white dark:bg-slate-900"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{hotel.name}</p>
                              <p className="text-xs text-muted-foreground">{hotel.distance} from venue · {hotel.price}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isSelected ? "outline" : "default"}
                              disabled={loadingChoice || saving === hotel.name}
                              onClick={() => selectHotel(hotel.name)}
                              className="shrink-0"
                            >
                              {saving === hotel.name ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isSelected ? (
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Selected</span>
                              ) : (
                                "I'll stay here"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <p className="text-xs text-muted-foreground text-center">
                Selecting a hotel here records your intent for the organizing team — it does not book or pay for the room. Contact the hotel directly to confirm availability and rates.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
