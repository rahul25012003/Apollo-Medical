"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
    CheckCircle2,
    XCircle,
    Calendar,
    MapPin,
    Award,
    User,
    Loader2,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface VerificationResult {
    valid: boolean;
    certificate?: {
        certificateCode: string;
        recipientName: string;
        title: string;
        cmeCredits: number | null;
        status: string;
        issuedAt: string;
        event: {
            title: string;
            type: string;
            startDate: string;
            endDate: string;
            location: string | null;
            city: string | null;
            organizer: string | null;
        };
    };
    message?: string;
}

export default function VerifyCertificatePage() {
    const params = useParams();
    const code = params.code as string;

    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verifyCertificate() {
            try {
                setLoading(true);
                const response = await fetch(`/api/certificates/verify/${code}`);
                const data = await response.json();

                if (data.success && data.data) {
                    setResult(data.data);
                } else {
                    setResult({ valid: false, message: data.error?.message || "Certificate not found" });
                }
            } catch (err) {
                setResult({ valid: false, message: "Verification failed" });
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (code) {
            verifyCertificate();
        }
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Verifying certificate...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Certificate Verification</h1>
                    <p className="text-muted-foreground mt-2">
                        Certificate Code: <span className="font-mono font-semibold">{code}</span>
                    </p>
                </div>

                {/* Result Card */}
                <Card className="shadow-xl">
                    <CardContent className="p-8">
                        {result?.valid && result.certificate ? (
                            <div className="space-y-6">
                                {/* Valid Badge */}
                                <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="text-lg font-semibold text-green-800">
                                            Valid Certificate
                                        </p>
                                        <p className="text-sm text-green-600">
                                            This certificate is authentic and verified
                                        </p>
                                    </div>
                                </div>

                                {/* Certificate Details */}
                                <div className="space-y-4">
                                    {/* Recipient */}
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <User className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Awarded to</p>
                                            <p className="text-xl font-semibold text-gray-900">
                                                {result.certificate.recipientName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Certificate Title */}
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <Award className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Certificate</p>
                                            <p className="font-semibold text-gray-900">
                                                {result.certificate.title}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Event */}
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Event</p>
                                            <p className="font-semibold text-gray-900">
                                                {result.certificate.event.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(result.certificate.event.startDate), "MMMM d, yyyy")}
                                                {result.certificate.event.endDate &&
                                                    result.certificate.event.startDate !== result.certificate.event.endDate && (
                                                        <> - {format(new Date(result.certificate.event.endDate), "MMMM d, yyyy")}</>
                                                    )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    {(result.certificate.event.location || result.certificate.event.city) && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Location</p>
                                                <p className="font-semibold text-gray-900">
                                                    {[result.certificate.event.location, result.certificate.event.city]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CME Credits */}
                                    {result.certificate.cmeCredits && result.certificate.cmeCredits > 0 && (
                                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                                            <p className="text-sm text-primary">CME Credits Awarded</p>
                                            <p className="text-3xl font-bold text-primary">
                                                {result.certificate.cmeCredits}
                                            </p>
                                        </div>
                                    )}

                                    {/* Issue Date */}
                                    <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                                        <p>
                                            Issued on{" "}
                                            <span className="font-semibold">
                                                {format(new Date(result.certificate.issuedAt), "MMMM d, yyyy")}
                                            </span>
                                        </p>
                                        {result.certificate.event.organizer && (
                                            <p className="mt-1">by {result.certificate.event.organizer}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                {/* Invalid Badge */}
                                <div className="inline-flex items-center justify-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
                                    <XCircle className="h-8 w-8 text-red-600" />
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-red-800">
                                            Invalid Certificate
                                        </p>
                                        <p className="text-sm text-red-600">
                                            {result?.message || "This certificate could not be verified"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 text-left">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-semibold mb-1">Possible reasons:</p>
                                        <ul className="list-disc list-inside space-y-1 text-amber-700">
                                            <li>The certificate code is incorrect</li>
                                            <li>The certificate has been revoked</li>
                                            <li>The certificate has not been issued yet</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8">
                    <Link href="/">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
