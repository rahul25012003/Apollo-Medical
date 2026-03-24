"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Award,
    Calendar,
    Download,
    Share2,
    ExternalLink,
    CheckCircle2,
    Copy,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { format } from "date-fns";
import { toast } from "sonner";

interface MyCertificate {
    id: string;
    certificateCode: string;
    title: string | null;
    issuedAt: string;
    cmeCredits: number | null;
    event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
    };
    registration?: {
        id: string;
        participantRole: string | null;
    };
}

export default function MyCertificatesPage() {
    const [certificates, setCertificates] = useState<MyCertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMyCertificates() {
            try {
                setLoading(true);
                const response = await fetch("/api/users/me/certificates");
                const data = await response.json();
                if (data.success && data.data) {
                    setCertificates(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch certificates:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchMyCertificates();
    }, []);

    const handleDownload = (certificateId: string) => {
        // Open the certificate view page (which has print/download functionality)
        window.open(`/dashboard/certificates/${certificateId}/view`, "_blank");
    };

    const handleShare = async (certificate: MyCertificate) => {
        const verifyUrl = `${window.location.origin}/verify/${certificate.certificateCode}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Certificate - ${certificate.event.title}`,
                    text: `View my certificate for ${certificate.event.title}`,
                    url: verifyUrl,
                });
            } catch (error) {
                // User cancelled share
            }
        } else {
            // Fallback to copying link
            handleCopyLink(certificate);
        }
    };

    const handleCopyLink = async (certificate: MyCertificate) => {
        const verifyUrl = `${window.location.origin}/verify/${certificate.certificateCode}`;
        try {
            await navigator.clipboard.writeText(verifyUrl);
            setCopiedId(certificate.id);
            toast.success("Verification link copied to clipboard");
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="My Certificates" subtitle="View and download your certificates">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="My Certificates" subtitle="View and download your certificates">
            <div className="space-y-6">
                {certificates.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-xl">
                        <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No certificates yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Certificates will appear here after you complete registered events.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {certificates.map((certificate) => (
                            <div
                                key={certificate.id}
                                className="bg-white/80 backdrop-blur-sm rounded-xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
                            >
                                {/* Certificate Header */}
                                <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Award className="w-5 h-5" />
                                                <span className="text-sm font-medium opacity-90">{certificate.title || "Certificate of Attendance"}</span>
                                            </div>
                                            <p className="text-xs opacity-75 font-mono">
                                                #{certificate.certificateCode}
                                            </p>
                                        </div>
                                        {certificate.cmeCredits && certificate.cmeCredits > 0 && (
                                            <Badge className="bg-white/20 text-white border-0">
                                                {certificate.cmeCredits} CME Credits
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Certificate Body */}
                                <div className="p-4 space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-foreground line-clamp-2">
                                            {certificate.event.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {format(new Date(certificate.event.startDate), "MMM d, yyyy")}
                                                {certificate.event.endDate !== certificate.event.startDate && (
                                                    <> - {format(new Date(certificate.event.endDate), "MMM d, yyyy")}</>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                            <span>Issued {format(new Date(certificate.issuedAt), "MMM d, yyyy")}</span>
                                        </div>
                                        <span className="font-mono text-[10px]">
                                            Verify: {certificate.certificateCode}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-2 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", boxShadow: "0 4px 16px rgba(15,118,110,0.25)" }}
                                            onClick={() => handleDownload(certificate.id)}
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 hover:shadow-md hover:border-teal-200 transition-all"
                                            onClick={() => handleShare(certificate)}
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9"
                                            aria-label="Copy certificate link"
                                            onClick={() => handleCopyLink(certificate)}
                                        >
                                            {copiedId === certificate.id ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
