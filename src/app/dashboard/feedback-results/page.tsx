"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star, UtensilsCrossed, Presentation, Mic2, BarChart3 } from "lucide-react";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { conferenceDay } from "@/lib/ifpc-eoi";
import "@/components/ifpc/food-preference.css";

type Summary = { count: number; average: number | null };
type Comment = { text: string; rating: number | null; at: string };
type Results = {
  respondents: number;
  responses: number;
  food: { date: string; meals: { meal: string; veg: Summary; nonVeg: Summary }[] }[];
  workshops: ({ sessionId: string; title: string; hall: string | null; sessionDate: string | null; startTime: string | null; comments: Comment[] } & Summary)[];
  scientific: ({ key: string; label: string; comments: Comment[] } & Summary)[];
};

function Score({ s }: { s: Summary }) {
  if (!s.count) return <span className="text-sm text-muted-foreground">No ratings yet</span>;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <Star className="h-4 w-4 self-center fill-amber-400 text-amber-400" />
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.average!.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">/ 5 · {s.count} rating{s.count === 1 ? "" : "s"}</span>
    </span>
  );
}

function Comments({ list }: { list: Comment[] }) {
  if (!list.length) return null;
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-primary">{list.length} comment{list.length === 1 ? "" : "s"}</summary>
      <ul className="mt-2 space-y-2">
        {list.map((c, i) => (
          <li key={i} className="rounded-lg bg-slate-50 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {c.rating != null && <span className="mr-1.5 font-semibold text-amber-600">{c.rating}★</span>}
            {c.text}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Admin: what delegates said about food, workshops and scientific sessions. */
export default function FeedbackResultsPage() {
  const ifpcCheck = useIsIfpcDashboard();
  if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();
  const { event } = useIfpcEvent();
  const [data, setData] = useState<Results | null>(null);

  useEffect(() => {
    if (!event?.id) return;
    fetch(`/api/events/${event.id}/delegate-feedback`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setData(j.data); })
      .catch(() => {});
  }, [event?.id]);

  return (
    <DashboardLayout title="Feedback Results" subtitle="Food, workshops and scientific sessions">
      {!data ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> {data.respondents} delegate{data.respondents === 1 ? "" : "s"} · {data.responses} response{data.responses === 1 ? "" : "s"}
          </p>
          <Tabs defaultValue="food" className="space-y-4">
            <TabsList>
              <TabsTrigger value="food" className="gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" /> Food</TabsTrigger>
              <TabsTrigger value="workshops" className="gap-1.5"><Presentation className="h-3.5 w-3.5" /> Workshops</TabsTrigger>
              <TabsTrigger value="scientific" className="gap-1.5"><Mic2 className="h-3.5 w-3.5" /> Scientific Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="food" className="space-y-4">
              {data.food.map((d) => (
                <Card key={d.date} className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Day {conferenceDay(d.date)} <span className="font-normal text-muted-foreground">· {format(parseISO(d.date), "EEEE, d MMMM")}</span></CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    {d.meals.map((m) => (
                      <div key={m.meal} className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                        <p className="font-semibold capitalize">{m.meal}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="ifpc-food ifpc-food--readout" data-selected="true"><span className="ifpc-food-mark" aria-hidden="true" />Veg</span>
                          <Score s={m.veg} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="ifpc-food ifpc-food--nonveg ifpc-food--readout" data-selected="true"><span className="ifpc-food-mark" aria-hidden="true" />Non-Veg</span>
                          <Score s={m.nonVeg} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="workshops" className="space-y-3">
              {data.workshops.map((w) => (
                <Card key={w.sessionId} className="border-0 shadow-sm">
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{w.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.sessionDate ? `Day ${conferenceDay(w.sessionDate)} · ${format(parseISO(w.sessionDate), "d MMM")}` : "Date TBA"}
                        {w.startTime ? ` · ${w.startTime}` : ""}{w.hall ? ` · ${w.hall}` : ""}
                      </p>
                      <Comments list={w.comments} />
                    </div>
                    <Score s={w} />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="scientific" className="space-y-3">
              {data.scientific.map((s) => (
                <Card key={s.key} className="border-0 shadow-sm">
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{s.label}</p>
                      <Comments list={s.comments} />
                    </div>
                    <Score s={s} />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
