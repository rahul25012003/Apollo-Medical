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
import { MapPin, Utensils, Info, CheckCircle2, Loader2, BedDouble, Lock, Pencil, X, BadgeCheck, CircleSlash } from "lucide-react";
import { IFPC_TENANT_SLUG, ACCOMMODATION_SHARING, sharingLabel } from "@/lib/ifpc-constants";
import { VENUE_TRAVEL, REGISTRATION } from "@/content/ifpc-2026";
import { type ChoicesWindow, OPEN_FOREVER, formatClosesAt } from "@/lib/ifpc-deadline";
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
  choices?: ChoicesWindow;
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

/** Where the delegate stands right now. Drives the status card and its actions. */
type Status = "none" | "requested" | "declined";

type Pref = { required: boolean | null; sharing: string | null; checkIn: string; checkOut: string; remarks: string };
const EMPTY_PREF: Pref = { required: null, sharing: null, checkIn: "", checkOut: "", remarks: "" };

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

  const [registered, setRegistered] = useState(true);
  // `saved` is what the server holds and drives the status card; `pref` is the
  // draft in the editor. Keeping them apart matters: otherwise picking "Yes"
  // flips the card to "Requested" before anything has been written.
  const [saved, setSaved] = useState<Pref>(EMPTY_PREF);
  const [pref, setPref] = useState<Pref>(EMPTY_PREF);
  const [eventRange, setEventRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [savingPref, setSavingPref] = useState(false);
  const [choicesWindow, setChoicesWindow] = useState<ChoicesWindow>(OPEN_FOREVER);
  // The editor is open while there is nothing on file, or when they ask to change.
  const [editing, setEditing] = useState(false);

  function applyServerState(d: AccommodationState) {
    setRegistered(d.registered !== false);
    setChoice(d.choice ?? null);
    const next: Pref = { required: d.required ?? null, sharing: d.sharing ?? null, checkIn: d.checkIn ?? "", checkOut: d.checkOut ?? "", remarks: d.remarks ?? "" };
    setSaved(next);
    setPref(next);
    if (d.choices) setChoicesWindow(d.choices);
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
        if (json.success) {
          applyServerState(json.data);
          // Nothing answered yet: open the flow rather than making them press
          // a button to reach an empty form.
          if (json.data?.required == null && !json.data?.choice) setEditing(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingChoice(false));
  }, [isIfpc]);

  const open = choicesWindow.open;
  const closesOn = formatClosesAt(choicesWindow.closesAt);
  const status: Status = saved.required === true ? "requested" : saved.required === false ? "declined" : "none";

  // Allowed stay window: a few days either side of the conference.
  const minDate = shiftDay(eventRange.start, -3);
  const maxDate = shiftDay(eventRange.end, 3);

  async function post(body: Record<string, unknown>, success: string) {
    const res = await fetch("/api/users/me/accommodation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast.error(json?.error?.message || "Could not save your change");
      return false;
    }
    applyServerState(json.data);
    toast.success(success);
    return true;
  }

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
    const ok = await post({
      required: pref.required,
      ...(pref.required ? { sharing: pref.sharing, checkIn: pref.checkIn || null, checkOut: pref.checkOut || null } : {}),
      remarks: pref.remarks.trim() || null,
    }, "Accommodation request saved");
    if (ok) setEditing(false);
    setSavingPref(false);
  }

  async function declineAccommodation() {
    setSavingPref(true);
    if (await post({ required: false }, "Noted — you don't need a room")) setEditing(false);
    setSavingPref(false);
  }

  async function cancelRequest() {
    setSavingPref(true);
    if (await post({ required: null }, "Request cancelled — you can book again any time")) setEditing(true);
    setSavingPref(false);
  }

  async function selectHotel(hotelName: string | null) {
    setSaving(hotelName ?? "__clear__");
    await post({ hotelName }, hotelName ? `Saved — you're marked as staying at ${hotelName}` : "Hotel preference removed");
    setSaving(null);
  }

  const grouped: Record<Tier, typeof VENUE_TRAVEL.accommodation.hotels> = {
    Budget: [],
    "Mid-Range": [],
    Premium: [],
  };
  for (const hotel of VENUE_TRAVEL.accommodation.hotels) {
    grouped[tierOf(hotel.price)].push(hotel);
  }

  const summary = [
    sharingLabel(saved.sharing),
    choice,
    saved.checkIn ? `${saved.checkIn} → ${saved.checkOut || "?"}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <Sidebar />
      <Header title="Accommodation" subtitle="Book and manage your stay" />
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
          ) : loadingChoice ? (
            <div className="flex justify-center py-20"><AiimsLoader /></div>
          ) : !registered ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                Once your registration is confirmed you can book your accommodation here.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ── Where you stand ─────────────────────────────────────── */}
              <Card className={cn("border-0 shadow-sm", status === "requested" && "bg-emerald-50/70 dark:bg-emerald-900/15")}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your accommodation</p>
                      <p className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {status === "requested" && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
                        {status === "declined" && <CircleSlash className="h-5 w-5 text-slate-400" />}
                        {status === "requested" ? "Requested" : status === "declined" ? "Not interested" : "Not booked yet"}
                      </p>
                      {status === "requested" && (
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          {summary.length ? summary.join(" · ") : "Room needed — details not filled in yet"}
                        </p>
                      )}
                      {status === "declined" && (
                        <p className="text-sm text-muted-foreground">You&apos;ve told us you don&apos;t need a room. You can change this any time.</p>
                      )}
                      {status === "none" && (
                        <p className="text-sm text-muted-foreground">Tell us whether you need a room near the venue.</p>
                      )}
                      {saved.remarks && <p className="text-xs text-muted-foreground">Note: {saved.remarks}</p>}
                    </div>

                    {open && (
                      <div className="flex flex-wrap gap-2">
                        {status === "requested" ? (
                          <>
                            <Button variant="outline" className="h-11 sm:h-9" onClick={() => { setPref(saved); setEditing(true); }} disabled={savingPref}>
                              <Pencil className="mr-1.5 h-4 w-4" /> Change
                            </Button>
                            <Button variant="outline" className="h-11 sm:h-9" onClick={cancelRequest} disabled={savingPref}>
                              <X className="mr-1.5 h-4 w-4" /> Cancel request
                            </Button>
                            <Button variant="outline" className="h-11 sm:h-9" onClick={declineAccommodation} disabled={savingPref}>
                              Not interested
                            </Button>
                          </>
                        ) : (
                          <Button className="h-11 sm:h-9" onClick={() => { setPref(saved); setEditing(true); }} disabled={savingPref}>
                            <BedDouble className="mr-1.5 h-4 w-4" /> Book Accommodation
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground border-t pt-3">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {open ? (
                      <span>
                        Shared with the organising team. This is a request, not a reservation — the hotel confirms directly.{" "}
                        {closesOn ? <>You can change it until <strong>{closesOn}</strong>.</> : "You can change it any time."}
                      </span>
                    ) : (
                      <span>Registration closed{closesOn ? ` on ${closesOn}` : ""}, so these choices are now final. Contact the organising team if something needs to change.</span>
                    )}
                  </p>
                </CardContent>
              </Card>

              {!open && (
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" /> Changes are closed
                </p>
              )}

              {/* ── The flow ────────────────────────────────────────────── */}
              {open && editing && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BedDouble className="h-4 w-4 text-primary" /> {status === "none" ? "Book accommodation" : "Change your request"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Step n={1} title="Do you need a room?">
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
                    </Step>

                    {pref.required && (
                      <Step n={2} title="Room and dates">
                        <div className="space-y-4">
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
                        </div>
                      </Step>
                    )}

                    <Step n={pref.required ? 3 : 2} title="Special requirements (optional)">
                      <Textarea
                        id="acc-remarks"
                        rows={3}
                        maxLength={1000}
                        placeholder="e.g. ground-floor room, accessibility needs, travelling with family"
                        value={pref.remarks}
                        onChange={(e) => setPref((p) => ({ ...p, remarks: e.target.value }))}
                      />
                    </Step>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                      <Button type="button" onClick={savePreference} disabled={savingPref} className="h-11 sm:h-9">
                        {savingPref && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {status === "none" ? "Save request" : "Save changes"}
                      </Button>
                      {status !== "none" && (
                        <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={() => { setPref(saved); setEditing(false); }} disabled={savingPref}>
                          Discard
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Hotels ──────────────────────────────────────────────── */}
              {status === "requested" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preferred hotel (optional)</p>
                    {choice && open && (
                      <Button variant="outline" size="sm" onClick={() => selectHotel(null)} disabled={saving === "__clear__"}>
                        {saving === "__clear__" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><X className="mr-1.5 h-3.5 w-3.5" /> Withdraw hotel choice</>}
                      </Button>
                    )}
                  </div>

                  {TIER_ORDER.filter((t) => grouped[t].length > 0).map((tier) => (
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
                                  disabled={!open || saving === hotel.name}
                                  onClick={() => selectHotel(hotel.name)}
                                  className="shrink-0"
                                >
                                  {saving === hotel.name ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isSelected ? (
                                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Selected</span>
                                  ) : choice ? (
                                    "Change to this"
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
                </>
              )}

              {/* ── Venue reference ─────────────────────────────────────── */}
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{n}</span>
        {title}
      </p>
      <div className="pl-8">{children}</div>
    </div>
  );
}
