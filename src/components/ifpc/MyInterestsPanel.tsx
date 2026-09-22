"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, Heart, Hotel, Mic2, Utensils, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sharingLabel } from "@/lib/ifpc-constants";

export interface MyInterests {
    sessions: { id: string; sessionId: string; title: string; sessionType: string; sessionDate: string | null; startTime: string | null; endTime: string | null; hall: string | null }[];
    speakers: { id: string; speakerId: string; name: string; designation: string | null }[];
    foodPreference: "VEG" | "NON_VEG" | null;
    accommodationChoice: string | null;
    accommodationRequired?: boolean | null;
    accommodationSharing?: string | null;
    accommodationCheckIn?: string | null;
    accommodationCheckOut?: string | null;
}

/** "Your interests" — only what the signed-in delegate has chosen. */
export function MyInterestsPanel({ data, loading }: { data: MyInterests | null; loading: boolean }) {
    const total = (data?.sessions.length ?? 0) + (data?.speakers.length ?? 0);

    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <Heart className="h-4 w-4 text-emerald-600" /> Your interests
                    </h3>
                    {!loading && <Badge className="bg-emerald-100 text-emerald-700">{total}</Badge>}
                </div>

                {loading ? (
                    <div className="space-y-2" aria-hidden>
                        {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-5">
                        <Group title="Sessions & workshops" icon={<CheckCircle2 className="h-3.5 w-3.5" />} empty="Tap “I’d like to attend” on any session to add it here.">
                            {data?.sessions.map((s) => (
                                <li key={s.id} className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                                    <p className="text-sm font-medium text-slate-900 leading-snug">{s.title}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                                        <span>{s.sessionType}</span>
                                        {s.sessionDate && <span>{format(parseISO(s.sessionDate), "d MMM")}</span>}
                                        {s.startTime && <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>}
                                        {s.hall && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{s.hall}</span>}
                                    </p>
                                </li>
                            ))}
                        </Group>

                        <Group title="Speakers" icon={<Mic2 className="h-3.5 w-3.5" />} empty="Mark speakers as “Interested” on the event page.">
                            {data?.speakers.map((s) => (
                                <li key={s.id} className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                                    {s.designation && <p className="text-[11px] text-slate-500 mt-0.5">{s.designation}</p>}
                                </li>
                            ))}
                        </Group>

                        <div className="grid grid-cols-1 gap-2 text-sm">
                            <p className="flex items-center gap-2 text-slate-600">
                                <Utensils className="h-3.5 w-3.5 text-slate-400" />
                                Food: <span className="font-medium text-slate-900">{data?.foodPreference === "NON_VEG" ? "Non-Vegetarian" : data?.foodPreference === "VEG" ? "Vegetarian" : "Not chosen"}</span>
                            </p>
                            <p className="flex items-start gap-2 text-slate-600">
                                <Hotel className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                                <span>Stay: <span className="font-medium text-slate-900">{stayText(data)}</span></span>
                            </p>
                            <Link href="/dashboard/accommodation" className="text-xs font-medium text-primary hover:underline">Choose accommodation</Link>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Group({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode[] | undefined }) {
    const hasItems = !!children && children.length > 0;
    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">{icon}{title}</p>
            {hasItems ? <ul className="space-y-2">{children}</ul> : <p className="text-xs text-slate-400">{empty}</p>}
        </div>
    );
}

export function stayText(d: MyInterests | null): string {
    if (!d || (d.accommodationRequired == null && !d.accommodationChoice)) return "Not chosen";
    if (d.accommodationRequired === false) return "Not required";
    const parts = [
        sharingLabel(d.accommodationSharing),
        d.accommodationChoice,
        d.accommodationCheckIn ? `${d.accommodationCheckIn} → ${d.accommodationCheckOut ?? "?"}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Room needed";
}
