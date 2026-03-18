"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    MapPin,
    Clock,
    Eye,
    Download,
    Ticket,
    CheckCircle2,
    XCircle,
    AlertCircle,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { format } from "date-fns";

interface MyRegistration {
    id: string;
    name?: string;
    participantRole?: string | null;
    status: string;
    paymentStatus: string;
    amount?: number | string;
    currency?: string;
    registeredAt: string;
    qrCode?: string | null;
    badgeGenerated?: boolean;
    event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        startTime: string | null;
        location: string | null;
        city: string | null;
    };
    certificates?: {
        id: string;
        certificateCode: string;
    }[];
}

export default function MyRegistrationsPage() {
    const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyRegistrations() {
            try {
                setLoading(true);
                const response = await fetch("/api/users/me/registrations");
                const data = await response.json();
                if (data.success && data.data) {
                    setRegistrations(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch registrations:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchMyRegistrations();
    }, []);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "CONFIRMED":
                return { label: "Confirmed", className: "bg-green-100 text-green-700 shadow-sm font-semibold", icon: CheckCircle2 };
            case "PENDING":
                return { label: "Pending", className: "bg-yellow-100 text-yellow-700 shadow-sm font-semibold", icon: AlertCircle };
            case "CANCELLED":
                return { label: "Cancelled", className: "bg-red-100 text-red-700 shadow-sm font-semibold", icon: XCircle };
            case "ATTENDED":
                return { label: "Attended", className: "bg-blue-100 text-blue-700 shadow-sm font-semibold", icon: CheckCircle2 };
            default:
                return { label: status, className: "bg-gray-100 text-gray-700 shadow-sm font-semibold", icon: AlertCircle };
        }
    };

    const getPaymentStatusConfig = (status: string) => {
        switch (status) {
            case "PAID":
                return { label: "Paid", className: "bg-green-100 text-green-700" };
            case "PENDING":
                return { label: "Payment Pending", className: "bg-yellow-100 text-yellow-700" };
            case "FAILED":
                return { label: "Payment Failed", className: "bg-red-100 text-red-700" };
            case "REFUNDED":
                return { label: "Refunded", className: "bg-gray-100 text-gray-700" };
            case "FREE":
                return { label: "Free", className: "bg-green-100 text-green-700" };
            default:
                return { label: status, className: "bg-gray-100 text-gray-700" };
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="My Registrations" subtitle="View your event registrations">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="My Registrations" subtitle="View your event registrations">
            <div className="space-y-6">
                {registrations.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-xl">
                        <Ticket className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No registrations yet</h3>
                        <p className="text-muted-foreground mb-4">
                            You haven&apos;t registered for any events yet.
                        </p>
                        <Link href="/dashboard/browse-events">
                            <Button>Browse Events</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {registrations.map((registration) => {
                            const statusConfig = getStatusConfig(registration.status);
                            const paymentConfig = getPaymentStatusConfig(registration.paymentStatus);
                            const StatusIcon = statusConfig.icon;
                            const eventDate = new Date(registration.event.startDate);
                            const isPastEvent = eventDate < new Date();

                            return (
                                <div
                                    key={registration.id}
                                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {statusConfig.label}
                                                </Badge>
                                                <Badge variant="outline" className={cn("text-xs", paymentConfig.className)}>
                                                    {paymentConfig.label}
                                                </Badge>
                                                {registration.certificates && registration.certificates.length > 0 && (
                                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                                                        Certificate Issued
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                                                {registration.event.title}
                                            </h3>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(eventDate, "MMM d, yyyy")}
                                                </span>
                                                {registration.event.startTime && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {registration.event.startTime}
                                                    </span>
                                                )}
                                                {registration.event.city && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4" />
                                                        {registration.event.city}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                                                <span>
                                                    ID: <span className="font-mono">{registration.id.slice(-8).toUpperCase()}</span>
                                                </span>
                                                <span>Registered: {format(new Date(registration.registeredAt), "MMM d, yyyy")}</span>
                                                {registration.amount && Number(registration.amount) > 0 && (
                                                    <span className="font-semibold text-foreground">
                                                        {registration.currency || "₹"} {Number(registration.amount).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* ID Card / Badge */}
                                            {registration.badgeGenerated && registration.qrCode && (
                                                <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200">
                                                    <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                                        <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                                                        Your ID Card
                                                    </p>
                                                    <div className="bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4">
                                                        <div className="w-20 h-20 bg-white rounded-lg border-2 border-teal-100 p-1.5 flex-shrink-0">
                                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registration.qrCode)}`} alt="Badge QR" className="w-full h-full" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate">{registration.name || "Delegate"}</p>
                                                            <p className="text-xs text-teal-700 font-medium capitalize">{registration.participantRole?.toLowerCase() || "Delegate"}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{registration.event.title}</p>
                                                            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{registration.id.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-2 text-center">Show this QR code at the venue for check-in and access</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/browse-events/${registration.event.id}`}>
                                                <Button variant="outline" size="sm" className="hover:shadow-md transition-all">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Event
                                                </Button>
                                            </Link>
                                            {registration.certificates && registration.certificates.length > 0 && (
                                                <Link href={`/dashboard/certificates/${registration.certificates[0].id}/view`}>
                                                    <Button size="sm" className="gap-2 hover:shadow-md transition-all">
                                                        <Download className="w-4 h-4" />
                                                        Certificate
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
