"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Search, Heart, Mail, Phone, UserX } from "lucide-react";
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

export function InterestsTab({ eventId }: { eventId: string }) {
    const [interests, setInterests] = useState<Interest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sessionFilter, setSessionFilter] = useState("all");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get<Interest[]>(`/api/events/${eventId}/interests`)
            .then((res) => {
                if (!cancelled && res.success && res.data) setInterests(res.data);
            })
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [eventId]);

    const sessions = useMemo(() => {
        const map = new Map<string, string>();
        interests.forEach((i) => map.set(i.session.id, i.session.title));
        return Array.from(map, ([id, title]) => ({ id, title }));
    }, [interests]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return interests.filter((i) => {
            if (sessionFilter !== "all" && i.session.id !== sessionFilter) return false;
            if (!q) return true;
            return (
                i.name.toLowerCase().includes(q) ||
                i.email.toLowerCase().includes(q) ||
                i.session.title.toLowerCase().includes(q) ||
                (i.registration?.name.toLowerCase().includes(q) ?? false)
            );
        });
    }, [interests, search, sessionFilter]);

    if (loading) return <AiimsLoader />;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-600" />
                    Workshop / Session Interests
                </CardTitle>
                <CardDescription>
                    Every &quot;I&apos;d like to attend&quot; submission for this event, linked to the matching delegate — {interests.length} total
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or session..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={sessionFilter} onValueChange={setSessionFilter}>
                        <SelectTrigger className="w-full sm:w-64">
                            <SelectValue placeholder="All sessions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All sessions</SelectItem>
                            {sessions.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>{interests.length === 0 ? "No one has expressed interest in any session yet." : "No interests match your search."}</p>
                    </div>
                ) : (
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
                                                <div>
                                                    <p className="font-medium">{i.registration.name}</p>
                                                    <div className="flex gap-1.5 mt-0.5">
                                                        {i.registration.category && (
                                                            <Badge variant="outline" className="text-[10px]">{i.registration.category}</Badge>
                                                        )}
                                                        {i.registration.participantRole && (
                                                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                                                {i.registration.participantRole}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
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
                )}
            </CardContent>
        </Card>
    );
}
