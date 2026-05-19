"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Users,
    IndianRupee,
    FileText,
    Award,
    Image,
    Plus,
    Trash2,
    GripVertical,
    Pencil,
    Info,
    Save,
    Eye,
    AlertCircle,
    CheckCircle2,
    X,
    Loader2,
    Building2,
    Mic2,
    User,
    MessageSquare,
    Megaphone,
    DoorOpen,
    Download,
    Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, parseISO } from "date-fns";
import type { Event as EventType } from "@/services/events";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { validateEventForPublish, calculateEventStatus } from "@/lib/event-validations";
import { EVENT_TYPES, EVENT_CATEGORIES, EVENT_STATUSES } from "@/lib/event-constants";
import { eventsService } from "@/services/events";
import { speakersService, Speaker } from "@/services/speakers";
import { sponsorsService, Sponsor } from "@/services/sponsors";
import { uploadFile } from "@/services";
import { toast } from "sonner";

// Build arrays from shared constants
const eventTypes = EVENT_TYPES.map(t => t.value);
const eventStatuses = EVENT_STATUSES.map(s => s.value);
const categories = EVENT_CATEGORIES.map(c => c.value);

const SESSION_TYPES = [
    { value: "PLENARY", label: "Plenary" },
    { value: "KEYNOTE", label: "Keynote" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "PANEL", label: "Panel Discussion" },
    { value: "BREAK", label: "Break / Lunch" },
    { value: "OTHER", label: "Other" },
];

const ENGAGEMENT_TYPES = [
    { value: "POLL", label: "Poll" },
    { value: "QA", label: "Q&A Session" },
    { value: "FEEDBACK", label: "Feedback Form" },
    { value: "ANNOUNCEMENT", label: "Announcement" },
    { value: "QUIZ", label: "Quiz" },
];

interface SessionSpeakerEntry {
    id: string;
    speakerId: string;
    speakerName: string;
    isExistingSpeaker: boolean;
    talkTitle: string;
    talkDescription: string;
    newSpeakerName: string;
    newSpeakerEmail: string;
    newSpeakerDesignation: string;
    newSpeakerInstitution: string;
}

interface EngagementEntry {
    id: string;
    title: string;
    type: string;
    description: string;
    content: unknown;
    isActive: boolean;
    isSaved: boolean;
}

interface HallEntry {
    id: string;
    name: string;
    isSaved: boolean;
}

interface FormData {
    title: string;
    shortDescription: string;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    timezone: string;
    location: string;
    address: string;
    city: string;
    state: string;
    country: string;
    mapLink: string;
    isVirtual: boolean;
    virtualLink: string;
    capacity: number;
    registrationOpensDate: string;
    registrationDeadline: string;
    isRegistrationOpen: boolean;
    price: number;
    earlyBirdPrice: number;
    earlyBirdDeadline: string;
    currency: string;
    status: string;
    type: string;
    typeTags: string[];
    category: string;
    cmeCredits: number;
    cmeCoordinatorName: string;
    cmeCoordinatorEmail: string;
    cmeCoordinatorDesignation: string;
    organizer: string;
    contactEmail: string;
    contactPhone: string;
    website: string;
    bannerImage: string;
    thumbnailImage: string;
    brochureUrl: string;
    signatory1Name: string;
    signatory1Title: string;
    signatory2Name: string;
    signatory2Title: string;
    isPublished: boolean;
    isFeatured: boolean;
}

interface Session {
    id: string;
    title: string;
    sessionType: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    speakerId: string;
    speakerName: string;
    isSaved: boolean;
    description: string;
    sessionOrder: number;
    status: string;
    isPublished: boolean;
    speakers: SessionSpeakerEntry[];
    isExistingSpeaker: boolean;
    newSpeakerName: string;
    newSpeakerEmail: string;
    newSpeakerDesignation: string;
    newSpeakerInstitution: string;
    hallId: string;
}

interface EventSponsorEntry {
    id: string;
    sponsorId: string;
    sponsorName: string;
    isExistingSponsor: boolean;
    isSaved: boolean; // True if loaded from database
    tier: string;
    // New sponsor fields (when creating new)
    newSponsorName: string;
    newSponsorEmail: string;
    newSponsorLogo: string;
    newSponsorWebsite: string;
}

const sponsorTiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

