"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
    Copy,
    Check,
    Share2,
    Mail,
    QrCode,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CertificateShareProps {
    certificateCode: string;
    recipientName: string;
    recipientEmail?: string;
    eventTitle?: string;
}

export function CertificateShare({
    certificateCode,
    recipientName,
    recipientEmail,
    eventTitle,
}: CertificateShareProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);
    const [canShare, setCanShare] = useState(false);

    const verifyUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify/${certificateCode}`
        : `/verify/${certificateCode}`;

    useEffect(() => {
        setCanShare(typeof navigator !== "undefined" && !!navigator.share);
    }, []);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(verifyUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Verification link copied to clipboard");
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy link");
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Certificate - ${recipientName}`,
                    text: `Verify certificate for ${eventTitle || "event"}: ${certificateCode}`,
                    url: verifyUrl,
                });
            } catch (err) {
                // User cancelled or error
                console.error("Share failed:", err);
            }
        }
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent(`Certificate Verification - ${recipientName}`);
        const body = encodeURIComponent(
            `Hello,\n\nYou can verify the certificate for ${recipientName}${eventTitle ? ` for "${eventTitle}"` : ""} using the link below:\n\n${verifyUrl}\n\nCertificate Code: ${certificateCode}\n\nBest regards`
        );
        window.open(`mailto:${recipientEmail || ""}?subject=${subject}&body=${body}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Certificate</DialogTitle>
                    <DialogDescription>
                        Share the verification link or QR code for {recipientName}&apos;s certificate
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <QRCodeSVG
                                value={verifyUrl}
                                size={180}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <QrCode className="h-3 w-3" />
                            Scan to verify certificate
                        </p>
                    </div>

                    {/* Verification Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Verification Link</label>
                        <div className="flex gap-2">
                            <Input
                                value={verifyUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyLink}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Certificate Code */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Certificate Code</label>
                        <p className="font-mono text-sm bg-muted px-3 py-2 rounded-md">
                            {certificateCode}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        {canShare && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleNativeShare}
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Share via...
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleEmailShare}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Send via Email
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(verifyUrl, "_blank")}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Verification Page
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CertificateShare;
