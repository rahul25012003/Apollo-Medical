"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Mail,
    Phone,
    Eye,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    CreditCard,
    Receipt,
    Users,
    IndianRupee,
    FileText,
    RefreshCw,
    Ban,
    Plus,
    ArrowLeft,
    Building2,
    Loader2,
    X,
    UserPlus,
    UserCheck,
    Globe,
    Gift,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { registrationsService, Registration } from "@/services/registrations";
import { eventsService, Event } from "@/services/events";
import { certificatesService } from "@/services/certificates";
import { useConfirmDialog, useAlertDialog } from "@/components/ui/confirm-dialog";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

// Main page wrapper with Suspense for useSearchParams
export default function RegistrationsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout title="Registrations" subtitle="Manage event registrations">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        }>
            <RegistrationsContent />
        </Suspense>
    );
}

function RegistrationsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const eventIdParam = searchParams.get("event");
    const actionParam = searchParams.get("action");
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();

    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("all");
    const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(actionParam === "add");
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEventFilter, setSelectedEventFilter] = useState(eventIdParam || "all");
    const [selectedPaymentFilter, setSelectedPaymentFilter] = useState("all");
    const [selectedSourceFilter, setSelectedSourceFilter] = useState("all");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    // Custom dialog hooks
    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { alert, AlertDialog } = useAlertDialog();

    // Form state for adding registration
    const [formData, setFormData] = useState({
        eventId: eventIdParam || "",
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
    const [submitting, setSubmitting] = useState(false);

    // Certificate generation dialog state
    const [certDialogOpen, setCertDialogOpen] = useState(false);
    const [certDialogReg, setCertDialogReg] = useState<Registration | null>(null);
    const [certDialogEvent, setCertDialogEvent] = useState<Event | null>(null);
    const [certGenerating, setCertGenerating] = useState(false);

    // Check for pending certificate generation on mount (after returning from event edit)
    useEffect(() => {
        const pendingCertRegId = sessionStorage.getItem("pendingCertificateRegId");
        if (pendingCertRegId) {
            sessionStorage.removeItem("pendingCertificateRegId");
            // We'll restore the dialog after registrations and events are loaded
            const checkAndRestore = () => {
                if (registrations.length > 0 && events.length > 0) {
                    const reg = registrations.find(r => r.id === pendingCertRegId);
                    if (reg) {
                        const event = events.find(e => e.id === reg.eventId);
                        if (event) {
                            setCertDialogReg(reg);
                            setCertDialogEvent(event);
                            setCertDialogOpen(true);
                        }
                    }
                }
            };
            // Small delay to ensure data is loaded
            setTimeout(checkAndRestore, 100);
        }
    }, [registrations, events]);

    // Fetch events and registrations
    useEffect(() => {
        if (sessionLoading) return;
        async function fetchData() {
            try {
                setLoading(true);
                const [eventsRes, regsRes] = await Promise.all([
                    eventsService.getAll({ ...tenantFilterParams }),
                    registrationsService.getAll({ ...(eventIdParam ? { eventId: eventIdParam } : {}), ...tenantFilterParams }),
                ]);

                if (eventsRes.success && eventsRes.data) {
                    const eventsList = Array.isArray(eventsRes.data) ? eventsRes.data : [];
                    setEvents(eventsList);

                    // Set selected event if coming from event page
                    if (eventIdParam) {
                        const event = eventsList.find((e: Event) => e.id === eventIdParam);
                        if (event) {
                            setSelectedEvent(event);
                            setFormData((prev) => ({
                                ...prev,
                                eventId: event.id,
                                amount: Number(event.price) || 0,
                            }));
                        }
                    }
                }

                if (regsRes.success && regsRes.data) {
                    setRegistrations(Array.isArray(regsRes.data) ? regsRes.data : []);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [sessionLoading, eventIdParam, effectiveTenantId]);

    // Filter registrations
    const filteredRegistrations = registrations.filter((reg) => {
        const matchesSearch =
            searchQuery === "" ||
            reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesEvent = selectedEventFilter === "all" || reg.eventId === selectedEventFilter;

        const matchesTab =
            selectedTab === "all" ||
            reg.status.toLowerCase() === selectedTab;

        const matchesPayment =
            selectedPaymentFilter === "all" ||
            (selectedPaymentFilter === "paid" && reg.paymentStatus === "PAID") ||
            (selectedPaymentFilter === "unpaid" && reg.paymentStatus === "PENDING") ||
            (selectedPaymentFilter === "free" && reg.paymentStatus === "FREE");

        const matchesSource =
            selectedSourceFilter === "all" ||
            (selectedSourceFilter === "admin" && !!reg.registeredById) ||
            (selectedSourceFilter === "self" && !reg.registeredById);

        return matchesSearch && matchesEvent && matchesTab && matchesPayment && matchesSource;
    });

    // Stats
    const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
    const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
    const waitlistCount = registrations.filter((r) => r.status === "WAITLIST").length;
    const totalRevenue = registrations
        .filter((r) => r.paymentStatus === "PAID")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Format revenue with Indian numbering (K, L, Cr)
    const formatRevenue = (amount: number): string => {
        if (!amount || !isFinite(amount)) return "₹0";
        const num = Math.abs(amount);
        if (num >= 10000000) {
            return `₹${(num / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
        } else if (num >= 100000) {
            return `₹${(num / 100000).toFixed(1).replace(/\.0$/, "")}L`;
        } else if (num >= 1000) {
            return `₹${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
        }
        return `₹${Math.round(num)}`;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { class: string; icon: React.ElementType; label: string }> = {
            CONFIRMED: { class: "bg-green-50 text-green-700", icon: CheckCircle2, label: "Confirmed" },
            PENDING: { class: "bg-amber-50 text-amber-700", icon: Clock, label: "Pending" },
            WAITLIST: { class: "bg-blue-50 text-blue-700", icon: Users, label: "Waitlist" },
            ATTENDED: { class: "bg-purple-50 text-purple-700", icon: CheckCircle2, label: "Attended" },
            CANCELLED: { class: "bg-red-50 text-red-700", icon: XCircle, label: "Cancelled" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={cn("gap-1 border-0", config.class)}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getPaymentBadge = (status: string, amount: number) => {
        const paymentConfig: Record<string, { class: string; label: string; icon?: React.ElementType }> = {
            PAID: { class: "bg-green-50 text-green-700", label: "Paid", icon: CheckCircle2 },
            PENDING: { class: "bg-amber-50 text-amber-700", label: "Unpaid", icon: Clock },
            FREE: { class: "bg-blue-50 text-blue-700", label: "Free" },
            REFUNDED: { class: "bg-gray-100 text-gray-600", label: "Refunded" },
            FAILED: { class: "bg-red-50 text-red-700", label: "Failed", icon: XCircle },
        };
        const config = paymentConfig[status] || paymentConfig.PENDING;
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={cn("text-xs border-0 gap-1", config.class)}>
                {Icon && <Icon className="h-3 w-3" />}
                {config.label}
            </Badge>
        );
    };

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRegistrationSourceBadge = (reg: Registration) => {
        const isAdminRegistered = !!reg.registeredById;
        if (isAdminRegistered) {
            return (
                <Badge
                    variant="outline"
                    className="gap-1 border-0 bg-violet-50 text-violet-700"
                    title={`Registered by ${reg.registeredBy?.name || reg.registeredBy?.email || "Admin"}`}
                >
                    <UserCheck className="h-3 w-3" />
                    Admin
                </Badge>
            );
        }
        return (
            <Badge
                variant="outline"
                className="gap-1 border-0 bg-cyan-50 text-cyan-700"
                title="Self-registered via public form"
            >
                <Globe className="h-3 w-3" />
                Self
            </Badge>
        );
    };

    const toggleRegistration = (id: string) => {
        setSelectedRegistrations((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRegistrations.length === filteredRegistrations.length) {
            setSelectedRegistrations([]);
        } else {
            setSelectedRegistrations(filteredRegistrations.map((r) => r.id));
        }
    };

    // Handle event selection in form
    const handleEventChange = (eventId: string) => {
        const event = events.find((e) => e.id === eventId);
        setFormData((prev) => ({
            ...prev,
            eventId,
            amount: Number(event?.price) || 0,
        }));
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!formData.eventId || !formData.name || !formData.email) {
            return;
        }

        try {
            setSubmitting(true);
            const response = await registrationsService.createAdmin({
                eventId: formData.eventId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                organization: formData.organization || undefined,
                designation: formData.designation || undefined,
                category: formData.category || undefined,
                amount: Number(formData.amount) || 0,
                notes: formData.notes || undefined,
                specialRequests: formData.specialRequests || undefined,
            });

            if (response.success) {
                // Refresh registrations
                const regsRes = await registrationsService.getAll(
                    eventIdParam ? { eventId: eventIdParam } : {}
                );
                if (regsRes.success && regsRes.data) {
                    setRegistrations(Array.isArray(regsRes.data) ? regsRes.data : []);
                }
                setIsAddOpen(false);
                // Reset form
                setFormData({
                    eventId: eventIdParam || "",
                    name: "",
                    email: "",
                    phone: "",
                    organization: "",
                    designation: "",
                    category: "",
                    amount: Number(selectedEvent?.price) || 0,
                    notes: "",
                    specialRequests: "",
                });
            }
        } catch (error) {
            console.error("Failed to create registration:", error);
        } finally {
            setSubmitting(false);
        }
    };

    // State for action in progress
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    // Refresh registrations helper
    const refreshRegistrations = async () => {
        const regsRes = await registrationsService.getAll(
            eventIdParam ? { eventId: eventIdParam } : {}
        );
        if (regsRes.success && regsRes.data) {
            setRegistrations(Array.isArray(regsRes.data) ? regsRes.data : []);
        }
    };

    // Handle confirm registration (PENDING -> CONFIRMED)
    const handleConfirmRegistration = async (regId: string) => {
        try {
            setActionInProgress(regId);
            const response = await registrationsService.confirm(regId);
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to confirm registration:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle move to confirmed (WAITLIST -> CONFIRMED)
    const handleMoveToConfirmed = async (regId: string) => {
        try {
            setActionInProgress(regId);
            const response = await registrationsService.confirm(regId);
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to move to confirmed:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle mark as paid
    const handleMarkAsPaid = async (regId: string) => {
        try {
            setActionInProgress(regId);
            const response = await registrationsService.markPaid(regId);
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to mark as paid:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle mark as free
    const handleMarkAsFree = async (regId: string) => {
        try {
            setActionInProgress(regId);
            const response = await registrationsService.update(regId, {
                paymentStatus: "FREE",
                amount: 0,
            });
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to mark as free:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle mark as attended
    const handleMarkAsAttended = async (regId: string) => {
        try {
            setActionInProgress(regId);
            const response = await registrationsService.update(regId, {
                status: "ATTENDED",
            });
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to mark as attended:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle cancel registration
    const handleCancelRegistration = async (regId: string) => {
        try {
            setActionInProgress(regId);
            const response = await registrationsService.cancel(regId);
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to cancel registration:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle generate certificate - show dialog first
    const handleGenerateCertificate = async (reg: Registration) => {
        // Find the event for this registration
        const event = events.find(e => e.id === reg.eventId);

        if (!event) {
            alert({
                title: "Error",
                description: "Event not found for this registration.",
                variant: "error",
            });
            return;
        }

        // Check if registration is attended
        if (reg.status !== "ATTENDED") {
            alert({
                title: "Cannot Generate Certificate",
                description: "Certificates can only be generated for registrations with 'Attended' status. Please update the registration status first.",
                variant: "warning",
            });
            return;
        }

        // Check if certificate already exists
        if (reg.certificate) {
            alert({
                title: "Certificate Already Exists",
                description: "A certificate has already been generated for this registration. Use 'Regenerate' to create a new one.",
                variant: "warning",
            });
            return;
        }

        // Show dialog with event signatory info
        setCertDialogReg(reg);
        setCertDialogEvent(event);
        setCertDialogOpen(true);
    };

    // Navigate to edit event signatories (saves state to return)
    const handleEditEventSignatories = () => {
        if (certDialogReg && certDialogEvent) {
            // Save the registration ID to restore dialog when returning
            sessionStorage.setItem("pendingCertificateRegId", certDialogReg.id);
            // Navigate to event edit page (settings tab has signatories)
            router.push(`/dashboard/events/${certDialogEvent.id}/edit`);
        }
    };

    // Actually generate the certificate after confirmation
    const confirmGenerateCertificate = async () => {
        if (!certDialogReg || !certDialogEvent) return;

        try {
            setCertGenerating(true);

            // Create certificate for this registration
            const response = await certificatesService.create({
                registrationId: certDialogReg.id,
                eventId: certDialogReg.eventId,
                recipientName: certDialogReg.name,
                recipientEmail: certDialogReg.email,
                status: "ISSUED",
            });

            if (response.success && response.data) {
                // Close dialog
                setCertDialogOpen(false);
                setCertDialogReg(null);
                setCertDialogEvent(null);
                // Refresh registrations to update certificate status
                await refreshRegistrations();
                // Open the certificate view in a new tab
                window.open(`/dashboard/certificates/${response.data.id}/view`, "_blank");
            } else {
                // Show detailed error message
                let errorMessage = "Failed to generate certificate";
                if (typeof response.error === 'string') {
                    errorMessage = response.error;
                } else if (response.error) {
                    if (response.error.details && Array.isArray(response.error.details)) {
                        const fieldErrors = response.error.details
                            .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
                            .join(", ");
                        errorMessage = `${response.error.message}: ${fieldErrors}`;
                    } else {
                        errorMessage = response.error.message || "Failed to generate certificate";
                    }
                }

                alert({
                    title: "Error",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to generate certificate:", error);
            alert({
                title: "Error",
                description: "Failed to generate certificate. Please try again.",
                variant: "error",
            });
        } finally {
            setCertGenerating(false);
        }
    };

    // Handle view/download certificate
    const handleViewCertificate = (reg: Registration) => {
        if (reg.certificate?.id) {
            window.open(`/dashboard/certificates/${reg.certificate.id}/view`, "_blank");
        }
    };

    // Handle regenerate certificate
    const handleRegenerateCertificate = async (reg: Registration) => {
        if (!reg.certificate?.id) return;

        const confirmed = await confirm({
            title: "Regenerate Certificate",
            description: "Are you sure you want to regenerate this certificate? The old certificate will be deleted and a new one will be created.",
            confirmText: "Regenerate",
            cancelText: "Cancel",
            variant: "warning",
        });

        if (!confirmed) return;

        try {
            setActionInProgress(reg.id);

            // Use atomic regenerate endpoint
            const response = await certificatesService.regenerate(reg.certificate.id);

            if (response.success && response.data) {
                // Refresh registrations to update certificate status
                await refreshRegistrations();
                // Open the new certificate view in a new tab
                window.open(`/dashboard/certificates/${response.data.id}/view`, "_blank");
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to regenerate certificate";
                alert({
                    title: "Error",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to regenerate certificate:", error);
            alert({
                title: "Error",
                description: "Failed to regenerate certificate. Please try again.",
                variant: "error",
            });
        } finally {
            setActionInProgress(null);
        }
    };

    // Loading state
    if (loading) {
        return (
            <DashboardLayout title="Registrations" subtitle="Manage event registrations">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Registrations" subtitle="Manage event registrations and attendees">
            <div className="space-y-6 animate-fadeIn">
                {/* Back Button when coming from event */}
                {eventIdParam && selectedEvent && (
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to {selectedEvent.title}
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-teal h-10 w-10 sm:h-12 sm:w-12">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">{registrations.length}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-green h-10 w-10 sm:h-12 sm:w-12">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">{confirmedCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Confirmed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-orange h-10 w-10 sm:h-12 sm:w-12">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">{pendingCount + waitlistCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-purple h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                                    <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold truncate">{formatRevenue(totalRevenue)}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col gap-3">
                    {/* Search Row */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-10 pr-10 h-9 sm:h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {!eventIdParam && (
                            <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
                                <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10">
                                    <SelectValue placeholder="All Events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={selectedPaymentFilter} onValueChange={setSelectedPaymentFilter}>
                            <SelectTrigger className="w-full sm:w-[120px] h-9 sm:h-10">
                                <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payments</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedSourceFilter} onValueChange={setSelectedSourceFilter}>
                            <SelectTrigger className="w-full sm:w-[120px] h-9 sm:h-10">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="self">Self</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="gap-2 gradient-medical text-white hover:opacity-90"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Registration</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{filteredRegistrations.length} of {registrations.length} registrations</span>
                            {(selectedPaymentFilter !== "all" || selectedSourceFilter !== "all" || selectedEventFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                        setSelectedPaymentFilter("all");
                                        setSelectedSourceFilter("all");
                                        setSelectedEventFilter("all");
                                    }}
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Clear filters
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {selectedRegistrations.length > 0 && (
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span className="hidden sm:inline">Email</span> ({selectedRegistrations.length})
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Add Registration Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Registration</DialogTitle>
                            <DialogDescription>
                                Register an attendee on behalf of a user
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Event Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="event">Event *</Label>
                                <Select
                                    value={formData.eventId}
                                    onValueChange={handleEventChange}
                                    disabled={!!eventIdParam}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map((event) => (
                                            <SelectItem key={event.id} value={event.id}>
                                                {event.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formData.eventId && (
                                    <p className="text-xs text-muted-foreground">
                                        Registration fee: ₹{formData.amount.toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="section-divider-gradient my-2" />

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Dr. John Smith"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@hospital.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
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
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input
                                        id="designation"
                                        placeholder="Professor"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="organization">Organization</Label>
                                    <Input
                                        id="organization"
                                        placeholder="Medical College"
                                        value={formData.organization}
                                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
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
                                    <Label htmlFor="amount">Amount (₹)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Internal)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any internal notes about this registration..."
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialRequests">Special Requests</Label>
                                <Textarea
                                    id="specialRequests"
                                    placeholder="Dietary requirements, accessibility needs, etc."
                                    rows={2}
                                    value={formData.specialRequests}
                                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !formData.eventId || !formData.name || !formData.email}
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

                {/* View Registration Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="max-w-2xl">
                        {selectedReg && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Registration Details</DialogTitle>
                                    <DialogDescription>
                                        ID: {selectedReg.id.slice(0, 8)}...
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    {/* Attendee Info */}
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                                {getInitials(selectedReg.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold">{selectedReg.name}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-4 w-4" />
                                                    {selectedReg.email}
                                                </span>
                                                {selectedReg.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-4 w-4" />
                                                        {selectedReg.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {(selectedReg.designation || selectedReg.organization) && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                    <Building2 className="h-4 w-4" />
                                                    {selectedReg.designation}
                                                    {selectedReg.designation && selectedReg.organization && " at "}
                                                    {selectedReg.organization}
                                                </div>
                                            )}
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {getStatusBadge(selectedReg.status)}
                                                {getRegistrationSourceBadge(selectedReg)}
                                                {getPaymentBadge(selectedReg.paymentStatus, selectedReg.amount)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="section-divider-gradient" />

                                    {/* Event Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Event</p>
                                            <p className="font-medium">{selectedReg.event?.title || "N/A"}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Category</p>
                                            <p className="font-medium">{selectedReg.category || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Amount</p>
                                            <p className="text-xl font-bold text-primary">
                                                ₹{selectedReg.amount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Registration Date</p>
                                            <p className="font-medium">
                                                {new Date(selectedReg.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Registration Source */}
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground mb-1">Registered By</p>
                                        <div className="flex items-center gap-2">
                                            {selectedReg.registeredById ? (
                                                <>
                                                    <UserCheck className="h-4 w-4 text-violet-600" />
                                                    <p className="font-medium">
                                                        {selectedReg.registeredBy?.name || selectedReg.registeredBy?.email || "Admin"}
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">(Admin Registration)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Globe className="h-4 w-4 text-cyan-600" />
                                                    <p className="font-medium">Self-Registered</p>
                                                    <span className="text-xs text-muted-foreground">(Public Form)</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {selectedReg.notes && (
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                            <p className="text-sm">{selectedReg.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                                        Close
                                    </Button>
                                    {(selectedReg.paymentStatus === "PAID" || selectedReg.paymentStatus === "FREE" || selectedReg.status === "CONFIRMED" || selectedReg.status === "ATTENDED") && (
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => window.open(`/dashboard/registrations/${selectedReg.id}/receipt`, "_blank")}
                                        >
                                            <Receipt className="h-4 w-4" />
                                            {selectedReg.paymentStatus === "FREE" ? "Download Confirmation" : "Download Receipt"}
                                        </Button>
                                    )}
                                    <Button className="gap-2">
                                        <Mail className="h-4 w-4" />
                                        Send Email
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Registrations Table */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1">
                                <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    All ({registrations.length})
                                </TabsTrigger>
                                <TabsTrigger value="confirmed" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    <span className="hidden sm:inline">Confirmed</span>
                                    <span className="sm:hidden">OK</span> ({confirmedCount})
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    <span className="hidden sm:inline">Pending</span>
                                    <span className="sm:hidden">Pend</span> ({pendingCount})
                                </TabsTrigger>
                                <TabsTrigger value="waitlist" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    <span className="hidden sm:inline">Waitlist</span>
                                    <span className="sm:hidden">Wait</span> ({waitlistCount})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                        {/* Desktop Table View */}
                        <div className="hidden sm:block rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                                                onCheckedChange={toggleAll}
                                            />
                                        </TableHead>
                                        <TableHead>Attendee</TableHead>
                                        <TableHead className="hidden md:table-cell">Event</TableHead>
                                        <TableHead className="hidden lg:table-cell">Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRegistrations.map((reg, index) => (
                                        <TableRow
                                            key={reg.id}
                                            className="animate-fadeIn"
                                            style={{ animationDelay: `${index * 0.03}s` }}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRegistrations.includes(reg.id)}
                                                    onCheckedChange={() => toggleRegistration(reg.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(reg.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{reg.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {reg.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <p className="text-sm truncate max-w-[200px]">{reg.event?.title || "N/A"}</p>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <Badge variant="outline">{reg.category || "N/A"}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {getStatusBadge(reg.status)}
                                                        {getRegistrationSourceBadge(reg)}
                                                    </div>
                                                    <div>{getPaymentBadge(reg.paymentStatus, reg.amount)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">₹{reg.amount.toLocaleString()}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setSelectedReg(reg);
                                                            setIsViewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedReg(reg);
                                                                    setIsViewOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            {reg.status !== "CONFIRMED" && reg.status !== "ATTENDED" && (
                                                                <DropdownMenuItem>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit Registration
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>
                                                                <Mail className="mr-2 h-4 w-4" />
                                                                Send Email
                                                            </DropdownMenuItem>
                                                            {(reg.paymentStatus === "PAID" || reg.paymentStatus === "FREE" || reg.status === "CONFIRMED" || reg.status === "ATTENDED") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => window.open(`/dashboard/registrations/${reg.id}/receipt`, "_blank")}
                                                                >
                                                                    <Receipt className="mr-2 h-4 w-4" />
                                                                    {reg.paymentStatus === "FREE" ? "Download Confirmation" : "Download Receipt"}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {(reg.status === "ATTENDED" || reg.event?.status === "COMPLETED") && (
                                                                reg.certificate ? (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleViewCertificate(reg)}
                                                                        >
                                                                            <Download className="mr-2 h-4 w-4" />
                                                                            Download Certificate
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRegenerateCertificate(reg)}
                                                                            disabled={actionInProgress === reg.id}
                                                                        >
                                                                            {actionInProgress === reg.id ? (
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                            )}
                                                                            Regenerate Certificate
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleGenerateCertificate(reg)}
                                                                        disabled={actionInProgress === reg.id}
                                                                    >
                                                                        {actionInProgress === reg.id ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <FileText className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        Generate Certificate
                                                                    </DropdownMenuItem>
                                                                )
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            {reg.status === "PENDING" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleConfirmRegistration(reg.id)}
                                                                    disabled={actionInProgress === reg.id}
                                                                >
                                                                    {actionInProgress === reg.id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Confirm Registration
                                                                </DropdownMenuItem>
                                                            )}
                                                            {reg.status === "WAITLIST" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleMoveToConfirmed(reg.id)}
                                                                    disabled={actionInProgress === reg.id}
                                                                >
                                                                    {actionInProgress === reg.id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Move to Confirmed
                                                                </DropdownMenuItem>
                                                            )}
                                                            {reg.status === "CONFIRMED" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleMarkAsAttended(reg.id)}
                                                                    disabled={actionInProgress === reg.id}
                                                                >
                                                                    {actionInProgress === reg.id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Mark as Attended
                                                                </DropdownMenuItem>
                                                            )}
                                                            {reg.paymentStatus === "PENDING" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleMarkAsPaid(reg.id)}
                                                                        disabled={actionInProgress === reg.id}
                                                                    >
                                                                        {actionInProgress === reg.id ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <CreditCard className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        Mark as Paid
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleMarkAsFree(reg.id)}
                                                                        disabled={actionInProgress === reg.id}
                                                                    >
                                                                        {actionInProgress === reg.id ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Gift className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        Mark as Free
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {reg.status !== "ATTENDED" && reg.status !== "CANCELLED" && reg.event?.status !== "COMPLETED" && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => handleCancelRegistration(reg.id)}
                                                                        disabled={actionInProgress === reg.id}
                                                                    >
                                                                        {actionInProgress === reg.id ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Ban className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        Cancel Registration
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-3">
                            {filteredRegistrations.map((reg, index) => (
                                <div
                                    key={reg.id}
                                    className="p-3 rounded-lg border bg-card animate-fadeIn"
                                    style={{ animationDelay: `${index * 0.03}s` }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Checkbox
                                                checked={selectedRegistrations.includes(reg.id)}
                                                onCheckedChange={() => toggleRegistration(reg.id)}
                                            />
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                    {getInitials(reg.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{reg.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{reg.email}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setSelectedReg(reg); setIsViewOpen(true); }}>
                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem><Mail className="mr-2 h-4 w-4" /> Email</DropdownMenuItem>
                                                {(reg.paymentStatus === "PAID" || reg.paymentStatus === "FREE" || reg.status === "CONFIRMED" || reg.status === "ATTENDED") && (
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`/dashboard/registrations/${reg.id}/receipt`, "_blank")}
                                                    >
                                                        <Receipt className="mr-2 h-4 w-4" />
                                                        {reg.paymentStatus === "FREE" ? "Confirmation" : "Receipt"}
                                                    </DropdownMenuItem>
                                                )}
                                                {(reg.status === "ATTENDED" || reg.event?.status === "COMPLETED") && (
                                                    reg.certificate ? (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewCertificate(reg)}
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleRegenerateCertificate(reg)}
                                                                disabled={actionInProgress === reg.id}
                                                            >
                                                                {actionInProgress === reg.id ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                                )}
                                                                Regenerate
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => handleGenerateCertificate(reg)}
                                                            disabled={actionInProgress === reg.id}
                                                        >
                                                            {actionInProgress === reg.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <FileText className="mr-2 h-4 w-4" />
                                                            )}
                                                            Certificate
                                                        </DropdownMenuItem>
                                                    )
                                                )}
                                                <DropdownMenuSeparator />
                                                {reg.status === "PENDING" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleConfirmRegistration(reg.id)}
                                                        disabled={actionInProgress === reg.id}
                                                    >
                                                        {actionInProgress === reg.id ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        )}
                                                        Confirm
                                                    </DropdownMenuItem>
                                                )}
                                                {reg.status === "WAITLIST" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleMoveToConfirmed(reg.id)}
                                                        disabled={actionInProgress === reg.id}
                                                    >
                                                        {actionInProgress === reg.id ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                        )}
                                                        Confirm
                                                    </DropdownMenuItem>
                                                )}
                                                {reg.status === "CONFIRMED" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleMarkAsAttended(reg.id)}
                                                        disabled={actionInProgress === reg.id}
                                                    >
                                                        {actionInProgress === reg.id ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        )}
                                                        Mark Attended
                                                    </DropdownMenuItem>
                                                )}
                                                {reg.paymentStatus === "PENDING" && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => handleMarkAsPaid(reg.id)}
                                                            disabled={actionInProgress === reg.id}
                                                        >
                                                            {actionInProgress === reg.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                            )}
                                                            Mark Paid
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleMarkAsFree(reg.id)}
                                                            disabled={actionInProgress === reg.id}
                                                        >
                                                            {actionInProgress === reg.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Gift className="mr-2 h-4 w-4" />
                                                            )}
                                                            Mark Free
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {reg.status !== "ATTENDED" && reg.status !== "CANCELLED" && reg.event?.status !== "COMPLETED" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleCancelRegistration(reg.id)}
                                                            disabled={actionInProgress === reg.id}
                                                        >
                                                            {actionInProgress === reg.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Ban className="mr-2 h-4 w-4" />
                                                            )}
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="text-xs text-muted-foreground truncate mb-1">{reg.event?.title || "N/A"}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1 flex-wrap">
                                                {getStatusBadge(reg.status)}
                                                {getRegistrationSourceBadge(reg)}
                                                {getPaymentBadge(reg.paymentStatus, reg.amount)}
                                            </div>
                                            <p className="text-sm font-semibold">₹{reg.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredRegistrations.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No registrations found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {registrations.length === 0
                                        ? "No registrations yet"
                                        : "No registrations match your filters"}
                                </p>
                                <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Add Registration
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Certificate Generation Dialog */}
            <Dialog open={certDialogOpen} onOpenChange={(open) => {
                if (!certGenerating) {
                    setCertDialogOpen(open);
                    if (!open) {
                        setCertDialogReg(null);
                        setCertDialogEvent(null);
                    }
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Generate Certificate</DialogTitle>
                        <DialogDescription>
                            Review the details below before generating the certificate.
                        </DialogDescription>
                    </DialogHeader>

                    {certDialogReg && certDialogEvent && (
                        <div className="space-y-4 py-4">
                            {/* Recipient Info */}
                            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <h4 className="font-medium text-sm">Recipient</h4>
                                <p className="text-sm">{certDialogReg.name}</p>
                                <p className="text-xs text-muted-foreground">{certDialogReg.email}</p>
                            </div>

                            {/* Event Info */}
                            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <h4 className="font-medium text-sm">Event</h4>
                                <p className="text-sm">{certDialogEvent.title}</p>
                                {certDialogEvent.cmeCredits && (
                                    <p className="text-xs text-muted-foreground">CME Credits: {certDialogEvent.cmeCredits}</p>
                                )}
                            </div>

                            {/* Signatories Info */}
                            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Signatories</h4>
                                    <Link href={`/dashboard/events/${certDialogEvent.id}/edit`} target="_blank">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                            <Edit className="h-3 w-3" />
                                            Edit in Event
                                        </Button>
                                    </Link>
                                </div>
                                {(certDialogEvent.signatory1Name || certDialogEvent.signatory2Name) ? (
                                    <div className="space-y-2">
                                        {certDialogEvent.signatory1Name && (
                                            <div className="text-sm">
                                                <p className="font-medium">{certDialogEvent.signatory1Name}</p>
                                                <p className="text-xs text-muted-foreground">{certDialogEvent.signatory1Title}</p>
                                            </div>
                                        )}
                                        {certDialogEvent.signatory2Name && (
                                            <div className="text-sm">
                                                <p className="font-medium">{certDialogEvent.signatory2Name}</p>
                                                <p className="text-xs text-muted-foreground">{certDialogEvent.signatory2Title}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-amber-600">
                                        ⚠️ No signatories configured. Edit the event to add signatories.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCertDialogOpen(false)}
                            disabled={certGenerating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmGenerateCertificate}
                            disabled={certGenerating}
                            className="gap-2"
                        >
                            {certGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    Generate Certificate
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Custom Dialogs */}
            <ConfirmDialog />
            <AlertDialog />
        </DashboardLayout>
    );
}
