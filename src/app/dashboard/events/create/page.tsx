"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Info,
    Save,
    AlertCircle,
    CheckCircle2,
    X,
    Mic2,
    Building2,
    User,
} from "lucide-react";
import { eventsService, speakersService, sponsorsService } from "@/services";
import { toast } from "sonner";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EVENT_TYPES, EVENT_CATEGORIES } from "@/lib/event-constants";
import { validateEventForPublish } from "@/lib/event-validations";

interface SlotCategory {
    id: string;
    name: string;
    description: string;
    totalSlots: number;
    price: number;
    earlyBirdPrice: number;
    earlyBirdDeadline: string;
}

interface Session {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    speakerId: string;
    speakerName: string;
    isExistingSpeaker: boolean;
    description: string;
    newSpeakerName: string;
    newSpeakerEmail: string;
    newSpeakerDesignation: string;
    newSpeakerInstitution: string;
}

interface EventSponsorEntry {
    id: string;
    sponsorId: string;
    sponsorName: string;
    isExistingSponsor: boolean;
    tier: string;
    newSponsorName: string;
    newSponsorEmail: string;
    newSponsorLogo: string;
    newSponsorWebsite: string;
}

interface ExistingSpeaker {
    id: string;
    name: string;
    email: string;
    designation: string | null;
    institution: string | null;
}

interface ExistingSponsor {
    id: string;
    name: string;
    email: string | null;
    logo: string | null;
    website: string | null;
}