interface SlotCategory {
    id: string;
    name: string;
    description: string;
    totalSlots: number;
    price: number;
    earlyBirdPrice: number;
    earlyBirdDeadline: string;
    isSaved: boolean;
}

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [activeTab, setActiveTab] = useState("basic");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeScheduleDay, setActiveScheduleDay] = useState("");
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [includes, setIncludes] = useState<string[]>([]);
    const [newIncludeItem, setNewIncludeItem] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [eventSponsors, setEventSponsors] = useState<EventSponsorEntry[]>([]);
    const [existingSpeakers, setExistingSpeakers] = useState<Speaker[]>([]);
    const [existingSponsors, setExistingSponsors] = useState<Sponsor[]>([]);
    const [slotCategories, setSlotCategories] = useState<SlotCategory[]>([]);
    const [engagements, setEngagements] = useState<EngagementEntry[]>([]);
    const [halls, setHalls] = useState<HallEntry[]>([]);
    const [bannerUploading, setBannerUploading] = useState(false);

    // Import schedule dialog state
    const [importOpen, setImportOpen] = useState(false);
    const [importableEvents, setImportableEvents] = useState<EventType[]>([]);
    const [loadingImportable, setLoadingImportable] = useState(false);
    const [importSourceId, setImportSourceId] = useState<string>("");
    const [importMode, setImportMode] = useState<"append" | "replace">("append");
    const [importShiftDates, setImportShiftDates] = useState(true);
    const [importIncludeSpeakers, setImportIncludeSpeakers] = useState(true);
    const [importIncludeHalls, setImportIncludeHalls] = useState(true);
    const [importing, setImporting] = useState(false);

    const { confirm, ConfirmDialog } = useConfirmDialog();

    const [formData, setFormData] = useState<FormData>({
        title: "",
        shortDescription: "",
        description: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        timezone: "Asia/Kolkata",
        location: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        mapLink: "",
        isVirtual: false,
        virtualLink: "",
        capacity: 100,
        registrationOpensDate: "",
        registrationDeadline: "",
        isRegistrationOpen: true,
        price: 0,
        earlyBirdPrice: 0,
        earlyBirdDeadline: "",
        currency: "INR",
        status: "DRAFT",
        type: "CONFERENCE",
        typeTags: [],
        category: "",
        cmeCredits: 0,
        cmeCoordinatorName: "",
        cmeCoordinatorEmail: "",
        cmeCoordinatorDesignation: "",
        organizer: "",
        contactEmail: "",
        contactPhone: "",
        website: "",
        bannerImage: "",
        thumbnailImage: "",
        brochureUrl: "",
        signatory1Name: "",
        signatory1Title: "",
        signatory2Name: "",
        signatory2Title: "",
        isPublished: false,
        isFeatured: false,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch event, speakers, and sponsors in parallel
                const [eventRes, speakersRes, sponsorsRes] = await Promise.all([
                    eventsService.getById(eventId),
                    speakersService.getAll({ isActive: true, limit: 500 }),
                    sponsorsService.getAll({ isActive: true, limit: 500 }),
                ]);

                // Set existing speakers and sponsors
                if (speakersRes.success && speakersRes.data) {
                    setExistingSpeakers(Array.isArray(speakersRes.data) ? speakersRes.data : []);
                }
                if (sponsorsRes.success && sponsorsRes.data) {
                    setExistingSponsors(Array.isArray(sponsorsRes.data) ? sponsorsRes.data : []);
                }

                if (eventRes.success && eventRes.data) {
                    const e = eventRes.data;
                    setFormData({
                        title: e.title || "",
                        shortDescription: e.shortDescription || "",
                        description: e.description || "",
                        startDate: e.startDate ? e.startDate.split("T")[0] : "",
                        endDate: e.endDate ? e.endDate.split("T")[0] : "",
                        startTime: e.startTime || "",
                        endTime: e.endTime || "",
                        timezone: e.timezone || "Asia/Kolkata",
                        location: e.location || "",
                        address: e.address || "",
                        city: e.city || "",
                        state: e.state || "",
                        country: e.country || "India",
                        mapLink: e.mapLink || "",
                        isVirtual: e.isVirtual || false,
                        virtualLink: e.virtualLink || "",
                        capacity: e.capacity || 100,
                        registrationOpensDate: e.registrationOpensDate ? e.registrationOpensDate.split("T")[0] : "",
                        registrationDeadline: e.registrationDeadline ? e.registrationDeadline.split("T")[0] : "",
                        isRegistrationOpen: e.isRegistrationOpen ?? true,
                        price: e.price || 0,
                        earlyBirdPrice: e.earlyBirdPrice || 0,
                        earlyBirdDeadline: e.earlyBirdDeadline ? e.earlyBirdDeadline.split("T")[0] : "",
                        currency: e.currency || "INR",
                        status: e.status || "DRAFT",
                        type: e.type || "CONFERENCE",
                        typeTags: (e as any).typeTags || [],
                        category: e.category || "",
                        cmeCredits: e.cmeCredits || 0,
                        cmeCoordinatorName: e.cmeCoordinatorName || "",
                        cmeCoordinatorEmail: e.cmeCoordinatorEmail || "",
                        cmeCoordinatorDesignation: e.cmeCoordinatorDesignation || "",
                        organizer: e.organizer || "",
                        contactEmail: e.contactEmail || "",
                        contactPhone: e.contactPhone || "",
                        website: e.website || "",
                        bannerImage: e.bannerImage || "",
                        thumbnailImage: e.thumbnailImage || "",
                        brochureUrl: e.brochureUrl || "",
                        signatory1Name: e.signatory1Name || "",
                        signatory1Title: e.signatory1Title || "",
                        signatory2Name: e.signatory2Name || "",
                        signatory2Title: e.signatory2Title || "",
                        isPublished: e.isPublished || false,
                        isFeatured: e.isFeatured || false,
                    });
                    setIncludes(e.includes || []);

                    // Populate sessions from eventSessions
                    if (e.eventSessions && e.eventSessions.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const loadedSessions = e.eventSessions.map((es: any) => ({
                            id: es.id,
                            title: es.title || "",
                            sessionType: es.sessionType || "OTHER",
                            date: es.sessionDate ? new Date(es.sessionDate).toISOString().split("T")[0] : "",
                            startTime: es.startTime || "",
                            endTime: es.endTime || "",
                            venue: es.venue || "",
                            speakerId: es.speakerId || "",
                            speakerName: es.speaker?.name || "",
                            isSaved: true,
                            description: es.description || "",
                            sessionOrder: es.sessionOrder || 0,
                            status: es.status || "scheduled",
                            isPublished: es.isPublished ?? true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            speakers: (es.sessionSpeakers || []).map((sp: any) => ({
                                id: sp.id,
                                speakerId: sp.speakerId,
                                speakerName: sp.speaker?.name || "",
                                isExistingSpeaker: true,
                                talkTitle: sp.talkTitle || "",
                                talkDescription: sp.talkDescription || "",
                                newSpeakerName: "",
                                newSpeakerEmail: "",
                                newSpeakerDesignation: "",
                                newSpeakerInstitution: "",
                            })),
                            isExistingSpeaker: true,
                            newSpeakerName: "",
                            newSpeakerEmail: "",
                            newSpeakerDesignation: "",
                            newSpeakerInstitution: "",
                            hallId: es.hallId || "",
                        }));
                        setSessions(loadedSessions);
                    }

                    // Populate engagements
                    if (e.id) {
                        try {
                            const engRes = await eventsService.getEngagements(e.id);
                            if (engRes.success && engRes.data && Array.isArray(engRes.data)) {
                                setEngagements(engRes.data.map((eng: { id: string; title: string; type: string; description: string | null; content: unknown; isActive: boolean }) => ({
                                    id: eng.id,
                                    title: eng.title || "",
                                    type: eng.type || "ANNOUNCEMENT",
                                    description: eng.description || "",
                                    content: eng.content || null,
                                    isActive: eng.isActive ?? false,
                                    isSaved: true,
                                })));
                            }
                        } catch {
                            console.error("Failed to fetch engagements");
                        }

                        // Fetch halls
                        try {
                            const hallsRes = await eventsService.getHalls(e.id);
                            if (hallsRes.success && hallsRes.data && Array.isArray(hallsRes.data)) {
                                setHalls(hallsRes.data.map((h: { id: string; name: string }) => ({
                                    id: h.id,
                                    name: h.name,
                                    isSaved: true,
                                })));
                            }
                        } catch {
                            console.error("Failed to fetch halls");
                        }
                    }

                    // Populate event sponsors
                    if (e.eventSponsors && e.eventSponsors.length > 0) {
                        const loadedSponsors = e.eventSponsors.map((es: {
                            id: string;
                            sponsorId: string;
                            tier: string;
                            sponsor: {
                                id: string;
                                name: string;
                            };
                        }) => ({
                            id: es.id,
                            sponsorId: es.sponsorId,
                            sponsorName: es.sponsor?.name || "",
                            isExistingSponsor: true,
                            isSaved: true, // Loaded from database
                            tier: es.tier || "SILVER",
                            newSponsorName: "",
                            newSponsorEmail: "",
                            newSponsorLogo: "",
                            newSponsorWebsite: "",
                        }));
                        setEventSponsors(loadedSponsors);
                    }

                    // Populate pricing categories
                    if (e.pricingCategories && e.pricingCategories.length > 0) {
                        const loadedCategories = e.pricingCategories.map((pc: {
                            id: string;
                            name: string;
                            description: string | null;
                            totalSlots: number;
                            price: number | string;
                            earlyBirdPrice: number | string | null;
                            earlyBirdDeadline: string | null;
                        }) => ({
                            id: pc.id,
                            name: pc.name || "",
                            description: pc.description || "",
                            totalSlots: pc.totalSlots || 100,
                            price: Number(pc.price) || 0,
                            earlyBirdPrice: pc.earlyBirdPrice ? Number(pc.earlyBirdPrice) : 0,
                            earlyBirdDeadline: pc.earlyBirdDeadline ? pc.earlyBirdDeadline.split("T")[0] : "",
                            isSaved: true,
                        }));
                        setSlotCategories(loadedCategories);
                    }
                } else {
                    setError("Event not found");
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to load event");
            } finally {
                setLoading(false);
            }
        }

        if (eventId) {
            fetchData();
        }
    }, [eventId]);

    const handleChange = (field: keyof FormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(false);
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setBannerUploading(true);
            const res = await uploadFile(file, "events");
            if (res.success && res.data) {
                handleChange("bannerImage", res.data.url);
                toast.success("Banner image uploaded successfully");
            } else {
                toast.error("Failed to upload banner image");
            }
        } catch {
            toast.error("Error uploading banner image");
        } finally {
            setBannerUploading(false);
        }
    };

    const [brochureUploading, setBrochureUploading] = useState(false);
    const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setBrochureUploading(true);
            const res = await uploadFile(file, "events/brochures");
            if (res.success && res.data) {
                handleChange("brochureUrl", res.data.url);
                toast.success("Brochure uploaded successfully");
            } else {
                toast.error("Failed to upload brochure");
            }
        } catch {
            toast.error("Error uploading brochure");
        } finally {
            setBrochureUploading(false);
        }
    };

    const addIncludeItem = () => {
        if (newIncludeItem.trim() && !includes.includes(newIncludeItem.trim())) {
            setIncludes([...includes, newIncludeItem.trim()]);
            setNewIncludeItem("");
        }
    };

    const removeIncludeItem = (index: number) => {
        setIncludes(includes.filter((_, i) => i !== index));
    };

    // Open the Import Schedule dialog and load importable events
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
            console.error(err);
            toast.error("Could not load events list");
        } finally {
            setLoadingImportable(false);
        }
    };

    // Call the import API and reload sessions from the server
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
                // Reload the event to pick up the new sessions
                const reload = await eventsService.getById(eventId);
                if (reload.success && reload.data?.eventSessions) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const loaded = reload.data.eventSessions.map((es: any) => ({
                        id: es.id,
                        title: es.title || "",
                        sessionType: es.sessionType || "OTHER",
                        date: es.sessionDate ? new Date(es.sessionDate).toISOString().split("T")[0] : "",
                        startTime: es.startTime || "",
                        endTime: es.endTime || "",
                        venue: es.venue || "",
                        speakerId: es.speakerId || "",
                        speakerName: es.speaker?.name || "",
                        isSaved: true,
                        description: es.description || "",
                        sessionOrder: es.sessionOrder || 0,
                        status: es.status || "scheduled",
                        isPublished: es.isPublished ?? true,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        speakers: (es.sessionSpeakers || []).map((sp: any) => ({
                            id: sp.id,
                            speakerId: sp.speakerId,
                            speakerName: sp.speaker?.name || "",
                            isExistingSpeaker: true,
                            talkTitle: sp.talkTitle || "",
                            talkDescription: sp.talkDescription || "",
                            newSpeakerName: "",
                            newSpeakerEmail: "",
                            newSpeakerDesignation: "",
                            newSpeakerInstitution: "",
                        })),
                        isExistingSpeaker: true,
                        newSpeakerName: "",
                        newSpeakerEmail: "",
                        newSpeakerDesignation: "",
                        newSpeakerInstitution: "",
                        hallId: es.hallId || "",
                    }));
                    setSessions(loaded);
                }
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

    const addSession = () => {
        setSessions([
            ...sessions,
            {
                id: Date.now().toString(),
                title: "",
                sessionType: "OTHER",
                date: "",
                startTime: "",
                endTime: "",
                venue: "",
                speakerId: "",
                speakerName: "",
                isSaved: false,
                description: "",
                sessionOrder: sessions.length,
                status: "scheduled",
                isPublished: true,
                speakers: [],
                isExistingSpeaker: true,
                newSpeakerName: "",
                newSpeakerEmail: "",
                newSpeakerDesignation: "",
                newSpeakerInstitution: "",
                hallId: "",
            },
        ]);
    };

    const removeSession = async (sessionToRemove: Session) => {
        const sessionTitle = sessionToRemove.title || "this session";

        const confirmed = await confirm({
            title: "Delete Session",
            description: `Are you sure you want to delete "${sessionTitle}"?`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        // If this is a saved session, delete from database
        if (sessionToRemove.isSaved) {
            try {
                await eventsService.deleteSession(eventId, sessionToRemove.id);
            } catch (error) {
                console.error("Failed to delete session:", error);
                toast.error("Failed to delete session");
                return;
            }
        }
        // Remove from local state
        setSessions(prev => prev.filter((session) => session.id !== sessionToRemove.id));
        toast.success("Session deleted");
    };

    const updateSession = (id: string, field: keyof Session, value: string | boolean) => {
        setSessions(
            sessions.map((session) =>
                session.id === id ? { ...session, [field]: value } : session
            )
        );
    };

    const addSessionSpeaker = (sessionId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId
                ? {
                    ...s,
                    speakers: [...s.speakers, {
                        id: Date.now().toString(),
                        speakerId: "",
                        speakerName: "",
                        isExistingSpeaker: true,
                        talkTitle: "",
                        talkDescription: "",
                        newSpeakerName: "",
                        newSpeakerEmail: "",
                        newSpeakerDesignation: "",
                        newSpeakerInstitution: "",
                    }]
                }
                : s
        ));
    };

    const removeSessionSpeaker = (sessionId: string, speakerEntryId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId
                ? { ...s, speakers: s.speakers.filter(sp => sp.id !== speakerEntryId) }
                : s
        ));
    };

    const updateSessionSpeaker = (sessionId: string, speakerEntryId: string, field: string, value: unknown) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId
                ? {
                    ...s,
                    speakers: s.speakers.map(sp =>
                        sp.id === speakerEntryId ? { ...sp, [field]: value } : sp
                    )
                }
                : s
        ));
    };

    const addEngagement = () => {
        setEngagements([
            ...engagements,
            {
                id: Date.now().toString(),
                title: "",
                type: "ANNOUNCEMENT",
                description: "",
                content: null,
                isActive: false,
                isSaved: false,
            },
        ]);
    };

    const removeEngagement = async (engagementToRemove: EngagementEntry) => {
        const engTitle = engagementToRemove.title || "this engagement";

        const confirmed = await confirm({
            title: "Delete Engagement",
            description: `Are you sure you want to delete "${engTitle}"?`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        if (engagementToRemove.isSaved) {
            try {
                await eventsService.deleteEngagement(eventId, engagementToRemove.id);
            } catch (error) {
                console.error("Failed to delete engagement:", error);
                toast.error("Failed to delete engagement");
                return;
            }
        }
        setEngagements(prev => prev.filter(e => e.id !== engagementToRemove.id));
        toast.success("Engagement deleted");
    };

    const updateEngagement = (id: string, field: string, value: unknown) => {
        setEngagements(prev => prev.map(e => {
            if (e.id !== id) return e;
            // Reset content when type changes (e.g., poll options shouldn't persist when switching to QA)
            if (field === "type" && value !== e.type) {
                return { ...e, type: value as string, content: null };
            }
            return { ...e, [field]: value };
        }));
    };

    const addHall = () => {
        setHalls([...halls, { id: Date.now().toString(), name: "", isSaved: false }]);
    };

    const removeHall = (id: string) => {
        setHalls(halls.filter(h => h.id !== id));
    };

    const updateHall = (id: string, name: string) => {
        setHalls(halls.map(h => h.id === id ? { ...h, name } : h));
    };

    const addEventSponsor = () => {
        setEventSponsors([
            ...eventSponsors,
            {
                id: Date.now().toString(),
                sponsorId: "",
                sponsorName: "",
                isExistingSponsor: true,
                isSaved: false, // New sponsor, not saved yet
                tier: "SILVER",
                newSponsorName: "",
                newSponsorEmail: "",
                newSponsorLogo: "",
                newSponsorWebsite: "",
            },
        ]);
    };

    const removeEventSponsor = async (sponsorToRemove: EventSponsorEntry) => {
        const sponsorName = sponsorToRemove.sponsorName || sponsorToRemove.newSponsorName || "this sponsor";

        const confirmed = await confirm({
            title: "Remove Sponsor",
            description: `Are you sure you want to remove "${sponsorName}" from this event?`,
            confirmText: "Remove",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        // If this is a saved sponsor, remove from database
        if (sponsorToRemove.isSaved && sponsorToRemove.sponsorId) {
            try {
                await eventsService.removeSponsor(eventId, sponsorToRemove.sponsorId);
            } catch (error) {
                console.error("Failed to remove sponsor from event:", error);
                toast.error("Failed to remove sponsor");
                return;
            }
        }

        // Remove from local state
        setEventSponsors(prev => prev.filter((sponsor) => sponsor.id !== sponsorToRemove.id));
        toast.success("Sponsor removed");
    };

    const updateEventSponsor = (id: string, field: keyof EventSponsorEntry, value: string | boolean) => {
        setEventSponsors(
            eventSponsors.map((sponsor) =>
                sponsor.id === id ? { ...sponsor, [field]: value } : sponsor
            )
        );
    };

    // Slot Category helpers
    const addSlotCategory = () => {
        setSlotCategories([
            ...slotCategories,
            {
                id: Date.now().toString(),
                name: "",
                description: "",
                totalSlots: 100,
                price: 0,
                earlyBirdPrice: 0,
                earlyBirdDeadline: "",
                isSaved: false,
            },
        ]);
    };

    const removeSlotCategory = (id: string) => {
        setSlotCategories(slotCategories.filter((cat) => cat.id !== id));
    };

    const updateSlotCategory = (id: string, field: keyof SlotCategory, value: string | number | boolean) => {
        setSlotCategories(
            slotCategories.map((cat) =>
                cat.id === id ? { ...cat, [field]: value } : cat
            )
        );
    };

    const handleSubmit = async (publish?: boolean) => {
        // Clear any previous errors first
        setError(null);
        setSuccess(false);

        // Title is always required (even for drafts)
        if (!formData.title.trim()) {
            setError("Title is required");
            setActiveTab("basic");
            return;
        }

        // If publishing, validate all required fields
        if (publish === true) {
            const validation = validateEventForPublish({
                title: formData.title,
                description: formData.description,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                registrationOpensDate: formData.registrationOpensDate || null,
                registrationDeadline: formData.registrationDeadline,
                location: formData.location,
                capacity: Number(formData.capacity),
                organizer: formData.organizer,
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone,
                price: Number(formData.price),
                sessions: sessions.filter(s => s.title?.trim()), // Sessions with title (speaker is optional)
            });

            if (!validation.isValid) {
                setError(`Cannot publish. Missing required fields:\n• ${validation.errors.join("\n• ")}`);
                return;
            }
        }

        try {
            setSaving(true);

            // Determine isPublished value and status
            const isPublished = publish !== undefined ? publish : formData.isPublished;
            const status = publish === true
                ? calculateEventStatus(formData.startDate, formData.endDate)
                : undefined;

            // Calculate total capacity from slot categories if available
            const totalCapacity = slotCategories.length > 0
                ? slotCategories.reduce((sum, cat) => sum + (Number(cat.totalSlots) || 0), 0)
                : Number(formData.capacity);

            // 1. Update basic event data
            const response = await eventsService.update(eventId, {
                ...formData,
                registrationOpensDate: formData.registrationOpensDate || undefined,
                registrationDeadline: formData.registrationDeadline || undefined,
                isPublished,
                ...(status && { status }),
                capacity: totalCapacity,
                price: Number(formData.price),
                earlyBirdPrice: formData.earlyBirdPrice ? Number(formData.earlyBirdPrice) : undefined,
                cmeCredits: formData.cmeCredits ? Number(formData.cmeCredits) : undefined,
                includes,
                // Include pricing categories for category-based pricing
                pricingCategories: slotCategories.filter(cat => cat.name.trim()).map((cat, index) => ({
                    name: cat.name,
                    description: cat.description || undefined,
                    totalSlots: Number(cat.totalSlots) || 100,
                    price: Number(cat.price) || 0,
                    earlyBirdPrice: cat.earlyBirdPrice ? Number(cat.earlyBirdPrice) : undefined,
                    earlyBirdDeadline: cat.earlyBirdDeadline || undefined,
                    displayOrder: index,
                })),
            });

            if (!response.success) {
                let errorMessage = "Failed to update event";
                if (typeof response.error === 'string') {
                    errorMessage = response.error;
                } else if (response.error) {
                    // Check for validation errors with details
                    if (response.error.details && Array.isArray(response.error.details)) {
                        const fieldErrors = response.error.details
                            .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
                            .join("\n• ");
                        errorMessage = `Validation failed:\n• ${fieldErrors}`;
                    } else {
                        errorMessage = response.error.message || "Failed to update event";
                    }
                }
                setError(errorMessage);
                setSaving(false);
                return;
            }

            // 2. Save halls
            const validHalls = halls.filter(h => h.name.trim());
            if (validHalls.length > 0) {
                const hallsRes = await eventsService.updateHalls(eventId, validHalls.map((h, i) => ({
                    id: h.isSaved ? h.id : undefined,
                    name: h.name.trim(),
                    displayOrder: i,
                })));
                if (hallsRes.success && hallsRes.data && Array.isArray(hallsRes.data)) {
                    setHalls(hallsRes.data.map((h: { id: string; name: string }) => ({
                        id: h.id,
                        name: h.name,
                        isSaved: true,
                    })));
                }
            }

            // 3. Handle sessions with multi-speaker support
            for (const session of sessions) {
                if (!session.title?.trim()) continue;

                // Resolve session speakers
                const resolvedSpeakers: { speakerId: string; talkTitle?: string; talkDescription?: string; displayOrder: number }[] = [];

                for (let i = 0; i < session.speakers.length; i++) {
                    const sp = session.speakers[i];
                    let speakerId = sp.speakerId;

                    if (!sp.isExistingSpeaker && sp.newSpeakerName) {
                        const speakerRes = await speakersService.create({
                            name: sp.newSpeakerName,
                            email: sp.newSpeakerEmail || undefined,
                            designation: sp.newSpeakerDesignation || undefined,
                            institution: sp.newSpeakerInstitution || undefined,
                        });
                        if (speakerRes.success && speakerRes.data) {
                            speakerId = speakerRes.data.id;
                            setExistingSpeakers(prev => [...prev, speakerRes.data!]);
                        }
                    }

                    if (speakerId) {
                        resolvedSpeakers.push({
                            speakerId,
                            talkTitle: sp.talkTitle || undefined,
                            talkDescription: sp.talkDescription || undefined,
                            displayOrder: i,
                        });
                    }
                }

                const sessionData = {
                    title: session.title,
                    sessionType: session.sessionType || "OTHER",
                    description: session.description || null,
                    sessionDate: session.date || null,
                    startTime: session.startTime || null,
                    endTime: session.endTime || null,
                    venue: session.venue || null,
                    sessionOrder: session.sessionOrder,
                    sessionSpeakers: resolvedSpeakers.length > 0 ? resolvedSpeakers : undefined,
                    status: session.status,
                    isPublished: session.isPublished,
                };

                if (session.isSaved) {
                    await eventsService.updateSession(eventId, session.id, sessionData);
                } else {
                    await eventsService.createSession(eventId, sessionData);
                }
            }

            // 4. Handle engagements
            for (const engagement of engagements) {
                if (!engagement.title?.trim()) continue;

                const engData = {
                    title: engagement.title,
                    type: engagement.type,
                    description: engagement.description || undefined,
                    content: engagement.content || undefined,
                    isActive: engagement.isActive,
                };

                if (engagement.isSaved) {
                    await eventsService.updateEngagement(eventId, engagement.id, engData);
                } else {
                    await eventsService.createEngagement(eventId, engData);
                }
            }

            // 5. Handle sponsors
            const currentSponsorsRes = await eventsService.getSponsors(eventId);
            const currentSponsorIds = currentSponsorsRes.data?.map((s: { sponsorId: string }) => s.sponsorId) || [];

            for (const sponsor of eventSponsors) {
                try {
                    if (sponsor.isExistingSponsor && sponsor.sponsorId) {
                        // Check if this sponsor is already linked
                        if (!currentSponsorIds.includes(sponsor.sponsorId)) {
                            // Add existing sponsor to event
                            const addRes = await eventsService.addSponsor(eventId, {
                                sponsorId: sponsor.sponsorId,
                                tier: (sponsor.tier || "SILVER") as "PLATINUM" | "GOLD" | "SILVER" | "BRONZE",
                            });
                            if (!addRes.success) {
                                console.error("Failed to add sponsor:", addRes.error);
                            }
                        } else {
                            // Update existing sponsor assignment
                            const updateRes = await eventsService.updateSponsor(eventId, sponsor.sponsorId, {
                                tier: (sponsor.tier || "SILVER") as "PLATINUM" | "GOLD" | "SILVER" | "BRONZE",
                            });
                            if (!updateRes.success) {
                                console.error("Failed to update sponsor:", updateRes.error);
                            }
                        }
                    } else if (!sponsor.isExistingSponsor && sponsor.newSponsorName.trim()) {
                        // Create new sponsor first
                        const sponsorData: { name: string; email?: string; website?: string } = {
                            name: sponsor.newSponsorName.trim(),
                        };

                        if (sponsor.newSponsorEmail && sponsor.newSponsorEmail.trim()) {
                            sponsorData.email = sponsor.newSponsorEmail.trim();
                        }

                        if (sponsor.newSponsorWebsite && sponsor.newSponsorWebsite.trim()) {
                            let website = sponsor.newSponsorWebsite.trim();
                            if (!website.startsWith('http://') && !website.startsWith('https://')) {
                                website = 'https://' + website;
                            }
                            sponsorData.website = website;
                        }

                        const sponsorRes = await sponsorsService.create(sponsorData);

                        if (sponsorRes.success && sponsorRes.data) {
                            const newSponsor = sponsorRes.data;
                            // Link the new sponsor to event
                            await eventsService.addSponsor(eventId, {
                                sponsorId: newSponsor.id,
                                tier: (sponsor.tier || "SILVER") as "PLATINUM" | "GOLD" | "SILVER" | "BRONZE",
                            });

                            // Update existing sponsors list
                            setExistingSponsors((prev) => [
                                ...prev,
                                newSponsor,
                            ]);

                            toast.success(`Sponsor "${newSponsor.name}" created`);
                        }
                    }
                } catch (sponsorError) {
                    console.error("Error saving sponsor:", sponsorError);
                }
            }

            setSuccess(true);
            toast.success("Event updated successfully!");
            setTimeout(() => {
                router.push(`/dashboard/events/${eventId}`);
            }, 1000);
        } catch (err) {
            console.error("Failed to update event:", err);
            setError("An error occurred while updating the event");
            toast.error("Failed to update event");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Edit Event" subtitle="Loading event details...">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Edit Event"
            subtitle="Update event details and settings"
        >
            <ConfirmDialog />

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
                        <div className="space-y-2">
                            <Label htmlFor="import-source" className="text-sm font-semibold">Copy from</Label>
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
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No other events found</div>
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
                                    <div className="text-xs text-muted-foreground">Keep the same speakers linked to each session.</div>
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
                                    <div className="text-xs text-muted-foreground">Create halls in this event that don&apos;t exist yet (matched by name).</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>
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

            <div className="space-y-6 animate-fadeIn">
                {/* Back Button & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/events/${eventId}`)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden xs:inline">Back to Event</span>
                        <span className="xs:hidden">Back</span>
                    </Button>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 flex-1 sm:flex-none"
                            onClick={() => window.open(`/events/${eventId}?preview=true`, "_blank")}
                        >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Preview</span>
                        </Button>
                        {!formData.isPublished ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 flex-1 sm:flex-none"
                                    onClick={() => handleSubmit(false)}
                                    disabled={saving}
                                >
                                    <Save className="h-4 w-4" />
                                    <span className="hidden sm:inline">{saving ? "Saving..." : "Save Draft"}</span>
                                    <span className="sm:hidden">{saving ? "..." : "Save"}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-2 gradient-medical text-white hover:opacity-90 flex-1 sm:flex-none"
                                    onClick={() => handleSubmit(true)}
                                    disabled={saving}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">{saving ? "Publishing..." : "Publish Event"}</span>
                                    <span className="sm:hidden">{saving ? "..." : "Publish"}</span>
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                className="gap-2 gradient-medical text-white hover:opacity-90 flex-1 sm:flex-none"
                                onClick={() => handleSubmit()}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="hidden sm:inline">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span className="hidden sm:inline">Save Changes</span>
                                        <span className="sm:hidden">Save</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Event updated successfully! Redirecting...
                    </div>
                )}

                {/* Progress Indicator */}
                <Card className="border-medical-teal/20 bg-gradient-to-r from-medical-teal-light/30 to-medical-blue-light/30">
                    <CardContent className="py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            {["Basic", "Price", "Program", "Engage", "Sponsors", "Settings"].map((step, index) => {
                                const fullNames = ["Basic Info", "Pricing", "Scientific Program", "Engagement", "Sponsors", "Settings"];
                                const tabs = ["basic", "slots", "sessions", "engagement", "sponsors", "settings"];
                                return (
                                    <div key={step} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors cursor-pointer",
                                                    index === tabs.indexOf(activeTab)
                                                        ? "bg-primary text-primary-foreground"
                                                        : index < tabs.indexOf(activeTab)
                                                        ? "bg-medical-green text-white"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                )}
                                                onClick={() => setActiveTab(tabs[index])}
                                            >
                                                {index + 1}
                                            </div>
                                            <span className="text-[9px] sm:text-xs mt-1 text-muted-foreground text-center max-w-[50px] sm:max-w-none">
                                                <span className="sm:hidden">{step}</span>
                                                <span className="hidden sm:inline">{fullNames[index]}</span>
                                            </span>
                                        </div>
                                        {index < 5 && (
                                            <div
                                                className={cn(
                                                    "w-4 xs:w-6 sm:w-10 md:w-16 h-0.5 mx-0.5 sm:mx-1",
                                                    index < tabs.indexOf(activeTab)
                                                        ? "bg-medical-green"
                                                        : "bg-muted"
                                                )}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex flex-wrap gap-1 w-full h-auto p-1">
                        <TabsTrigger value="basic" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
                            <FileText className="h-4 w-4 hidden md:block" />
                            <span className="hidden sm:inline">Overview</span>
                            <span className="sm:hidden">Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="slots" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
                            <Users className="h-4 w-4 hidden md:block" />
                            <span className="hidden sm:inline">Pricing</span>
                            <span className="sm:hidden">Price</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
                            <Award className="h-4 w-4 hidden md:block" />
                            Settings
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
                            <Mic2 className="h-4 w-4 hidden md:block" />
                            <span className="hidden sm:inline">Scientific Program</span>
                            <span className="sm:hidden">Program</span>
                        </TabsTrigger>
                        <TabsTrigger value="engagement" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
                            <Megaphone className="h-4 w-4 hidden md:block" />
                            <span className="hidden sm:inline">Engagement</span>
                            <span className="sm:hidden">Engage</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Form */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="icon-container icon-container-teal">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            Event Details
                                        </CardTitle>
                                        <CardDescription>
                                            Basic information about your event
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Event Title *</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={e => handleChange("title", e.target.value)}
                                                placeholder="e.g., Annual Neurostimulation Conference 2025"
                                                className="text-lg"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Event Category</Label>
                                                <Select value={formData.category} onValueChange={v => handleChange("category", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Event Type *</Label>
                                                <Select value={formData.type} onValueChange={v => handleChange("type", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EVENT_TYPES.map(t => (
                                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description *</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={e => handleChange("description", e.target.value)}
                                                placeholder="Provide a detailed description of the event..."
                                                rows={5}
                                                className="resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="shortDescription">Short Description</Label>
                                            <Input
                                                id="shortDescription"
                                                value={formData.shortDescription}
                                                onChange={e => handleChange("shortDescription", e.target.value)}
                                                placeholder="Brief summary for event cards (max 150 characters)"
                                                maxLength={150}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                This will appear in event listings and cards
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="icon-container icon-container-green">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            What's Included
                                        </CardTitle>
                                        <CardDescription>
                                            List what attendees will receive with their registration
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newIncludeItem}
                                                onChange={(e) => setNewIncludeItem(e.target.value)}
                                                placeholder="e.g., Lunch and refreshments"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addIncludeItem();
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                onClick={addIncludeItem}
                                                disabled={!newIncludeItem.trim()}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {includes.length > 0 ? (
                                            <div className="space-y-2">
                                                {includes.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-medical-green shrink-0" />
                                                            <span className="text-sm">{item}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeIncludeItem(index)}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No items added yet. Add what's included in the registration.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="icon-container icon-container-blue">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            Date & Time
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startDate">Start Date *</Label>
                                                <Input
                                                    id="startDate"
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={e => handleChange("startDate", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endDate">End Date *</Label>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={e => handleChange("endDate", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startTime">Start Time</Label>
                                                <Input
                                                    id="startTime"
                                                    type="time"
                                                    value={formData.startTime}
                                                    onChange={e => handleChange("startTime", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endTime">End Time</Label>
                                                <Input
                                                    id="endTime"
                                                    type="time"
                                                    value={formData.endTime}
                                                    onChange={e => handleChange("endTime", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="registrationOpensDate">Registration Opens Date</Label>
                                                <Input
                                                    id="registrationOpensDate"
                                                    type="date"
                                                    className="w-full"
                                                    value={formData.registrationOpensDate}
                                                    onChange={e => handleChange("registrationOpensDate", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                                                <Input
                                                    id="registrationDeadline"
                                                    type="date"
                                                    className="w-full"
                                                    value={formData.registrationDeadline}
                                                    onChange={e => handleChange("registrationDeadline", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="icon-container icon-container-green">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            Venue Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <Label>Virtual Event</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    This is an online event
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.isVirtual}
                                                onCheckedChange={v => handleChange("isVirtual", v)}
                                            />
                                        </div>

                                        {formData.isVirtual ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="virtualLink">Virtual Meeting Link</Label>
                                                <Input
                                                    id="virtualLink"
                                                    type="url"
                                                    value={formData.virtualLink}
                                                    onChange={e => handleChange("virtualLink", e.target.value)}
                                                    placeholder="https://zoom.us/... or https://meet.google.com/..."
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Venue Name</Label>
                                                    <Input
                                                        id="location"
                                                        value={formData.location}
                                                        onChange={e => handleChange("location", e.target.value)}
                                                        placeholder="e.g., Grand Conference Hall"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="address">Full Address</Label>
                                                    <Textarea
                                                        id="address"
                                                        value={formData.address}
                                                        onChange={e => handleChange("address", e.target.value)}
                                                        placeholder="Complete address"
                                                        rows={2}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city">City</Label>
                                                        <Input
                                                            id="city"
                                                            value={formData.city}
                                                            onChange={e => handleChange("city", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="state">State</Label>
                                                        <Input
                                                            id="state"
                                                            value={formData.state}
                                                            onChange={e => handleChange("state", e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="mapLink">Google Maps Link</Label>
                                                    <Input
                                                        id="mapLink"
                                                        type="url"
                                                        value={formData.mapLink}
                                                        onChange={e => handleChange("mapLink", e.target.value)}
                                                        placeholder="https://maps.google.com/..."
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="icon-container icon-container-purple">
                                                <Image className="h-5 w-5" />
                                            </div>
                                            Event Banner
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bannerUpload">Upload Banner Image</Label>
                                            <Input
                                                id="bannerUpload"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                onChange={handleBannerUpload}
                                                disabled={bannerUploading}
                                                className="cursor-pointer"
                                            />
                                            {bannerUploading && (
                                                <p className="text-xs text-muted-foreground">Uploading...</p>
                                            )}
                                        </div>
                                        {formData.bannerImage && (
                                            <div className="space-y-2">
                                                <div className="rounded-lg overflow-hidden border">
                                                    <img
                                                        src={formData.bannerImage}
                                                        alt="Banner preview"
                                                        className="w-full h-32 object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleChange("bannerImage", "")}
                                                    className="gap-1 text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Brochure Upload */}
                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Event Brochure (PDF)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="space-y-2">
                                            <Input
                                                id="brochureUpload"
                                                type="file"
                                                accept="application/pdf,image/jpeg,image/png"
                                                onChange={handleBrochureUpload}
                                                disabled={brochureUploading}
                                                className="cursor-pointer"
                                            />
                                            {brochureUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                                        </div>
                                        {formData.brochureUrl && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <a href={formData.brochureUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                                                        View Brochure
                                                    </a>
                                                </div>
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleChange("brochureUrl", "")} className="gap-1 text-destructive flex-shrink-0">
                                                    <Trash2 className="h-3 w-3" /> Remove
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="text-base">Event Status</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={formData.status} onValueChange={v => handleChange("status", v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eventStatuses.map(status => (
                                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm">Published</span>
                                            <Switch
                                                checked={formData.isPublished}
                                                onCheckedChange={v => handleChange("isPublished", v)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm">Featured</span>
                                            <Switch
                                                checked={formData.isFeatured}
                                                onCheckedChange={v => handleChange("isFeatured", v)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Slots & Pricing Tab */}
                    <TabsContent value="slots" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <div className="icon-container icon-container-teal h-8 w-8 sm:h-10 sm:w-10">
                                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    Capacity & Pricing
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-1">
                                    Set registration capacity and pricing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {slotCategories.length === 0 && (
                                        <div className="space-y-2">
                                            <Label>Total Capacity *</Label>
                                            <Input
                                                type="number"
                                                value={formData.capacity}
                                                onChange={e => handleChange("capacity", parseInt(e.target.value) || 0)}
                                                min={1}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select value={formData.currency} onValueChange={v => handleChange("currency", v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INR">INR (₹)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Default Pricing (used when no categories defined) */}
                                {slotCategories.length === 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Regular Price (₹)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={e => handleChange("price", parseFloat(e.target.value) || 0)}
                                                    className="pl-10"
                                                    min={0}
                                                />
                                            </div>
                                        </div>
                                        {/* Early bird hidden — enable when needed */}
                                    </div>
                                )}

                                {/* Pricing Categories */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base">Pricing Categories</Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Add different pricing tiers for Faculty, Students, Professionals, etc.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addSlotCategory}
                                            className="gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Category
                                        </Button>
                                    </div>

                                    {slotCategories.length > 0 && (
                                        <div className="space-y-4">
                                            {slotCategories.map((category, index) => (
                                                <div
                                                    key={category.id}
                                                    className="p-4 border rounded-xl bg-muted/30 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="secondary" className="font-medium">
                                                            Category {index + 1}
                                                        </Badge>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeSlotCategory(category.id)}
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Category Name *</Label>
                                                            <Input
                                                                placeholder="e.g., Faculty, Student, Professional"
                                                                value={category.name}
                                                                onChange={e => updateSlotCategory(category.id, "name", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Slots Available</Label>
                                                            <Input
                                                                type="number"
                                                                value={category.totalSlots}
                                                                onChange={e => updateSlotCategory(category.id, "totalSlots", parseInt(e.target.value) || 0)}
                                                                min={1}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Description (Optional)</Label>
                                                        <Input
                                                            placeholder="Brief description of this category"
                                                            value={category.description}
                                                            onChange={e => updateSlotCategory(category.id, "description", e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Price (₹)</Label>
                                                            <div className="relative">
                                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    type="number"
                                                                    value={category.price}
                                                                    onChange={e => updateSlotCategory(category.id, "price", parseFloat(e.target.value) || 0)}
                                                                    className="pl-10"
                                                                    min={0}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Early bird hidden */}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {slotCategories.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                                            <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                            <p className="text-sm text-muted-foreground mb-3">
                                                No pricing categories defined. Default pricing will be used.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addSlotCategory}
                                                className="gap-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Pricing Category
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Summary Card */}
                                <div className="mt-6 p-4 rounded-xl gradient-medical-light border border-medical-teal/20">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">
                                                Total Capacity
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {slotCategories.length > 0
                                                    ? `Sum of ${slotCategories.length} categor${slotCategories.length === 1 ? 'y' : 'ies'}`
                                                    : "Maximum registrations allowed"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-primary">
                                                {slotCategories.length > 0
                                                    ? slotCategories.reduce((sum, cat) => sum + (Number(cat.totalSlots) || 0), 0)
                                                    : formData.capacity}
                                            </p>
                                            <p className="text-xs text-muted-foreground">slots</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registration Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="icon-container icon-container-orange">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    Registration Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label>Registration Open</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Accept new registrations
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isRegistrationOpen}
                                        onCheckedChange={v => handleChange("isRegistrationOpen", v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sessions Tab */}
                    {/* Scientific Program Tab */}
                    <TabsContent value="sessions" className="space-y-6 mt-6">
                        {/* Halls/Venues */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                        Event Halls / Venues
                                    </CardTitle>
                                    <Button onClick={addHall} size="sm" variant="outline" className="gap-1 h-7 text-xs">
                                        <Plus className="h-3 w-3" /> Add Hall
                                    </Button>
                                </div>
                                <CardDescription className="text-xs">
                                    Define halls/venues for this event. These will appear as options when assigning sessions.
                                </CardDescription>
                            </CardHeader>
                            {halls.length > 0 && (
                                <CardContent className="pt-0">
                                    <div className="flex flex-wrap gap-2">
                                        {halls.map((hall) => (
                                            <div key={hall.id} className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 bg-muted/30">
                                                <Input
                                                    value={hall.name}
                                                    onChange={(e) => updateHall(hall.id, e.target.value)}
                                                    placeholder="Hall name"
                                                    className="h-7 w-32 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeHall(hall.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Sessions — Day-wise tabular view */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <div className="icon-container icon-container-blue h-8 w-8 sm:h-10 sm:w-10">
                                                <Mic2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            Scientific Program
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">
                                            Manage sessions, talks, and workshops with speakers and topics
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={openImportDialog}
                                        className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                    >
                                        <Download className="h-4 w-4" />
                                        Import Schedule
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    // Generate day tabs from event start/end dates
                                    const eventDays: { date: string; label: string; dateObj: Date }[] = [];
                                    if (formData.startDate) {
                                        const start = new Date(formData.startDate);
                                        const end = formData.endDate ? new Date(formData.endDate) : start;
                                        const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
                                        for (let i = 0; i < Math.min(dayCount, 30); i++) {
                                            const d = new Date(start.getTime() + i * 86400000);
                                            eventDays.push({
                                                date: d.toISOString().split("T")[0],
                                                label: `Day ${i + 1}`,
                                                dateObj: d,
                                            });
                                        }
                                    }
                                    if (eventDays.length === 0) eventDays.push({ date: "", label: "Day 1", dateObj: new Date() });

                                    // Group sessions by day
                                    const sessionsByDay: Record<string, typeof sessions> = {};
                                    const unscheduled: typeof sessions = [];
                                    eventDays.forEach(d => { sessionsByDay[d.date] = []; });
                                    sessions.forEach(s => {
                                        const sd = s.date ? (s.date.length === 10 ? s.date : new Date(s.date).toISOString().split("T")[0]) : "";
                                        if (sessionsByDay[sd]) sessionsByDay[sd].push(s);
                                        else unscheduled.push(s);
                                    });

                                    // Sort each day's sessions by startTime ascending.
                                    // Sessions without a start time go to the end; ties broken by sessionOrder.
                                    const sortByTime = (a: typeof sessions[0], b: typeof sessions[0]) => {
                                        if (!a.startTime && !b.startTime) return (a.sessionOrder || 0) - (b.sessionOrder || 0);
                                        if (!a.startTime) return 1;
                                        if (!b.startTime) return -1;
                                        const aPadded = a.startTime.padStart(5, "0");
                                        const bPadded = b.startTime.padStart(5, "0");
                                        if (aPadded < bPadded) return -1;
                                        if (aPadded > bPadded) return 1;
                                        return (a.sessionOrder || 0) - (b.sessionOrder || 0);
                                    };
                                    Object.keys(sessionsByDay).forEach(key => sessionsByDay[key].sort(sortByTime));
                                    unscheduled.sort(sortByTime);

                                    const activeDay = activeScheduleDay || eventDays[0]?.date || "";
                                    const setActiveDay = setActiveScheduleDay;

                                    const addSessionToDay = (dayDate: string) => {
                                        setSessions(prev => [...prev, {
                                            id: Date.now().toString(),
                                            title: "",
                                            sessionType: "OTHER",
                                            date: dayDate,
                                            startTime: "",
                                            endTime: "",
                                            venue: "",
                                            speakerId: "",
                                            speakerName: "",
                                            isSaved: false,
                                            description: "",
                                            sessionOrder: prev.length,
                                            status: "scheduled",
                                            isPublished: true,
                                            speakers: [],
                                            isExistingSpeaker: true,
                                            newSpeakerName: "",
                                            newSpeakerEmail: "",
                                            newSpeakerDesignation: "",
                                            newSpeakerInstitution: "",
                                            hallId: "",
                                        }]);
                                    };

                                    const daySessions = sessionsByDay[activeDay] || [];


                                    return (
                                        <div>
                                            {/* Day Tabs */}
                                            <div className="flex flex-wrap gap-2 mb-4 border-b pb-3">
                                                {eventDays.map(d => (
                                                    <button
                                                        key={d.date}
                                                        type="button"
                                                        onClick={() => setActiveDay(d.date)}
                                                        className={cn(
                                                            "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                                            activeDay === d.date
                                                                ? "bg-primary text-primary-foreground shadow-md"
                                                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        {d.label}
                                                        <span className="block text-[10px] font-normal">
                                                            {!isNaN(d.dateObj.getTime()) ? d.dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : ""}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Sessions Table for active day */}
                                            {daySessions.length === 0 && editingSessionId === null ? (
                                                <div className="text-center py-8 border-2 border-dashed rounded-xl">
                                                    <Mic2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm text-muted-foreground mb-3">No sessions for this day</p>
                                                    <Button type="button" onClick={() => addSessionToDay(activeDay)} variant="outline" size="sm" className="gap-2">
                                                        <Plus className="h-4 w-4" /> Add Session
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* Table */}
                                                    <div className="border rounded-xl overflow-hidden mb-3">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-muted/50 border-b">
                                                                    <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground w-[80px]">Time</th>
                                                                    <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground">Title</th>
                                                                    <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground hidden sm:table-cell">Speaker</th>
                                                                    <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground hidden md:table-cell w-[80px]">Type</th>
                                                                    <th className="text-right px-3 py-2 font-semibold text-xs text-muted-foreground w-[80px]">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {daySessions.map((session) => {
                                                                    const speakerNames = session.speakers?.map((sp: any) => sp.speakerName || (sp.isExistingSpeaker ? (existingSpeakers.find(s => s.id === sp.speakerId)?.name || "") : sp.newSpeakerName)).filter(Boolean).join(", ") || session.speakerName || "—";
                                                                    return (
                                                                        <tr key={session.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                                            <td className="px-3 py-2.5 text-xs font-medium">
                                                                                {session.startTime || "—"}
                                                                                {session.endTime && <div className="text-muted-foreground">{session.endTime}</div>}
                                                                            </td>
                                                                            <td className="px-3 py-2.5">
                                                                                <p className="font-medium text-sm">{session.title || <span className="text-muted-foreground italic">Untitled</span>}</p>
                                                                                {session.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{session.description}</p>}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{speakerNames}</td>
                                                                            <td className="px-3 py-2.5 hidden md:table-cell">
                                                                                <Badge variant="outline" className="text-[10px]">{SESSION_TYPES.find(t => t.value === session.sessionType)?.label || session.sessionType}</Badge>
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-right">
                                                                                <div className="flex items-center justify-end gap-1">
                                                                                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingSessionId(editingSessionId === session.id ? null : session.id)}>
                                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeSession(session)}>
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <Button type="button" onClick={() => addSessionToDay(activeDay)} variant="outline" size="sm" className="gap-2">
                                                        <Plus className="h-4 w-4" /> Add Session to {eventDays.find(d => d.date === activeDay)?.label || "Day"}
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Unscheduled sessions */}
                                            {unscheduled.length > 0 && (
                                                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                                                    <p className="text-xs font-semibold text-amber-700 mb-2">Unscheduled Sessions ({unscheduled.length}) — these sessions have dates outside the event range</p>
                                                    {unscheduled.map(s => (
                                                        <div key={s.id} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-amber-200 last:border-0">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium">{s.title || "Untitled"}</span>
                                                                {s.date && <span className="text-xs text-amber-600 ml-2">(date: {s.date})</span>}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Select onValueChange={(v) => { updateSession(s.id, "date", v); }}>
                                                                    <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue placeholder="Move to..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {eventDays.map(d => <SelectItem key={d.date} value={d.date}>{d.label}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingSessionId(s.id)}>Edit</Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Inline Edit Panel */}
                                            {editingSessionId && (() => {
                                                const session = sessions.find(s => s.id === editingSessionId);
                                                if (!session) return null;
                                                return (
                                                    <div className="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-semibold text-sm">Edit Session</h4>
                                                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingSessionId(null)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="sm:col-span-2">
                                                                <Label className="text-xs">Title *</Label>
                                                                <Input value={session.title} onChange={(e) => updateSession(session.id, "title", e.target.value)} placeholder="Session title" className="h-8 text-sm" />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Start Time</Label>
                                                                <Input type="time" value={session.startTime} onChange={(e) => updateSession(session.id, "startTime", e.target.value)} className="h-8 text-sm" />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">End Time</Label>
                                                                <Input type="time" value={session.endTime} onChange={(e) => updateSession(session.id, "endTime", e.target.value)} className="h-8 text-sm" />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Type</Label>
                                                                <Select value={session.sessionType} onValueChange={(v) => updateSession(session.id, "sessionType", v)}>
                                                                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {SESSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Hall / Venue</Label>
                                                                <Select value={session.hallId || "none"} onValueChange={(v) => updateSession(session.id, "hallId", v === "none" ? "" : v)}>
                                                                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select hall" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">No hall</SelectItem>
                                                                        {halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <Label className="text-xs">Description</Label>
                                                                <Input value={session.description} onChange={(e) => updateSession(session.id, "description", e.target.value)} placeholder="Session description" className="h-8 text-sm" />
                                                            </div>
                                                            {/* Speaker */}
                                                            <div className="sm:col-span-2">
                                                                <Label className="text-xs">Speakers</Label>
                                                                <div className="space-y-2 mt-1">
                                                                    {session.speakers.map((sp: any) => (
                                                                        <div key={sp.id} className="flex items-center gap-2">
                                                                            {sp.isExistingSpeaker ? (
                                                                                <Select value={sp.speakerId} onValueChange={(v) => updateSessionSpeaker(session.id, sp.id, "speakerId", v)}>
                                                                                    <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Select speaker" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {existingSpeakers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            ) : (
                                                                                <div className="flex-1 grid grid-cols-2 gap-1">
                                                                                    <Input value={sp.newSpeakerName} onChange={(e) => updateSessionSpeaker(session.id, sp.id, "newSpeakerName", e.target.value)} placeholder="Name *" className="h-8 text-sm" />
                                                                                    <Input value={sp.newSpeakerEmail} onChange={(e) => updateSessionSpeaker(session.id, sp.id, "newSpeakerEmail", e.target.value)} placeholder="Email" className="h-8 text-sm" />
                                                                                </div>
                                                                            )}
                                                                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateSessionSpeaker(session.id, sp.id, "isExistingSpeaker", !sp.isExistingSpeaker)}>
                                                                                {sp.isExistingSpeaker ? "New" : "Existing"}
                                                                            </Button>
                                                                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeSessionSpeaker(session.id, sp.id)}>
                                                                                <X className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addSessionSpeaker(session.id)}>
                                                                        <Plus className="h-3 w-3" /> Add Speaker
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end mt-3">
                                                            <Button type="button" size="sm" onClick={() => setEditingSessionId(null)}>Done</Button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    {/* Engagement Tab */}
                    <TabsContent value="engagement" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <div className="icon-container icon-container-purple h-8 w-8 sm:h-10 sm:w-10">
                                                <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            Event Engagement
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">
                                            Add polls, Q&A sessions, feedback forms, and announcements
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addEngagement} size="sm" className="gap-2 w-full sm:w-auto">
                                        <Plus className="h-4 w-4" />
                                        Add Engagement
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {engagements.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                        <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No engagements yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Add polls, Q&A, feedback forms to engage your attendees
                                        </p>
                                        <Button onClick={addEngagement} variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add First Engagement
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {engagements.map((engagement, index) => (
                                            <div
                                                key={engagement.id}
                                                className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow animate-fadeIn"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold">Engagement {index + 1}</span>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {ENGAGEMENT_TYPES.find(t => t.value === engagement.type)?.label || engagement.type}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs">Active</Label>
                                                            <Switch
                                                                checked={engagement.isActive}
                                                                onCheckedChange={(checked) => updateEngagement(engagement.id, "isActive", checked)}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeEngagement(engagement)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Type *</Label>
                                                            <Select
                                                                value={engagement.type}
                                                                onValueChange={(v) => updateEngagement(engagement.id, "type", v)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ENGAGEMENT_TYPES.map((t) => (
                                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="md:col-span-2 space-y-2">
                                                            <Label className="text-xs">Title *</Label>
                                                            <Input
                                                                value={engagement.title}
                                                                onChange={(e) => updateEngagement(engagement.id, "title", e.target.value)}
                                                                placeholder="e.g., Post-session feedback, Live Q&A"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Link to Session</Label>
                                                            <Select
                                                                value={(engagement as any).sessionId || "none"}
                                                                onValueChange={(v) => updateEngagement(engagement.id, "sessionId" as any, v === "none" ? null : v)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Event-level" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Event-level (all)</SelectItem>
                                                                    {sessions.map((s) => (
                                                                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Description</Label>
                                                        <Textarea
                                                            value={engagement.description}
                                                            onChange={(e) => updateEngagement(engagement.id, "description", e.target.value)}
                                                            placeholder="Describe this engagement activity"
                                                            rows={2}
                                                        />
                                                    </div>

                                                    {/* Poll options */}
                                                    {engagement.type === "POLL" && (
                                                        <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                                                            <Label className="text-xs font-medium">Poll Options</Label>
                                                            {((engagement.content as { options?: string[] })?.options || []).map((option: string, optIndex: number) => (
                                                                <div key={optIndex} className="flex items-center gap-2">
                                                                    <Input
                                                                        value={option}
                                                                        onChange={(e) => {
                                                                            const opts = [...((engagement.content as { options?: string[] })?.options || [])];
                                                                            opts[optIndex] = e.target.value;
                                                                            updateEngagement(engagement.id, "content", { options: opts });
                                                                        }}
                                                                        placeholder={`Option ${optIndex + 1}`}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                                        const opts = [...((engagement.content as { options?: string[] })?.options || [])];
                                                                        opts.splice(optIndex, 1);
                                                                        updateEngagement(engagement.id, "content", { options: opts });
                                                                    }} className="h-8 w-8 p-0 text-destructive">
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <Button variant="outline" size="sm" onClick={() => {
                                                                const opts = [...((engagement.content as { options?: string[] })?.options || []), ""];
                                                                updateEngagement(engagement.id, "content", { options: opts });
                                                            }} className="gap-1 h-7 text-xs">
                                                                <Plus className="h-3 w-3" /> Add Option
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sponsors Tab - Hidden until explicitly needed. Data/API preserved. */}

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <div className="icon-container icon-container-green h-8 w-8 sm:h-10 sm:w-10">
                                            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        CME Credits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>CME Credit Hours</Label>
                                        <Input
                                            type="number"
                                            value={formData.cmeCredits}
                                            onChange={e => handleChange("cmeCredits", parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>

                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-sm font-medium mb-3">CME Coordinator</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coordinator Name</Label>
                                        <Input
                                            value={formData.cmeCoordinatorName}
                                            onChange={e => handleChange("cmeCoordinatorName", e.target.value)}
                                            placeholder="Dr. John Smith"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coordinator Designation</Label>
                                        <Input
                                            value={formData.cmeCoordinatorDesignation}
                                            onChange={e => handleChange("cmeCoordinatorDesignation", e.target.value)}
                                            placeholder="CME Director"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coordinator Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.cmeCoordinatorEmail}
                                            onChange={e => handleChange("cmeCoordinatorEmail", e.target.value)}
                                            placeholder="cme@hospital.com"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <div className="icon-container icon-container-purple h-8 w-8 sm:h-10 sm:w-10">
                                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        Certificate Signatories
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Signatory 1 Name</Label>
                                            <Input
                                                placeholder="Dr. Rajesh Kumar"
                                                value={formData.signatory1Name}
                                                onChange={(e) => handleChange("signatory1Name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Signatory 1 Title</Label>
                                            <Input
                                                placeholder="Conference Director"
                                                value={formData.signatory1Title}
                                                onChange={(e) => handleChange("signatory1Title", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Signatory 2 Name</Label>
                                            <Input
                                                placeholder="Dr. Priya Sharma"
                                                value={formData.signatory2Name}
                                                onChange={(e) => handleChange("signatory2Name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Signatory 2 Title</Label>
                                            <Input
                                                placeholder="Scientific Chair"
                                                value={formData.signatory2Title}
                                                onChange={(e) => handleChange("signatory2Title", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Organizer</Label>
                                        <Input
                                            value={formData.organizer}
                                            onChange={e => handleChange("organizer", e.target.value)}
                                            placeholder="Organization name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Contact Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={e => handleChange("contactEmail", e.target.value)}
                                            placeholder="events@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Contact Phone</Label>
                                        <Input
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={e => handleChange("contactPhone", e.target.value)}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Event Website</Label>
                                        <Input
                                            type="url"
                                            value={formData.website}
                                            onChange={e => handleChange("website", e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                    {activeTab !== "basic" ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const tabs = ["basic", "slots", "sessions", "sponsors", "settings"];
                                const currentIndex = tabs.indexOf(activeTab);
                                if (currentIndex > 0) {
                                    setActiveTab(tabs[currentIndex - 1]);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                        >
                            Previous
                        </Button>
                    ) : (
                        <div />
                    )}
                    {activeTab !== "settings" ? (
                        <Button
                            onClick={() => {
                                const tabs = ["basic", "slots", "sessions", "sponsors", "settings"];
                                const currentIndex = tabs.indexOf(activeTab);
                                if (currentIndex < tabs.length - 1) {
                                    setActiveTab(tabs[currentIndex + 1]);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                        >
                            Next Step
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleSubmit()}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
