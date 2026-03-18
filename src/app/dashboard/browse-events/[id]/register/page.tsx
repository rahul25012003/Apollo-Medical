"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Calendar,
    Clock,
    MapPin,
    Award,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    User,
    Mail,
    Phone,
    Building2,
    CreditCard,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { format } from "date-fns";
import { registrationsService } from "@/services/registrations";

interface PricingCategory {
    id: string;
    name: string;
    description: string | null;
    totalSlots: number;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
}

interface EventDetails {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    city: string | null;
    type: string;
    capacity: number;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    cmeCredits: number | null;
    pricingCategories?: PricingCategory[];
    _count?: {
        registrations: number;
    };
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    organization: string;
    designation: string;
    agreeTerms: boolean;
}

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registrationData, setRegistrationData] = useState<{
        id: string;
        event: EventDetails;
        category?: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [form, setForm] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        organization: "",
        designation: "",
        agreeTerms: false,
    });

    // Pre-fill form with session data
    useEffect(() => {
        if (session?.user) {
            setForm((prev) => ({
                ...prev,
                name: session.user.name || "",
                email: session.user.email || "",
            }));
        }
    }, [session]);

    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);
                // Check if already registered
                const regsRes = await fetch("/api/users/me/registrations");
                const regsData = await regsRes.json();
                if (regsData.success && Array.isArray(regsData.data)) {
                    const alreadyRegistered = regsData.data.some((r: { event?: { id: string } }) => r.event?.id === params.id);
                    if (alreadyRegistered) {
                        setSuccess(true);
                        setLoading(false);
                        return;
                    }
                }

                const response = await fetch(`/api/events/public/${params.id}`);
                const data = await response.json();
                if (data.success && data.data) {
                    setEvent(data.data);
                    if (data.data.pricingCategories?.length > 0) {
                        setSelectedCategory(data.data.pricingCategories[0].id);
                    }
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

        if (params.id) {
            fetchEvent();
        }
    }, [params.id]);

    // Helper function to get price for selected category
    const getSelectedPrice = () => {
        if (!event) return 0;

        // If there are pricing categories, use the selected one
        if (event.pricingCategories && event.pricingCategories.length > 0) {
            const category = event.pricingCategories.find(c => c.id === selectedCategory);
            if (category) {
                const isEarlyBird = category.earlyBirdPrice && category.earlyBirdDeadline &&
                    new Date() <= new Date(category.earlyBirdDeadline);
                const price = isEarlyBird ? Number(category.earlyBirdPrice) : Number(category.price);
                return isNaN(price) ? 0 : price;
            }
        }

        // Fallback to event-level pricing
        const isEarlyBird = event.earlyBirdPrice && event.earlyBirdDeadline &&
            new Date() <= new Date(event.earlyBirdDeadline);
        const price = isEarlyBird ? Number(event.earlyBirdPrice) : Number(event.price);
        return isNaN(price) ? 0 : price;
    };

    const getSelectedCategoryName = () => {
        if (!event?.pricingCategories || !selectedCategory) return null;
        return event.pricingCategories.find(c => c.id === selectedCategory)?.name;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        if (!form.agreeTerms) {
            setError("Please agree to the terms and conditions");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const amount = getSelectedPrice();
            const categoryName = getSelectedCategoryName();
            const response = await registrationsService.create({
                eventId: event.id,
                name: form.name,
                email: form.email,
                phone: form.phone || undefined,
                organization: form.organization || undefined,
                designation: form.designation || undefined,
                category: categoryName || undefined,
                amount: amount,
            });

            if (response.success && response.data) {
                setSuccess(true);
                setRegistrationData({
                    id: response.data.id,
                    event: event,
                    category: categoryName || undefined,
                });
            } else {
                // Show specific error from API (e.g. "already registered", "registration closed", etc.)
                const errorMessage =
                    response.error?.message ||
                    "Registration failed. Please try again.";
                setError(errorMessage);
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadReceipt = () => {
        if (!registrationData) return;

        const receiptPrice = getSelectedPrice();
        const receiptContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Registration Receipt - ${registrationData.event.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #0d9488; font-size: 20px; margin-bottom: 5px; }
        .success-badge { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; display: inline-block; font-size: 11px; font-weight: 600; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { padding: 8px; background: #f9fafb; border-radius: 6px; }
        .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
        .info-value { font-weight: 500; color: #111827; }
        .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10px; }
        @media print { body { padding: 10px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>CareNS - Registration Receipt</h1>
        <span class="success-badge">${receiptPrice > 0 ? '⏳ Registration Submitted — Payment Pending' : '✓ Registration Confirmed'}</span>
    </div>
    <div class="section">
        <div class="section-title">Registration Details</div>
        <div class="grid">
            <div class="info-item"><div class="info-label">Registration ID</div><div class="info-value">${registrationData.id}</div></div>
            <div class="info-item"><div class="info-label">Registration Date</div><div class="info-value">${format(new Date(), "MMM d, yyyy")}</div></div>
        </div>
    </div>
    <div class="section">
        <div class="section-title">Event Information</div>
        <div class="grid">
            <div class="info-item" style="grid-column: span 2;"><div class="info-label">Event Name</div><div class="info-value">${registrationData.event.title}</div></div>
            <div class="info-item"><div class="info-label">Date</div><div class="info-value">${format(new Date(registrationData.event.startDate), "MMM d, yyyy")}</div></div>
            <div class="info-item"><div class="info-label">Time</div><div class="info-value">${registrationData.event.startTime || "TBA"}</div></div>
            <div class="info-item" style="grid-column: span 2;"><div class="info-label">Venue</div><div class="info-value">${registrationData.event.location || registrationData.event.city || "TBA"}</div></div>
        </div>
    </div>
    <div class="section">
        <div class="section-title">Attendee Information</div>
        <div class="grid">
            <div class="info-item"><div class="info-label">Name</div><div class="info-value">${form.name}</div></div>
            <div class="info-item"><div class="info-label">Email</div><div class="info-value">${form.email}</div></div>
            <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${form.phone || "N/A"}</div></div>
            <div class="info-item"><div class="info-label">Organization</div><div class="info-value">${form.organization || "N/A"}</div></div>
        </div>
    </div>
    <div class="footer">
        <p>Thank you for registering! This receipt serves as confirmation of your registration.</p>
        <p style="margin-top: 5px;">© ${new Date().getFullYear()} CareNS - Conference Management System</p>
    </div>
</body>
</html>`;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(receiptContent);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Register" subtitle="Loading...">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    if (error && !event) {
        return (
            <DashboardLayout title="Register" subtitle="Event not found">
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{error}</h3>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (success && registrationData) {
        const successPrice = getSelectedPrice();
        return (
            <DashboardLayout title="Registration Successful" subtitle="You're all set!">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-background rounded-xl border p-8 text-center">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
                            successPrice > 0 ? "bg-amber-100" : "bg-green-100"
                        )}>
                            <CheckCircle2 className={cn(
                                "w-8 h-8",
                                successPrice > 0 ? "text-amber-600" : "text-green-600"
                            )} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            {successPrice > 0 ? "Registration Submitted!" : "Registration Confirmed!"}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {successPrice > 0
                                ? `You have registered for ${registrationData.event.title}. Payment details will be shared via email.`
                                : `You have successfully registered for ${registrationData.event.title}`
                            }
                        </p>

                        <div className="bg-muted/50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-muted-foreground">Registration ID</p>
                            <p className="text-xl font-mono font-bold">{registrationData.id}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 text-left mb-6">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Calendar className="w-4 h-4" />
                                    Date
                                </div>
                                <p className="font-medium">
                                    {format(new Date(registrationData.event.startDate), "MMMM d, yyyy")}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Clock className="w-4 h-4" />
                                    Time
                                </div>
                                <p className="font-medium">{registrationData.event.startTime || "TBA"}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={handleDownloadReceipt} variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Download Receipt
                            </Button>
                            <Link href="/dashboard/my-registrations">
                                <Button className="gap-2 w-full sm:w-auto">
                                    View My Registrations
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!event) return null;

    const eventPrice = getSelectedPrice();
    const hasPricingCategories = event.pricingCategories && event.pricingCategories.length > 0;

    return (
        <DashboardLayout title="Register" subtitle={event.title}>
            <div className="space-y-6">
                {/* Back Button */}
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Event
                </Button>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Registration Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-background rounded-xl border p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-1">Personal Information</h2>
                                <p className="text-sm text-muted-foreground">
                                    Please fill in your details to complete registration
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleInputChange}
                                            placeholder="Enter your phone number"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="organization">Organization</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="organization"
                                            name="organization"
                                            value={form.organization}
                                            onChange={handleInputChange}
                                            placeholder="Hospital/Institution"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input
                                        id="designation"
                                        name="designation"
                                        value={form.designation}
                                        onChange={handleInputChange}
                                        placeholder="Your role/designation"
                                    />
                                </div>
                            </div>

                            {/* Registration Category Selection */}
                            {hasPricingCategories && (
                                <div className="space-y-3">
                                    <Label>Registration Category *</Label>
                                    <div className="grid gap-3">
                                        {event.pricingCategories!.map((category) => {
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
                                                        <p className="font-bold text-primary">
                                                            {displayPrice > 0 ? `₹${displayPrice.toLocaleString()}` : "Free"}
                                                        </p>
                                                        {/* Early bird hidden */}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="agreeTerms"
                                    checked={form.agreeTerms}
                                    onCheckedChange={(checked) =>
                                        setForm((prev) => ({ ...prev, agreeTerms: checked === true }))
                                    }
                                />
                                <div className="grid gap-1 leading-none">
                                    <label htmlFor="agreeTerms" className="text-sm font-medium cursor-pointer">
                                        I agree to the terms and conditions *
                                    </label>
                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                        <p>Registration is subject to organizer approval and availability. Contact details may be used for event communications. Fees are non-refundable unless stated otherwise.</p>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Complete Registration
                                        {eventPrice > 0 && ` - ₹${eventPrice.toLocaleString()}`}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-background rounded-xl border p-6 sticky top-6">
                            <h3 className="font-semibold mb-4">Order Summary</h3>

                            <div className="space-y-4">
                                <div>
                                    <Badge variant="secondary" className="mb-2">{event.type}</Badge>
                                    <h4 className="font-medium line-clamp-2">{event.title}</h4>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(event.startDate), "MMM d, yyyy")}
                                    </div>
                                    {event.startTime && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {event.startTime}
                                        </div>
                                    )}
                                    {event.city && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {event.city}
                                        </div>
                                    )}
                                </div>

                                {event.cmeCredits && event.cmeCredits > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 p-2 rounded-lg">
                                        <Award className="w-4 h-4" />
                                        {event.cmeCredits} CME Credits
                                    </div>
                                )}

                                <div className="border-t pt-4 mt-4">
                                    {hasPricingCategories && selectedCategory && (
                                        <div className="flex justify-between items-center mb-2 text-sm">
                                            <span className="text-muted-foreground">Category</span>
                                            <span className="font-medium">{getSelectedCategoryName()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Registration Fee</span>
                                        <span className="text-xl font-bold text-primary">
                                            {eventPrice > 0 ? `₹${eventPrice.toLocaleString()}` : "Free"}
                                        </span>
                                    </div>
                                    {/* Early bird hidden */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
