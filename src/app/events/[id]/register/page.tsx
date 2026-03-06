"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    MapPin,
    Award,
    GraduationCap,
    User,
    Mail,
    CreditCard,
    CheckCircle2,
    Shield,
    Ticket,
    AlertCircle,
    Loader2,
    Users,
    Hotel,
    Utensils,
    Heart,
    Plus,
    Minus,
    X,
    Car,
    Plane,
    Info,
    Eye,
    Clock,
    Building2,
    Phone,
    Globe,
    Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { eventsService, Event } from "@/services/events";
import { registrationsService, CreateRegistrationData } from "@/services/registrations";

interface PricingCategory {
    id: string;
    name: string;
    description: string | null;
    totalSlots: number;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
}

interface EventDisplayData {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    address: string | null;
    cmeCredits: number | null;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    isEarlyBird: boolean;
    capacity: number;
    registrations: number;
    description: string | null;
    type: string;
    organizer: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    includes: string[];
    speakers: { name: string; designation: string | null; institution: string | null }[];
    sponsors: { name: string; logo: string | null; tier: string }[];
    pricingCategories: PricingCategory[];
}

type Step = "category" | "details" | "preferences" | "payment" | "confirmation";

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    age: string;
    dietaryPreference: string;
}

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const [currentStep, setCurrentStep] = useState<Step>("details");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Event data from API
    const [eventData, setEventData] = useState<EventDisplayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if page was opened as preview from dashboard
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasOpener = window.opener !== null;
            const fromDashboard = document.referrer.includes("/dashboard");
            setIsPreviewMode(hasOpener || fromDashboard);
        }
    }, []);

    // Fetch event data
    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);
                const response = await eventsService.getPublicById(eventId);
                if (response.success && response.data) {
                    const event = response.data;
                    const startDate = new Date(event.startDate);
                    const earlyBirdDate = event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline) : null;
                    const isEarlyBird = earlyBirdDate ? new Date() < earlyBirdDate : false;

                    // Map pricing categories from API
                    const pricingCategories: PricingCategory[] = event.pricingCategories?.map((pc: { id: string; name: string; description?: string | null; totalSlots: number; price: number | string; earlyBirdPrice?: number | string | null; earlyBirdDeadline?: string | null }) => ({
                        id: pc.id,
                        name: pc.name,
                        description: pc.description || null,
                        totalSlots: pc.totalSlots,
                        price: Number(pc.price),
                        earlyBirdPrice: pc.earlyBirdPrice ? Number(pc.earlyBirdPrice) : null,
                        earlyBirdDeadline: pc.earlyBirdDeadline || null,
                    })) || [];

                    setEventData({
                        id: event.id,
                        title: event.title,
                        date: startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                        time: event.startTime ? `${event.startTime} - ${event.endTime || ""}` : "TBA",
                        location: [event.location, event.city].filter(Boolean).join(", ") || "TBA",
                        address: [event.address, event.city, event.state, event.country].filter(Boolean).join(", ") || null,
                        cmeCredits: event.cmeCredits,
                        price: Number(event.price),
                        earlyBirdPrice: event.earlyBirdPrice ? Number(event.earlyBirdPrice) : null,
                        earlyBirdDeadline: earlyBirdDate?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) || null,
                        isEarlyBird,
                        capacity: event.capacity,
                        registrations: event._count?.registrations || 0,
                        description: event.description,
                        type: event.type,
                        organizer: event.organizer,
                        contactEmail: event.contactEmail,
                        contactPhone: event.contactPhone,
                        website: event.website,
                        includes: event.includes || [],
                        speakers: event.eventSpeakers?.map(es => ({
                            name: es.speaker.name,
                            designation: es.speaker.designation,
                            institution: es.speaker.institution,
                        })) || [],
                        sponsors: event.eventSponsors?.map(es => ({
                            name: es.sponsor.name,
                            logo: es.sponsor.logo,
                            tier: es.tier,
                        })) || [],
                        pricingCategories,
                    });

                    // Auto-select first pricing category if available
                    if (pricingCategories.length > 0) {
                        setSelectedCategory(pricingCategories[0].id);
                    }
                } else {
                    setError("Event not found");
                }
            } catch {
                setError("Failed to load event");
            } finally {
                setLoading(false);
            }
        }
        if (eventId) fetchEvent();
    }, [eventId]);

    // Form state
    const [selectedCategory, setSelectedCategory] = useState("general");
    const [paymentMethod, setPaymentMethod] = useState("razorpay");
    const [formData, setFormData] = useState({
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        institution: "",
        designation: "",
        city: "",
        state: "",
        medicalCouncilNumber: "",
        agreeTerms: false,
        agreeUpdates: true,
    });

    // Preferences state
    const [preferences, setPreferences] = useState({
        // Family
        bringingFamily: false,
        familyMembers: [] as FamilyMember[],
        // Accommodation
        needAccommodation: false,
        accommodationType: "",
        checkInDate: "",
        checkOutDate: "",
        numberOfNights: 2,
        specialRoomRequests: "",
        // Food
        dietaryPreference: "veg",
        foodAllergies: "",
        mealPlan: "",
        // Transportation
        needAirportPickup: false,
        flightDetails: "",
        needLocalTransport: false,
        // Other
        wheelchairAccess: false,
        specialAssistance: "",
        workshopPreferences: [] as string[],
        networkingInterests: "",
    });

    // Calculate base price based on selected category
    const getBasePrice = () => {
        if (!eventData) return 0;

        // If there are pricing categories, use the selected one
        if (eventData.pricingCategories && eventData.pricingCategories.length > 0) {
            const category = eventData.pricingCategories.find(c => c.id === selectedCategory);
            if (category) {
                // Check if early bird is applicable for this category
                const isEarlyBird = category.earlyBirdPrice && category.earlyBirdDeadline &&
                    new Date() <= new Date(category.earlyBirdDeadline);
                return isEarlyBird ? Number(category.earlyBirdPrice) : Number(category.price);
            }
        }

        // Fallback to event-level pricing
        return eventData.isEarlyBird && eventData.earlyBirdPrice
            ? Number(eventData.earlyBirdPrice)
            : Number(eventData.price);
    };

    const getSelectedCategoryName = () => {
        if (!eventData?.pricingCategories || !selectedCategory) return selectedCategory;
        return eventData.pricingCategories.find(c => c.id === selectedCategory)?.name || selectedCategory;
    };

    const basePrice = getBasePrice();

    // Calculate additional costs (simplified - can be expanded later)
    const additionalCosts = { accommodation: 0, meals: 0, transport: 0, total: 0 };
    const totalPrice = basePrice + additionalCosts.total;

    const steps: { key: Step; label: string; icon: React.ElementType }[] = [
        { key: "details", label: "Details", icon: User },
        { key: "payment", label: "Payment", icon: CreditCard },
        { key: "confirmation", label: "Done", icon: CheckCircle2 },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePreferenceChange = (field: string, value: unknown) => {
        setPreferences((prev) => ({ ...prev, [field]: value }));
    };

    const addFamilyMember = () => {
        const newMember: FamilyMember = {
            id: Date.now().toString(),
            name: "",
            relation: "",
            age: "",
            dietaryPreference: "veg",
        };
        setPreferences(prev => ({
            ...prev,
            familyMembers: [...prev.familyMembers, newMember]
        }));
    };

    const removeFamilyMember = (id: string) => {
        setPreferences(prev => ({
            ...prev,
            familyMembers: prev.familyMembers.filter(m => m.id !== id)
        }));
    };

    const updateFamilyMember = (id: string, field: string, value: string) => {
        setPreferences(prev => ({
            ...prev,
            familyMembers: prev.familyMembers.map(m =>
                m.id === id ? { ...m, [field]: value } : m
            )
        }));
    };

    const handleNextStep = () => {
        // "preferences" removed for demo
        const stepOrder: Step[] = ["category", "details", "payment", "confirmation"];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
            setCurrentStep(stepOrder[currentIndex + 1]);
        }
    };

    const handlePrevStep = () => {
        // "preferences" removed for demo
        const stepOrder: Step[] = ["category", "details", "payment", "confirmation"];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(stepOrder[currentIndex - 1]);
        }
    };

    const handlePayment = async () => {
        if (!eventData) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const registrationData: CreateRegistrationData = {
                eventId: eventData.id,
                name: `${formData.title} ${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phone || undefined,
                organization: formData.institution || undefined,
                designation: formData.designation || undefined,
                category: getSelectedCategoryName() || undefined,
                amount: totalPrice,
                specialRequests: preferences.foodAllergies || undefined,
            };

            const response = await registrationsService.create(registrationData);

            if (response.success && response.data) {
                setRegistrationId(response.data.id);
                setCurrentStep("confirmation");
            } else {
                // Show the actual error from the API so the user knows what went wrong
                const errorMessage =
                    response.error?.message ||
                    "Failed to complete registration. Please try again.";
                setError(errorMessage);
            }
        } catch {
            setError("An error occurred during registration. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceedFromCategory = selectedCategory !== "";
    const canProceedFromDetails =
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.institution &&
        formData.agreeTerms;

    const handleDownloadReceipt = () => {
        if (!eventData || !registrationId) return;

        const receiptContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Registration Receipt - ${eventData.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #fff; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 15px; }
        .logo { font-size: 22px; font-weight: bold; color: #0d9488; }
        .subtitle { font-size: 10px; color: #666; margin-top: 2px; }
        .title { font-size: 16px; margin-top: 8px; color: #333; }
        .receipt-id { font-size: 10px; color: #888; margin-top: 4px; }
        .content { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .section { background: #fafafa; padding: 12px; border-radius: 6px; }
        .section.full { grid-column: 1 / -1; }
        .section-title { font-size: 10px; color: #0d9488; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.5px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .label { color: #666; font-size: 11px; }
        .value { font-weight: 600; color: #333; font-size: 11px; text-align: right; max-width: 60%; }
        .highlight { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); padding: 15px; border-radius: 8px; margin: 12px 0; border: 1px solid #99f6e4; text-align: center; }
        .amount-label { font-size: 11px; color: #666; margin-bottom: 3px; }
        .amount { font-size: 24px; color: #0d9488; font-weight: bold; }
        .status { display: inline-block; padding: 3px 10px; background: #dcfce7; color: #166534; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .footer { text-align: center; margin-top: 15px; padding-top: 12px; border-top: 1px solid #eee; }
        .footer p { color: #666; font-size: 10px; margin-bottom: 4px; }
        .footer .thanks { font-size: 12px; color: #0d9488; font-weight: 600; margin-bottom: 8px; }
        .print-btn { display: block; margin: 15px auto; padding: 10px 25px; background: #0d9488; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
        .print-btn:hover { background: #0f766e; }
        @media print {
            body { padding: 15px; }
            .print-btn { display: none; }
            .section { background: #f8f8f8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .highlight { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">MedConf</div>
        <div class="subtitle">Medical Conference Portal</div>
        <div class="title">Registration Receipt</div>
        <div class="receipt-id">Receipt #${registrationId.slice(-8).toUpperCase()}</div>
    </div>

    <div class="content">
        <div class="section">
            <div class="section-title">Event Details</div>
            <div class="row"><span class="label">Event</span><span class="value">${eventData.title}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${eventData.date}</span></div>
            <div class="row"><span class="label">Time</span><span class="value">${eventData.time}</span></div>
            <div class="row"><span class="label">Venue</span><span class="value">${eventData.location}</span></div>
            ${eventData.cmeCredits ? `<div class="row"><span class="label">CME</span><span class="value">${eventData.cmeCredits} Credits</span></div>` : ''}
        </div>

        <div class="section">
            <div class="section-title">Attendee</div>
            <div class="row"><span class="label">Name</span><span class="value">${formData.title} ${formData.firstName} ${formData.lastName}</span></div>
            <div class="row"><span class="label">Email</span><span class="value">${formData.email}</span></div>
            <div class="row"><span class="label">Phone</span><span class="value">${formData.phone}</span></div>
            <div class="row"><span class="label">Institution</span><span class="value">${formData.institution}</span></div>
            ${formData.designation ? `<div class="row"><span class="label">Designation</span><span class="value">${formData.designation}</span></div>` : ''}
        </div>

        <div class="section full">
            <div class="section-title">Registration</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="row"><span class="label">Registration ID</span><span class="value">${registrationId}</span></div>
                <div class="row"><span class="label">Category</span><span class="value">${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</span></div>
                <div class="row"><span class="label">Date</span><span class="value">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <div class="row"><span class="label">Status</span><span class="status">${totalPrice > 0 ? 'Payment Pending' : 'Confirmed'}</span></div>
            </div>
        </div>
    </div>

    <div class="highlight">
        <div class="amount-label">${totalPrice > 0 ? 'Total Amount Due' : 'Registration Fee'}</div>
        <div class="amount">${totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : 'FREE'}</div>
        ${totalPrice > 0 ? '<p style="font-size:10px;color:#666;margin-top:4px;">Payment details will be shared via email</p>' : ''}
    </div>

    <div class="footer">
        <p class="thanks">Thank you for registering!</p>
        <p>Confirmation sent to ${formData.email} | Queries: ${eventData.contactEmail || 'support@medconf.com'}</p>
        <p style="margin-top: 8px; color: #999;">© ${new Date().getFullYear()} MedConf</p>
    </div>

    <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
</body>
</html>`;

        // Open in new window for print-to-PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(receiptContent);
            printWindow.document.close();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !eventData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-xl font-semibold">{error}</h1>
                <Link href="/events">
                    <Button variant="outline">Back to Events</Button>
                </Link>
            </div>
        );
    }

    if (!eventData) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg gradient-medical flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">MedConf</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button variant="outline" size="sm">
                                    Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Back Navigation */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => isPreviewMode ? window.close() : router.back()}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {isPreviewMode ? "Close Preview" : "Back"}
                        </button>
                        {isPreviewMode && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                Preview Mode
                            </Badge>
                        )}
                    </div>
                    {/* View Details Modal */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                View Event Details
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh]">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{eventData?.title}</DialogTitle>
                                <DialogDescription>
                                    <Badge variant="outline" className="mt-1">{eventData?.type}</Badge>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto pr-4">
                                <div className="space-y-6">
                                    {/* Date, Time, Location */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">{eventData?.date}</p>
                                                <p className="text-sm text-muted-foreground">{eventData?.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">{eventData?.location}</p>
                                                {eventData?.address && (
                                                    <p className="text-sm text-muted-foreground">{eventData.address}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {eventData?.description && (
                                        <div>
                                            <h4 className="font-semibold mb-2">About This Event</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                {eventData.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* What's Included */}
                                    {eventData?.includes && eventData.includes.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">What's Included</h4>
                                            <ul className="space-y-2">
                                                {eventData.includes.map((item, index) => (
                                                    <li key={index} className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Speakers */}
                                    {eventData?.speakers && eventData.speakers.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Speakers</h4>
                                            <div className="space-y-2">
                                                {eventData.speakers.map((speaker, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{speaker.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {[speaker.designation, speaker.institution].filter(Boolean).join(", ")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sponsors */}
                                    {eventData?.sponsors && eventData.sponsors.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Sponsors</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {eventData.sponsors.map((sponsor, index) => (
                                                    <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">{sponsor.name}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {sponsor.tier}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pricing & CME */}
                                    {eventData && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-lg bg-primary/5">
                                                <p className="text-xs text-muted-foreground">Registration Fee</p>
                                                <p className="text-lg font-bold text-primary">
                                                    ₹{(eventData.isEarlyBird && eventData.earlyBirdPrice ? eventData.earlyBirdPrice : eventData.price).toLocaleString()}
                                                </p>
                                                {eventData.isEarlyBird && eventData.earlyBirdPrice && (
                                                    <p className="text-xs text-green-600">Early bird price!</p>
                                                )}
                                            </div>
                                            {(eventData.cmeCredits ?? 0) > 0 && (
                                                <div className="p-3 rounded-lg bg-green-50">
                                                    <p className="text-xs text-muted-foreground">CME Credits</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {eventData.cmeCredits} Credits
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Contact Information */}
                                    {eventData && (eventData.organizer || eventData.contactEmail || eventData.contactPhone) && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Contact Information</h4>
                                            <div className="space-y-2 text-sm">
                                                {eventData.organizer && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>{eventData.organizer}</span>
                                                    </div>
                                                )}
                                                {eventData.contactEmail && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <a href={`mailto:${eventData.contactEmail}`} className="text-primary hover:underline">
                                                            {eventData.contactEmail}
                                                        </a>
                                                    </div>
                                                )}
                                                {eventData.contactPhone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <a href={`tel:${eventData.contactPhone}`}>{eventData.contactPhone}</a>
                                                    </div>
                                                )}
                                                {eventData.website && (
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <a href={eventData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                            Event Website
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Event Summary */}
                    <Card className="mb-8 border-0 shadow-lg animate-fadeIn">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">
                                        Event Registration
                                    </Badge>
                                    <h1 className="text-xl font-bold">{eventData.title}</h1>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            {eventData.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {eventData.location}
                                        </span>
                                        {(eventData.cmeCredits ?? 0) > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Award className="h-4 w-4 text-primary" />
                                                {eventData.cmeCredits} CME Credits
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {totalPrice > 0 && currentStep !== "confirmation" && (
                                    <div className="text-right bg-primary/5 px-4 py-3 rounded-xl">
                                        <p className="text-xs text-muted-foreground">Total Amount</p>
                                        <p className="text-2xl font-bold text-primary">
                                            ₹{totalPrice.toLocaleString()}
                                        </p>
                                        {additionalCosts.total > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                (includes ₹{additionalCosts.total.toLocaleString()} add-ons)
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Steps */}
                    <div className="mb-8 animate-fadeIn stagger-1">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isActive = currentStepIndex === index;
                                const isCompleted = currentStepIndex > index;
                                return (
                                    <React.Fragment key={step.key}>
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
                                                    isCompleted
                                                        ? "bg-green-500 text-white"
                                                        : isActive
                                                        ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                                                        : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5" />
                                                ) : (
                                                    <StepIcon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-xs mt-2 hidden sm:block",
                                                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                                                )}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={cn(
                                                    "flex-1 h-1 mx-2 rounded-full transition-colors",
                                                    isCompleted ? "bg-green-500" : "bg-muted"
                                                )}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="animate-fadeIn stagger-2">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Step 1: Personal Details */}
                        {currentStep === "details" && (
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Your Details
                                    </CardTitle>
                                    <CardDescription>
                                        Please provide your information for registration and certificate
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Registration Category Selection */}
                                    {eventData.pricingCategories && eventData.pricingCategories.length > 0 && (
                                        <>
                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold">Registration Category *</Label>
                                                <p className="text-sm text-muted-foreground">Select your registration category based on your professional status</p>
                                                <div className="grid gap-3">
                                                    {eventData.pricingCategories.map((category) => {
                                                        const isEarlyBird = category.earlyBirdPrice && category.earlyBirdDeadline &&
                                                            new Date() <= new Date(category.earlyBirdDeadline);
                                                        const displayPrice = isEarlyBird ? Number(category.earlyBirdPrice) : Number(category.price);

                                                        return (
                                                            <div
                                                                key={category.id}
                                                                className={cn(
                                                                    "relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                                    selectedCategory === category.id
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-border hover:border-primary/50"
                                                                )}
                                                                onClick={() => setSelectedCategory(category.id)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                                        selectedCategory === category.id
                                                                            ? "border-primary"
                                                                            : "border-muted-foreground"
                                                                    )}>
                                                                        {selectedCategory === category.id && (
                                                                            <div className="w-3 h-3 rounded-full bg-primary" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">{category.name}</p>
                                                                        {category.description && (
                                                                            <p className="text-sm text-muted-foreground">{category.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-primary text-lg">
                                                                        {displayPrice > 0 ? `₹${displayPrice.toLocaleString()}` : "Free"}
                                                                    </p>
                                                                    {isEarlyBird && (
                                                                        <p className="text-xs text-green-600">Early bird</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="h-px bg-border" />
                                        </>
                                    )}

                                    {/* Name */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Select
                                                value={formData.title}
                                                onValueChange={(v) => handleInputChange("title", v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dr">Dr.</SelectItem>
                                                    <SelectItem value="mr">Mr.</SelectItem>
                                                    <SelectItem value="ms">Ms.</SelectItem>
                                                    <SelectItem value="prof">Prof.</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>First Name *</Label>
                                            <Input
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                placeholder="John"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name *</Label>
                                            <Input
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                placeholder="Smith"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-border" />

                                    {/* Contact */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Email Address *</Label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange("email", e.target.value)}
                                                placeholder="john.smith@hospital.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number *</Label>
                                            <Input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-border" />

                                    {/* Professional */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Institution/Hospital *</Label>
                                            <Input
                                                value={formData.institution}
                                                onChange={(e) => handleInputChange("institution", e.target.value)}
                                                placeholder="AIIMS, New Delhi"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Designation</Label>
                                            <Input
                                                value={formData.designation}
                                                onChange={(e) => handleInputChange("designation", e.target.value)}
                                                placeholder="Senior Resident"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                                placeholder="New Delhi"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input
                                                value={formData.state}
                                                onChange={(e) => handleInputChange("state", e.target.value)}
                                                placeholder="Delhi"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Medical Council Registration Number</Label>
                                        <Input
                                            value={formData.medicalCouncilNumber}
                                            onChange={(e) => handleInputChange("medicalCouncilNumber", e.target.value)}
                                            placeholder="MCI/DMC Registration Number"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Required for CME credit certificate
                                        </p>
                                    </div>

                                    <div className="h-px bg-border" />

                                    {/* Terms */}
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="terms"
                                                checked={formData.agreeTerms}
                                                onCheckedChange={(checked) =>
                                                    handleInputChange("agreeTerms", checked as boolean)
                                                }
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                                                    I agree to the terms and conditions *
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    By registering, you agree to our cancellation and refund policy
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="updates"
                                                checked={formData.agreeUpdates}
                                                onCheckedChange={(checked) =>
                                                    handleInputChange("agreeUpdates", checked as boolean)
                                                }
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor="updates" className="text-sm font-medium cursor-pointer">
                                                    Keep me updated about future events
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleNextStep}
                                            disabled={!canProceedFromDetails}
                                            className="gap-2 gradient-medical text-white"
                                            size="lg"
                                        >
                                            Continue to Payment
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Payment */}
                        {currentStep === "payment" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <Card className="border-0 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-primary" />
                                                Payment
                                            </CardTitle>
                                            <CardDescription>
                                                Complete your registration by making payment
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {totalPrice > 0 ? (
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                                                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-amber-800">Payment Required</p>
                                                            <p className="text-xs text-amber-700">
                                                                Click below to confirm your registration. Payment details will be shared via email after registration. Your spot is reserved once payment is completed.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-green-800">Free Registration</p>
                                                        <p className="text-xs text-green-700">
                                                            This event is free. Click below to confirm your registration.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between pt-4">
                                                <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                                                    <ArrowLeft className="h-4 w-4" />
                                                    Back
                                                </Button>
                                                <Button
                                                    onClick={handlePayment}
                                                    disabled={isSubmitting}
                                                    className="gap-2 gradient-medical text-white"
                                                    size="lg"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : totalPrice > 0 ? (
                                                        <>
                                                            Register — ₹{totalPrice.toLocaleString()}
                                                            <ArrowRight className="h-4 w-4" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            Confirm Registration
                                                            <ArrowRight className="h-4 w-4" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Order Summary */}
                                <div>
                                    <Card className="border-0 shadow-lg sticky top-24">
                                        <CardHeader>
                                            <CardTitle className="text-base">Order Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Registration Fee</span>
                                                    <span>₹{eventData.price.toLocaleString()}</span>
                                                </div>
                                                {eventData.isEarlyBird && eventData.earlyBirdPrice && (
                                                    <div className="flex justify-between text-sm text-green-600">
                                                        <span>Early Bird Discount</span>
                                                        <span>
                                                            -₹{(eventData.price - eventData.earlyBirdPrice).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                            </div>

                                            <div className="h-px bg-border" />

                                            <div className="flex justify-between font-bold text-lg">
                                                <span>Total</span>
                                                <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
                                            </div>

                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Confirmation */}
                        {currentStep === "confirmation" && (
                            <Card className="text-center border-0 shadow-lg">
                                <CardContent className="pt-12 pb-8">
                                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
                                    <p className="text-muted-foreground mb-6">
                                        Thank you for registering for {eventData.title}
                                    </p>

                                    <div className="max-w-md mx-auto space-y-4 text-left mb-8">
                                        <div className="p-4 rounded-xl bg-muted/50">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Registration ID</p>
                                                    <p className="font-mono font-bold">{registrationId || "Pending"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{totalPrice > 0 ? "Amount Due" : "Fee"}</p>
                                                    <p className="font-bold text-primary">
                                                        {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : "FREE"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Name</p>
                                                    <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                                                </div>
                                                {(eventData.cmeCredits ?? 0) > 0 && (
                                                    <div>
                                                        <p className="text-muted-foreground">CME Credits</p>
                                                        <p className="font-medium">{eventData.cmeCredits} Credits</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {totalPrice > 0 && (
                                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                                <p className="text-sm text-amber-700">
                                                    <AlertCircle className="h-4 w-4 inline mr-2" />
                                                    Your registration is confirmed. Payment details will be shared to {formData.email}. Your spot is reserved once payment is completed.
                                                </p>
                                            </div>
                                        )}

                                        {totalPrice === 0 && (
                                            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                                                <p className="text-sm text-green-700">
                                                    <CheckCircle2 className="h-4 w-4 inline mr-2" />
                                                    Your registration is confirmed! Details have been sent to {formData.email}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button variant="outline" className="gap-2" onClick={handleDownloadReceipt}>
                                            <Download className="h-4 w-4" />
                                            Download Receipt
                                        </Button>
                                        <Link href="/events">
                                            <Button className="gap-2 gradient-medical text-white">
                                                Browse More Events
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/30 mt-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg gradient-medical flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold">MedConf</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2025 MedConf. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
