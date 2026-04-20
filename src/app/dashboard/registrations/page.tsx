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
import { DEFAULT_PARTICIPANT_ROLES } from "@/lib/config/event-defaults";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { registrationsService, Registration } from "@/services/registrations";
import { eventsService, Event } from "@/services/events";
import { certificatesService } from "@/services/certificates";
import { useConfirmDialog, useAlertDialog } from "@/components/ui/confirm-dialog";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { toast } from "sonner";

// Main page wrapper with Suspense for useSearchParams
export default function RegistrationsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout title="Registrations" subtitle="Manage event registrations">
                <AiimsLoader />
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
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        phone: "",
        organization: "",
        designation: "",
        category: "",
        participantRole: "DELEGATE",
        amount: 0,
        status: "PENDING" as Registration["status"],
        paymentStatus: "PENDING" as Registration["paymentStatus"],
        notes: "",
        specialRequests: "",
    });
    const [editSubmitting, setEditSubmitting] = useState(false);
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
        participantRole: "DELEGATE",
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
                    eventsService.getAll({ ...tenantFilterParams, limit: 200 }),
                    registrationsService.getAll({ ...(eventIdParam ? { eventId: eventIdParam } : {}), ...tenantFilterParams, limit: 500, sortBy: "createdAt", sortOrder: "desc" }),
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
            <Badge variant="outline" className={cn("gap-1 border-0 font-semibold tracking-wide rounded-full", config.class)}>
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
            <Badge variant="outline" className={cn("text-xs border-0 gap-1 font-semibold tracking-wide rounded-full", config.class)}>
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
                    className="gap-1 border-0 bg-violet-50 text-violet-700 font-semibold tracking-wide rounded-full"
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
                className="gap-1 border-0 bg-cyan-50 text-cyan-700 font-semibold tracking-wide rounded-full"
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

    // Send registration confirmation email to a single registrant
    const handleSendEmail = async (reg: Registration) => {
        const ok = await confirm({
            title: "Send Registration Email",
            description: `Send the registration confirmation email to ${reg.name} (${reg.email})?`,
            confirmText: "Send Email",
        });
        if (!ok) return;

        const loadingToast = toast.loading(`Sending email to ${reg.name}...`);
        try {
            const res = await registrationsService.sendConfirmationEmail(reg.id);
            toast.dismiss(loadingToast);
            if (res.success) {
                toast.success(`Email sent to ${reg.email}`);
            } else {
                toast.error(typeof res.error === "string" ? res.error : res.error?.message || "Failed to send email");
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Failed to send email");
            console.error(err);
        }
    };

    // Send registration confirmation email to multiple registrants (selected or all filtered)
    const handleSendBulkEmails = async (mode: "selected" | "filtered") => {
        const targets = mode === "selected"
            ? filteredRegistrations.filter(r => selectedRegistrations.includes(r.id))
            : filteredRegistrations;

        if (targets.length === 0) {
            toast.error("No registrations to send to");
            return;
        }

        const ok = await confirm({
            title: "Send Registration Emails",
            description: `Send the registration confirmation email to ${targets.length} ${targets.length === 1 ? "registrant" : "registrants"}? This action cannot be undone.`,
            confirmText: `Send to ${targets.length}`,
        });
        if (!ok) return;

        const loadingToast = toast.loading(`Sending ${targets.length} emails...`);
        try {
            const res = await registrationsService.sendBulkConfirmationEmails(targets.map(r => r.id));
            toast.dismiss(loadingToast);
            if (res.success && res.data) {
                const { sent, failed, total } = res.data;
                if (failed === 0) {
                    toast.success(`Sent ${sent} of ${total} emails successfully`);
                } else {
                    toast.warning(`Sent ${sent} of ${total} — ${failed} failed`);
                }
            } else {
                toast.error(typeof res.error === "string" ? res.error : res.error?.message || "Failed to send emails");
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Failed to send emails");
            console.error(err);
        }
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
                participantRole: formData.participantRole || "DELEGATE",
                amount: Number(formData.amount) || 0,
                notes: formData.notes || undefined,
                specialRequests: formData.specialRequests || undefined,
            });

            if (response.success) {
                const regsRes = await registrationsService.getAll(
                    { ...(eventIdParam ? { eventId: eventIdParam } : {}), ...tenantFilterParams, limit: 500, sortBy: "createdAt", sortOrder: "desc" }
                );
                if (regsRes.success && regsRes.data) {
                    setRegistrations(Array.isArray(regsRes.data) ? regsRes.data : []);
                }
                setIsAddOpen(false);
                setFormData({
                    eventId: eventIdParam || "",
                    name: "",
                    email: "",
                    phone: "",
                    organization: "",
                    designation: "",
                    category: "",
                    participantRole: "DELEGATE",
                    amount: Number(selectedEvent?.price) || 0,
                    notes: "",
                    specialRequests: "",
                });
                alert({ title: "Success", description: "Registration created successfully", variant: "success" });
            } else {
                const errorMsg = typeof response.error === "string" ? response.error : response.error?.message || "Failed to create registration";
                alert({ title: "Error", description: errorMsg, variant: "error" });
            }
        } catch (error) {
            console.error("Failed to create registration:", error);
            alert({ title: "Error", description: "Failed to create registration. Please try again.", variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    // Open the edit dialog pre-filled with the registration's current values
    const handleOpenEdit = (reg: Registration) => {
        setSelectedReg(reg);
        setEditFormData({
            name: reg.name || "",
            email: reg.email || "",
            phone: reg.phone || "",
            organization: reg.organization || "",
            designation: reg.designation || "",
            category: reg.category || "",
            participantRole: reg.participantRole || "DELEGATE",
            amount: Number(reg.amount) || 0,
            status: reg.status,
            paymentStatus: reg.paymentStatus,
            notes: reg.notes || "",
            specialRequests: reg.specialRequests || "",
        });
        setIsEditOpen(true);
    };

    // Save edited registration
    const handleEditSubmit = async () => {
        if (!selectedReg) return;
        if (!editFormData.name) {
            alert({ title: "Validation", description: "Name is required.", variant: "error" });
            return;
        }
        try {
            setEditSubmitting(true);
            const response = await registrationsService.update(selectedReg.id, {
                name: editFormData.name,
                phone: editFormData.phone || undefined,
                organization: editFormData.organization || undefined,
                designation: editFormData.designation || undefined,
                category: editFormData.category || undefined,
                participantRole: editFormData.participantRole || undefined,
                amount: Number(editFormData.amount) || 0,
                status: editFormData.status,
                paymentStatus: editFormData.paymentStatus,
                notes: editFormData.notes || undefined,
                specialRequests: editFormData.specialRequests || undefined,
            });
            if (response.success) {
                await refreshRegistrations();
                setIsEditOpen(false);
                alert({ title: "Success", description: "Registration updated successfully", variant: "success" });
            } else {
                const errorMsg = typeof response.error === "string" ? response.error : response.error?.message || "Failed to update registration";
                alert({ title: "Error", description: errorMsg, variant: "error" });
            }
        } catch (error) {
            console.error("Failed to update registration:", error);
            alert({ title: "Error", description: "Failed to update registration. Please try again.", variant: "error" });
        } finally {
            setEditSubmitting(false);
        }
    };

    // State for action in progress
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    // Refresh registrations helper
    const refreshRegistrations = async () => {
        const regsRes = await registrationsService.getAll(
            { ...(eventIdParam ? { eventId: eventIdParam } : {}), ...tenantFilterParams, limit: 500, sortBy: "createdAt", sortOrder: "desc" }
        );
        if (regsRes.success && regsRes.data) {
            setRegistrations(Array.isArray(regsRes.data) ? regsRes.data : []);
        }
    };

    // Handle confirm registration (PENDING -> CONFIRMED)
    const handleConfirmRegistration = async (regId: string) => {
        const reg = registrations.find(r => r.id === regId);
        const hasProof = reg?.paymentProof;

        const confirmed = await confirm({
            title: "Confirm Registration",
            description: hasProof
                ? "Review the payment proof below and confirm this registration."
                : `Confirm registration for ${reg?.name || "this attendee"}?`,
            confirmText: "Confirm",
            cancelText: "Cancel",
            variant: "success",
            body: hasProof ? (
                <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Proof:</p>
                    <a href={reg!.paymentProof!} target="_blank" rel="noopener noreferrer">
                        <img
                            src={reg!.paymentProof!}
                            alt="Payment proof"
                            className="max-w-full max-h-48 rounded-lg border object-contain bg-white cursor-pointer hover:opacity-90"
                        />
                    </a>
                </div>
            ) : undefined,
        });

        if (!confirmed) return;

        try {
            setActionInProgress(regId);
            const response = await registrationsService.confirm(regId);
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to confirm registration:", error);
            alert({ title: "Error", description: "Failed to confirm registration.", variant: "error" });
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
            alert({ title: "Error", description: "Failed to move to confirmed.", variant: "error" });
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle mark as paid
    const handleMarkAsPaid = async (regId: string) => {
        const reg = registrations.find(r => r.id === regId);
        const hasProof = reg?.paymentProof;

        const confirmed = await confirm({
            title: "Mark as Paid",
            description: hasProof
                ? "Review the payment proof and mark this registration as paid."
                : `Mark payment as received for ${reg?.name || "this attendee"}?`,
            confirmText: "Mark Paid",
            cancelText: "Cancel",
            variant: "success",
            body: hasProof ? (
                <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Proof:</p>
                    <a href={reg!.paymentProof!} target="_blank" rel="noopener noreferrer">
                        <img
                            src={reg!.paymentProof!}
                            alt="Payment proof"
                            className="max-w-full max-h-48 rounded-lg border object-contain bg-white cursor-pointer hover:opacity-90"
                        />
                    </a>
                </div>
            ) : undefined,
        });

        if (!confirmed) return;

        try {
            setActionInProgress(regId);
            const response = await registrationsService.markPaid(regId);
            if (response.success) {
                await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to mark as paid:", error);
            alert({ title: "Error", description: "Failed to mark as paid.", variant: "error" });
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle approve registration (confirm + mark paid in one action)
    const handleApproveRegistration = async (regId: string) => {
        const reg = registrations.find(r => r.id === regId);
        const hasProof = reg?.paymentProof;
        const isFree = !reg?.amount || Number(reg.amount) === 0;

        const confirmed = await confirm({
            title: "Approve Registration",
            description: isFree
                ? `Approve registration for ${reg?.name || "this attendee"}? This will confirm registration.`
                : hasProof
                    ? "Review the payment screenshot below and approve this registration. This will confirm registration and mark payment as received."
                    : `Approve registration for ${reg?.name || "this attendee"}? This will confirm registration and mark payment as received.`,
            confirmText: "Approve",
            cancelText: "Cancel",
            variant: "success",
            body: hasProof ? (
                <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Screenshot:</p>
                    <a href={reg!.paymentProof!} target="_blank" rel="noopener noreferrer">
                        <img
                            src={reg!.paymentProof!}
                            alt="Payment screenshot"
                            className="max-w-full max-h-48 rounded-lg border object-contain bg-white cursor-pointer hover:opacity-90"
                        />
                    </a>
                    {reg!.paymentId && (
                        <p className="text-xs text-muted-foreground">
                            Transaction ID: <span className="font-mono font-semibold">{reg!.paymentId}</span>
                        </p>
                    )}
                    <p className="text-sm font-semibold mt-2">Amount: ₹{Number(reg!.amount).toLocaleString()}</p>
                </div>
            ) : undefined,
        });

        if (!confirmed) return;

        try {
            setActionInProgress(regId);
            if (isFree) {
                // For free events, just confirm
                const response = await registrationsService.update(regId, {
                    status: "CONFIRMED",
                    paymentStatus: "FREE",
                });
                if (response.success) await refreshRegistrations();
            } else {
                // Approve: confirm + mark paid
                const response = await registrationsService.approve(regId);
                if (response.success) await refreshRegistrations();
            }
        } catch (error) {
            console.error("Failed to approve registration:", error);
            alert({ title: "Error", description: "Failed to approve registration.", variant: "error" });
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
            alert({ title: "Error", description: "Failed to mark as free.", variant: "error" });
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
            alert({ title: "Error", description: "Failed to mark as attended.", variant: "error" });
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
            alert({ title: "Error", description: "Failed to cancel registration.", variant: "error" });
        } finally {
            setActionInProgress(null);
        }
    };

    const handleDeleteRegistration = async (regId: string) => {
        const ok = await confirm({
            title: "Delete Registration",
            description: "This will permanently delete this registration. This action cannot be undone. Are you sure?",
            confirmText: "Delete",
            variant: "danger",
        });
        if (!ok) return;
        try {
            setActionInProgress(regId);
            const response = await registrationsService.delete(regId);
            if (response.success) {
                await refreshRegistrations();
                alert({ title: "Deleted", description: "Registration deleted successfully.", variant: "success" });
            } else {
                alert({ title: "Error", description: (response as any).error?.message || "Failed to delete registration.", variant: "error" });
            }
        } catch (error) {
            console.error("Failed to delete registration:", error);
            alert({ title: "Error", description: "Failed to delete registration.", variant: "error" });
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
        if (reg.certificates && reg.certificates.length > 0) {
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
        const cert = reg.certificates?.[0];
        if (cert?.id) {
            window.open(`/dashboard/certificates/${cert.id}/view`, "_blank");
        }
    };

    // Handle regenerate certificate
    const handleRegenerateCertificate = async (reg: Registration) => {
        const cert = reg.certificates?.[0];
        if (!cert?.id) return;

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
            const response = await certificatesService.regenerate(cert.id);

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
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Registrations" subtitle="Manage event registrations and attendees">
            <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-fadeIn bg-gradient-to-br from-slate-50 via-white to-teal-50/30 min-h-screen">
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
                    <Card className="group card-premium overflow-hidden border-0">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 to-teal-600" />
                        <CardContent className="relative p-4 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight animate-count">{registrations.length}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="group card-premium overflow-hidden border-0">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-green-600" />
                        <CardContent className="relative p-4 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight animate-count">{confirmedCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Confirmed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="group card-premium overflow-hidden border-0">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                        <CardContent className="relative p-4 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight animate-count">{pendingCount + waitlistCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="group card-premium overflow-hidden border-0">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-400 to-purple-600" />
                        <CardContent className="relative p-4 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 shrink-0">
                                    <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight truncate animate-count">{formatRevenue(totalRevenue)}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col gap-3">
                    {/* Search Row */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1 search-premium rounded-xl">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-10 pr-10 h-11 rounded-xl border-border/60 bg-background"
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
                            className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all text-white"
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
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleSendBulkEmails("selected")}>
                                    <Mail className="w-4 h-4" />
                                    <span className="hidden sm:inline">Send Email</span> ({selectedRegistrations.length})
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleSendBulkEmails("filtered")}>
                                <Mail className="w-4 h-4" />
                                <span className="hidden sm:inline">Email All</span>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                                const params = new URLSearchParams();
                                if (selectedEventFilter !== "all") params.set("eventId", selectedEventFilter);
                                if (tenantFilterParams.tenantId) params.set("tenantId", tenantFilterParams.tenantId);
                                window.open(`/api/registrations/export?${params.toString()}`, "_blank");
                            }}>
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Add Registration Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95">
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
                                        Registration fee: ₹{Number(formData.amount).toLocaleString()}
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
                                    <Label htmlFor="participantRole">Role</Label>
                                    <Select
                                        value={formData.participantRole}
                                        onValueChange={(value) => setFormData({ ...formData, participantRole: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEFAULT_PARTICIPANT_ROLES.map(role => (
                                                <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                                            ))}
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

                {/* Edit Registration Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95">
                        <DialogHeader>
                            <DialogTitle>Edit Registration</DialogTitle>
                            <DialogDescription>
                                {selectedReg ? `Update details for ${selectedReg.name}` : "Update registration details"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Event (read-only) */}
                            <div className="space-y-2">
                                <Label>Event</Label>
                                <Input value={selectedReg?.event?.title || "N/A"} disabled />
                            </div>

                            <div className="section-divider-gradient my-2" />

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="edit-name">Full Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={editFormData.email}
                                        disabled
                                        title="Email cannot be changed after registration"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Phone</Label>
                                    <Input
                                        id="edit-phone"
                                        type="tel"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="section-divider-gradient my-2" />

                            {/* Professional Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-designation">Designation</Label>
                                    <Input
                                        id="edit-designation"
                                        value={editFormData.designation}
                                        onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-organization">Organization</Label>
                                    <Input
                                        id="edit-organization"
                                        value={editFormData.organization}
                                        onChange={(e) => setEditFormData({ ...editFormData, organization: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category">Category</Label>
                                    <Select
                                        value={editFormData.category}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
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
                                    <Label htmlFor="edit-participantRole">Role</Label>
                                    <Select
                                        value={editFormData.participantRole}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, participantRole: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEFAULT_PARTICIPANT_ROLES.map(role => (
                                                <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-amount">Amount (₹)</Label>
                                    <Input
                                        id="edit-amount"
                                        type="number"
                                        value={editFormData.amount}
                                        onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="section-divider-gradient my-2" />

                            {/* Status & Payment */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select
                                        value={editFormData.status}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Registration["status"] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                            <SelectItem value="WAITLIST">Waitlist</SelectItem>
                                            <SelectItem value="ATTENDED">Attended</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-paymentStatus">Payment Status</Label>
                                    <Select
                                        value={editFormData.paymentStatus}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, paymentStatus: value as Registration["paymentStatus"] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Unpaid</SelectItem>
                                            <SelectItem value="PAID">Paid</SelectItem>
                                            <SelectItem value="FREE">Free</SelectItem>
                                            <SelectItem value="REFUNDED">Refunded</SelectItem>
                                            <SelectItem value="FAILED">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-notes">Notes (Internal)</Label>
                                <Textarea
                                    id="edit-notes"
                                    rows={2}
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-specialRequests">Special Requests</Label>
                                <Textarea
                                    id="edit-specialRequests"
                                    rows={2}
                                    value={editFormData.specialRequests}
                                    onChange={(e) => setEditFormData({ ...editFormData, specialRequests: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={editSubmitting || !editFormData.name}
                            >
                                {editSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* View Registration Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95">
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

                                    {/* Participant Role */}
                                    {selectedReg.participantRole && (
                                        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                                            <p className="text-xs text-muted-foreground mb-1">Participant Role</p>
                                            <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                                                {selectedReg.participantRole.charAt(0) + selectedReg.participantRole.slice(1).toLowerCase()}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Payment Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Amount</p>
                                            <p className="text-xl font-bold text-primary">
                                                ₹{Number(selectedReg.amount).toLocaleString()}
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

                                    {/* Payment Proof Section */}
                                    {selectedReg.amount > 0 && (
                                        <div className={cn(
                                            "p-4 rounded-lg border",
                                            selectedReg.paymentProof
                                                ? "bg-purple-50 border-purple-200"
                                                : "bg-amber-50 border-amber-200"
                                        )}>
                                            <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                                                <CreditCard className="h-3.5 w-3.5" />
                                                Payment Proof
                                            </p>
                                            {selectedReg.paymentProof ? (
                                                <>
                                                    <a
                                                        href={selectedReg.paymentProof}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <img
                                                            src={selectedReg.paymentProof}
                                                            alt="Payment proof screenshot"
                                                            className="max-w-full max-h-64 rounded-lg border border-purple-300 object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity"
                                                        />
                                                    </a>
                                                    <p className="text-xs text-purple-600 mt-2">Click image to view full size</p>
                                                    {selectedReg.paymentId && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Transaction ID: <span className="font-mono font-semibold">{selectedReg.paymentId}</span>
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm text-amber-700">No payment proof uploaded yet</p>
                                            )}
                                        </div>
                                    )}

                                    {selectedReg.notes && (
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                            <p className="text-sm">{selectedReg.notes}</p>
                                        </div>
                                    )}
                                </div>
                                {/* Quick Status Actions */}
                                <div className="border-t pt-4 space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedReg.status !== "CONFIRMED" && (
                                            <Button
                                                size="sm"
                                                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                                disabled={actionInProgress === selectedReg.id}
                                                onClick={async () => {
                                                    setIsViewOpen(false);
                                                    await handleApproveRegistration(selectedReg.id);
                                                }}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Confirm
                                            </Button>
                                        )}
                                        {selectedReg.status !== "ATTENDED" && selectedReg.status === "CONFIRMED" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5"
                                                disabled={actionInProgress === selectedReg.id}
                                                onClick={async () => {
                                                    setIsViewOpen(false);
                                                    try {
                                                        await registrationsService.update(selectedReg.id, { status: "ATTENDED" });
                                                        await refreshRegistrations();
                                                    } catch {}
                                                }}
                                            >
                                                Mark Attended
                                            </Button>
                                        )}
                                        {selectedReg.paymentStatus === "PENDING" && Number(selectedReg.amount) > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5"
                                                disabled={actionInProgress === selectedReg.id}
                                                onClick={async () => {
                                                    setIsViewOpen(false);
                                                    await handleMarkAsPaid(selectedReg.id);
                                                }}
                                            >
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                Mark Paid
                                            </Button>
                                        )}
                                        {selectedReg.status !== "CANCELLED" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                disabled={actionInProgress === selectedReg.id}
                                                onClick={async () => {
                                                    setIsViewOpen(false);
                                                    try {
                                                        await registrationsService.update(selectedReg.id, { status: "CANCELLED" });
                                                        await refreshRegistrations();
                                                    } catch {}
                                                }}
                                            >
                                                Cancel Registration
                                            </Button>
                                        )}
                                        {selectedReg.status === "CANCELLED" && (
                                            <Button
                                                size="sm"
                                                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                                disabled={actionInProgress === selectedReg.id}
                                                onClick={async () => {
                                                    setIsViewOpen(false);
                                                    try {
                                                        await registrationsService.update(selectedReg.id, { status: "PENDING" });
                                                        await refreshRegistrations();
                                                    } catch {}
                                                }}
                                            >
                                                Re-activate
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            onClick={() => handleSendEmail(selectedReg)}
                                        >
                                            <Mail className="h-3.5 w-3.5" />
                                            Send Email
                                        </Button>
                                    </div>
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
                                            {selectedReg.paymentStatus === "FREE" ? "Confirmation" : "Receipt"}
                                        </Button>
                                    )}
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Registrations Table */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 bg-slate-100/80 backdrop-blur-sm p-1 rounded-xl">
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
                        <div className="hidden sm:block rounded-xl border border-border/60 overflow-hidden backdrop-blur-sm bg-white/80">
                            <Table className="table-premium">
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-b from-muted/60 to-muted/30">
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
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline">{reg.category || "N/A"}</Badge>
                                                    {reg.participantRole && (
                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                                                            {reg.participantRole.charAt(0) + reg.participantRole.slice(1).toLowerCase()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {getStatusBadge(reg.status)}
                                                        {getRegistrationSourceBadge(reg)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {getPaymentBadge(reg.paymentStatus, reg.amount)}
                                                        {reg.paymentProof && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-300 bg-purple-50">
                                                                <Eye className="h-2.5 w-2.5 mr-0.5" />
                                                                Proof
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">₹{Number(reg.amount).toLocaleString()}</p>
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
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(reg)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit Registration
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleSendEmail(reg)}>
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
                                                                reg.certificates && reg.certificates.length > 0 ? (
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
                                                            {/* Approve: combined confirm + mark paid */}
                                                            {(reg.status === "PENDING" || reg.status === "WAITLIST") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleApproveRegistration(reg.id)}
                                                                    disabled={actionInProgress === reg.id}
                                                                    className="text-green-700"
                                                                >
                                                                    {actionInProgress === reg.id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Approve Registration
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
                                                            {/* Mark paid separately only if already confirmed but payment pending */}
                                                            {reg.status === "CONFIRMED" && reg.paymentStatus === "PENDING" && (
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
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDeleteRegistration(reg.id)}
                                                                disabled={actionInProgress === reg.id}
                                                            >
                                                                {actionInProgress === reg.id ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                )}
                                                                Delete Registration
                                                            </DropdownMenuItem>
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
                                    className="p-3 rounded-lg border bg-card animate-fadeIn hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
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
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenEdit(reg)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Registration
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSendEmail(reg)}>
                                                    <Mail className="mr-2 h-4 w-4" /> Send Email
                                                </DropdownMenuItem>
                                                {(reg.paymentStatus === "PAID" || reg.paymentStatus === "FREE" || reg.status === "CONFIRMED" || reg.status === "ATTENDED") && (
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`/dashboard/registrations/${reg.id}/receipt`, "_blank")}
                                                    >
                                                        <Receipt className="mr-2 h-4 w-4" />
                                                        {reg.paymentStatus === "FREE" ? "Confirmation" : "Receipt"}
                                                    </DropdownMenuItem>
                                                )}
                                                {(reg.status === "ATTENDED" || reg.event?.status === "COMPLETED") && (
                                                    reg.certificates && reg.certificates.length > 0 ? (
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
                                                {(reg.status === "PENDING" || reg.status === "WAITLIST") && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleApproveRegistration(reg.id)}
                                                        disabled={actionInProgress === reg.id}
                                                        className="text-green-700"
                                                    >
                                                        {actionInProgress === reg.id ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        )}
                                                        Approve
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
                                                {reg.status === "CONFIRMED" && reg.paymentStatus === "PENDING" && (
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
                                                {reg.paymentProof && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-300 bg-purple-50">
                                                        <Eye className="h-2.5 w-2.5 mr-0.5" />
                                                        Proof
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold">₹{Number(reg.amount).toLocaleString()}</p>
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
                <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/95">
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
