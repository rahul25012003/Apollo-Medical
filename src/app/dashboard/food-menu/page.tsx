"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Loader2, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";
import { conferenceDay } from "@/lib/ifpc-eoi";
import type { FoodMenus, FoodMeal } from "@/lib/tenant/types";
import "@/components/ifpc/food-preference.css";

// Textareas hold one item per line; the API stores arrays.
type MealDraft = { veg: string; nonVeg: string; link: string };
type DayDraft = { date: string; lunch: MealDraft; dinner: MealDraft };

const toDraft = (m: FoodMeal): MealDraft => ({ veg: m.veg.join("\n"), nonVeg: m.nonVeg.join("\n"), link: m.link ?? "" });
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const fromDraft = (m: MealDraft): FoodMeal => ({ veg: lines(m.veg), nonVeg: lines(m.nonVeg), link: m.link.trim() });

/** Admin: lunch and dinner menus for each conference day. */
export default function FoodMenuAdminPage() {
  const ifpcCheck = useIsIfpcDashboard();
  if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();

  const [days, setDays] = useState<DayDraft[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ifpcCheck.isIfpc) return;
    fetch("/api/tenants/my/food-menu")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setDays((json.data as FoodMenus).days.map((d) => ({ date: d.date, lunch: toDraft(d.lunch), dinner: toDraft(d.dinner) })));
      })
      .catch(() => toast.error("Could not load the food menu"));
  }, [ifpcCheck.isIfpc]);

  const update = (date: string, meal: "lunch" | "dinner", field: keyof MealDraft, value: string) =>
    setDays((ds) => ds && ds.map((d) => (d.date === date ? { ...d, [meal]: { ...d[meal], [field]: value } } : d)));

  async function save() {
    if (!days) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tenants/my/food-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: days.map((d) => ({ date: d.date, lunch: fromDraft(d.lunch), dinner: fromDraft(d.dinner) })) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not save the food menu");
        return;
      }
      toast.success("Food menu saved — delegates see it now");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="Food Menu" subtitle="Lunch and dinner for each conference day">
      {!days ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">One dish per line. A meal left empty shows &ldquo;Menu to be announced&rdquo; to delegates.</p>
            <div className="flex items-center gap-3">
              <a href="/t/apollo-medical/food-menu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View as delegates see it <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {/* Also at the top: the install banner can sit over the bottom-right one. */}
              <Button onClick={save} disabled={saving} size="sm" className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </div>
          </div>

          {days.map((d) => (
            <Card key={d.date} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  Day {conferenceDay(d.date)} <span className="font-normal text-muted-foreground">· {format(parseISO(d.date), "EEEE, d MMMM")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {(["lunch", "dinner"] as const).map((meal) => (
                  <div key={meal} className="space-y-3">
                    <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{meal}</p>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${d.date}-${meal}-veg`} className="flex items-center gap-2">
                        <span className="ifpc-food ifpc-food--readout" data-selected="true"><span className="ifpc-food-mark" aria-hidden="true" />Veg</span>
                      </Label>
                      <Textarea id={`${d.date}-${meal}-veg`} rows={4} value={d[meal].veg} onChange={(e) => update(d.date, meal, "veg", e.target.value)} placeholder={"e.g. Paneer butter masala\nJeera rice"} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${d.date}-${meal}-nonveg`} className="flex items-center gap-2">
                        <span className="ifpc-food ifpc-food--nonveg ifpc-food--readout" data-selected="true"><span className="ifpc-food-mark" aria-hidden="true" />Non-Veg</span>
                      </Label>
                      <Textarea id={`${d.date}-${meal}-nonveg`} rows={4} value={d[meal].nonVeg} onChange={(e) => update(d.date, meal, "nonVeg", e.target.value)} placeholder={"e.g. Chicken biryani"} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${d.date}-${meal}-link`}>Full menu link (optional)</Label>
                      <Input id={`${d.date}-${meal}-link`} value={d[meal].link} onChange={(e) => update(d.date, meal, "link", e.target.value)} placeholder="https://…" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save food menu
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
