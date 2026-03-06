"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Printer,
    Download,
    X,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { certificatesService } from "@/services/certificates";
import { CertificateTemplate, CertificateData, EventType } from "@/components/certificates/certificate-template";
import { CertificateShare } from "@/components/certificates/certificate-share";

interface CertificateDetails {
    id: string;
    certificateCode: string;
    recipientName: string;
    recipientEmail: string;
    title: string | null;
    description: string | null;
    cmeCredits: number | null;
    status: string;
    issuedAt: string | null;
    event: {
        id: string;
        title: string;
        type: EventType;
        startDate: string;
        endDate: string;
        location: string | null;
        city: string | null;
        organizer: string | null;
        cmeCredits: number | null;
        signatory1Name: string | null;
        signatory1Title: string | null;
        signatory2Name: string | null;
        signatory2Title: string | null;
    };
}

export default function CertificateViewPage() {
    const params = useParams();
    const certificateId = params.id as string;

    const [certificate, setCertificate] = useState<CertificateDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCertificate() {
            try {
                setLoading(true);
                const response = await certificatesService.getById(certificateId);
                if (response.success && response.data) {
                    setCertificate(response.data as unknown as CertificateDetails);
                } else {
                    setError("Certificate not found");
                }
            } catch (err) {
                setError("Failed to load certificate");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (certificateId) {
            fetchCertificate();
        }
    }, [certificateId]);

    // Set document title for PDF filename
    useEffect(() => {
        if (certificate) {
            const fileName = `${certificate.event.title} - ${certificate.recipientName} - Certificate`;
            document.title = fileName;
        }
    }, [certificate]);

    const handlePrint = () => {
        window.print();
    };

    const verifyUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify/${certificate?.certificateCode}`
        : `/verify/${certificate?.certificateCode}`;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
                <p className="text-destructive">{error || "Certificate not found"}</p>
                <Button variant="outline" onClick={() => window.close()}>
                    <X className="mr-2 h-4 w-4" />
                    Close
                </Button>
            </div>
        );
    }

    // Prepare certificate data for template
    // Ensure we have a valid event type, default to CONFERENCE if missing
    const eventType: EventType = certificate.event?.type || "CONFERENCE";

    // Build signatories array from event data
    const signatories: { name: string; title: string }[] = [];
    if (certificate.event?.signatory1Name || certificate.event?.signatory1Title) {
        signatories.push({
            name: certificate.event.signatory1Name || "",
            title: certificate.event.signatory1Title || "",
        });
    }
    if (certificate.event?.signatory2Name || certificate.event?.signatory2Title) {
        signatories.push({
            name: certificate.event.signatory2Name || "",
            title: certificate.event.signatory2Title || "",
        });
    }

    const certificateData: CertificateData = {
        recipientName: certificate.recipientName,
        eventTitle: certificate.event?.title || "Event",
        eventType: eventType,
        eventDate: certificate.event?.startDate || new Date().toISOString(),
        eventEndDate: certificate.event?.endDate,
        eventLocation: [certificate.event?.location, certificate.event?.city].filter(Boolean).join(", ") || undefined,
        certificateCode: certificate.certificateCode,
        cmeCredits: certificate.cmeCredits || certificate.event?.cmeCredits || undefined,
        description: certificate.description || undefined,
        organizer: certificate.event?.organizer || undefined,
        issuedAt: certificate.issuedAt || undefined,
        signatories: signatories.length > 0 ? signatories : undefined,
        verifyUrl: verifyUrl,
    };

    return (
        <>
            {/* Print Styles - Landscape A4 */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: 297mm 210mm landscape;
                        margin: 0;
                    }
                    html, body {
                        width: 297mm;
                        height: 210mm;
                        margin: 0;
                        padding: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #certificate-print-area, #certificate-print-area * {
                        visibility: visible;
                    }
                    #certificate-print-area {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 297mm;
                        height: 210mm;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .certificate-container {
                        box-shadow: none !important;
                        width: 297mm !important;
                        height: 210mm !important;
                    }
                }
            `}</style>

            {/* Action Bar - Hidden when printing */}
            <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => window.close()}>
                        <X className="mr-2 h-4 w-4" />
                        Close
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                            {certificate.certificateCode}
                        </span>
                        <CertificateShare
                            certificateCode={certificate.certificateCode}
                            recipientName={certificate.recipientName}
                            recipientEmail={certificate.recipientEmail}
                            eventTitle={certificate.event?.title}
                        />
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

            {/* Certificate Preview - Screen view */}
            <div className="min-h-screen bg-gray-100 py-8 no-print">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-lg overflow-auto">
                        <CertificateTemplate data={certificateData} />
                    </div>
                </div>
            </div>

            {/* Print-only version */}
            <div id="certificate-print-area" className="hidden print:block">
                <CertificateTemplate data={certificateData} />
            </div>
        </>
    );
}
