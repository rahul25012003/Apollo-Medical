"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Loader2,
    Edit,
    Calendar,
    Clock,
    MapPin,
    ChevronDown,
    ChevronUp,
    Mic2,
    DoorOpen,
    Eye,
    EyeOff,
    Download,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    eventsService,
    EventSession,
    EventHall,
    EventSpeaker,
    CreateSessionData,
    SessionSpeakerData,
    Event,
} from "@/services/events";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_TYPE_CONFIG: Record<
    string,
    {
        bg: string;
        border: string;
        badge: string;
        icon: string;
        label: string;
    }
> = {
    KEYNOTE: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-700",
        icon: "\uD83C\uDFA4",
        label: "Keynote",
    },
    PLENARY: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        badge: "bg-indigo-100 text-indigo-700",
        icon: "\uD83C\uDFDB\uFE0F",
        label: "Plenary",
    },
    WORKSHOP: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-700",
        icon: "\uD83D\uDD2C",
        label: "Workshop",
    },
    PANEL: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        badge: "bg-purple-100 text-purple-700",
        icon: "\uD83D\uDC65",
        label: "Panel Discussion",
    },
    BREAK: {
        bg: "bg-amber-50/50",
        border: "border-amber-200/50",
        badge: "bg-amber-100 text-amber-700",
        icon: "\u2615",
        label: "Break",
    },
    OTHER: {
        bg: "bg-slate-50",
        border: "border-slate-200",
        badge: "bg-slate-100 text-slate-700",
        icon: "\uD83D\uDCCB",
        label: "Other",
    },
};

const SESSION_TYPES = ["KEYNOTE", "PLENARY", "WORKSHOP", "PANEL", "BREAK", "OTHER"] as const;
const SESSION_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"] as const;

