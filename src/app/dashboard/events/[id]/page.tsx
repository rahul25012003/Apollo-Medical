"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Users,
    Award,
    Edit,
    Copy,
    Trash2,
    Mail,
    FileText,
    MoreHorizontal,
    TrendingUp,
    UserPlus,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Mic2,
    Building2,
    Eye,
    Printer,
    QrCode,
    BarChart3,
    Phone,
    Globe,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEventImage } from "@/lib/event-utils";
import { validateEventForPublish, calculateEventStatus } from "@/lib/event-validations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { eventsService, Event, EventSpeaker, EventSponsor, EventSession } from "@/services/events";
import { registrationsService, Registration } from "@/services/registrations";
import { speakersService, Speaker } from "@/services/speakers";
import { sponsorsService, Sponsor } from "@/services/sponsors";

// Display session type
interface DisplaySession {
    id: string;
    title: string;
    description: string | null;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    venue: string | null;
    speaker?: {
        id: string;
        name: string;
        designation: string | null;
        institution: string | null;
        photo: string | null;
    } | null;
}

// Display type for the UI
interface DisplayEvent {
    id: string;
    title: string;
    description: string | null;
    date: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    time: string;
    registrationDeadline: string | null;
    location: string;
    address: string | null;
    city: string | null;
    mapLink: string | null;
    registrations: number;
    capacity: number;
    status: string;
    type: string;
    category: string | null;
    bannerImage: string | null;
    revenue: number;
    cmeCredits: number | null;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    createdAt: string;
    updatedAt: string;
    organizer: string | null;
    cmeCoordinatorName: string | null;
    cmeCoordinatorEmail: string | null;
    cmeCoordinatorDesignation: string | null;
    isPublished: boolean;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    speakers: { id: string; name: string; designation: string | null; institution: string | null; photo: string | null; topic: string | null }[];
    sessions: DisplaySession[];
    sponsors: { id: string; name: string; tier: string; logo: string | null }[];
    includes: string[];
}

