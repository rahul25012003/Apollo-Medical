"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Building2,
    Plus,
    Trash2,
    Loader2,
    Save,
    Mic2,
    Clock,
    Users,
    MapPin,
    Edit,
    GripVertical,
    DoorOpen,
} from "lucide-react";
import { eventsService, EventHall } from "@/services/events";

interface SessionInfo {
    id: string;
    title: string;
    sessionType: string;
    startTime: string | null;
    endTime: string | null;
    hallName: string | null;
    hallId: string | null;
    speakers: { name: string }[];
}

interface VenuesTabProps {
    eventId: string;
    sessions: SessionInfo[];
    eventStatus: string;
}

const SESSION_TYPE_COLORS: Record<string, string> = {
    PLENARY: "bg-purple-100 text-purple-700 border-purple-200",
    KEYNOTE: "bg-blue-100 text-blue-700 border-blue-200",
    WORKSHOP: "bg-green-100 text-green-700 border-green-200",
    PANEL: "bg-orange-100 text-orange-700 border-orange-200",
    BREAK: "bg-gray-100 text-gray-500 border-gray-200",
    OTHER: "bg-slate-100 text-slate-600 border-slate-200",
};

export function VenuesTab({ eventId, sessions, eventStatus }: VenuesTabProps) {
    const [halls, setHalls] = useState<EventHall[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formHalls, setFormHalls] = useState<{ id?: string; name: string; displayOrder: number }[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newHallName, setNewHallName] = useState("");

    const fetchHalls = async () => {
        setLoading(true);
        try {
            const res = await eventsService.getHalls(eventId);
            if (res.success && res.data) {
                setHalls(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch halls:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHalls();
    }, [eventId]);

    // Get sessions assigned to a hall
    const getHallSessions = (hallId: string) => {
        return sessions.filter(s => s.hallId === hallId);
    };

    // Get unassigned sessions
    const unassignedSessions = sessions.filter(s => !s.hallId || !halls.find(h => h.id === s.hallId));

    const startEdit = () => {
        setFormHalls(halls.map(h => ({ id: h.id, name: h.name, displayOrder: h.displayOrder })));
        setEditMode(true);
    };

    const handleAddHall = () => {
        if (!newHallName.trim()) return;
        if (editMode) {
            setFormHalls([...formHalls, { name: newHallName.trim(), displayOrder: formHalls.length }]);
        } else {
            // Quick add
            (async () => {
                try {
                    await eventsService.createHall(eventId, { name: newHallName.trim(), displayOrder: halls.length });
                    await fetchHalls();
                } catch (err) {
                    console.error("Failed to create hall:", err);
                }
            })();
        }
        setNewHallName("");
        setAddDialogOpen(false);
    };

    const removeFormHall = (idx: number) => {
        setFormHalls(formHalls.filter((_, i) => i !== idx));
    };

    const updateFormHallName = (idx: number, name: string) => {
        const updated = [...formHalls];
        updated[idx] = { ...updated[idx], name };
        setFormHalls(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await eventsService.updateHalls(
                eventId,
                formHalls.map((h, i) => ({ id: h.id, name: h.name, displayOrder: i }))
            );
            if (res.success) {
                await fetchHalls();
                setEditMode(false);
            }
        } catch (err) {
            console.error("Failed to save halls:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHall = async (hallId: string) => {
        try {
            await eventsService.deleteHall(eventId, hallId);
            await fetchHalls();
        } catch (err) {
            console.error("Failed to delete hall:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-premium overflow-hidden border-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500" />
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{halls.length}</p>
                                <p className="text-xs text-muted-foreground">Venues / Halls</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-premium overflow-hidden border-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
                                <Mic2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{sessions.length}</p>
                                <p className="text-xs text-muted-foreground">Total Sessions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-premium overflow-hidden border-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20">
                                <DoorOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{sessions.filter(s => s.hallId).length}</p>
                                <p className="text-xs text-muted-foreground">Assigned</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-premium overflow-hidden border-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{unassignedSessions.length}</p>
                                <p className="text-xs text-muted-foreground">Unassigned</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Halls Management */}
            <Card className="card-premium border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5" />
                            Venues & Halls
                        </CardTitle>
                        <CardDescription>
                            Configure venues, halls, and see session assignments
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {editMode ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setAddDialogOpen(true)}
                                    variant="outline"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Hall
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                    Save
                                </Button>
                            </>
                        ) : eventStatus !== "completed" ? (
                            <>
                                <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Hall
                                </Button>
                                {halls.length > 0 && (
                                    <Button size="sm" variant="outline" onClick={startEdit}>
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit Halls
                                    </Button>
                                )}
                            </>
                        ) : null}
                    </div>
                </CardHeader>
                <CardContent>
                    {editMode ? (
                        /* Edit Mode */
                        formHalls.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No halls. Click &quot;Add Hall&quot; to create one.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formHalls.map((hall, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                                        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                                        <Input
                                            value={hall.name}
                                            onChange={(e) => updateFormHallName(idx, e.target.value)}
                                            className="flex-1 h-9"
                                            placeholder="Hall name"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                            onClick={() => removeFormHall(idx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : halls.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                                <Building2 className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">No Venues Configured</h3>
                            <p className="text-muted-foreground text-sm max-w-md mb-4">
                                Add halls like &quot;Main Auditorium&quot;, &quot;Workshop Room A&quot;, &quot;Seminar Hall B&quot; to organize your sessions by location
                            </p>
                            {eventStatus !== "completed" && (
                                <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add First Hall
                                </Button>
                            )}
                        </div>
                    ) : (
                        /* View Mode - Hall Cards with Sessions */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {halls.map((hall) => {
                                const hallSessions = getHallSessions(hall.id);
                                return (
                                    <div
                                        key={hall.id}
                                        className="rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 overflow-hidden hover:shadow-md transition-all group"
                                    >
                                        {/* Hall Header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-sm">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm">{hall.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{hallSessions.length} session{hallSessions.length !== 1 ? "s" : ""} assigned</p>
                                                </div>
                                            </div>
                                            {eventStatus !== "completed" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                                    onClick={() => handleDeleteHall(hall.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Sessions List */}
                                        <div className="px-5 py-3 space-y-2 min-h-[80px]">
                                            {hallSessions.length === 0 ? (
                                                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground/60">
                                                    No sessions assigned to this hall
                                                </div>
                                            ) : (
                                                hallSessions.map((session) => (
                                                    <div
                                                        key={session.id}
                                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-background/80 border border-border/30 hover:border-border/60 transition-colors"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className="text-sm font-medium truncate">{session.title}</p>
                                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SESSION_TYPE_COLORS[session.sessionType] || SESSION_TYPE_COLORS.OTHER}`}>
                                                                    {session.sessionType}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                {session.startTime && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {session.startTime}{session.endTime ? ` - ${session.endTime}` : ""}
                                                                    </span>
                                                                )}
                                                                {session.speakers.length > 0 && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        {session.speakers.map(s => s.name).join(", ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Unassigned Sessions Card */}
                            {unassignedSessions.length > 0 && (
                                <div className="rounded-2xl border border-dashed border-amber-300/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 overflow-hidden">
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200/40">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-amber-800">Unassigned Sessions</h4>
                                            <p className="text-xs text-amber-600/70">{unassignedSessions.length} session{unassignedSessions.length !== 1 ? "s" : ""} without a hall</p>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 space-y-2">
                                        {unassignedSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/60 border border-amber-200/30"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{session.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SESSION_TYPE_COLORS[session.sessionType] || SESSION_TYPE_COLORS.OTHER}`}>
                                                            {session.sessionType}
                                                        </Badge>
                                                        {session.startTime && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {session.startTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Hall Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Venue / Hall</DialogTitle>
                    </DialogHeader>
                    <div>
                        <label className="text-sm font-medium">Hall Name</label>
                        <Input
                            placeholder="e.g., Main Auditorium, Workshop Room A"
                            value={newHallName}
                            onChange={(e) => setNewHallName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddHall()}
                            className="mt-1"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddHall} disabled={!newHallName.trim()}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Hall
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
