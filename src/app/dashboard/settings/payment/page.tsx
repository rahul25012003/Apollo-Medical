"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    CreditCard,
    QrCode,
    Ban,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Upload,
    Eye,
    EyeOff,
    Shield,
    Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";

type PaymentMode = "NONE" | "RAZORPAY" | "QR_CODE";

interface PaymentSettings {
    paymentMode: PaymentMode;
    razorpayKeyId: string | null;
    razorpayKeySecret: string | null;
    paymentQrCode: string | null;
    paymentUpiId: string | null;
    paymentInstructions: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    bankName: string | null;
    bankBeneficiary: string | null;
}

export default function PaymentSettingsPage() {
    const [settings, setSettings] = useState<PaymentSettings>({
        paymentMode: "NONE",
        razorpayKeyId: null,
        razorpayKeySecret: null,
        paymentQrCode: null,
        paymentUpiId: null,
        paymentInstructions: null,
        bankAccountNumber: null,
        bankIfscCode: null,
        bankName: null,
        bankBeneficiary: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [uploadingQr, setUploadingQr] = useState(false);

    // Fetch current settings
    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/tenants/my/payment");
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings({
                        paymentMode: data.data.paymentMode || "NONE",
                        razorpayKeyId: data.data.razorpayKeyId || null,
                        razorpayKeySecret: data.data.razorpayKeySecret || null,
                        paymentQrCode: data.data.paymentQrCode || null,
                        paymentUpiId: data.data.paymentUpiId || null,
                        paymentInstructions: data.data.paymentInstructions || null,
                        bankAccountNumber: data.data.bankAccountNumber || null,
                        bankIfscCode: data.data.bankIfscCode || null,
                        bankName: data.data.bankName || null,
                        bankBeneficiary: data.data.bankBeneficiary || null,
                    });
                }
            } catch {
                setError("Failed to load payment settings");
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/tenants/my/payment", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.error?.message || "Failed to save settings");
            }
        } catch {
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleQrUpload = async (file: File) => {
        setUploadingQr(true);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "payment-qr");
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
            const data = await res.json();
            if (data.success && data.data?.url) {
                setSettings(prev => ({ ...prev, paymentQrCode: data.data.url }));
            } else {
                setError("Failed to upload QR code image");
            }
        } catch {
            setError("Failed to upload QR code image");
        } finally {
            setUploadingQr(false);
        }
    };

    const paymentModes = [
        {
            value: "NONE" as PaymentMode,
            label: "No Online Payment",
            description: "Payment details will be shared via email after registration",
            icon: Ban,
            color: "text-gray-500",
            bg: "bg-gray-50 border-gray-200",
            activeBg: "bg-gray-100 border-gray-400 ring-2 ring-gray-300",
        },
        {
            value: "RAZORPAY" as PaymentMode,
            label: "Razorpay",
            description: "Accept payments via UPI, cards, and net banking",
            icon: CreditCard,
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
            activeBg: "bg-blue-100 border-blue-400 ring-2 ring-blue-300",
        },
        {
            value: "QR_CODE" as PaymentMode,
            label: "QR Code / UPI",
            description: "Show QR code for manual payment with proof upload",
            icon: QrCode,
            color: "text-purple-600",
            bg: "bg-purple-50 border-purple-200",
            activeBg: "bg-purple-100 border-purple-400 ring-2 ring-purple-300",
        },
    ];

    if (loading) {
        return (
            <DashboardLayout title="Payment Settings" subtitle="Configure payment options for your events">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Payment Settings" subtitle="Configure how attendees pay for your events">
            <div className="max-w-3xl space-y-6">
                {/* Payment Mode Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Payment Mode
                        </CardTitle>
                        <CardDescription>
                            Choose how you want to collect payments for event registrations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {paymentModes.map((mode) => {
                                const Icon = mode.icon;
                                const isActive = settings.paymentMode === mode.value;
                                return (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, paymentMode: mode.value }))}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                                            isActive ? mode.activeBg : mode.bg + " hover:opacity-80"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", isActive ? "bg-white shadow-sm" : "bg-white/50")}>
                                            <Icon className={cn("h-5 w-5", mode.color)} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{mode.label}</p>
                                                {isActive && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">{mode.description}</p>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                                            isActive ? "border-primary bg-primary" : "border-muted-foreground/30"
                                        )}>
                                            {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Razorpay Configuration */}
                {settings.paymentMode === "RAZORPAY" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Razorpay Configuration
                            </CardTitle>
                            <CardDescription>
                                Enter your Razorpay API credentials. Get them from your Razorpay Dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                                <Input
                                    id="razorpayKeyId"
                                    placeholder="rzp_live_xxxxxxxxxx"
                                    value={settings.razorpayKeyId || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                                <div className="relative">
                                    <Input
                                        id="razorpayKeySecret"
                                        type={showSecret ? "text" : "password"}
                                        placeholder="Enter secret key"
                                        value={settings.razorpayKeySecret || ""}
                                        onChange={(e) => setSettings(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Your secret key is encrypted and stored securely.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* QR Code Configuration */}
                {settings.paymentMode === "QR_CODE" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-purple-600" />
                                QR Code / UPI Configuration
                            </CardTitle>
                            <CardDescription>
                                Upload your payment QR code and configure UPI details. Attendees will scan and upload proof.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* QR Code Upload */}
                            <div className="space-y-2">
                                <Label>Payment QR Code</Label>
                                <div className="flex items-start gap-4">
                                    {settings.paymentQrCode ? (
                                        <div className="relative group">
                                            <img
                                                src={settings.paymentQrCode}
                                                alt="Payment QR Code"
                                                className="w-40 h-40 object-contain border-2 border-purple-200 rounded-xl p-2 bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSettings(prev => ({ ...prev, paymentQrCode: null }))}
                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-40 h-40 border-2 border-dashed border-purple-300 rounded-xl flex flex-col items-center justify-center bg-purple-50/50">
                                            <QrCode className="h-8 w-8 text-purple-300 mb-2" />
                                            <p className="text-xs text-purple-400">No QR uploaded</p>
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingQr}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleQrUpload(file);
                                            }}
                                        />
                                        {uploadingQr && (
                                            <p className="text-xs text-primary flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Upload a clear QR code image. Supports JPG, PNG, WebP.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* UPI ID */}
                            <div className="space-y-2">
                                <Label htmlFor="paymentUpiId">UPI ID</Label>
                                <Input
                                    id="paymentUpiId"
                                    placeholder="yourname@upi"
                                    value={settings.paymentUpiId || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, paymentUpiId: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Displayed below the QR code for manual UPI payment
                                </p>
                            </div>

                            {/* Bank Account Details */}
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-purple-600" />
                                    Bank Account Details (Optional)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankBeneficiary">Beneficiary Name</Label>
                                        <Input
                                            id="bankBeneficiary"
                                            placeholder="e.g., CARE in Neuromodulation"
                                            value={settings.bankBeneficiary || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, bankBeneficiary: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                                        <Input
                                            id="bankAccountNumber"
                                            placeholder="e.g., 1234567890123"
                                            value={settings.bankAccountNumber || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankIfscCode">IFSC Code</Label>
                                        <Input
                                            id="bankIfscCode"
                                            placeholder="e.g., SBIN0001234"
                                            value={settings.bankIfscCode || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, bankIfscCode: e.target.value.toUpperCase() }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Input
                                            id="bankName"
                                            placeholder="e.g., State Bank of India"
                                            value={settings.bankName || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, bankName: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Bank details shown to attendees for direct bank transfer payments
                                </p>
                            </div>

                            {/* Payment Instructions */}
                            <div className="space-y-2">
                                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                                <Textarea
                                    id="paymentInstructions"
                                    placeholder="e.g., Scan the QR code above to pay. After payment, upload a screenshot as proof."
                                    value={settings.paymentInstructions || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Custom instructions shown to attendees during payment
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Save Button & Status */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2 gradient-medical text-white"
                        size="lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Payment Settings
                            </>
                        )}
                    </Button>

                    {success && (
                        <p className="text-sm text-green-600 flex items-center gap-1 animate-fadeIn">
                            <CheckCircle2 className="h-4 w-4" />
                            Settings saved successfully!
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
