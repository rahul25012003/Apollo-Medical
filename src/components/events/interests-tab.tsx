"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Heart, Mail, Phone, UserX, Utensils, Building2, Mic2, Landmark } from "lucide-react";
import { AiimsLoader } from "@/components/ui/aiims-loader";

interface Interest {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    session: { id: string; title: string; sessionType: string; sessionDate: string | null; startTime: string | null };
    registration: { id: string; name: string; participantRole: string | null; category: string | null; organization: string | null } | null;
}

interface FoodRow {
    id: string;
    name: string;
    email: string;
    category: string | null;
    participantRole: string | null;
    preference: "VEG" | "NON_VEG" | string;
}

interface AccommodationRow {
    id: string;
    name: string;
    email: string;
    category: string | null;
    participantRole: string | null;
    hotel: string;
    selectedAt: string | null;
}

// Campus Tour is a seeded SEMINAR-type session, so it's split out by title
// before the generic workshop/session buckets.
const isCampusTour = (i: Interest) => i.session.title.toLowerCase().includes("campus tour");

function DelegateCell({ name, category, participantRole, notRegisteredLabel }: { name: string; category?: string | null; participantRole?: string | null; notRegisteredLabel?: string }) {
    return (
        <div>
            <p className="font-medium">{name}</p>
            <div className="flex gap-1.5 mt-0.5">
                {category && <Badge variant="outline" className="text-[10px]">{category}</Badge>}
                {participantRole && (
                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">{participantRole}</Badge>
                )}
                {notRegisteredLabel && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{notRegisteredLabel}</Badge>
                )}
            </div>
        </div>
    );
}