const STATUS_DOT: Record<string, string> = {
    scheduled: "bg-green-500",
    ongoing: "bg-amber-500",
    completed: "bg-blue-400",
    cancelled: "bg-red-500",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(t: string | null): string {
    if (!t) return "";
    // Handle HH:mm or HH:mm:ss
    const parts = t.split(":");
    if (parts.length < 2) return t;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function dateLabel(dateStr: string, index: number): string {
    try {
        const d = parseISO(dateStr);
        if (isNaN(d.getTime())) return `Day ${index + 1}`;
        return `Day ${index + 1} - ${format(d, "MMM d")}`;
    } catch {
        return `Day ${index + 1}`;
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScientificProgramTabProps {
    eventId: string;
}

interface SessionFormData {
    title: string;
    description: string;
    sessionType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    hallId: string;
    venue: string;
    speakerIds: string[];
    status: string;
}

const DEFAULT_FORM: SessionFormData = {
    title: "",
    description: "",
    sessionType: "OTHER",
    sessionDate: "",
    startTime: "",
    endTime: "",
    hallId: "",
    venue: "",
    speakerIds: [],
    status: "scheduled",
};

export function ScientificProgramTab({ eventId }: ScientificProgramTabProps) {
    // Data state
    const [sessions, setSessions] = useState<EventSession[]>([]);
    const [halls, setHalls] = useState<EventHall[]>([]);
    const [eventSpeakers, setEventSpeakers] = useState<EventSpeaker[]>([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [selectedDay, setSelectedDay] = useState<string>("all");
    const [showDeleted, setShowDeleted] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<EventSession | null>(null);
    const [form, setForm] = useState<SessionFormData>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<EventSession | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Import schedule state
    const [importOpen, setImportOpen] = useState(false);
    const [importableEvents, setImportableEvents] = useState<Event[]>([]);
    const [loadingImportable, setLoadingImportable] = useState(false);
    const [importSourceId, setImportSourceId] = useState<string>("");
    const [importMode, setImportMode] = useState<"append" | "replace">("append");
    const [importShiftDates, setImportShiftDates] = useState(true);
    const [importIncludeSpeakers, setImportIncludeSpeakers] = useState(true);
    const [importIncludeHalls, setImportIncludeHalls] = useState(true);
    const [importing, setImporting] = useState(false);

    // -----------------------------------------------------------------------
    // Data fetching
    // -----------------------------------------------------------------------

    const fetchSessions = useCallback(async () => {
        const res = await eventsService.getSessions(eventId);
        if (res.success && res.data) setSessions(res.data);
    }, [eventId]);

    const fetchHalls = useCallback(async () => {
        const res = await eventsService.getHalls(eventId);
        if (res.success && res.data) setHalls(res.data);
    }, [eventId]);

    const fetchSpeakers = useCallback(async () => {
        const res = await eventsService.getSpeakers(eventId);
        if (res.success && res.data) setEventSpeakers(res.data);
    }, [eventId]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchSessions(), fetchHalls(), fetchSpeakers()]);
            setLoading(false);
        };
        init();
    }, [fetchSessions, fetchHalls, fetchSpeakers]);

    // -----------------------------------------------------------------------
    // Derived data
    // -----------------------------------------------------------------------

    const uniqueDates = useMemo(() => {
        const dates = new Set<string>();
        sessions.forEach((s) => {
            if (s.sessionDate) {
                try {
                    const d = parseISO(s.sessionDate);
                    if (!isNaN(d.getTime())) {
                        dates.add(format(d, "yyyy-MM-dd"));
                    }
                } catch {
                    // ignore invalid dates
                }
            }
        });
        return Array.from(dates).sort();
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        let list = sessions;
        if (!showDeleted) {
            list = list.filter((s) => s.status !== "cancelled");
        }
        if (selectedDay !== "all") {
            list = list.filter((s) => {
                if (!s.sessionDate) return false;
                try {
                    return format(parseISO(s.sessionDate), "yyyy-MM-dd") === selectedDay;
                } catch {
                    return false;
                }
            });
        }
        return list;
    }, [sessions, showDeleted, selectedDay]);

    const groupedSessions = useMemo(() => {
        const grouped: Record<string, EventSession[]> = {};
        filteredSessions.forEach((session) => {
            const dateKey = session.sessionDate
                ? format(parseISO(session.sessionDate), "yyyy-MM-dd")
                : "unscheduled";
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(session);
        });
        // Sort within each day
        Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
                if (a.startTime && b.startTime) {
                    if (a.startTime < b.startTime) return -1;
                    if (a.startTime > b.startTime) return 1;
                }
                return a.sessionOrder - b.sessionOrder;
            });
        });
        return grouped;
    }, [filteredSessions]);

    const sortedDateKeys = useMemo(
        () =>
            Object.keys(groupedSessions).sort((a, b) => {
                if (a === "unscheduled") return 1;
                if (b === "unscheduled") return -1;
                return a.localeCompare(b);
            }),
        [groupedSessions]
    );

    // -----------------------------------------------------------------------
    // Import Schedule handlers
    // -----------------------------------------------------------------------

    const openImportDialog = async () => {
        setImportOpen(true);
        setImportSourceId("");
        setImportMode("append");
        setImportShiftDates(true);
        setImportIncludeSpeakers(true);
        setImportIncludeHalls(true);
        setLoadingImportable(true);
        try {
            const res = await eventsService.getAll({ limit: 100, sortBy: "startDate", sortOrder: "desc" });
            if (res.success && Array.isArray(res.data)) {
                setImportableEvents(res.data.filter((e) => e.id !== eventId));
            }
        } catch (err) {
            console.error("Failed to load events:", err);
            toast.error("Could not load events list");
        } finally {
            setLoadingImportable(false);
        }
    };

    const handleImportSchedule = async () => {
        if (!importSourceId) {
            toast.error("Please choose an event to import from");
            return;
        }
        setImporting(true);
        const loadingId = toast.loading("Importing schedule...");
        try {
            const res = await eventsService.importSchedule(eventId, {
                sourceEventId: importSourceId,
                mode: importMode,
                shiftDates: importShiftDates,
                includeSpeakers: importIncludeSpeakers,
                includeHalls: importIncludeHalls,
            });
            toast.dismiss(loadingId);
            if (res.success && res.data) {
                const { imported, replaced } = res.data;
                if (replaced > 0) {
                    toast.success(`Imported ${imported} session${imported === 1 ? "" : "s"} (replaced ${replaced})`);
                } else {
                    toast.success(`Imported ${imported} session${imported === 1 ? "" : "s"}`);
                }
                setImportOpen(false);
                await Promise.all([fetchSessions(), fetchHalls()]);
            } else {
                const msg = typeof res.error === "string" ? res.error : res.error?.message || "Import failed";
                toast.error(msg);
            }
        } catch (err) {
            toast.dismiss(loadingId);
            console.error(err);
            toast.error("Import failed");
        } finally {
            setImporting(false);
        }
    };

    // -----------------------------------------------------------------------
    // Form helpers
    // -----------------------------------------------------------------------

    const openAddDialog = () => {
        setEditingSession(null);
        setForm({
            ...DEFAULT_FORM,
            sessionDate: selectedDay !== "all" ? selectedDay : "",
        });
        setDialogOpen(true);
    };

    const openEditDialog = (session: EventSession) => {
        setEditingSession(session);
        const speakerIds =
            session.sessionSpeakers?.map((ss) => ss.speakerId) ??
            (session.speakerId ? [session.speakerId] : []);
        setForm({
            title: session.title,
            description: session.description ?? "",
            sessionType: session.sessionType,
            sessionDate: session.sessionDate
                ? format(parseISO(session.sessionDate), "yyyy-MM-dd")
                : "",
            startTime: session.startTime ?? "",
            endTime: session.endTime ?? "",
            hallId: session.hallId ?? "",
            venue: session.venue ?? "",
            speakerIds,
            status: session.status,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        setSaving(true);

        const sessionSpeakers: CreateSessionData["sessionSpeakers"] = form.speakerIds.map(
            (sid, i) => ({
                speakerId: sid,
                displayOrder: i,
            })
        );

        const payload: CreateSessionData = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            sessionType: form.sessionType,
            sessionDate: form.sessionDate || null,
            startTime: form.startTime || null,
            endTime: form.endTime || null,
            hallId: form.hallId || null,
            venue: form.venue.trim() || null,
            sessionSpeakers,
            status: form.status,
            speakerId: form.speakerIds[0] ?? null,
        };

        try {
            if (editingSession) {
                await eventsService.updateSession(eventId, editingSession.id, payload);
            } else {
                await eventsService.createSession(eventId, payload);
            }
            await fetchSessions();
            setDialogOpen(false);
        } catch {
            // silently handle
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await eventsService.deleteSession(eventId, deleteTarget.id);
            await fetchSessions();
            setDeleteTarget(null);
        } catch {
            // silently handle
        } finally {
            setDeleting(false);
        }
    };

    const toggleSpeaker = (speakerId: string) => {
        setForm((prev) => ({
            ...prev,
            speakerIds: prev.speakerIds.includes(speakerId)
                ? prev.speakerIds.filter((id) => id !== speakerId)
                : [...prev.speakerIds, speakerId],
        }));
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------

    const getSpeakers = (session: EventSession) => {
        if (session.sessionSpeakers && session.sessionSpeakers.length > 0) {
            return session.sessionSpeakers
                .filter((ss) => ss.speaker)
                .map((ss) => ss.speaker!);
        }
        if (session.speaker) return [session.speaker];
        return [];
    };

    const getHallName = (session: EventSession) => {
        if (session.hall) return session.hall.name;
        const hall = halls.find((h) => h.id === session.hallId);
        if (hall) return hall.name;
        return session.venue;
    };

    // -----------------------------------------------------------------------
    // Loading
    // -----------------------------------------------------------------------

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // Main render
    // -----------------------------------------------------------------------

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Mic2 className="h-5 w-5 text-teal-600" />
                        Scientific Program
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sessions, talks, and workshops across all event days
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="show-deleted"
                            checked={showDeleted}
                            onCheckedChange={setShowDeleted}
                        />
                        <Label htmlFor="show-deleted" className="text-sm text-muted-foreground cursor-pointer">
                            {showDeleted ? (
                                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Show Deleted</span>
                            ) : (
                                <span className="flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> Show Deleted</span>
                            )}
                        </Label>
                    </div>
                    <Button
                        variant="outline"
                        onClick={openImportDialog}
                        className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                    >
                        <Download className="h-4 w-4" />
                        Import Schedule
                    </Button>
                    <Button onClick={openAddDialog} className="gap-2 bg-teal-600 hover:bg-teal-700">
                        <Plus className="h-4 w-4" />
                        Add Session
                    </Button>
                </div>
            </div>

            {/* Day tabs */}
            {uniqueDates.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setSelectedDay("all")}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                            selectedDay === "all"
                                ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                    >
                        All Days
                    </button>
                    {uniqueDates.map((date, i) => (
                        <button
                            key={date}
                            onClick={() => setSelectedDay(date)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                                selectedDay === date
                                    ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                        >
                            {dateLabel(date, i)}
                        </button>
                    ))}
                </div>
            )}

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {uniqueDates.length} Day{uniqueDates.length !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                    <Mic2 className="h-3.5 w-3.5" />
                    {filteredSessions.length} Session{filteredSessions.length !== 1 ? "s" : ""}
                </Badge>
                {halls.length > 0 && (
                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                        <DoorOpen className="h-3.5 w-3.5" />
                        {halls.length} Hall{halls.length !== 1 ? "s" : ""}
                    </Badge>
                )}
            </div>

            {/* Empty state */}
            {filteredSessions.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground mb-4">
                            {sessions.length === 0
                                ? "No sessions scheduled yet. Add your first session to build the program."
                                : "No sessions match the current filters."}
                        </p>
                        {sessions.length === 0 && (
                            <Button onClick={openAddDialog} className="gap-2 bg-teal-600 hover:bg-teal-700">
                                <Plus className="h-4 w-4" />
                                Add First Session
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Timeline view grouped by day */}
            {sortedDateKeys.map((dateKey, dayIdx) => {
                const daySessions = groupedSessions[dateKey];
                const dayNumber = uniqueDates.indexOf(dateKey) + 1;
                let heading = "Unscheduled Sessions";
                if (dateKey !== "unscheduled") {
                    try {
                        const d = parseISO(dateKey);
                        heading = `Day ${dayNumber} \u2014 ${format(d, "EEEE, MMM d, yyyy")}`;
                    } catch {
                        heading = `Day ${dayIdx + 1}`;
                    }
                }

                return (
                    <div key={dateKey} className="space-y-4">
                        {/* Day heading */}
                        {(sortedDateKeys.length > 1 || selectedDay === "all") && (
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-teal-700 whitespace-nowrap">
                                    {heading}
                                </h3>
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}

                        {/* Session cards */}
                        <div className="space-y-3">
                            {daySessions.map((session) => {
                                const config =
                                    SESSION_TYPE_CONFIG[session.sessionType] ??
                                    SESSION_TYPE_CONFIG.OTHER;
                                const isBreak = session.sessionType === "BREAK";
                                const isCancelled = session.status === "cancelled";
                                const speakers = getSpeakers(session);
                                const hallName = getHallName(session);
                                const isExpanded = expandedId === session.id;

                                return (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "group relative rounded-xl border transition-all",
                                            config.bg,
                                            config.border,
                                            isBreak && "border-dashed",
                                            isCancelled && "opacity-50"
                                        )}
                                    >
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() =>
                                                setExpandedId(isExpanded ? null : session.id)
                                            }
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start gap-3">
                                                {/* Time column */}
                                                <div className="flex-shrink-0 md:w-36">
                                                    {(session.startTime || session.endTime) && (
                                                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                            {formatTime(session.startTime)}
                                                            {session.endTime && (
                                                                <>
                                                                    {" - "}
                                                                    {formatTime(session.endTime)}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Status dot */}
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span
                                                            className={cn(
                                                                "inline-block h-2 w-2 rounded-full",
                                                                STATUS_DOT[session.status] ??
                                                                    STATUS_DOT.scheduled
                                                            )}
                                                        />
                                                        <span className="text-xs text-muted-foreground capitalize">
                                                            {session.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge
                                                                className={cn(
                                                                    "text-xs font-medium",
                                                                    config.badge
                                                                )}
                                                            >
                                                                <span className="mr-1">
                                                                    {config.icon}
                                                                </span>
                                                                {config.label}
                                                            </Badge>
                                                            <h3
                                                                className={cn(
                                                                    "font-semibold text-base",
                                                                    isBreak &&
                                                                        "text-muted-foreground font-medium",
                                                                    isCancelled && "line-through"
                                                                )}
                                                            >
                                                                {session.title}
                                                            </h3>
                                                        </div>
                                                        {hallName && (
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 text-xs shrink-0 hidden sm:flex"
                                                            >
                                                                <MapPin className="h-3 w-3" />
                                                                {hallName}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Hall name on mobile */}
                                                    {hallName && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 sm:hidden">
                                                            <MapPin className="h-3 w-3" />
                                                            {hallName}
                                                        </div>
                                                    )}

                                                    {/* Speakers */}
                                                    {!isBreak && speakers.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            {speakers.map((sp) => (
                                                                <div
                                                                    key={sp.id}
                                                                    className="flex items-center gap-2.5"
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium overflow-hidden flex-shrink-0">
                                                                        {sp.photo ? (
                                                                            <img
                                                                                src={sp.photo}
                                                                                alt={sp.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            sp.name
                                                                                .split(" ")
                                                                                .map((n) => n[0])
                                                                                .join("")
                                                                                .slice(0, 2)
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="font-medium text-sm">
                                                                            {sp.name}
                                                                        </div>
                                                                        {(sp.designation ||
                                                                            sp.institution) && (
                                                                            <div className="text-xs text-muted-foreground truncate">
                                                                                {sp.designation}
                                                                                {sp.designation &&
                                                                                    sp.institution &&
                                                                                    ", "}
                                                                                {sp.institution}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {speakers.length > 2 && (
                                                                <p className="text-xs text-muted-foreground pl-10">
                                                                    {speakers.length} speakers
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Expanded description */}
                                                    {isExpanded && session.description && (
                                                        <div className="mt-3 pt-3 border-t border-border/50">
                                                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                                {session.description}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Expand indicator */}
                                                    {session.description && (
                                                        <div className="mt-2">
                                                            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                                                                {isExpanded ? (
                                                                    <>
                                                                        <ChevronUp className="h-3 w-3" />
                                                                        Less details
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ChevronDown className="h-3 w-3" />
                                                                        More details
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action buttons (on hover) */}
                                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditDialog(session);
                                                        }}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget(session);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Add / Edit Session Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSession ? "Edit Session" : "Add Session"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSession
                                ? "Update the session details below."
                                : "Fill in the details to create a new session."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="session-title">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="session-title"
                                value={form.title}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, title: e.target.value }))
                                }
                                placeholder="e.g. Keynote: AI in Healthcare"
                            />
                        </div>

                        {/* Type & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Session Type</Label>
                                <Select
                                    value={form.sessionType}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, sessionType: v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SESSION_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {SESSION_TYPE_CONFIG[t].icon}{" "}
                                                {SESSION_TYPE_CONFIG[t].label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, status: v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SESSION_STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                <span className="flex items-center gap-2 capitalize">
                                                    <span
                                                        className={cn(
                                                            "inline-block h-2 w-2 rounded-full",
                                                            STATUS_DOT[s]
                                                        )}
                                                    />
                                                    {s}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date & Times */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="session-date">Date</Label>
                                <Input
                                    id="session-date"
                                    type="date"
                                    value={form.sessionDate}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            sessionDate: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="session-start">Start Time</Label>
                                <Input
                                    id="session-start"
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            startTime: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="session-end">End Time</Label>
                                <Input
                                    id="session-end"
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            endTime: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Hall */}
                        <div className="space-y-2">
                            <Label>Hall / Venue</Label>
                            {halls.length > 0 ? (
                                <Select
                                    value={form.hallId}
                                    onValueChange={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            hallId: v === "__none__" ? "" : v,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a hall" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No hall</SelectItem>
                                        {halls.map((h) => (
                                            <SelectItem key={h.id} value={h.id}>
                                                {h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    value={form.venue}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, venue: e.target.value }))
                                    }
                                    placeholder="e.g. Main Auditorium"
                                />
                            )}
                        </div>

                        {/* Speakers (multi-select) */}
                        {form.sessionType !== "BREAK" && eventSpeakers.length > 0 && (
                            <div className="space-y-2">
                                <Label>Speakers</Label>
                                <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                                    {eventSpeakers.map((es) => {
                                        const selected = form.speakerIds.includes(
                                            es.speakerId
                                        );
                                        return (
                                            <button
                                                key={es.speakerId}
                                                type="button"
                                                onClick={() => toggleSpeaker(es.speakerId)}
                                                className={cn(
                                                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors",
                                                    selected
                                                        ? "bg-teal-50 border border-teal-200"
                                                        : "hover:bg-muted"
                                                )}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0">
                                                    {es.speaker.photo ? (
                                                        <img
                                                            src={es.speaker.photo}
                                                            alt={es.speaker.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        es.speaker.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .slice(0, 2)
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium truncate">
                                                        {es.speaker.name}
                                                    </div>
                                                    {es.speaker.institution && (
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {es.speaker.institution}
                                                        </div>
                                                    )}
                                                </div>
                                                {selected && (
                                                    <div className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {form.speakerIds.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {form.speakerIds.length} speaker
                                        {form.speakerIds.length !== 1 ? "s" : ""} selected
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="session-desc">Description</Label>
                            <Textarea
                                id="session-desc"
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                                placeholder="Optional session description..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !form.title.trim()}
                            className="gap-2 bg-teal-600 hover:bg-teal-700"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editingSession ? "Save Changes" : "Create Session"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                title="Delete Session"
                description={`Are you sure you want to delete "${deleteTarget?.title ?? ""}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
            />

            {/* Import Schedule Dialog */}
            <Dialog open={importOpen} onOpenChange={(open) => !importing && setImportOpen(open)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-teal-600" />
                            Import Schedule
                        </DialogTitle>
                        <DialogDescription>
                            Copy sessions, halls, and speakers from another event to save time. You can tweak everything after importing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Source event picker */}
                        <div className="space-y-2">
                            <Label htmlFor="import-source" className="text-sm font-semibold">
                                Copy from
                            </Label>
                            <Select
                                value={importSourceId}
                                onValueChange={setImportSourceId}
                                disabled={loadingImportable || importing}
                            >
                                <SelectTrigger id="import-source">
                                    <SelectValue placeholder={loadingImportable ? "Loading events..." : "Select an event"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {importableEvents.length === 0 && !loadingImportable && (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            No other events found
                                        </div>
                                    )}
                                    {importableEvents.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            <span className="flex flex-col">
                                                <span className="font-medium">{e.title}</span>
                                                {e.startDate && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(parseISO(e.startDate), "dd MMM yyyy")}
                                                    </span>
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Mode */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">How to handle existing sessions</Label>
                            <RadioGroup
                                value={importMode}
                                onValueChange={(v) => setImportMode(v as "append" | "replace")}
                                disabled={importing}
                                className="gap-2"
                            >
                                <label className={cn(
                                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                    importMode === "append" ? "border-teal-400 bg-teal-50/60" : "border-border hover:bg-muted/40"
                                )}>
                                    <RadioGroupItem value="append" id="import-append" className="mt-0.5" />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">Append to existing</div>
                                        <div className="text-xs text-muted-foreground">Keeps current sessions and adds imported ones on top.</div>
                                    </div>
                                </label>
                                <label className={cn(
                                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                    importMode === "replace" ? "border-red-400 bg-red-50/60" : "border-border hover:bg-muted/40"
                                )}>
                                    <RadioGroupItem value="replace" id="import-replace" className="mt-0.5" />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">Replace existing</div>
                                        <div className="text-xs text-muted-foreground">Removes all current sessions first. This cannot be undone.</div>
                                    </div>
                                </label>
                            </RadioGroup>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                            <div className="text-sm font-semibold">Options</div>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                    checked={importShiftDates}
                                    onCheckedChange={(v) => setImportShiftDates(!!v)}
                                    disabled={importing}
                                    className="mt-0.5"
                                />
                                <div>
                                    <div className="text-sm font-medium">Shift dates to match this event</div>
                                    <div className="text-xs text-muted-foreground">
                                        Align Day 1 with this event&apos;s start date; all sessions move accordingly.
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                    checked={importIncludeSpeakers}
                                    onCheckedChange={(v) => setImportIncludeSpeakers(!!v)}
                                    disabled={importing}
                                    className="mt-0.5"
                                />
                                <div>
                                    <div className="text-sm font-medium">Include speaker assignments</div>
                                    <div className="text-xs text-muted-foreground">
                                        Keep the same speakers linked to each session.
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                    checked={importIncludeHalls}
                                    onCheckedChange={(v) => setImportIncludeHalls(!!v)}
                                    disabled={importing}
                                    className="mt-0.5"
                                />
                                <div>
                                    <div className="text-sm font-medium">Copy halls if missing</div>
                                    <div className="text-xs text-muted-foreground">
                                        Create halls in this event that don&apos;t exist yet (matched by name).
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setImportOpen(false)}
                            disabled={importing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImportSchedule}
                            disabled={importing || !importSourceId}
                            className="gap-2 bg-teal-600 hover:bg-teal-700"
                        >
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {importing ? "Importing..." : "Import Schedule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
