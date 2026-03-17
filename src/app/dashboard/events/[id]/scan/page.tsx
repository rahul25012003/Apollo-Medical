"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowDownLeft,
    ArrowUpRight,
    Camera,
    CameraOff,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    ShieldCheck,
    ShieldX,
    Users,
    UserCheck,
    Scan,
    QrCode,
    DoorOpen,
    Clock,
    Loader2,
    Search,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    RefreshCw,
    ChevronDown,
    Wifi,
    WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events";
import { scannerService, ScanResponse, ScanLog } from "@/services/scanner";
import { zonesService, EventZone } from "@/services/zones";
import { Utensils } from "lucide-react";

type ScanMode = "CHECK_IN" | "ZONE_ACCESS" | "FOOD_DISTRIBUTION";
type ScanDirection = "IN" | "OUT";
type ScanResultType = "SUCCESS" | "DENIED" | "ALREADY_CHECKED_IN" | "ALREADY_SERVED" | "ZONE_FULL" | "NOT_FOUND" | "INVALID" | null;

interface AccessPoint {
    id: string;
    name: string;
    type: string;
    direction: string;
    isActive: boolean;
    hall?: { name: string } | null;
}

interface FoodZone {
    id: string;
    name: string;
    maxServings: number | null;
    isActive: boolean;
}