const tierConfig = {
    platinum: {
        label: "Platinum",
        className: "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 border-slate-400 font-semibold",
        cardBorder: "border-slate-400/60 hover:border-slate-500",
        cardBg: "from-slate-50 to-slate-100/50"
    },
    gold: {
        label: "Gold",
        className: "bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-800 border-amber-400 font-semibold",
        cardBorder: "border-amber-400/60 hover:border-amber-500",
        cardBg: "from-amber-50 to-yellow-100/50"
    },
    silver: {
        label: "Silver",
        className: "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 border-gray-400",
        cardBorder: "border-gray-300/60 hover:border-gray-400",
        cardBg: "from-gray-50 to-gray-100/50"
    },
    bronze: {
        label: "Bronze",
        className: "bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800 border-orange-400",
        cardBorder: "border-orange-300/60 hover:border-orange-400",
        cardBg: "from-orange-50 to-orange-100/50"
    },
};

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [addRegOpen, setAddRegOpen] = useState(false);
    const [event, setEvent] = useState<DisplayEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        organization: "",
        designation: "",
        category: "",
        amount: 0,
        notes: "",
        specialRequests: "",
    });

    // Speaker modal state
    const [addSpeakerOpen, setAddSpeakerOpen] = useState(false);
    const [allSpeakers, setAllSpeakers] = useState<Speaker[]>([]);
    const [speakerMode, setSpeakerMode] = useState<"select" | "create">("select");
    const [speakerFormData, setSpeakerFormData] = useState({
        speakerId: "",
        topic: "",
        // New speaker fields
        name: "",
        email: "",
        designation: "",
        institution: "",
        phone: "",
    });

    // Sponsor modal state
    const [addSponsorOpen, setAddSponsorOpen] = useState(false);
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [sponsorMode, setSponsorMode] = useState<"select" | "create">("select");
    const [sponsorFormData, setSponsorFormData] = useState({
        sponsorId: "",
        tier: "SILVER",
        // New sponsor fields
        name: "",
        email: "",
        description: "",
        website: "",
    });

    // Publish validation state
    const [validationErrorsOpen, setValidationErrorsOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const eventId = params.id as string;

    // Handle publish click with validation
    const handlePublishClick = () => {
        if (!event) return;

        const validation = validateEventForPublish({
            ...event,
            speakers: event.speakers,
        });

        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            setValidationErrorsOpen(true);
        } else {
            setPublishDialogOpen(true);
        }
    };

    // Fetch event from API
    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);
                const response = await eventsService.getById(eventId);

                if (response.success && response.data) {
                    const e = response.data;
                    setEvent({
                        id: e.id,
                        title: e.title,
                        description: e.description,
                        date: new Date(e.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        startDate: e.startDate,
                        endDate: e.endDate,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        time: e.startTime && e.endTime ? `${e.startTime} - ${e.endTime}` : e.startTime || "TBA",
                        registrationDeadline: e.registrationDeadline,
                        location: e.location || "TBA",
                        address: e.address,
                        city: e.city,
                        mapLink: e.mapLink,
                        registrations: e._count?.registrations || 0,
                        capacity: e.capacity,
                        status: e.status.toLowerCase(),
                        type: e.type,
                        category: e.category,
                        bannerImage: e.bannerImage,
                        revenue: (e._count?.registrations || 0) * Number(e.price),
                        cmeCredits: e.cmeCredits,
                        price: Number(e.price),
                        earlyBirdPrice: e.earlyBirdPrice ? Number(e.earlyBirdPrice) : null,
                        earlyBirdDeadline: e.earlyBirdDeadline ? new Date(e.earlyBirdDeadline).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }) : null,
                        createdAt: new Date(e.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        updatedAt: new Date(e.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        organizer: e.organizer,
                        cmeCoordinatorName: e.cmeCoordinatorName,
                        cmeCoordinatorEmail: e.cmeCoordinatorEmail,
                        cmeCoordinatorDesignation: e.cmeCoordinatorDesignation,
                        isPublished: e.isPublished,
                        contactEmail: e.contactEmail,
                        contactPhone: e.contactPhone,
                        website: e.website,
                        // Get sessions from eventSessions
                        sessions: e.eventSessions?.map((es: EventSession) => ({
                            id: es.id,
                            title: es.title,
                            description: es.description,
                            date: es.sessionDate ? new Date(es.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null,
                            startTime: es.startTime,
                            endTime: es.endTime,
                            venue: es.venue,
                            speaker: es.speaker ? {
                                id: es.speaker.id,
                                name: es.speaker.name,
                                designation: es.speaker.designation,
                                institution: es.speaker.institution,
                                photo: es.speaker.photo,
                            } : null,
                        })) || [],
                        // Derive unique speakers from sessions
                        speakers: (() => {
                            const speakerMap = new Map<string, { id: string; name: string; designation: string | null; institution: string | null; photo: string | null; topic: string | null }>();
                            // First add speakers from eventSessions (new model)
                            e.eventSessions?.forEach((es: EventSession) => {
                                if (es.speaker && !speakerMap.has(es.speaker.id)) {
                                    speakerMap.set(es.speaker.id, {
                                        id: es.speaker.id,
                                        name: es.speaker.name,
                                        designation: es.speaker.designation,
                                        institution: es.speaker.institution,
                                        photo: es.speaker.photo,
                                        topic: es.title, // Use session title as topic
                                    });
                                }
                            });
                            // Fallback to eventSpeakers for backward compatibility
                            if (speakerMap.size === 0 && e.eventSpeakers) {
                                e.eventSpeakers.forEach((es: EventSpeaker) => {
                                    if (!speakerMap.has(es.speaker.id)) {
                                        speakerMap.set(es.speaker.id, {
                                            id: es.speaker.id,
                                            name: es.speaker.name,
                                            designation: es.speaker.designation,
                                            institution: es.speaker.institution,
                                            photo: es.speaker.photo,
                                            topic: es.topic,
                                        });
                                    }
                                });
                            }
                            return Array.from(speakerMap.values());
                        })(),
                        sponsors: e.eventSponsors?.map((es: EventSponsor) => ({
                            id: es.sponsor.id,
                            name: es.sponsor.name,
                            tier: es.tier.toLowerCase(),
                            logo: es.sponsor.logo,
                        })) || [],
                        includes: e.includes || [],
                    });
                } else {
                    setError("Event not found");
                }
            } catch (err) {
                console.error("Failed to fetch event:", err);
                setError("Failed to load event");
            } finally {
                setLoading(false);
            }
        }

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    // Fetch registrations when event is loaded
    useEffect(() => {
        async function fetchRegistrations() {
            if (!event) return;
            try {
                const response = await registrationsService.getAll({ eventId: event.id, limit: 5 });
                if (response.success && response.data) {
                    setRegistrations(Array.isArray(response.data) ? response.data : []);
                }
            } catch (err) {
                console.error("Failed to fetch registrations:", err);
            }
        }

        fetchRegistrations();
    }, [event]);

    // Update form amount when event price is loaded
    useEffect(() => {
        if (event) {
            setFormData(prev => ({ ...prev, amount: event.price }));
        }
    }, [event]);

    // Handle add registration form submission
    const handleAddRegistration = async () => {
        if (!event || !formData.name || !formData.email) {
            setFormError("Name and email are required");
            return;
        }

        try {
            setSubmitting(true);
            setFormError(null);
            setFormSuccess(false);

            const response = await registrationsService.createAdmin({
                eventId: event.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                organization: formData.organization || undefined,
                designation: formData.designation || undefined,
                category: formData.category || undefined,
                amount: formData.amount,
                notes: formData.notes || undefined,
                specialRequests: formData.specialRequests || undefined,
                // Admin-created registrations are auto-confirmed
                status: "CONFIRMED",
                paymentStatus: formData.amount === 0 ? "FREE" : "PAID",
            });

            if (response.success) {
                // Refresh registrations
                const regsRes = await registrationsService.getAll({ eventId: event.id, limit: 5 });
                if (regsRes.success && regsRes.data) {
                    setRegistrations(Array.isArray(regsRes.data) ? regsRes.data : []);
                }
                // Update event registration count
                setEvent(prev => prev ? { ...prev, registrations: prev.registrations + 1 } : null);
                setFormSuccess(true);
                // Reset form
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    organization: "",
                    designation: "",
                    category: "",
                    amount: event.price,
                    notes: "",
                    specialRequests: "",
                });
                // Close dialog after a brief delay to show success
                setTimeout(() => {
                    setAddRegOpen(false);
                    setFormSuccess(false);
                }, 1500);
            } else {
                // API returned an error
                const errorMsg = response.error?.message || "Failed to create registration";
                setFormError(errorMsg);
            }
        } catch (err) {
            console.error("Failed to create registration:", err);
            setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    // Fetch all active speakers when modal opens
    useEffect(() => {
        if (addSpeakerOpen && allSpeakers.length === 0) {
            speakersService.getAll({ isActive: true }).then(res => {
                if (res.success && res.data) {
                    setAllSpeakers(Array.isArray(res.data) ? res.data : []);
                }
            });
        }
    }, [addSpeakerOpen, allSpeakers.length]);

    // Fetch all active sponsors when modal opens
    useEffect(() => {
        if (addSponsorOpen && allSponsors.length === 0) {
            sponsorsService.getAll({ isActive: true }).then(res => {
                if (res.success && res.data) {
                    setAllSponsors(Array.isArray(res.data) ? res.data : []);
                }
            });
        }
    }, [addSponsorOpen, allSponsors.length]);

    // Handle add speaker to event
    const handleAddSpeaker = async () => {
        if (!event) return;

        try {
            setSubmitting(true);
            setFormError(null);

            let speakerId = speakerFormData.speakerId;

            // If creating new speaker, create it first
            if (speakerMode === "create") {
                if (!speakerFormData.name || !speakerFormData.email) {
                    setFormError("Name and email are required for new speaker");
                    setSubmitting(false);
                    return;
                }

                const createRes = await speakersService.create({
                    name: speakerFormData.name,
                    email: speakerFormData.email,
                    designation: speakerFormData.designation || undefined,
                    institution: speakerFormData.institution || undefined,
                    phone: speakerFormData.phone || undefined,
                });

                if (!createRes.success || !createRes.data) {
                    setFormError(createRes.error?.message || "Failed to create speaker");
                    setSubmitting(false);
                    return;
                }

                speakerId = createRes.data.id;
                // Add to local list
                setAllSpeakers(prev => [...prev, createRes.data!]);
            }

            if (!speakerId) {
                setFormError("Please select or create a speaker");
                setSubmitting(false);
                return;
            }

            // Add speaker to event
            const response = await eventsService.addSpeaker(event.id, {
                speakerId,
                topic: speakerFormData.topic || undefined,
            });

            if (response.success) {
                // Refresh event data to get updated speakers
                const eventRes = await eventsService.getById(event.id);
                if (eventRes.success && eventRes.data) {
                    const e = eventRes.data;
                    setEvent(prev => prev ? {
                        ...prev,
                        speakers: e.eventSpeakers?.map((es: EventSpeaker) => ({
                            id: es.speaker.id,
                            name: es.speaker.name,
                            designation: es.speaker.designation,
                            institution: es.speaker.institution,
                            photo: es.speaker.photo,
                            topic: es.topic,
                        })) || [],
                    } : null);
                }
                setFormSuccess(true);
                // Reset form
                setSpeakerFormData({
                    speakerId: "",
                    topic: "",
                    name: "",
                    email: "",
                    designation: "",
                    institution: "",
                    phone: "",
                });
                setSpeakerMode("select");
                setTimeout(() => {
                    setAddSpeakerOpen(false);
                    setFormSuccess(false);
                }, 1500);
            } else {
                setFormError(response.error?.message || "Failed to add speaker to event");
            }
        } catch (err) {
            console.error("Failed to add speaker:", err);
            setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle add sponsor to event
    const handleAddSponsor = async () => {
        if (!event) return;

        try {
            setSubmitting(true);
            setFormError(null);

            let sponsorId = sponsorFormData.sponsorId;

            // If creating new sponsor, create it first
            if (sponsorMode === "create") {
                if (!sponsorFormData.name) {
                    setFormError("Name is required for new sponsor");
                    setSubmitting(false);
                    return;
                }

                const createRes = await sponsorsService.create({
                    name: sponsorFormData.name,
                    email: sponsorFormData.email || undefined,
                    description: sponsorFormData.description || undefined,
                    website: sponsorFormData.website || undefined,
                });

                if (!createRes.success || !createRes.data) {
                    setFormError(createRes.error?.message || "Failed to create sponsor");
                    setSubmitting(false);
                    return;
                }

                sponsorId = createRes.data.id;
                // Add to local list
                setAllSponsors(prev => [...prev, createRes.data!]);
            }

            if (!sponsorId) {
                setFormError("Please select or create a sponsor");
                setSubmitting(false);
                return;
            }

            // Add sponsor to event - ensure tier is uppercase enum value
            const response = await eventsService.addSponsor(event.id, {
                sponsorId,
                tier: sponsorFormData.tier as "PLATINUM" | "GOLD" | "SILVER" | "BRONZE",
            });

            if (response.success) {
                // Refresh event data to get updated sponsors
                const eventRes = await eventsService.getById(event.id);
                if (eventRes.success && eventRes.data) {
                    const e = eventRes.data;
                    setEvent(prev => prev ? {
                        ...prev,
                        sponsors: e.eventSponsors?.map((es: EventSponsor) => ({
                            id: es.sponsor.id,
                            name: es.sponsor.name,
                            tier: es.tier.toLowerCase(),
                            logo: es.sponsor.logo,
                        })) || [],
                    } : null);
                }
                setFormSuccess(true);
                // Reset form
                setSponsorFormData({
                    sponsorId: "",
                    tier: "SILVER",
                    name: "",
                    email: "",
                    description: "",
                    website: "",
                });
                setSponsorMode("select");
                setTimeout(() => {
                    setAddSponsorOpen(false);
                    setFormSuccess(false);
                }, 1500);
            } else {
                setFormError(response.error?.message || "Failed to add sponsor to event");
            }
        } catch (err) {
            console.error("Failed to add sponsor:", err);
            setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "upcoming":
                return { label: "Upcoming", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar };
            case "active":
                return { label: "Active", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 };
            case "completed":
                return { label: "Completed", className: "bg-gray-100 text-gray-700 border-gray-200", icon: CheckCircle2 };
            case "draft":
                return { label: "Draft", className: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: FileText };
            case "cancelled":
                return { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle };
            default:
                return { label: status, className: "bg-gray-100 text-gray-700 border-gray-200", icon: Calendar };
        }
    };

    // Loading state
    if (loading) {
        return (
            <DashboardLayout title="Event Details" subtitle="Loading...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // Error state
    if (error || !event) {
        return (
            <DashboardLayout title="Event Details" subtitle="Error">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <p className="text-lg font-medium">{error || "Event not found"}</p>
                    <Link href="/dashboard/events">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Events
                        </Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const statusConfig = getStatusConfig(event.status);
    const StatusIcon = statusConfig.icon;
    const capacityPercentage = event.capacity > 0 ? Math.round((event.registrations / event.capacity) * 100) : 0;

    return (
        <DashboardLayout title="Event Details" subtitle={event.title}>
            <div className="space-y-6">
                {/* Back Button & Actions */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Link
                        href="/dashboard/events"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Events
                    </Link>

                    <div className="flex flex-wrap gap-2">
                        <Link href={`/events/${event.id}?preview=true`} target="_blank">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </Button>
                        </Link>
                        {/* Edit button - only show if no registrations and not published */}
                        {event.registrations === 0 && !event.isPublished ? (
                            <Link href={`/dashboard/events/${event.id}/edit`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 opacity-50 cursor-not-allowed"
                                disabled
                                title={event.registrations > 0
                                    ? "Cannot edit: Event has registrations"
                                    : "Cannot edit: Event is published"}
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        )}
                        {/* Publish button - only for drafts */}
                        {!event.isPublished && (
                            <Button
                                size="sm"
                                className="gap-2 gradient-medical text-white hover:opacity-90"
                                disabled={publishLoading}
                                onClick={handlePublishClick}
                            >
                                {publishLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                {publishLoading ? "Publishing..." : "Publish"}
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate Event
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Generate QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {event.status !== "draft" && (
                                    <DropdownMenuItem>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Email All Attendees
                                    </DropdownMenuItem>
                                )}
                                {event.status === "completed" && (
                                    <DropdownMenuItem>
                                        <Award className="mr-2 h-4 w-4" />
                                        Generate Certificates
                                    </DropdownMenuItem>
                                )}
                                {event.status !== "draft" && (
                                    <DropdownMenuItem>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export Report
                                    </DropdownMenuItem>
                                )}
                                {event.registrations === 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Event
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Event Header Card */}
                <Card className="overflow-hidden">
                    {/* Banner Image */}
                    <div
                        className="h-48 md:h-56 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${getEventImage(event.bannerImage, null, event.type)})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Event Info */}
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusConfig.label}
                                    </Badge>
                                    <Badge variant="secondary">{event.type}</Badge>
                                    {event.category && <Badge variant="outline">{event.category}</Badge>}
                                    {event.cmeCredits && event.cmeCredits > 0 && (
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                            <Award className="w-3 h-3 mr-1" />
                                            {event.cmeCredits} CME Credits
                                        </Badge>
                                    )}
                                </div>

                                <h1 className="text-2xl font-bold">{event.title}</h1>
                                <p className="text-muted-foreground">{event.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-medium">{event.date}</p>
                                            <p className="text-sm text-muted-foreground">{event.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-medium">{event.location}</p>
                                            <p className="text-sm text-muted-foreground">{event.city}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-64">
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                                        <Users className="h-4 w-4" />
                                        <span className="text-xs font-medium">Registrations</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {event.registrations}/{event.capacity}
                                    </p>
                                    <div className="mt-2">
                                        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full"
                                                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-blue-600 mt-1">{capacityPercentage}% filled</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="text-xs font-medium">Revenue</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">
                                        ₹{event.revenue.toLocaleString()}
                                    </p>
                                    {event.registrations > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Avg: ₹{Math.round(event.revenue / event.registrations).toLocaleString()}/registration
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="registrations">Registrations</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        <TabsTrigger value="speakers">Speakers</TabsTrigger>
                        <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Event Details */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Event Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Event Type</p>
                                            <p className="font-medium">{event.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Category</p>
                                            <p className="font-medium">{event.category || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Registration Fee</p>
                                            <p className="font-medium">₹{event.price.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Early Bird Price</p>
                                            <p className="font-medium">{event.earlyBirdPrice ? `₹${event.earlyBirdPrice.toLocaleString()}` : "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Early Bird Deadline</p>
                                            <p className="font-medium">{event.earlyBirdDeadline || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Registration Deadline</p>
                                            <p className="font-medium">{event.registrationDeadline || "N/A"}</p>
                                        </div>
                                    </div>

                                    {event.address && (
                                        <div className="border-t pt-4">
                                            <p className="text-sm text-muted-foreground mb-2">Venue Address</p>
                                            <p className="font-medium">{event.address}</p>
                                            {event.mapLink && (
                                                <a
                                                    href={event.mapLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                    View on Google Maps
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {event.includes && event.includes.length > 0 && (
                                        <div className="border-t pt-4">
                                            <p className="text-sm text-muted-foreground mb-3">What's Included</p>
                                            <div className="space-y-2">
                                                {event.includes.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                                        <span className="text-sm">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Contact & Meta */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contact Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {event.organizer && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Organizer</p>
                                                <p className="font-medium">{event.organizer}</p>
                                            </div>
                                        )}
                                        {event.cmeCoordinatorName && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">CME Coordinator</p>
                                                <p className="font-medium">{event.cmeCoordinatorName}</p>
                                                {event.cmeCoordinatorDesignation && (
                                                    <p className="text-sm text-muted-foreground">{event.cmeCoordinatorDesignation}</p>
                                                )}
                                            </div>
                                        )}
                                        {event.cmeCoordinatorEmail && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <a href={`mailto:${event.cmeCoordinatorEmail}`} className="text-sm text-primary hover:underline">
                                                    {event.cmeCoordinatorEmail}
                                                </a>
                                            </div>
                                        )}
                                        {event.contactEmail && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <a href={`mailto:${event.contactEmail}`} className="text-sm text-primary hover:underline">
                                                    {event.contactEmail}
                                                </a>
                                            </div>
                                        )}
                                        {event.contactPhone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <a href={`tel:${event.contactPhone}`} className="text-sm">
                                                    {event.contactPhone}
                                                </a>
                                            </div>
                                        )}
                                        {event.website && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                                    Website
                                                </a>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Meta Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Created</span>
                                            <span>{event.createdAt}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Last Updated</span>
                                            <span>{event.updatedAt}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Event ID</span>
                                            <span className="font-mono text-xs">{event.id.slice(0, 8)}...</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {event.status !== "completed" && event.status !== "draft" ? (
                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex-col gap-2 w-full"
                                            onClick={() => setAddRegOpen(true)}
                                        >
                                            <UserPlus className="h-5 w-5" />
                                            <span className="text-xs">Add Registration</span>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full" disabled>
                                            <UserPlus className="h-5 w-5" />
                                            <span className="text-xs">Add Registration</span>
                                        </Button>
                                    )}
                                    {event.contactEmail ? (
                                        <a href={`mailto:${event.contactEmail}?subject=Regarding: ${encodeURIComponent(event.title)}`}>
                                            <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                                                <Mail className="h-5 w-5" />
                                                <span className="text-xs">Send Email</span>
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
                                            <Mail className="h-5 w-5" />
                                            <span className="text-xs">Send Email</span>
                                        </Button>
                                    )}
                                    <Link href={`/dashboard/certificates?event=${event.id}`}>
                                        <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                                            <Award className="h-5 w-5" />
                                            <span className="text-xs">Certificates</span>
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/registrations?event=${event.id}`}>
                                        <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                                            <BarChart3 className="h-5 w-5" />
                                            <span className="text-xs">View Report</span>
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Registrations Tab */}
                    <TabsContent value="registrations" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Recent Registrations</CardTitle>
                                    <CardDescription>{event.registrations} total registrations for this event</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {event.status !== "completed" && event.status !== "draft" && (
                                        <Button size="sm" className="gap-2" onClick={() => setAddRegOpen(true)}>
                                            <UserPlus className="h-4 w-4" />
                                            Add
                                        </Button>
                                    )}
                                    <Link href={`/dashboard/registrations?event=${event.id}`}>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            View All
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {registrations.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No registrations yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {event.status !== "completed" && event.status !== "draft"
                                                ? "Start accepting registrations for this event"
                                                : "No registrations were recorded for this event"}
                                        </p>
                                        {event.status !== "completed" && event.status !== "draft" && (
                                            <Button size="sm" className="gap-2" onClick={() => setAddRegOpen(true)}>
                                                <UserPlus className="h-4 w-4" />
                                                Add First Registration
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {registrations.map((reg) => (
                                            <div
                                                key={reg.id}
                                                className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                            {reg.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{reg.name}</p>
                                                            <p className="text-sm text-muted-foreground">{reg.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 pl-13 sm:pl-0">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-xs",
                                                                reg.status === "CONFIRMED" && "bg-green-100 text-green-700 border-green-200",
                                                                reg.status === "PENDING" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                                                reg.status === "ATTENDED" && "bg-blue-100 text-blue-700 border-blue-200",
                                                                reg.status === "CANCELLED" && "bg-red-100 text-red-700 border-red-200",
                                                                reg.status === "WAITLIST" && "bg-orange-100 text-orange-700 border-orange-200"
                                                            )}
                                                        >
                                                            {reg.status.charAt(0) + reg.status.slice(1).toLowerCase()}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-xs",
                                                                reg.paymentStatus === "PAID" && "bg-green-100 text-green-700 border-green-200",
                                                                reg.paymentStatus === "PENDING" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                                                reg.paymentStatus === "FREE" && "bg-blue-100 text-blue-700 border-blue-200",
                                                                reg.paymentStatus === "REFUNDED" && "bg-gray-100 text-gray-700 border-gray-200",
                                                                reg.paymentStatus === "FAILED" && "bg-red-100 text-red-700 border-red-200"
                                                            )}
                                                        >
                                                            {reg.paymentStatus === "PAID" ? `₹${reg.amount}` : reg.paymentStatus.charAt(0) + reg.paymentStatus.slice(1).toLowerCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {(reg.organization || reg.designation) && (
                                                    <div className="mt-2 pl-13 text-sm text-muted-foreground">
                                                        {reg.designation && <span>{reg.designation}</span>}
                                                        {reg.designation && reg.organization && <span> at </span>}
                                                        {reg.organization && <span>{reg.organization}</span>}
                                                    </div>
                                                )}
                                                <div className="mt-2 pl-13 flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>Registered: {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                    {reg.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {reg.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {event.registrations > 5 && (
                                            <div className="text-center pt-4">
                                                <Link href={`/dashboard/registrations?event=${event.id}`}>
                                                    <Button variant="outline" className="gap-2">
                                                        View All {event.registrations} Registrations
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Event Schedule</CardTitle>
                                    <CardDescription>{event.sessions.length} sessions scheduled</CardDescription>
                                </div>
                                {event.status !== "completed" && (
                                    <Link href={`/dashboard/events/${event.id}/edit`}>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit Sessions
                                        </Button>
                                    </Link>
                                )}
                            </CardHeader>
                            <CardContent>
                                {event.sessions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground mb-4">
                                            {event.status !== "completed"
                                                ? "No sessions scheduled yet"
                                                : "No sessions were scheduled for this event"}
                                        </p>
                                        {event.status !== "completed" && (
                                            <Link href={`/dashboard/events/${event.id}/edit`}>
                                                <Button size="sm" className="gap-2">
                                                    <Edit className="h-4 w-4" />
                                                    Add Sessions
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {event.sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                    <div className="flex-shrink-0 text-center md:text-left md:w-28">
                                                        {session.date && (
                                                            <div className="text-sm font-medium text-primary">{session.date}</div>
                                                        )}
                                                        {session.startTime && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {session.startTime}{session.endTime ? ` - ${session.endTime}` : ""}
                                                            </div>
                                                        )}
                                                        {session.venue && (
                                                            <div className="text-xs text-muted-foreground mt-1">{session.venue}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{session.title}</h3>
                                                        {session.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                                                        )}
                                                        {session.speaker && (
                                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden">
                                                                    {session.speaker.photo ? (
                                                                        <img src={session.speaker.photo} alt={session.speaker.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        session.speaker.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm">{session.speaker.name}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {session.speaker.designation}{session.speaker.institution ? `, ${session.speaker.institution}` : ""}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Speakers Tab */}
                    <TabsContent value="speakers" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Speakers</CardTitle>
                                    <CardDescription>{event.speakers.length} speakers for this event</CardDescription>
                                </div>
                                {event.status !== "completed" && (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddSpeakerOpen(true)}>
                                        <UserPlus className="h-4 w-4" />
                                        Add Speaker
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {event.speakers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Mic2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground mb-4">
                                            {event.status !== "completed"
                                                ? "No speakers added yet"
                                                : "No speakers were assigned to this event"}
                                        </p>
                                        {event.status !== "completed" && (
                                            <Button size="sm" className="gap-2" onClick={() => setAddSpeakerOpen(true)}>
                                                <UserPlus className="h-4 w-4" />
                                                Add First Speaker
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {event.speakers.map((speaker) => (
                                            <div
                                                key={speaker.id}
                                                className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                                                        {speaker.photo ? (
                                                            <img src={speaker.photo} alt={speaker.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            speaker.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate">{speaker.name}</p>
                                                        <p className="text-sm text-muted-foreground truncate">{speaker.designation}</p>
                                                        <p className="text-sm text-muted-foreground truncate">{speaker.institution}</p>
                                                        {speaker.topic && (
                                                            <p className="text-xs text-primary mt-1 truncate">Topic: {speaker.topic}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sponsors Tab */}
                    <TabsContent value="sponsors" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Sponsors</CardTitle>
                                    <CardDescription>{event.sponsors.length} sponsors for this event</CardDescription>
                                </div>
                                {event.status !== "completed" && (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddSponsorOpen(true)}>
                                        <Building2 className="h-4 w-4" />
                                        Add Sponsor
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {event.sponsors.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground mb-4">
                                            {event.status !== "completed"
                                                ? "No sponsors added yet"
                                                : "No sponsors were assigned to this event"}
                                        </p>
                                        {event.status !== "completed" && (
                                            <Button size="sm" className="gap-2" onClick={() => setAddSponsorOpen(true)}>
                                                <Building2 className="h-4 w-4" />
                                                Add First Sponsor
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                        {event.sponsors.map((sponsor) => {
                                            const tier = tierConfig[sponsor.tier as keyof typeof tierConfig] || tierConfig.silver;
                                            return (
                                                <div
                                                    key={sponsor.id}
                                                    className={cn(
                                                        "group relative p-5 rounded-xl border-2 bg-gradient-to-br hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                                                        tier.cardBg,
                                                        tier.cardBorder
                                                    )}
                                                >
                                                    {/* Tier Badge - Top Right */}
                                                    <div className="absolute -top-3 -right-2">
                                                        <Badge className={cn("shadow-md px-3 py-1", tier.className)}>
                                                            {tier.label}
                                                        </Badge>
                                                    </div>

                                                    {/* Logo/Avatar */}
                                                    <div className="flex justify-center mb-4 pt-2">
                                                        <div className="w-20 h-20 rounded-xl bg-white shadow-md border-2 border-white flex items-center justify-center overflow-hidden">
                                                            {sponsor.logo ? (
                                                                <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-contain p-2" />
                                                            ) : (
                                                                <span className="text-2xl font-bold text-primary/70">
                                                                    {sponsor.name.slice(0, 2).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sponsor Name */}
                                                    <p className="font-semibold text-center truncate" title={sponsor.name}>
                                                        {sponsor.name}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Add Registration Dialog */}
            <Dialog open={addRegOpen} onOpenChange={(open) => {
                if (!submitting) {
                    setAddRegOpen(open);
                    if (open) {
                        setFormError(null);
                        setFormSuccess(false);
                    }
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Registration</DialogTitle>
                        <DialogDescription>
                            Register an attendee for {event.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Success Message */}
                        {formSuccess && (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-700 font-medium">Registration added successfully!</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {formError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>
                        )}

                        {/* Event Info */}
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                                Registration fee: ₹{event.price.toLocaleString()}
                            </p>
                        </div>

                        <div className="section-divider-gradient my-2" />

                        {/* Personal Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-2">
                                <Label htmlFor="reg-name">Full Name *</Label>
                                <Input
                                    id="reg-name"
                                    placeholder="Dr. John Smith"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-email">Email *</Label>
                                <Input
                                    id="reg-email"
                                    type="email"
                                    placeholder="john@hospital.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-phone">Phone</Label>
                                <Input
                                    id="reg-phone"
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="section-divider-gradient my-2" />

                        {/* Professional Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-designation">Designation</Label>
                                <Input
                                    id="reg-designation"
                                    placeholder="Professor"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-organization">Organization</Label>
                                <Input
                                    id="reg-organization"
                                    placeholder="Medical College"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Faculty">Faculty</SelectItem>
                                        <SelectItem value="Resident/Fellow">Resident/Fellow</SelectItem>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Industry">Industry</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-amount">Amount (₹)</Label>
                                <Input
                                    id="reg-amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="reg-notes">Notes (Internal)</Label>
                            <Textarea
                                id="reg-notes"
                                placeholder="Any internal notes about this registration..."
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-requests">Special Requests</Label>
                            <Textarea
                                id="reg-requests"
                                placeholder="Dietary requirements, accessibility needs, etc."
                                rows={2}
                                value={formData.specialRequests}
                                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddRegOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddRegistration}
                            disabled={submitting || !formData.name || !formData.email}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Registration"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Speaker Dialog */}
            <Dialog open={addSpeakerOpen} onOpenChange={(open) => {
                if (!submitting) {
                    setAddSpeakerOpen(open);
                    if (open) {
                        setFormError(null);
                        setFormSuccess(false);
                    }
                }
            }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Speaker to Event</DialogTitle>
                        <DialogDescription>
                            Select an existing speaker or create a new one
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Success Message */}
                        {formSuccess && (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-700 font-medium">Speaker added successfully!</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {formError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>
                        )}

                        {/* Mode Toggle */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={speakerMode === "select" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSpeakerMode("select")}
                            >
                                Select Existing
                            </Button>
                            <Button
                                type="button"
                                variant={speakerMode === "create" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSpeakerMode("create")}
                            >
                                Create New
                            </Button>
                        </div>

                        {speakerMode === "select" ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Select Speaker *</Label>
                                    <Select
                                        value={speakerFormData.speakerId}
                                        onValueChange={(value) => setSpeakerFormData({ ...speakerFormData, speakerId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a speaker" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allSpeakers.filter(s => !event.speakers.some(es => es.id === s.id)).map((speaker) => (
                                                <SelectItem key={speaker.id} value={speaker.id}>
                                                    {speaker.name} {speaker.designation ? `- ${speaker.designation}` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label>Name *</Label>
                                        <Input
                                            placeholder="Dr. John Smith"
                                            value={speakerFormData.name}
                                            onChange={(e) => setSpeakerFormData({ ...speakerFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email *</Label>
                                        <Input
                                            type="email"
                                            placeholder="john@hospital.com"
                                            value={speakerFormData.email}
                                            onChange={(e) => setSpeakerFormData({ ...speakerFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            placeholder="+91 98765 43210"
                                            value={speakerFormData.phone}
                                            onChange={(e) => setSpeakerFormData({ ...speakerFormData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Designation</Label>
                                        <Input
                                            placeholder="Professor"
                                            value={speakerFormData.designation}
                                            onChange={(e) => setSpeakerFormData({ ...speakerFormData, designation: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Institution</Label>
                                        <Input
                                            placeholder="Medical College"
                                            value={speakerFormData.institution}
                                            onChange={(e) => setSpeakerFormData({ ...speakerFormData, institution: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="section-divider-gradient my-2" />

                        <div className="space-y-2">
                            <Label>Topic / Session Title</Label>
                            <Input
                                placeholder="Introduction to Modern Medicine"
                                value={speakerFormData.topic}
                                onChange={(e) => setSpeakerFormData({ ...speakerFormData, topic: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddSpeakerOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddSpeaker}
                            disabled={submitting || (speakerMode === "select" ? !speakerFormData.speakerId : !speakerFormData.name || !speakerFormData.email)}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Speaker"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Sponsor Dialog */}
            <Dialog open={addSponsorOpen} onOpenChange={(open) => {
                if (!submitting) {
                    setAddSponsorOpen(open);
                    if (open) {
                        setFormError(null);
                        setFormSuccess(false);
                    }
                }
            }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Sponsor to Event</DialogTitle>
                        <DialogDescription>
                            Select an existing sponsor or create a new one
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Success Message */}
                        {formSuccess && (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-700 font-medium">Sponsor added successfully!</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {formError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>
                        )}

                        {/* Mode Toggle */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={sponsorMode === "select" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSponsorMode("select")}
                            >
                                Select Existing
                            </Button>
                            <Button
                                type="button"
                                variant={sponsorMode === "create" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSponsorMode("create")}
                            >
                                Create New
                            </Button>
                        </div>

                        {sponsorMode === "select" ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Select Sponsor *</Label>
                                    <Select
                                        value={sponsorFormData.sponsorId}
                                        onValueChange={(value) => setSponsorFormData({ ...sponsorFormData, sponsorId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a sponsor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allSponsors.filter(s => !event.sponsors.some(es => es.id === s.id)).map((sponsor) => (
                                                <SelectItem key={sponsor.id} value={sponsor.id}>
                                                    {sponsor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label>Company Name *</Label>
                                        <Input
                                            placeholder="Acme Pharma Ltd."
                                            value={sponsorFormData.name}
                                            onChange={(e) => setSponsorFormData({ ...sponsorFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="contact@company.com"
                                            value={sponsorFormData.email}
                                            onChange={(e) => setSponsorFormData({ ...sponsorFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Website</Label>
                                        <Input
                                            placeholder="https://company.com"
                                            value={sponsorFormData.website}
                                            onChange={(e) => setSponsorFormData({ ...sponsorFormData, website: e.target.value })}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder="Brief description of the company..."
                                            rows={2}
                                            value={sponsorFormData.description}
                                            onChange={(e) => setSponsorFormData({ ...sponsorFormData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="section-divider-gradient my-2" />

                        <div className="space-y-2">
                            <Label>Sponsorship Tier *</Label>
                            <Select
                                value={sponsorFormData.tier}
                                onValueChange={(value) => setSponsorFormData({ ...sponsorFormData, tier: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                                    <SelectItem value="GOLD">Gold</SelectItem>
                                    <SelectItem value="SILVER">Silver</SelectItem>
                                    <SelectItem value="BRONZE">Bronze</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddSponsorOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddSponsor}
                            disabled={submitting || (sponsorMode === "select" ? !sponsorFormData.sponsorId : !sponsorFormData.name)}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Sponsor"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Publish Validation Errors Dialog */}
            <Dialog open={validationErrorsOpen} onOpenChange={setValidationErrorsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full shrink-0 bg-amber-100">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle>Cannot Publish Event</DialogTitle>
                                <DialogDescription>
                                    Please complete the following required fields before publishing:
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="mt-4 space-y-2">
                        {validationErrors.map((error, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                                {error}
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setValidationErrorsOpen(false)}>
                            Close
                        </Button>
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                            <Button className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Event
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Publish Confirmation Dialog */}
            <ConfirmDialog
                open={publishDialogOpen}
                onOpenChange={setPublishDialogOpen}
                title="Publish Event"
                description={`Are you sure you want to publish "${event.title}"? This will make the event visible to the public.`}
                confirmText="Publish"
                cancelText="Cancel"
                variant="info"
                loading={publishLoading}
                onConfirm={async () => {
                    try {
                        setPublishLoading(true);
                        const newStatus = calculateEventStatus(event.startDate, event.endDate);

                        const response = await eventsService.update(event.id, {
                            isPublished: true,
                            status: newStatus
                        });
                        if (response.success) {
                            setEvent({ ...event, isPublished: true, status: newStatus.toLowerCase() });
                            setPublishDialogOpen(false);
                        }
                    } catch (err) {
                        console.error("Failed to publish event:", err);
                    } finally {
                        setPublishLoading(false);
                    }
                }}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Event"
                description={`Are you sure you want to delete "${event.title}"? This action cannot be undone. All registrations and data associated with this event will be permanently removed.`}
                confirmText="Delete Event"
                cancelText="Cancel"
                variant="danger"
                loading={deleteLoading}
                onConfirm={async () => {
                    try {
                        setDeleteLoading(true);
                        await eventsService.delete(event.id);
                        setDeleteDialogOpen(false);
                        router.push("/dashboard/events");
                    } catch (err) {
                        console.error("Failed to delete event:", err);
                    } finally {
                        setDeleteLoading(false);
                    }
                }}
            />
        </DashboardLayout>
    );
}