export function InterestsTab({ eventId }: { eventId: string }) {
    const [interests, setInterests] = useState<Interest[]>([]);
    const [food, setFood] = useState<FoodRow[]>([]);
    const [accommodation, setAccommodation] = useState<AccommodationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sessionFilter, setSessionFilter] = useState("all");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            api.get<Interest[]>(`/api/events/${eventId}/interests`),
            api.get<{ food: FoodRow[]; accommodation: AccommodationRow[] }>(`/api/events/${eventId}/preferences`),
        ])
            .then(([interestsRes, prefsRes]) => {
                if (cancelled) return;
                if (interestsRes.success && interestsRes.data) setInterests(interestsRes.data);
                if (prefsRes.success && prefsRes.data) {
                    setFood(prefsRes.data.food);
                    setAccommodation(prefsRes.data.accommodation);
                }
            })
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [eventId]);

    const campusTourInterests = useMemo(() => interests.filter(isCampusTour), [interests]);
    const workshopInterests = useMemo(() => interests.filter((i) => !isCampusTour(i) && i.session.sessionType === "WORKSHOP"), [interests]);
    const otherInterests = useMemo(() => interests.filter((i) => !isCampusTour(i) && i.session.sessionType !== "WORKSHOP"), [interests]);

    const sessionsFor = (list: Interest[]) => {
        const map = new Map<string, string>();
        list.forEach((i) => map.set(i.session.id, i.session.title));
        return Array.from(map, ([id, title]) => ({ id, title }));
    };

    function filterInterests(list: Interest[]) {
        const q = search.trim().toLowerCase();
        return list.filter((i) => {
            if (sessionFilter !== "all" && i.session.id !== sessionFilter) return false;
            if (!q) return true;
            return (
                i.name.toLowerCase().includes(q) ||
                i.email.toLowerCase().includes(q) ||
                i.session.title.toLowerCase().includes(q) ||
                (i.registration?.name.toLowerCase().includes(q) ?? false)
            );
        });
    }

    function filterRows<T extends { name: string; email: string }>(list: T[]) {
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }

    const vegCount = food.filter((f) => f.preference === "VEG").length;
    const nonVegCount = food.filter((f) => f.preference === "NON_VEG").length;
    const hotelCounts = useMemo(() => {
        const counts = new Map<string, number>();
        accommodation.forEach((a) => counts.set(a.hotel, (counts.get(a.hotel) || 0) + 1));
        return Array.from(counts, ([hotel, count]) => ({ hotel, count })).sort((a, b) => b.count - a.count);
    }, [accommodation]);

    if (loading) return <AiimsLoader />;

    function renderInterestTable(list: Interest[]) {
        const filtered = filterInterests(list);
        if (filtered.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground">
                    <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>{list.length === 0 ? "No submissions yet." : "No results match your search."}</p>
                </div>
            );
        }
        return (
            <div className="rounded-lg border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Delegate</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Submitted</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((i) => (
                            <TableRow key={i.id}>
                                <TableCell>
                                    {i.registration ? (
                                        <DelegateCell name={i.registration.name} category={i.registration.category} participantRole={i.registration.participantRole} />
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <UserX className="h-3.5 w-3.5" />
                                            <span className="text-sm">{i.name}</span>
                                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Not registered</Badge>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium">{i.session.title}</p>
                                    <p className="text-xs text-muted-foreground">{i.session.sessionType}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {i.email}</div>
                                        {i.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {i.phone}</div>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                    {new Date(i.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-600" />
                    Interests & Preferences
                </CardTitle>
                <CardDescription>
                    Everything delegates have expressed interest in for this event, linked to their registration
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Tabs defaultValue="workshops" onValueChange={() => setSessionFilter("all")}>
                    <TabsList className="flex flex-wrap h-auto justify-start">
                        <TabsTrigger value="workshops" className="gap-1.5">
                            <Mic2 className="h-3.5 w-3.5" /> Workshops ({workshopInterests.length})
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="gap-1.5">
                            <Heart className="h-3.5 w-3.5" /> Sessions ({otherInterests.length})
                        </TabsTrigger>
                        <TabsTrigger value="accommodation" className="gap-1.5">
                            <Building2 className="h-3.5 w-3.5" /> Accommodation ({accommodation.length})
                        </TabsTrigger>
                        <TabsTrigger value="food" className="gap-1.5">
                            <Utensils className="h-3.5 w-3.5" /> Food ({food.length})
                        </TabsTrigger>
                        <TabsTrigger value="campus-tour" className="gap-1.5">
                            <Landmark className="h-3.5 w-3.5" /> NIMHANS Campus Tour ({campusTourInterests.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="workshops" className="space-y-3 pt-2">
                        <Select value={sessionFilter} onValueChange={setSessionFilter}>
                            <SelectTrigger className="w-full sm:w-64">
                                <SelectValue placeholder="All workshops" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All workshops</SelectItem>
                                {sessionsFor(workshopInterests).map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderInterestTable(workshopInterests)}
                    </TabsContent>

                    <TabsContent value="sessions" className="space-y-3 pt-2">
                        <Select value={sessionFilter} onValueChange={setSessionFilter}>
                            <SelectTrigger className="w-full sm:w-64">
                                <SelectValue placeholder="All sessions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sessions</SelectItem>
                                {sessionsFor(otherInterests).map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderInterestTable(otherInterests)}
                    </TabsContent>

                    <TabsContent value="accommodation" className="space-y-3 pt-2">
                        {hotelCounts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {hotelCounts.map((h) => (
                                    <Badge key={h.hotel} variant="outline" className="text-xs">{h.hotel}: {h.count}</Badge>
                                ))}
                            </div>
                        )}
                        {filterRows(accommodation).length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>{accommodation.length === 0 ? "No one has selected accommodation yet." : "No results match your search."}</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Delegate</TableHead>
                                            <TableHead>Hotel</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Selected</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filterRows(accommodation).map((a) => (
                                            <TableRow key={a.id}>
                                                <TableCell><DelegateCell name={a.name} category={a.category} participantRole={a.participantRole} /></TableCell>
                                                <TableCell className="text-sm font-medium">{a.hotel}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{a.email}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {a.selectedAt ? new Date(a.selectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="food" className="space-y-3 pt-2">
                        {food.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Vegetarian: {vegCount}</Badge>
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Non-Vegetarian: {nonVegCount}</Badge>
                            </div>
                        )}
                        {filterRows(food).length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Utensils className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>{food.length === 0 ? "No one has set a food preference yet." : "No results match your search."}</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Delegate</TableHead>
                                            <TableHead>Preference</TableHead>
                                            <TableHead>Contact</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filterRows(food).map((f) => (
                                            <TableRow key={f.id}>
                                                <TableCell><DelegateCell name={f.name} category={f.category} participantRole={f.participantRole} /></TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={f.preference === "VEG" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"}>
                                                        {f.preference === "VEG" ? "Vegetarian" : "Non-Vegetarian"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{f.email}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="campus-tour" className="space-y-3 pt-2">
                        {renderInterestTable(campusTourInterests)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