const RESULT_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string; label: string; sound: "success" | "error" | "warning" }> = {
    SUCCESS: { icon: ShieldCheck, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/50", label: "Access Granted", sound: "success" },
    DENIED: { icon: ShieldX, color: "text-red-400", bg: "from-red-500/20 to-red-600/10", border: "border-red-500/50", label: "Access Denied", sound: "error" },
    ALREADY_CHECKED_IN: { icon: AlertTriangle, color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/50", label: "Already Checked In", sound: "warning" },
    ALREADY_SERVED: { icon: AlertTriangle, color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/50", label: "Already Served", sound: "warning" },
    ZONE_FULL: { icon: ShieldX, color: "text-red-400", bg: "from-red-500/20 to-red-600/10", border: "border-red-500/50", label: "Zone Full", sound: "error" },
    NOT_FOUND: { icon: XCircle, color: "text-red-400", bg: "from-red-500/20 to-red-600/10", border: "border-red-500/50", label: "Not Found", sound: "error" },
    INVALID: { icon: XCircle, color: "text-red-400", bg: "from-red-500/20 to-red-600/10", border: "border-red-500/50", label: "Invalid QR Code", sound: "error" },
};

export default function ScannerPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    // State
    const [eventTitle, setEventTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [scanMode, setScanMode] = useState<ScanMode>("CHECK_IN");
    const [scanDirection, setScanDirection] = useState<ScanDirection>("IN");
    const [selectedZoneId, setSelectedZoneId] = useState("");
    const [selectedAccessPointId, setSelectedAccessPointId] = useState("");
    const [selectedFoodZoneId, setSelectedFoodZoneId] = useState("");
    const [zones, setZones] = useState<EventZone[]>([]);
    const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
    const [foodZones, setFoodZones] = useState<FoodZone[]>([]);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
    const [lastResultType, setLastResultType] = useState<ScanResultType>(null);
    const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
    const [manualCode, setManualCode] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [stats, setStats] = useState({ totalCheckedIn: 0, totalRegistrations: 0 });
    const [showManualEntry, setShowManualEntry] = useState(false);

    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load event data and zones
    useEffect(() => {
        async function loadData() {
            try {
                const [eventRes, zonesRes, logsRes, apRes, fzRes] = await Promise.all([
                    eventsService.getById(eventId),
                    zonesService.getAll(eventId),
                    scannerService.getLogs(eventId, { limit: 20 }),
                    fetch(`/api/events/${eventId}/access-points`).then(r => r.json()).catch(() => null),
                    fetch(`/api/events/${eventId}/food-zones`).then(r => r.json()).catch(() => null),
                ]);

                if (eventRes.success && eventRes.data) {
                    setEventTitle(eventRes.data.title);
                    setStats({
                        totalCheckedIn: 0,
                        totalRegistrations: eventRes.data._count?.registrations || 0,
                    });
                }
                if (zonesRes.success && zonesRes.data) {
                    setZones(Array.isArray(zonesRes.data) ? zonesRes.data : []);
                }
                if (logsRes.success && logsRes.data) {
                    setRecentScans(Array.isArray(logsRes.data) ? logsRes.data : []);
                }
                if (apRes?.success && apRes.data) {
                    setAccessPoints(Array.isArray(apRes.data) ? apRes.data : []);
                }
                if (fzRes?.success && fzRes.data) {
                    setFoodZones(Array.isArray(fzRes.data) ? fzRes.data : []);
                }
            } catch (err) {
                console.error("Failed to load scanner data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [eventId]);

    // Sound feedback
    const playSound = useCallback((type: "success" | "error" | "warning") => {
        if (!soundEnabled) return;
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.3;

            if (type === "success") {
                osc.frequency.value = 800;
                osc.type = "sine";
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === "error") {
                osc.frequency.value = 300;
                osc.type = "square";
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            } else {
                osc.frequency.value = 600;
                osc.type = "triangle";
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch { /* Audio not supported */ }
    }, [soundEnabled]);

    // Process QR code
    const processScan = useCallback(async (qrCode: string) => {
        if (processing) return;

        // Clear previous result
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);

        setProcessing(true);
        setLastResult(null);
        setLastResultType(null);

        try {
            const response = await scannerService.scan(eventId, {
                qrCode,
                scanType: scanMode,
                zoneId: scanMode === "ZONE_ACCESS" ? selectedZoneId : undefined,
                accessPointId: selectedAccessPointId || undefined,
                direction: scanDirection,
                foodZoneId: scanMode === "FOOD_DISTRIBUTION" ? selectedFoodZoneId : undefined,
            });

            if (response.success && response.data) {
                const result = response.data;
                setLastResult(result);
                setLastResultType(result.result as ScanResultType);

                // Play sound
                const config = RESULT_CONFIG[result.result];
                if (config) playSound(config.sound);

                // Update stats on successful check-in
                if (result.result === "SUCCESS" && scanMode === "CHECK_IN") {
                    setStats(prev => ({ ...prev, totalCheckedIn: prev.totalCheckedIn + 1 }));
                }

                // Refresh recent scans
                const logsRes = await scannerService.getLogs(eventId, { limit: 20 });
                if (logsRes.success && logsRes.data) {
                    setRecentScans(Array.isArray(logsRes.data) ? logsRes.data : []);
                }

                // Auto-clear result after 5 seconds
                resultTimeoutRef.current = setTimeout(() => {
                    setLastResult(null);
                    setLastResultType(null);
                }, 5000);
            } else {
                setLastResultType("INVALID");
                playSound("error");
            }
        } catch (err) {
            console.error("Scan error:", err);
            setLastResultType("INVALID");
            playSound("error");
        } finally {
            setProcessing(false);
        }
    }, [processing, eventId, scanMode, selectedZoneId, playSound]);

    // Start camera
    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const { Html5Qrcode } = await import("html5-qrcode");

            if (html5QrCodeRef.current) {
                try { await html5QrCodeRef.current.stop(); } catch { /* ignore */ }
            }

            const scanner = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText: string) => {
                    processScan(decodedText);
                },
                () => { /* ignore errors during scanning */ }
            );

            setCameraActive(true);
        } catch (err: any) {
            console.error("Camera error:", err);
            setCameraError(err?.message || "Failed to access camera. Please check permissions.");
            setCameraActive(false);
        }
    }, [processScan]);

    // Stop camera
    const stopCamera = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch { /* ignore */ }
            html5QrCodeRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        };
    }, [stopCamera]);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Manual entry handler
    const handleManualScan = () => {
        if (!manualCode.trim()) return;
        processScan(manualCode.trim());
        setManualCode("");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse">
                        <Scan className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-slate-400">Loading scanner...</p>
                </div>
            </div>
        );
    }

    const resultConfig = lastResultType ? RESULT_CONFIG[lastResultType] : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-card-dark border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/events/${eventId}`}>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-none">{eventTitle}</h1>
                            <p className="text-xs text-slate-400">Event Scanner</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Stats pill */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-xs font-mono text-emerald-400">{stats.totalCheckedIn}</span>
                            <span className="text-xs text-slate-500">/</span>
                            <span className="text-xs font-mono text-slate-400">{stats.totalRegistrations}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                        >
                            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Scanner */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Mode selector */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setScanMode("CHECK_IN")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                                    scanMode === "CHECK_IN"
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
                                )}
                            >
                                <UserCheck className="h-4 w-4" />
                                Check-In
                            </button>
                            <button
                                onClick={() => setScanMode("ZONE_ACCESS")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                                    scanMode === "ZONE_ACCESS"
                                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
                                )}
                            >
                                <DoorOpen className="h-4 w-4" />
                                Zone Access
                            </button>
                            <button
                                onClick={() => setScanMode("FOOD_DISTRIBUTION")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                                    scanMode === "FOOD_DISTRIBUTION"
                                        ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25"
                                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
                                )}
                            >
                                <Utensils className="h-4 w-4" />
                                Food
                            </button>
                        </div>

                        {/* Second row: selectors based on mode */}
                        <div className="flex flex-wrap gap-2">
                            {/* Access Point selector (all modes) */}
                            {accessPoints.length > 0 && (
                                <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
                                    <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Access Point" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- No Access Point --</SelectItem>
                                        {accessPoints.filter(ap => ap.isActive).map(ap => (
                                            <SelectItem key={ap.id} value={ap.id}>
                                                {ap.name} {ap.hall ? `(${ap.hall.name})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Direction toggle (CHECK_IN and ZONE_ACCESS) */}
                            {scanMode !== "FOOD_DISTRIBUTION" && (
                                <div className="flex rounded-xl overflow-hidden border border-white/10">
                                    <button
                                        onClick={() => setScanDirection("IN")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all",
                                            scanDirection === "IN"
                                                ? "bg-emerald-500/20 text-emerald-400 border-r border-white/10"
                                                : "bg-white/5 text-slate-400 hover:text-white border-r border-white/10"
                                        )}
                                    >
                                        <ArrowDownLeft className="h-3 w-3" /> IN
                                    </button>
                                    <button
                                        onClick={() => setScanDirection("OUT")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all",
                                            scanDirection === "OUT"
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-white/5 text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <ArrowUpRight className="h-3 w-3" /> OUT
                                    </button>
                                </div>
                            )}

                            {/* Zone selector */}
                            {scanMode === "ZONE_ACCESS" && (
                                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                                    <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select zone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {zones.map(zone => (
                                            <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Food zone selector */}
                            {scanMode === "FOOD_DISTRIBUTION" && (
                                <Select value={selectedFoodZoneId} onValueChange={setSelectedFoodZoneId}>
                                    <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select food zone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {foodZones.filter(fz => fz.isActive).map(fz => (
                                            <SelectItem key={fz.id} value={fz.id}>
                                                {fz.name} {fz.maxServings ? `(max: ${fz.maxServings})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Camera viewport */}
                        <div className="relative">
                            <div
                                ref={scannerRef}
                                className={cn(
                                    "relative overflow-hidden rounded-2xl border-2 transition-all duration-500",
                                    lastResultType === "SUCCESS" ? "border-emerald-500/50" :
                                    lastResultType === "DENIED" || lastResultType === "INVALID" || lastResultType === "NOT_FOUND" ? "border-red-500/50" :
                                    lastResultType === "ALREADY_CHECKED_IN" ? "border-amber-500/50" :
                                    "border-white/10"
                                )}
                            >
                                {/* QR reader element */}
                                <div
                                    id="qr-reader"
                                    className={cn(
                                        "w-full aspect-square sm:aspect-video bg-slate-900/80",
                                        !cameraActive && "flex items-center justify-center min-h-[300px] sm:min-h-[400px]"
                                    )}
                                >
                                    {!cameraActive && (
                                        <div className="text-center space-y-6 p-8">
                                            <div className="relative mx-auto w-24 h-24">
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
                                                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                    <QrCode className="h-10 w-10 text-white" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-white">Ready to Scan</p>
                                                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                                                    Start the camera to scan attendee badges, or use manual entry below
                                                </p>
                                            </div>
                                            {cameraError && (
                                                <div className="mx-auto max-w-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                                    <p className="text-sm text-red-400 flex items-center gap-2">
                                                        <CameraOff className="h-4 w-4 shrink-0" />
                                                        {cameraError}
                                                    </p>
                                                </div>
                                            )}
                                            <Button
                                                onClick={startCamera}
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 gap-2"
                                                size="lg"
                                            >
                                                <Camera className="h-5 w-5" />
                                                Start Camera
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Scan result overlay */}
                                {lastResultType && resultConfig && (
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center bg-gradient-to-br backdrop-blur-sm z-10",
                                        resultConfig.bg,
                                        lastResultType === "SUCCESS" ? "animate-scan-success" : "animate-scan-denied"
                                    )}>
                                        <div className="text-center space-y-4 p-6">
                                            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", resultConfig.border, "border-2 bg-slate-900/50")}>
                                                <resultConfig.icon className={cn("h-10 w-10", resultConfig.color)} />
                                            </div>
                                            <div>
                                                <p className={cn("text-xl font-bold", resultConfig.color)}>{resultConfig.label}</p>
                                                {lastResult?.registration && (
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-lg font-semibold text-white">{lastResult.registration.name}</p>
                                                        <p className="text-sm text-slate-300">{lastResult.registration.organization}</p>
                                                        <Badge className="mt-2 bg-white/10 text-white border-white/20">
                                                            {lastResult.registration.category || "General"}
                                                        </Badge>
                                                    </div>
                                                )}
                                                {lastResult?.message && (
                                                    <p className="text-xs text-slate-400 mt-3">{lastResult.message}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                                onClick={() => { setLastResult(null); setLastResultType(null); }}
                                            >
                                                Scan Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera controls */}
                            {cameraActive && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    <Button
                                        onClick={stopCamera}
                                        variant="outline"
                                        size="sm"
                                        className="bg-slate-900/80 border-white/20 text-white hover:bg-slate-900 backdrop-blur-sm gap-2"
                                    >
                                        <CameraOff className="h-4 w-4" />
                                        Stop
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Manual entry */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                            <button
                                onClick={() => setShowManualEntry(!showManualEntry)}
                                className="flex items-center justify-between w-full text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Manual Entry / Search
                                </span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", showManualEntry && "rotate-180")} />
                            </button>
                            {showManualEntry && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter QR code or registration ID..."
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                    <Button
                                        onClick={handleManualScan}
                                        disabled={!manualCode.trim() || processing}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shrink-0"
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Mobile stats */}
                        <div className="sm:hidden grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                                <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.totalCheckedIn}</p>
                                <p className="text-xs text-slate-400">Checked In</p>
                            </div>
                            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                                <p className="text-2xl font-bold text-blue-400 font-mono">{stats.totalRegistrations}</p>
                                <p className="text-xs text-slate-400">Total Registered</p>
                            </div>
                        </div>
                    </div>

                    {/* Right column - Stats & Scan history */}
                    <div className="space-y-4">
                        {/* Stats cards */}
                        <div className="hidden sm:grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4">
                                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                    <UserCheck className="h-4 w-4" />
                                    <span className="text-xs font-medium">Checked In</span>
                                </div>
                                <p className="text-3xl font-bold text-white font-mono">{stats.totalCheckedIn}</p>
                                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                        style={{ width: `${stats.totalRegistrations > 0 ? (stats.totalCheckedIn / stats.totalRegistrations) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-4">
                                <div className="flex items-center gap-2 text-blue-400 mb-2">
                                    <Users className="h-4 w-4" />
                                    <span className="text-xs font-medium">Registered</span>
                                </div>
                                <p className="text-3xl font-bold text-white font-mono">{stats.totalRegistrations}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                    {stats.totalRegistrations - stats.totalCheckedIn} remaining
                                </p>
                            </div>
                        </div>

                        {/* Zones quick view */}
                        {zones.length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <DoorOpen className="h-4 w-4 text-blue-400" />
                                    Event Zones
                                </h3>
                                <div className="space-y-2">
                                    {zones.map(zone => (
                                        <div key={zone.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5">
                                            <span className="text-sm text-slate-300">{zone.name}</span>
                                            <Badge variant="outline" className="text-[10px] border-white/20 text-slate-400">
                                                {zone.accessRules?.length || 0} rules
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent scans */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    Recent Scans
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                                    onClick={async () => {
                                        const res = await scannerService.getLogs(eventId, { limit: 20 });
                                        if (res.success && res.data) setRecentScans(Array.isArray(res.data) ? res.data : []);
                                    }}
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            {recentScans.length === 0 ? (
                                <div className="text-center py-8">
                                    <Scan className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                                    <p className="text-xs text-slate-500">No scans yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {recentScans.map(log => {
                                        const isSuccess = log.result === "SUCCESS";
                                        const isDenied = log.result === "DENIED";
                                        return (
                                            <div
                                                key={log.id}
                                                className={cn(
                                                    "p-3 rounded-lg border transition-colors",
                                                    isSuccess ? "bg-emerald-500/5 border-emerald-500/20" :
                                                    isDenied ? "bg-red-500/5 border-red-500/20" :
                                                    "bg-white/5 border-white/10"
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{log.registration?.name || "Unknown"}</p>
                                                        <p className="text-xs text-slate-400">{log.registration?.category || "—"}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <Badge className={cn(
                                                            "text-[10px]",
                                                            isSuccess ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                                            isDenied ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                            "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                        )}>
                                                            {log.result}
                                                        </Badge>
                                                        <p className="text-[10px] text-slate-500 mt-1">
                                                            {new Date(log.scannedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {log.zone && (
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                                        <DoorOpen className="h-2.5 w-2.5" />
                                                        {log.zone.name}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
