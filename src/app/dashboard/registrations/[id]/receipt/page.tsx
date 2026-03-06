"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
    Calendar,
    MapPin,
    User,
    Mail,
    Phone,
    Building2,
    CheckCircle2,
    Printer,
    Download,
    X,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { registrationsService } from "@/services/registrations";

interface RegistrationDetails {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    designation: string | null;
    category: string | null;
    status: string;
    paymentStatus: string;
    amount: number;
    currency: string;
    paidAt: string | null;
    createdAt: string;
    event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        location: string | null;
        city: string | null;
        organizer: string | null;
        contactEmail: string | null;
    };
    registeredBy?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
}

export default function ReceiptPage() {
    const params = useParams();
    const registrationId = params.id as string;

    const [registration, setRegistration] = useState<RegistrationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRegistration() {
            try {
                setLoading(true);
                const response = await registrationsService.getById(registrationId);
                if (response.success && response.data) {
                    setRegistration(response.data as unknown as RegistrationDetails);
                } else {
                    setError("Registration not found");
                }
            } catch (err) {
                setError("Failed to load registration");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (registrationId) {
            fetchRegistration();
        }
    }, [registrationId]);

    // Set document title for PDF filename
    useEffect(() => {
        if (registration) {
            const isFree = registration.paymentStatus === "FREE";
            const fileName = `${registration.event.title} - ${registration.name} - ${isFree ? "Confirmation" : "Receipt"}`;
            document.title = fileName;
        }
    }, [registration]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !registration) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-destructive">{error || "Registration not found"}</p>
                <Button variant="outline" onClick={() => window.close()}>
                    <X className="mr-2 h-4 w-4" />
                    Close
                </Button>
            </div>
        );
    }

    const isFree = registration.paymentStatus === "FREE";
    const isPaid = registration.paymentStatus === "PAID";
    const documentTitle = isFree ? "Registration Confirmation" : "Payment Receipt";
    const documentNumber = `${isFree ? "CONF" : "RCPT"}-${registration.id.slice(-8).toUpperCase()}`;

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 1rem !important;
                    }
                    .print-area .bg-white {
                        box-shadow: none !important;
                        border: none !important;
                    }
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                }
            `}</style>

            {/* Action Bar - Hidden when printing */}
            <div className="no-print sticky top-0 z-50 bg-background border-b">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => window.close()}>
                        <X className="mr-2 h-4 w-4" />
                        Close
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button size="sm" onClick={handlePrint}>
                            <Download className="mr-2 h-4 w-4" />
                            Save as PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Content */}
            <div className="print-area max-w-4xl mx-auto p-8">
                <div className="bg-white border rounded-lg shadow-sm p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-6 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">
                                {documentTitle}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {documentNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                isPaid ? "bg-green-100 text-green-700" :
                                isFree ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                            }`}>
                                <CheckCircle2 className="h-4 w-4" />
                                {isPaid ? "PAID" : isFree ? "FREE" : registration.paymentStatus}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                {format(new Date(registration.createdAt), "dd MMM yyyy, hh:mm a")}
                            </p>
                        </div>
                    </div>

                    {/* Event Details */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Event Details</h2>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h3 className="font-semibold text-lg">{registration.event.title}</h3>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {format(new Date(registration.event.startDate), "dd MMM yyyy")}
                                        {registration.event.endDate && registration.event.startDate !== registration.event.endDate && (
                                            <> - {format(new Date(registration.event.endDate), "dd MMM yyyy")}</>
                                        )}
                                    </span>
                                </div>
                                {(registration.event.location || registration.event.city) && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>
                                            {[registration.event.location, registration.event.city]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attendee Details */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Attendee Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-grid">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{registration.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{registration.email}</p>
                                </div>
                            </div>
                            {registration.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{registration.phone}</p>
                                    </div>
                                </div>
                            )}
                            {registration.organization && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Organization</p>
                                        <p className="font-medium">
                                            {registration.designation && `${registration.designation}, `}
                                            {registration.organization}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">
                            {isFree ? "Registration Details" : "Payment Details"}
                        </h2>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-4 py-3 text-muted-foreground">Registration ID</td>
                                        <td className="px-4 py-3 text-right font-mono">{registration.id}</td>
                                    </tr>
                                    {registration.category && (
                                        <tr className="border-b">
                                            <td className="px-4 py-3 text-muted-foreground">Category</td>
                                            <td className="px-4 py-3 text-right">{registration.category}</td>
                                        </tr>
                                    )}
                                    <tr className="border-b">
                                        <td className="px-4 py-3 text-muted-foreground">Registration Status</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                registration.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                                                registration.status === "ATTENDED" ? "bg-purple-100 text-purple-700" :
                                                "bg-amber-100 text-amber-700"
                                            }`}>
                                                {registration.status}
                                            </span>
                                        </td>
                                    </tr>
                                    {!isFree && (
                                        <>
                                            <tr className="border-b">
                                                <td className="px-4 py-3 text-muted-foreground">Payment Status</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                        isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                        {registration.paymentStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                            {registration.paidAt && (
                                                <tr className="border-b">
                                                    <td className="px-4 py-3 text-muted-foreground">Payment Date</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {format(new Date(registration.paidAt), "dd MMM yyyy, hh:mm a")}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                    <tr className="bg-muted/50">
                                        <td className="px-4 py-4 font-semibold">
                                            {isFree ? "Registration Fee" : "Amount Paid"}
                                        </td>
                                        <td className="px-4 py-4 text-right text-xl font-bold text-primary">
                                            {isFree ? "FREE" : `₹${Number(registration.amount).toLocaleString()}`}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 mt-6">
                        <div className="text-center text-sm text-muted-foreground">
                            {registration.event.organizer && (
                                <p className="font-medium text-foreground mb-1">
                                    {registration.event.organizer}
                                </p>
                            )}
                            {registration.event.contactEmail && (
                                <p>Contact: {registration.event.contactEmail}</p>
                            )}
                            <p className="mt-4 text-xs">
                                This is a computer-generated document. No signature is required.
                            </p>
                            <p className="text-xs mt-1">
                                Generated on {format(new Date(), "dd MMM yyyy, hh:mm a")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
