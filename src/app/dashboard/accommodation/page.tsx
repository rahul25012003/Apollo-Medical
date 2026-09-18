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
import { MapPin, Utensils, Info, CheckCircle2, Loader2 } from "lucide-react";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { VENUE_TRAVEL, REGISTRATION } from "@/content/ifpc-2026";
import { toast } from "sonner";

type Tier = "Budget" | "Mid-Range" | "Premium";

function tierOf(priceRange: string): Tier {
  // "₹16,000 – 22,000" -> first number token -> lower bound
  const match = priceRange.match(/[\d,]+/);
  const lower = match ? Number(match[0].replace(/,/g, "")) : 0;
  if (lower < 10000) return "Budget";
  if (lower < 20000) return "Mid-Range";
  return "Premium";
}

const TIER_ORDER: Tier[] = ["Budget", "Mid-Range", "Premium"];
const TIER_STYLES: Record<Tier, string> = {
  Budget: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Mid-Range": "bg-blue-50 text-blue-700 border-blue-200",
  Premium: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AccommodationPage() {
  const { sidebarCollapsed } = useUIStore();
  const { tenant, isLoading } = useTenant();

  const isIfpc = tenant?.slug === IFPC_TENANT_SLUG;

  const [choice, setChoice] = useState<string | null>(null);
  const [loadingChoice, setLoadingChoice] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!isIfpc) {
      setLoadingChoice(false);
      return;
    }
    fetch("/api/users/me/accommodation")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setChoice(json.data.choice);
      })
      .catch(() => {})
      .finally(() => setLoadingChoice(false));
  }, [isIfpc]);

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
      setChoice(json.data.choice);
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

              {choice && (
                <Card className="border-0 shadow-sm bg-emerald-50 border border-emerald-200">
                  <CardContent className="py-4 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <p className="text-sm">You&apos;re marked as staying at <strong>{choice}</strong>. This is visible to the organizing team.</p>
                  </CardContent>
                </Card>
              )}

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