export default function CreateEventPage() {
    const router = useRouter();
    const { effectiveTenantId } = useTenantFilter();
    const [activeTab, setActiveTab] = useState("basic");
    const [slotCategories, setSlotCategories] = useState<SlotCategory[]>([
        {
            id: "1",
            name: "General Registration",
            description: "Standard conference access",
            totalSlots: 100,
            price: 5000,
            earlyBirdPrice: 4000,
            earlyBirdDeadline: "",
        },
    ]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [eventSponsors, setEventSponsors] = useState<EventSponsorEntry[]>([]);
    const [existingSpeakers, setExistingSpeakers] = useState<ExistingSpeaker[]>([]);
    const [existingSponsors, setExistingSponsors] = useState<ExistingSponsor[]>([]);
    const [includes, setIncludes] = useState<string[]>([
        "Conference kit and materials",
        "Refreshments during sessions",
    ]);
    const [newIncludeItem, setNewIncludeItem] = useState("");
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        type: "",
        description: "",
        shortDescription: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        timezone: "ist",
        venue: "",
        address: "",
        city: "",
        state: "",
        mapLink: "",
        virtualLink: "",
        registrationOpensDate: new Date().toISOString().split('T')[0], // Default to today
        registrationDeadline: "",
        // Settings
        cmeEnabled: false,
        cmeCredits: "",
        accreditingBody: "",
        cmeRegNumber: "",
        cmeCoordinatorName: "",
        cmeCoordinatorEmail: "",
        cmeCoordinatorDesignation: "",
        autoGenerateCertificates: true,
        emailCertificates: true,
        certificateTemplate: "default",
        // Certificate Signatories
        signatory1Name: "",
        signatory1Title: "",
        signatory2Name: "",
        signatory2Title: "",
        status: "draft",
        isFeatured: false,
        allowComments: false,
        contactEmail: "",
        contactPhone: "",
        website: "",
    });

    const updateFormData = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Fetch existing speakers and sponsors
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [speakersRes, sponsorsRes] = await Promise.all([
                    speakersService.getAll({ isActive: true }),
                    sponsorsService.getAll({ isActive: true }),
                ]);

                if (speakersRes.data) {
                    setExistingSpeakers(speakersRes.data.map((s: ExistingSpeaker) => ({
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        designation: s.designation,
                        institution: s.institution,
                    })));
                }

                if (sponsorsRes.data) {
                    setExistingSponsors(sponsorsRes.data.map((s: ExistingSponsor) => ({
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        logo: s.logo,
                        website: s.website,
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch speakers/sponsors:", error);
            }
        };

        fetchData();
    }, []);

    const addIncludeItem = () => {
        if (newIncludeItem.trim() && !includes.includes(newIncludeItem.trim())) {
            setIncludes([...includes, newIncludeItem.trim()]);
            setNewIncludeItem("");
        }
    };

    const removeIncludeItem = (index: number) => {
        setIncludes(includes.filter((_, i) => i !== index));
    };

    const addSlotCategory = () => {
        setSlotCategories([
            ...slotCategories,
            {
                id: Date.now().toString(),
                name: "",
                description: "",
                totalSlots: 50,
                price: 0,
                earlyBirdPrice: 0,
                earlyBirdDeadline: "",
            },
        ]);
    };

    const removeSlotCategory = (id: string) => {
        setSlotCategories(slotCategories.filter((cat) => cat.id !== id));
    };

    const updateSlotCategory = (id: string, field: keyof SlotCategory, value: string | number) => {
        setSlotCategories(
            slotCategories.map((cat) =>
                cat.id === id ? { ...cat, [field]: value } : cat
            )
        );
    };

    const addSession = () => {
        setSessions([
            ...sessions,
            {
                id: Date.now().toString(),
                title: "",
                date: "",
                startTime: "",
                endTime: "",
                venue: "",
                speakerId: "",
                speakerName: "",
                isExistingSpeaker: true,
                description: "",
                newSpeakerName: "",
                newSpeakerEmail: "",
                newSpeakerDesignation: "",
                newSpeakerInstitution: "",
            },
        ]);
    };

    const removeSession = (id: string) => {
        setSessions(sessions.filter((session) => session.id !== id));
    };

    const updateSession = (id: string, field: keyof Session, value: string | boolean) => {
        setSessions(
            sessions.map((session) =>
                session.id === id ? { ...session, [field]: value } : session
            )
        );
    };

    const addEventSponsor = () => {
        setEventSponsors([
            ...eventSponsors,
            {
                id: Date.now().toString(),
                sponsorId: "",
                sponsorName: "",
                isExistingSponsor: true,
                tier: "GOLD",
                newSponsorName: "",
                newSponsorEmail: "",
                newSponsorLogo: "",
                newSponsorWebsite: "",
            },
        ]);
    };

    const removeEventSponsor = (id: string) => {
        setEventSponsors(eventSponsors.filter((s) => s.id !== id));
    };

    const updateEventSponsor = (id: string, field: keyof EventSponsorEntry, value: string | boolean) => {
        setEventSponsors(
            eventSponsors.map((sponsor) =>
                sponsor.id === id ? { ...sponsor, [field]: value } : sponsor
            )
        );
    };

    const totalSlots = slotCategories.reduce((sum, cat) => sum + cat.totalSlots, 0);

    // Save/Publish Event Handler
    const handleSaveEvent = async (publish: boolean = false) => {
        // Title is always required (even for drafts)
        if (!formData.title.trim()) {
            toast.error("Event title is required");
            setActiveTab("basic");
            return;
        }

        // If publishing, validate all required fields
        if (publish) {
            const validation = validateEventForPublish({
                title: formData.title,
                description: formData.description,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                registrationDeadline: "",
                location: formData.venue,
                capacity: totalSlots,
                organizer: "",
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone,
                price: slotCategories[0]?.price || 0,
                sessions: sessions.filter(s => s.title?.trim()), // Sessions with title (speaker is optional)
            });

            if (!validation.isValid) {
                toast.error(`Cannot publish. Missing required fields:\n• ${validation.errors.join("\n• ")}`);
                return;
            }
        }

        setSaving(true);

        try {
            // 1. Create the event
            const eventData = {
                title: formData.title,
                shortDescription: formData.shortDescription || undefined,
                description: formData.description || undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime || undefined,
                endTime: formData.endTime || undefined,
                timezone: formData.timezone || "UTC",
                location: formData.venue || undefined,
                address: formData.address || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                mapLink: formData.mapLink || undefined,
                virtualLink: formData.virtualLink || undefined,
                isVirtual: !!formData.virtualLink,
                registrationDeadline: formData.registrationDeadline || undefined,
                capacity: totalSlots,
                price: slotCategories[0]?.price || 0,
                earlyBirdPrice: slotCategories[0]?.earlyBirdPrice || undefined,
                earlyBirdDeadline: slotCategories[0]?.earlyBirdDeadline || undefined,
                type: formData.type?.toUpperCase() || "CONFERENCE",
                category: formData.category || undefined,
                status: publish ? "UPCOMING" : "DRAFT",
                cmeCredits: formData.cmeEnabled ? Number(formData.cmeCredits) : undefined,
                cmeCoordinatorName: formData.cmeEnabled && formData.cmeCoordinatorName ? formData.cmeCoordinatorName : undefined,
                cmeCoordinatorEmail: formData.cmeEnabled && formData.cmeCoordinatorEmail ? formData.cmeCoordinatorEmail : undefined,
                cmeCoordinatorDesignation: formData.cmeEnabled && formData.cmeCoordinatorDesignation ? formData.cmeCoordinatorDesignation : undefined,
                contactEmail: formData.contactEmail || undefined,
                contactPhone: formData.contactPhone || undefined,
                website: formData.website || undefined,
                includes: includes,
                isPublished: publish,
                isFeatured: formData.isFeatured,
                signatory1Name: formData.signatory1Name || undefined,
                signatory1Title: formData.signatory1Title || undefined,
                signatory2Name: formData.signatory2Name || undefined,
                signatory2Title: formData.signatory2Title || undefined,
                // Include pricing categories for category-based pricing
                pricingCategories: slotCategories.map((cat, index) => ({
                    name: cat.name,
                    description: cat.description || undefined,
                    totalSlots: cat.totalSlots,
                    price: cat.price,
                    earlyBirdPrice: cat.earlyBirdPrice || undefined,
                    earlyBirdDeadline: cat.earlyBirdDeadline || undefined,
                    displayOrder: index,
                })),
            };

            // Pass tenant context
            if (effectiveTenantId) {
                (eventData as Record<string, unknown>).tenantId = effectiveTenantId;
            }

            const eventRes = await eventsService.create(eventData);

            if (!eventRes.success || !eventRes.data) {
                let errorMessage = "Failed to create event";
                if (typeof eventRes.error === 'string') {
                    errorMessage = eventRes.error;
                } else if (eventRes.error) {
                    // Check for validation errors with details
                    if (eventRes.error.details && Array.isArray(eventRes.error.details)) {
                        const fieldErrors = eventRes.error.details
                            .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
                            .join(", ");
                        errorMessage = `Validation failed: ${fieldErrors}`;
                    } else {
                        errorMessage = eventRes.error.message || "Failed to create event";
                    }
                }
                toast.error(errorMessage);
                setSaving(false);
                return;
            }

            const createdEventId = eventRes.data.id;

            // 2. Create speakers and link to event
            for (const session of sessions) {
                if (session.isExistingSpeaker && session.speakerId) {
                    // Link existing speaker
                    await eventsService.addSpeaker(createdEventId, {
                        speakerId: session.speakerId,
                        topic: session.title || undefined,
                        sessionDescription: session.description || undefined,
                        sessionDate: session.date || undefined,
                        sessionTime: session.startTime || undefined,
                        sessionEndTime: session.endTime || undefined,
                        sessionVenue: session.venue || undefined,
                    });
                } else if (!session.isExistingSpeaker && session.newSpeakerName && session.newSpeakerEmail) {
                    // Create new speaker first
                    const speakerRes = await speakersService.create({
                        name: session.newSpeakerName,
                        email: session.newSpeakerEmail,
                        designation: session.newSpeakerDesignation || undefined,
                        institution: session.newSpeakerInstitution || undefined,
                    });

                    if (speakerRes.success && speakerRes.data) {
                        const newSpeaker = speakerRes.data;
                        // Link the new speaker to event
                        await eventsService.addSpeaker(createdEventId, {
                            speakerId: newSpeaker.id,
                            topic: session.title || undefined,
                            sessionDescription: session.description || undefined,
                            sessionDate: session.date || undefined,
                            sessionTime: session.startTime || undefined,
                            sessionEndTime: session.endTime || undefined,
                            sessionVenue: session.venue || undefined,
                        });

                        // Add to existing speakers list so it appears immediately
                        setExistingSpeakers((prev) => [
                            ...prev,
                            {
                                id: newSpeaker.id,
                                name: newSpeaker.name,
                                email: newSpeaker.email,
                                designation: newSpeaker.designation,
                                institution: newSpeaker.institution,
                            },
                        ]);
                    }
                }
            }

            // 3. Create sponsors and link to event
            for (const sponsor of eventSponsors) {
                if (sponsor.isExistingSponsor && sponsor.sponsorId) {
                    // Link existing sponsor
                    await eventsService.addSponsor(createdEventId, {
                        sponsorId: sponsor.sponsorId,
                        tier: sponsor.tier as "PLATINUM" | "GOLD" | "SILVER" | "BRONZE",
                    });
                } else if (!sponsor.isExistingSponsor && sponsor.newSponsorName.trim()) {
                    // Create new sponsor first
                    // Only include email/website if they are valid (not empty)
                    const sponsorData: { name: string; email?: string; website?: string } = {
                        name: sponsor.newSponsorName.trim(),
                    };

                    if (sponsor.newSponsorEmail && sponsor.newSponsorEmail.trim()) {
                        sponsorData.email = sponsor.newSponsorEmail.trim();
                    }

                    if (sponsor.newSponsorWebsite && sponsor.newSponsorWebsite.trim()) {
                        // Add https:// if no protocol specified
                        let website = sponsor.newSponsorWebsite.trim();
                        if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
                            website = 'https://' + website;
                        }
                        sponsorData.website = website;
                    }

                    console.log("Creating sponsor with data:", sponsorData);
                    const sponsorRes = await sponsorsService.create(sponsorData);
                    console.log("Sponsor create response:", sponsorRes);

                    if (sponsorRes.success && sponsorRes.data) {
                        const newSponsor = sponsorRes.data;
                        // Link the new sponsor to event
                        await eventsService.addSponsor(createdEventId, {
                            sponsorId: newSponsor.id,
                            tier: sponsor.tier as "PLATINUM" | "GOLD" | "SILVER" | "BRONZE",
                        });

                        // Add to existing sponsors list so it appears immediately
                        setExistingSponsors((prev) => [
                            ...prev,
                            {
                                id: newSponsor.id,
                                name: newSponsor.name,
                                email: newSponsor.email,
                                logo: newSponsor.logo,
                                website: newSponsor.website,
                            },
                        ]);
                    } else {
                        console.error("Failed to create sponsor:", sponsorRes.error);
                        toast.error(`Failed to create sponsor: ${sponsor.newSponsorName}`);
                    }
                }
            }

            toast.success(publish ? "Event published successfully!" : "Event saved as draft");
            router.push(`/dashboard/events/${createdEventId}`);
        } catch (error) {
            console.error("Failed to create event:", error);
            toast.error("An error occurred while creating the event");
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout
            title="Create Event"
            subtitle="Set up a new conference, workshop, or CME session"
        >
            <div className="space-y-6 animate-fadeIn">
                {/* Back Button & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden xs:inline">Back to Events</span>
                        <span className="xs:hidden">Back</span>
                    </Button>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 flex-1 sm:flex-none"
                            onClick={() => handleSaveEvent(false)}
                            disabled={saving}
                        >
                            <Save className="h-4 w-4" />
                            <span className="hidden sm:inline">{saving ? "Saving..." : "Save Draft"}</span>
                            <span className="sm:hidden">{saving ? "..." : "Save"}</span>
                        </Button>
                        <Button
                            size="sm"
                            className="gap-2 gradient-medical text-white hover:opacity-90 flex-1 sm:flex-none"
                            onClick={() => handleSaveEvent(true)}
                            disabled={saving}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">{saving ? "Publishing..." : "Publish Event"}</span>
                            <span className="sm:hidden">{saving ? "..." : "Publish"}</span>
                        </Button>
                    </div>
                </div>

                {/* Progress Indicator */}
                <Card className="border-medical-teal/20 bg-gradient-to-r from-medical-teal-light/30 to-medical-blue-light/30">
                    <CardContent className="py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            {["Basic", "Pricing", "Sessions", "Sponsors", "Settings"].map((step, index) => {
                                const fullNames = ["Basic Info", "Slots & Pricing", "Sessions", "Sponsors", "Settings"];
                                const tabKeys = ["basic", "slots", "sessions", "sponsors", "settings"];
                                return (
                                    <div key={step} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors",
                                                    index === tabKeys.indexOf(activeTab)
                                                        ? "bg-primary text-primary-foreground"
                                                        : index < tabKeys.indexOf(activeTab)
                                                        ? "bg-medical-green text-white"
                                                        : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {index + 1}
                                            </div>
                                            <span className="text-[10px] sm:text-xs mt-1 text-muted-foreground text-center max-w-[50px] sm:max-w-none">
                                                <span className="sm:hidden">{step}</span>
                                                <span className="hidden sm:inline">{fullNames[index]}</span>
                                            </span>
                                        </div>
                                        {index < 4 && (
                                            <div
                                                className={cn(
                                                    "w-4 xs:w-8 sm:w-12 md:w-16 h-0.5 mx-1 sm:mx-2",
                                                    index < tabKeys.indexOf(activeTab)
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
                    <TabsList className="grid w-full grid-cols-5 h-10 sm:h-12">
                        <TabsTrigger value="basic" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                            <FileText className="h-4 w-4 hidden md:block" />
                            <span className="hidden sm:inline">Basic Info</span>
                            <span className="sm:hidden">Basic</span>
                        </TabsTrigger>
                        <TabsTrigger value="slots" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                            <Users className="h-4 w-4 hidden md:block" />
                            <span className="hidden sm:inline">Slots & Pricing</span>
                            <span className="sm:hidden">Pricing</span>
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                            <Mic2 className="h-4 w-4 hidden md:block" />
                            Sessions
                        </TabsTrigger>
                        <TabsTrigger value="sponsors" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                            <Building2 className="h-4 w-4 hidden md:block" />
                            Sponsors
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                            <Award className="h-4 w-4 hidden md:block" />
                            Settings
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
                                                onChange={(e) => updateFormData("title", e.target.value)}
                                                placeholder="e.g., Annual Neurostimulation Conference 2025"
                                                className="text-lg"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Medical Specialty</Label>
                                                <Select value={formData.category} onValueChange={(v) => updateFormData("category", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select specialty" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EVENT_CATEGORIES.map((cat) => (
                                                            <SelectItem key={cat.value} value={cat.value}>
                                                                {cat.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="type">Event Type *</Label>
                                                <Select value={formData.type} onValueChange={(v) => updateFormData("type", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EVENT_TYPES.map((type) => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
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
                                                onChange={(e) => updateFormData("description", e.target.value)}
                                                placeholder="Provide a detailed description of the event, topics covered, target audience, learning objectives..."
                                                rows={5}
                                                className="resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="shortDescription">Short Description</Label>
                                            <Input
                                                id="shortDescription"
                                                value={formData.shortDescription}
                                                onChange={(e) => updateFormData("shortDescription", e.target.value)}
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

                                        <p className="text-xs text-muted-foreground">
                                            Common items: Conference kit, Lunch, CME Certificate, Access to recordings, Networking dinner
                                        </p>
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
                                                    onChange={(e) => updateFormData("startDate", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endDate">End Date *</Label>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={(e) => updateFormData("endDate", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startTime">Start Time *</Label>
                                                <Input
                                                    id="startTime"
                                                    type="time"
                                                    value={formData.startTime}
                                                    onChange={(e) => updateFormData("startTime", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endTime">End Time *</Label>
                                                <Input
                                                    id="endTime"
                                                    type="time"
                                                    value={formData.endTime}
                                                    onChange={(e) => updateFormData("endTime", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select value={formData.timezone} onValueChange={(v) => updateFormData("timezone", v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                                                    <SelectItem value="utc">UTC</SelectItem>
                                                    <SelectItem value="est">EST (UTC-5)</SelectItem>
                                                    <SelectItem value="pst">PST (UTC-8)</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                        <div className="space-y-2">
                                            <Label htmlFor="venue">Venue Name *</Label>
                                            <Input
                                                id="venue"
                                                value={formData.venue}
                                                onChange={(e) => updateFormData("venue", e.target.value)}
                                                placeholder="e.g., Grand Conference Hall, Medical College"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Full Address</Label>
                                            <Textarea
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) => updateFormData("address", e.target.value)}
                                                placeholder="Complete address including city, state, and PIN code"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={formData.city}
                                                    onChange={(e) => updateFormData("city", e.target.value)}
                                                    placeholder="e.g., Mumbai"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={formData.state}
                                                    onChange={(e) => updateFormData("state", e.target.value)}
                                                    placeholder="e.g., Maharashtra"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="mapLink">Google Maps Link</Label>
                                            <Input
                                                id="mapLink"
                                                value={formData.mapLink}
                                                onChange={(e) => updateFormData("mapLink", e.target.value)}
                                                placeholder="https://maps.google.com/..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="virtualLink">Virtual Meeting Link</Label>
                                            <Input
                                                id="virtualLink"
                                                value={formData.virtualLink}
                                                onChange={(e) => updateFormData("virtualLink", e.target.value)}
                                                placeholder="https://zoom.us/... or https://meet.google.com/..."
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                For virtual or hybrid events
                                            </p>
                                        </div>
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
                                    <CardContent>
                                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                    <Image className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-medium">
                                                    Upload Banner Image
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Recommended: 1200x630px, PNG or JPG
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="card-hover">
                                    <CardHeader>
                                        <CardTitle className="text-base">Quick Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm text-muted-foreground">
                                                Total Slots
                                            </span>
                                            <Badge variant="secondary" className="text-lg font-bold">
                                                {totalSlots}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm text-muted-foreground">
                                                Categories
                                            </span>
                                            <Badge variant="secondary" className="text-lg font-bold">
                                                {slotCategories.length}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm text-muted-foreground">
                                                Sessions
                                            </span>
                                            <Badge variant="secondary" className="text-lg font-bold">
                                                {sessions.length}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm text-muted-foreground">
                                                Includes
                                            </span>
                                            <Badge variant="secondary" className="text-lg font-bold">
                                                {includes.length}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-medical-orange/30 bg-medical-orange-light/30">
                                    <CardContent className="pt-6">
                                        <div className="flex gap-3">
                                            <Info className="h-5 w-5 text-medical-orange shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-medical-orange">
                                                    Tips for Success
                                                </p>
                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                    <li>• Add a compelling banner image</li>
                                                    <li>• Write detailed descriptions</li>
                                                    <li>• Set early bird pricing</li>
                                                    <li>• Add speaker profiles</li>
                                                </ul>
                                            </div>
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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <div className="icon-container icon-container-teal h-8 w-8 sm:h-10 sm:w-10">
                                                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            Registration Categories
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">
                                            Define different registration types with pricing
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addSlotCategory} size="sm" className="gap-2 w-full sm:w-auto">
                                        <Plus className="h-4 w-4" />
                                        Add Category
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {slotCategories.map((category, index) => (
                                    <div
                                        key={category.id}
                                        className="p-3 sm:p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow animate-fadeIn"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        {/* Mobile: Header with drag and delete */}
                                        <div className="flex items-center justify-between mb-3 sm:hidden">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Category {index + 1}</span>
                                            </div>
                                            {slotCategories.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeSlotCategory(category.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Desktop: Original layout */}
                                        <div className="hidden sm:flex items-start gap-4">
                                            <div className="cursor-grab p-2 text-muted-foreground hover:text-foreground">
                                                <GripVertical className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Category Name *</Label>
                                                        <Input
                                                            value={category.name}
                                                            onChange={(e) =>
                                                                updateSlotCategory(
                                                                    category.id,
                                                                    "name",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g., Faculty, Student, Professional"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Total Slots *</Label>
                                                        <Input
                                                            type="number"
                                                            value={category.totalSlots}
                                                            onChange={(e) =>
                                                                updateSlotCategory(
                                                                    category.id,
                                                                    "totalSlots",
                                                                    parseInt(e.target.value) || 0
                                                                )
                                                            }
                                                            min={1}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <Input
                                                        value={category.description}
                                                        onChange={(e) =>
                                                            updateSlotCategory(
                                                                category.id,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="What's included in this registration"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Regular Price (₹) *</Label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={category.price}
                                                                onChange={(e) =>
                                                                    updateSlotCategory(
                                                                        category.id,
                                                                        "price",
                                                                        parseInt(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="pl-10"
                                                                min={0}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Early Bird Price (₹)</Label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={category.earlyBirdPrice}
                                                                onChange={(e) =>
                                                                    updateSlotCategory(
                                                                        category.id,
                                                                        "earlyBirdPrice",
                                                                        parseInt(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="pl-10"
                                                                min={0}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Early Bird Deadline</Label>
                                                        <Input
                                                            type="date"
                                                            value={category.earlyBirdDeadline}
                                                            onChange={(e) =>
                                                                updateSlotCategory(
                                                                    category.id,
                                                                    "earlyBirdDeadline",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {slotCategories.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSlotCategory(category.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Mobile: Stacked form fields */}
                                        <div className="sm:hidden space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Category Name *</Label>
                                                <Input
                                                    value={category.name}
                                                    onChange={(e) =>
                                                        updateSlotCategory(category.id, "name", e.target.value)
                                                    }
                                                    placeholder="e.g., Faculty, Student"
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Total Slots *</Label>
                                                    <Input
                                                        type="number"
                                                        value={category.totalSlots}
                                                        onChange={(e) =>
                                                            updateSlotCategory(category.id, "totalSlots", parseInt(e.target.value) || 0)
                                                        }
                                                        min={1}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Price (₹) *</Label>
                                                    <Input
                                                        type="number"
                                                        value={category.price}
                                                        onChange={(e) =>
                                                            updateSlotCategory(category.id, "price", parseInt(e.target.value) || 0)
                                                        }
                                                        min={0}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Early Bird (₹)</Label>
                                                    <Input
                                                        type="number"
                                                        value={category.earlyBirdPrice}
                                                        onChange={(e) =>
                                                            updateSlotCategory(category.id, "earlyBirdPrice", parseInt(e.target.value) || 0)
                                                        }
                                                        min={0}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">EB Deadline</Label>
                                                    <Input
                                                        type="date"
                                                        value={category.earlyBirdDeadline}
                                                        onChange={(e) =>
                                                            updateSlotCategory(category.id, "earlyBirdDeadline", e.target.value)
                                                        }
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Summary Card */}
                                <div className="mt-6 p-4 rounded-xl gradient-medical-light border border-medical-teal/20">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">
                                                Total Capacity
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Across all categories
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-primary">
                                                {totalSlots}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Registration Opens *</Label>
                                        <Input
                                            type="date"
                                            value={formData.registrationOpensDate}
                                            onChange={(e) => updateFormData("registrationOpensDate", e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            max={formData.startDate || undefined}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            When registration becomes available (must be before event start)
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Registration Deadline</Label>
                                        <Input
                                            type="date"
                                            value={formData.registrationDeadline}
                                            onChange={(e) => updateFormData("registrationDeadline", e.target.value)}
                                            min={formData.registrationOpensDate || new Date().toISOString().split('T')[0]}
                                            max={formData.startDate || undefined}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Last date to register (must be before event start)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label>Enable Waitlist</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Allow registrations after slots are full
                                        </p>
                                    </div>
                                    <Switch />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label>Auto-block slots on payment</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically reserve slots when payment is initiated
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label>Show remaining seats</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Display real-time slot availability
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sessions Tab */}
                    <TabsContent value="sessions" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <div className="icon-container icon-container-blue h-8 w-8 sm:h-10 sm:w-10">
                                                <Mic2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            Event Sessions
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">
                                            Add individual sessions, talks, or workshops with speakers
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addSession} size="sm" className="gap-2 w-full sm:w-auto">
                                        <Plus className="h-4 w-4" />
                                        Add Session
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {sessions.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                        <Mic2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Add sessions to build your event schedule
                                        </p>
                                        <Button onClick={addSession} variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add First Session
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sessions.map((session, index) => (
                                            <div
                                                key={session.id}
                                                className="p-3 sm:p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow animate-fadeIn"
                                            >
                                                {/* Mobile: Header */}
                                                <div className="flex items-center justify-between mb-3 sm:hidden">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Session {index + 1}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeSession(session.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Desktop: Original layout */}
                                                <div className="hidden sm:flex items-start gap-4">
                                                    <div className="cursor-grab p-2 text-muted-foreground hover:text-foreground">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Session Title *</Label>
                                                            <Input
                                                                value={session.title}
                                                                onChange={(e) => updateSession(session.id, "title", e.target.value)}
                                                                placeholder="e.g., Keynote: Future of Neurostimulation"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label>Date *</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={session.date}
                                                                    onChange={(e) => updateSession(session.id, "date", e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Start Time *</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={session.startTime}
                                                                    onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>End Time *</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={session.endTime}
                                                                    onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Venue/Room</Label>
                                                            <Input
                                                                value={session.venue}
                                                                onChange={(e) => updateSession(session.id, "venue", e.target.value)}
                                                                placeholder="e.g., Hall A, Room 101"
                                                            />
                                                        </div>

                                                        {/* Speaker Selection */}
                                                        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="flex items-center gap-2">
                                                                    <User className="h-4 w-4" />
                                                                    Speaker
                                                                </Label>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateSession(session.id, "isExistingSpeaker", true)}
                                                                        className={cn(
                                                                            "px-3 py-1 text-xs rounded-l-md border transition-colors",
                                                                            session.isExistingSpeaker
                                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                                : "bg-background border-border hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        Select Existing
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateSession(session.id, "isExistingSpeaker", false)}
                                                                        className={cn(
                                                                            "px-3 py-1 text-xs rounded-r-md border transition-colors",
                                                                            !session.isExistingSpeaker
                                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                                : "bg-background border-border hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        Create New
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {session.isExistingSpeaker ? (
                                                                <Select
                                                                    value={session.speakerId || undefined}
                                                                    onValueChange={(value) => {
                                                                        if (!value) return;
                                                                        const speaker = existingSpeakers.find((s) => s.id === value);
                                                                        setSessions(prev => prev.map(s =>
                                                                            s.id === session.id
                                                                                ? { ...s, speakerId: value, speakerName: speaker?.name || "" }
                                                                                : s
                                                                        ));
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select a speaker" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {existingSpeakers.length === 0 ? (
                                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                                No speakers found
                                                                            </div>
                                                                        ) : (
                                                                            existingSpeakers.map((speaker) => (
                                                                                <SelectItem key={speaker.id} value={speaker.id}>
                                                                                    <div className="flex flex-col">
                                                                                        <span>{speaker.name}</span>
                                                                                        {speaker.designation && (
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                {speaker.designation}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </SelectItem>
                                                                            ))
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs">Name *</Label>
                                                                        <Input
                                                                            value={session.newSpeakerName}
                                                                            onChange={(e) => updateSession(session.id, "newSpeakerName", e.target.value)}
                                                                            placeholder="Speaker name"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs">Email *</Label>
                                                                        <Input
                                                                            type="email"
                                                                            value={session.newSpeakerEmail}
                                                                            onChange={(e) => updateSession(session.id, "newSpeakerEmail", e.target.value)}
                                                                            placeholder="speaker@email.com"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs">Designation</Label>
                                                                        <Input
                                                                            value={session.newSpeakerDesignation}
                                                                            onChange={(e) => updateSession(session.id, "newSpeakerDesignation", e.target.value)}
                                                                            placeholder="e.g., Professor"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs">Institution</Label>
                                                                        <Input
                                                                            value={session.newSpeakerInstitution}
                                                                            onChange={(e) => updateSession(session.id, "newSpeakerInstitution", e.target.value)}
                                                                            placeholder="e.g., Medical College"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Session Description</Label>
                                                            <Textarea
                                                                value={session.description}
                                                                onChange={(e) => updateSession(session.id, "description", e.target.value)}
                                                                placeholder="Describe what will be covered in this session"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeSession(session.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Mobile: Stacked form */}
                                                <div className="sm:hidden space-y-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Session Title *</Label>
                                                        <Input
                                                            value={session.title}
                                                            onChange={(e) => updateSession(session.id, "title", e.target.value)}
                                                            placeholder="e.g., Keynote Session"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Date *</Label>
                                                        <Input
                                                            type="date"
                                                            value={session.date}
                                                            onChange={(e) => updateSession(session.id, "date", e.target.value)}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Start Time *</Label>
                                                            <Input
                                                                type="time"
                                                                value={session.startTime}
                                                                onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">End Time *</Label>
                                                            <Input
                                                                type="time"
                                                                value={session.endTime}
                                                                onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Venue/Room</Label>
                                                        <Input
                                                            value={session.venue}
                                                            onChange={(e) => updateSession(session.id, "venue", e.target.value)}
                                                            placeholder="e.g., Hall A"
                                                            className="h-9"
                                                        />
                                                    </div>

                                                    {/* Mobile Speaker Selection */}
                                                    <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                Speaker
                                                            </Label>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateSession(session.id, "isExistingSpeaker", true)}
                                                                    className={cn(
                                                                        "px-2 py-0.5 text-[10px] rounded-l border transition-colors",
                                                                        session.isExistingSpeaker
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border"
                                                                    )}
                                                                >
                                                                    Existing
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateSession(session.id, "isExistingSpeaker", false)}
                                                                    className={cn(
                                                                        "px-2 py-0.5 text-[10px] rounded-r border transition-colors",
                                                                        !session.isExistingSpeaker
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border"
                                                                    )}
                                                                >
                                                                    New
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {session.isExistingSpeaker ? (
                                                            <Select
                                                                value={session.speakerId || undefined}
                                                                onValueChange={(value) => {
                                                                    if (!value) return;
                                                                    const speaker = existingSpeakers.find((s) => s.id === value);
                                                                    setSessions(prev => prev.map(s =>
                                                                        s.id === session.id
                                                                            ? { ...s, speakerId: value, speakerName: speaker?.name || "" }
                                                                            : s
                                                                    ));
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue placeholder="Select speaker" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {existingSpeakers.map((speaker) => (
                                                                        <SelectItem key={speaker.id} value={speaker.id}>
                                                                            {speaker.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <Input
                                                                    value={session.newSpeakerName}
                                                                    onChange={(e) => updateSession(session.id, "newSpeakerName", e.target.value)}
                                                                    placeholder="Speaker name"
                                                                    className="h-8 text-sm"
                                                                />
                                                                <Input
                                                                    type="email"
                                                                    value={session.newSpeakerEmail}
                                                                    onChange={(e) => updateSession(session.id, "newSpeakerEmail", e.target.value)}
                                                                    placeholder="Email"
                                                                    className="h-8 text-sm"
                                                                />
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

                    {/* Sponsors Tab */}
                    <TabsContent value="sponsors" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <div className="icon-container icon-container-purple h-8 w-8 sm:h-10 sm:w-10">
                                                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            Event Sponsors
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">
                                            Add sponsors supporting this event
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addEventSponsor} size="sm" className="gap-2 w-full sm:w-auto">
                                        <Plus className="h-4 w-4" />
                                        Add Sponsor
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {eventSponsors.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No sponsors yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Add sponsors to showcase event partners
                                        </p>
                                        <Button onClick={addEventSponsor} variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add First Sponsor
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {eventSponsors.map((sponsor, index) => (
                                            <div
                                                key={sponsor.id}
                                                className="p-3 sm:p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow animate-fadeIn"
                                            >
                                                {/* Mobile: Header */}
                                                <div className="flex items-center justify-between mb-3 sm:hidden">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Sponsor {index + 1}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeEventSponsor(sponsor.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Desktop Layout */}
                                                <div className="hidden sm:flex items-start gap-4">
                                                    <div className="cursor-grab p-2 text-muted-foreground hover:text-foreground">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        {/* Sponsor Selection Toggle */}
                                                        <div className="flex items-center justify-between">
                                                            <Label className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4" />
                                                                Sponsor
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateEventSponsor(sponsor.id, "isExistingSponsor", true)}
                                                                    className={cn(
                                                                        "px-3 py-1 text-xs rounded-l-md border transition-colors",
                                                                        sponsor.isExistingSponsor
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border hover:bg-muted"
                                                                    )}
                                                                >
                                                                    Select Existing
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateEventSponsor(sponsor.id, "isExistingSponsor", false)}
                                                                    className={cn(
                                                                        "px-3 py-1 text-xs rounded-r-md border transition-colors",
                                                                        !sponsor.isExistingSponsor
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border hover:bg-muted"
                                                                    )}
                                                                >
                                                                    Create New
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {sponsor.isExistingSponsor ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>Select Sponsor *</Label>
                                                                    <Select
                                                                        value={sponsor.sponsorId || undefined}
                                                                        onValueChange={(value) => {
                                                                            const existingSponsor = existingSponsors.find((s) => s.id === value);
                                                                            updateEventSponsor(sponsor.id, "sponsorId", value);
                                                                            updateEventSponsor(sponsor.id, "sponsorName", existingSponsor?.name || "");
                                                                        }}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select a sponsor" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {existingSponsors.length === 0 ? (
                                                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                                                    No sponsors found
                                                                                </div>
                                                                            ) : (
                                                                                existingSponsors.map((s) => (
                                                                                    <SelectItem key={s.id} value={s.id}>
                                                                                        {s.name}
                                                                                    </SelectItem>
                                                                                ))
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Sponsorship Tier *</Label>
                                                                    <Select
                                                                        value={sponsor.tier}
                                                                        onValueChange={(value) => updateEventSponsor(sponsor.id, "tier", value)}
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
                                                        ) : (
                                                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Sponsor Name *</Label>
                                                                        <Input
                                                                            value={sponsor.newSponsorName}
                                                                            onChange={(e) => updateEventSponsor(sponsor.id, "newSponsorName", e.target.value)}
                                                                            placeholder="Company name"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Email</Label>
                                                                        <Input
                                                                            type="email"
                                                                            value={sponsor.newSponsorEmail}
                                                                            onChange={(e) => updateEventSponsor(sponsor.id, "newSponsorEmail", e.target.value)}
                                                                            placeholder="contact@company.com"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Website</Label>
                                                                        <Input
                                                                            value={sponsor.newSponsorWebsite}
                                                                            onChange={(e) => updateEventSponsor(sponsor.id, "newSponsorWebsite", e.target.value)}
                                                                            placeholder="https://company.com"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Sponsorship Tier *</Label>
                                                                        <Select
                                                                            value={sponsor.tier}
                                                                            onValueChange={(value) => updateEventSponsor(sponsor.id, "tier", value)}
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
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeEventSponsor(sponsor.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Mobile Layout */}
                                                <div className="sm:hidden space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            Sponsor
                                                        </Label>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateEventSponsor(sponsor.id, "isExistingSponsor", true)}
                                                                className={cn(
                                                                    "px-2 py-0.5 text-[10px] rounded-l border transition-colors",
                                                                    sponsor.isExistingSponsor
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-background border-border"
                                                                )}
                                                            >
                                                                Existing
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateEventSponsor(sponsor.id, "isExistingSponsor", false)}
                                                                className={cn(
                                                                    "px-2 py-0.5 text-[10px] rounded-r border transition-colors",
                                                                    !sponsor.isExistingSponsor
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-background border-border"
                                                                )}
                                                            >
                                                                New
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {sponsor.isExistingSponsor ? (
                                                        <div className="space-y-2">
                                                            <Select
                                                                value={sponsor.sponsorId || undefined}
                                                                onValueChange={(value) => {
                                                                    const existingSponsor = existingSponsors.find((s) => s.id === value);
                                                                    updateEventSponsor(sponsor.id, "sponsorId", value);
                                                                    updateEventSponsor(sponsor.id, "sponsorName", existingSponsor?.name || "");
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue placeholder="Select sponsor" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {existingSponsors.map((s) => (
                                                                        <SelectItem key={s.id} value={s.id}>
                                                                            {s.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select
                                                                value={sponsor.tier}
                                                                onValueChange={(value) => updateEventSponsor(sponsor.id, "tier", value)}
                                                            >
                                                                <SelectTrigger className="h-9">
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
                                                    ) : (
                                                        <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                                                            <Input
                                                                value={sponsor.newSponsorName}
                                                                onChange={(e) => updateEventSponsor(sponsor.id, "newSponsorName", e.target.value)}
                                                                placeholder="Sponsor name"
                                                                className="h-8 text-sm"
                                                            />
                                                            <Input
                                                                type="email"
                                                                value={sponsor.newSponsorEmail}
                                                                onChange={(e) => updateEventSponsor(sponsor.id, "newSponsorEmail", e.target.value)}
                                                                placeholder="Email"
                                                                className="h-8 text-sm"
                                                            />
                                                            <Select
                                                                value={sponsor.tier}
                                                                onValueChange={(value) => updateEventSponsor(sponsor.id, "tier", value)}
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="Tier" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                                                                    <SelectItem value="GOLD">Gold</SelectItem>
                                                                    <SelectItem value="SILVER">Silver</SelectItem>
                                                                    <SelectItem value="BRONZE">Bronze</SelectItem>
                                                                </SelectContent>
                                                            </Select>
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
                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="space-y-0.5">
                                            <Label>Enable CME Credits</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Award CME credits upon completion
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.cmeEnabled}
                                            onCheckedChange={(checked) => updateFormData("cmeEnabled", checked)}
                                        />
                                    </div>

                                    {formData.cmeEnabled && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>CME Credit Hours</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g., 8"
                                                    min={0}
                                                    value={formData.cmeCredits}
                                                    onChange={e => updateFormData("cmeCredits", e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Accrediting Body</Label>
                                                <Input
                                                    value={formData.accreditingBody}
                                                    onChange={e => updateFormData("accreditingBody", e.target.value)}
                                                    placeholder="e.g., State Medical Council"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>CME Registration Number</Label>
                                                <Input
                                                    value={formData.cmeRegNumber}
                                                    onChange={e => updateFormData("cmeRegNumber", e.target.value)}
                                                    placeholder="e.g., CME/2025/001"
                                                />
                                            </div>

                                            <div className="border-t pt-4 mt-4">
                                                <p className="text-sm font-medium mb-3">CME Coordinator</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Coordinator Name</Label>
                                                <Input
                                                    value={formData.cmeCoordinatorName}
                                                    onChange={e => updateFormData("cmeCoordinatorName", e.target.value)}
                                                    placeholder="Dr. John Smith"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Coordinator Designation</Label>
                                                <Input
                                                    value={formData.cmeCoordinatorDesignation}
                                                    onChange={e => updateFormData("cmeCoordinatorDesignation", e.target.value)}
                                                    placeholder="CME Director"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Coordinator Email</Label>
                                                <Input
                                                    type="email"
                                                    value={formData.cmeCoordinatorEmail}
                                                    onChange={e => updateFormData("cmeCoordinatorEmail", e.target.value)}
                                                    placeholder="cme@hospital.com"
                                                />
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <div className="icon-container icon-container-purple h-8 w-8 sm:h-10 sm:w-10">
                                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        Certificate Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="space-y-0.5">
                                            <Label>Auto-generate Certificates</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Create certificates after event completion
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="space-y-0.5">
                                            <Label>Email Certificates</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Automatically email certificates to participants
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Certificate Template</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Default Certificate</SelectItem>
                                                <SelectItem value="cme">CME Certificate</SelectItem>
                                                <SelectItem value="workshop">Workshop Certificate</SelectItem>
                                                <SelectItem value="custom">Custom Template</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Certificate Signatories</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm text-muted-foreground">Signatory 1 Name</Label>
                                                <Input
                                                    placeholder="Dr. Rajesh Kumar"
                                                    value={formData.signatory1Name}
                                                    onChange={(e) => updateFormData("signatory1Name", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm text-muted-foreground">Signatory 1 Title</Label>
                                                <Input
                                                    placeholder="Conference Director"
                                                    value={formData.signatory1Title}
                                                    onChange={(e) => updateFormData("signatory1Title", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm text-muted-foreground">Signatory 2 Name</Label>
                                                <Input
                                                    placeholder="Dr. Priya Sharma"
                                                    value={formData.signatory2Name}
                                                    onChange={(e) => updateFormData("signatory2Name", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm text-muted-foreground">Signatory 2 Title</Label>
                                                <Input
                                                    placeholder="Scientific Chair"
                                                    value={formData.signatory2Title}
                                                    onChange={(e) => updateFormData("signatory2Title", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base sm:text-lg">Visibility & Access</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Event Status</Label>
                                        <Select defaultValue="draft">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="published">Published</SelectItem>
                                                <SelectItem value="private">Private</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="space-y-0.5">
                                            <Label>Featured Event</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Show on homepage and featured listings
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="space-y-0.5">
                                            <Label>Allow Comments</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Enable discussion on event page
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Contact Email</Label>
                                        <Input type="email" placeholder="events@medicalcollege.edu" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Contact Phone</Label>
                                        <Input type="tel" placeholder="+91 98765 43210" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Event Website</Label>
                                        <Input type="url" placeholder="https://event.medicalcollege.edu" />
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
                    {activeTab === "settings" ? (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleSaveEvent(false)}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Draft"}
                            </Button>
                            <Button
                                className="gradient-medical text-white hover:opacity-90"
                                onClick={() => handleSaveEvent(true)}
                                disabled={saving}
                            >
                                {saving ? "Publishing..." : "Create Event"}
                            </Button>
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
