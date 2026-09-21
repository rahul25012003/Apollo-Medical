"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Shield,
    Users,
    UserCheck,
    Utensils,
    Clock,
    Plus,
    Trash2,
    Edit2,
    RefreshCw,
    ExternalLink,
    QrCode,
    ArrowDownLeft,
    ArrowUpRight,
    Activity,
    Loader2,
} from "lucide-react";

// ---------- Types ----------

interface ScanEntry {
    id: string;
    time: string;
    attendeeName: string;
    result: "SUCCESS" | "DENIED" | "ALREADY";
    scanType: string;
    accessPointName: string;
    direction: "IN" | "OUT";
}

interface AccessPoint {
    id: string;
    name: string;
    type: "ACCESS" | "FOOD";
    hallName: string;
    direction: "IN" | "OUT" | "BOTH";
    active: boolean;
}

interface FoodZone {
    id: string;
    name: string;
    served: number;
    maxServings: number;
}

interface HourlyData {
    hour: string;
    count: number;
}

interface DashboardStats {
    checkedInCount: number;
    totalRegistered: number;
    foodDistributedToday: number;
    activeAccessPoints: number;
    totalAccessPoints: number;
    peakHour: string;
    peakHourCount: number;
    recentScans: ScanEntry[];
    accessPoints: AccessPoint[];
    foodZones: FoodZone[];
    hourlyCheckins: HourlyData[];
}

// ---------- Helpers ----------

const defaultStats: DashboardStats = {
    checkedInCount: 0,
    totalRegistered: 0,
    foodDistributedToday: 0,
    activeAccessPoints: 0,
    totalAccessPoints: 0,
    peakHour: "--",
    peakHourCount: 0,
    recentScans: [],
    accessPoints: [],
    foodZones: [],
    hourlyCheckins: Array.from({ length: 11 }, (_, i) => ({
        hour: `${(8 + i).toString().padStart(2, "0")}:00`,
        count: 0,
    })),
};

function resultBadgeVariant(result: ScanEntry["result"]) {
    switch (result) {
        case "SUCCESS":
            return "success";
        case "DENIED":
            return "destructive";
        case "ALREADY":
            return "warning";
        default:
            return "secondary" as const;
    }
}

function typeBadgeClass(type: AccessPoint["type"]) {
    return type === "FOOD"
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : "bg-blue-100 text-blue-700 border-blue-200";
}

function directionLabel(dir: "IN" | "OUT" | "BOTH") {
    if (dir === "IN") return "Entry";
    if (dir === "OUT") return "Exit";
    return "Both";
}

// ---------- Component ----------

interface AccessControlDashboardProps {
    eventId: string;
}

export function AccessControlDashboard({ eventId }: AccessControlDashboardProps) {
    const [stats, setStats] = useState<DashboardStats>(defaultStats);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dialogs
    const [addPointOpen, setAddPointOpen] = useState(false);
    const [editPointId, setEditPointId] = useState<string | null>(null);
    const [addFoodZoneOpen, setAddFoodZoneOpen] = useState(false);

    // Access point form
    const [pointName, setPointName] = useState("");
    const [pointType, setPointType] = useState<"ACCESS" | "FOOD">("ACCESS");
    const [pointHall, setPointHall] = useState("");
    const [pointDirection, setPointDirection] = useState<"IN" | "OUT" | "BOTH">("IN");

    // Food zone form
    const [foodZoneName, setFoodZoneName] = useState("");
    const [foodZoneMax, setFoodZoneMax] = useState("");

    // ---------- Fetch ----------

    const fetchStats = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch(`/api/events/${eventId}/access-control/stats`);
            const data = await res.json();
            if (data.success && data.data) {
                setStats({
                    ...defaultStats,
                    ...data.data,
                    hourlyCheckins:
                        data.data.hourlyCheckins?.length > 0
                            ? data.data.hourlyCheckins
                            : defaultStats.hourlyCheckins,
                });
            }
        } catch (err) {
            console.error("Failed to fetch access control stats:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto-refresh scan feed every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchStats(true), 10_000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // ---------- Handlers ----------

    const handleToggleAccessPoint = async (id: string, active: boolean) => {
        try {
            await fetch(`/api/events/${eventId}/access-control/access-points/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active }),
            });
            setStats((prev) => ({
                ...prev,
                accessPoints: prev.accessPoints.map((ap) =>
                    ap.id === id ? { ...ap, active } : ap
                ),
                activeAccessPoints: prev.accessPoints.filter((ap) =>
                    ap.id === id ? active : ap.active
                ).length,
            }));
        } catch (err) {
            console.error("Failed to toggle access point:", err);
        }
    };

    const resetPointForm = () => {
        setPointName("");
        setPointType("ACCESS");
        setPointHall("");
        setPointDirection("IN");
        setEditPointId(null);
    };

    const handleSaveAccessPoint = async () => {
        if (!pointName.trim()) return;
        const payload = {
            name: pointName.trim(),
            type: pointType,
            hallName: pointHall.trim(),
            direction: pointDirection,
        };
        try {
            if (editPointId) {
                await fetch(`/api/events/${eventId}/access-control/access-points/${editPointId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch(`/api/events/${eventId}/access-control/access-points`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            resetPointForm();
            setAddPointOpen(false);
            fetchStats(true);
        } catch (err) {
            console.error("Failed to save access point:", err);
        }
    };

    const handleDeleteAccessPoint = async (id: string) => {
        try {
            await fetch(`/api/events/${eventId}/access-control/access-points/${id}`, {
                method: "DELETE",
            });
            fetchStats(true);
        } catch (err) {
            console.error("Failed to delete access point:", err);
        }
    };

    const handleEditAccessPoint = (ap: AccessPoint) => {
        setPointName(ap.name);
        setPointType(ap.type);
        setPointHall(ap.hallName);
        setPointDirection(ap.direction);
        setEditPointId(ap.id);
        setAddPointOpen(true);
    };

    const handleSaveFoodZone = async () => {
        if (!foodZoneName.trim()) return;
        try {
            await fetch(`/api/events/${eventId}/access-control/food-zones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: foodZoneName.trim(),
                    maxServings: parseInt(foodZoneMax) || 500,
                }),
            });
            setFoodZoneName("");
            setFoodZoneMax("");
            setAddFoodZoneOpen(false);
            fetchStats(true);
        } catch (err) {
            console.error("Failed to save food zone:", err);
        }
    };

    const handleDeleteFoodZone = async (id: string) => {
        try {
            await fetch(`/api/events/${eventId}/access-control/food-zones/${id}`, {
                method: "DELETE",
            });
            fetchStats(true);
        } catch (err) {
            console.error("Failed to delete food zone:", err);
        }
    };

    // ---------- Computed ----------

    const checkedInPercent =
        stats.totalRegistered > 0
            ? Math.round((stats.checkedInCount / stats.totalRegistered) * 100)
            : 0;

    const maxHourlyCount = Math.max(...stats.hourlyCheckins.map((h) => h.count), 1);

    // ---------- Loading ----------

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ---------- Render ----------

    return (
        <div className="space-y-6">
            {/* ===== Metric Cards ===== */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Checked In */}
                <div className="stat-card-premium rounded-xl border p-5">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Total Checked In</span>
                        <div className="rounded-lg p-2 bg-gradient-to-br from-blue-500 to-blue-600">
                            <UserCheck className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold gradient-text-teal">{checkedInPercent}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.checkedInCount} of {stats.totalRegistered} registered
                    </p>
                </div>

                {/* Food Distributed */}
                <div className="stat-card-premium rounded-xl border p-5">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Food Distributed Today</span>
                        <div className="rounded-lg p-2 bg-gradient-to-br from-emerald-500 to-emerald-600">
                            <Utensils className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold gradient-text-teal">
                        {stats.foodDistributedToday}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Meals served</p>
                </div>

                {/* Active Access Points */}
                <div className="stat-card-premium rounded-xl border p-5">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Active Access Points</span>
                        <div className="rounded-lg p-2 bg-gradient-to-br from-violet-500 to-violet-600">
                            <Shield className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold gradient-text-teal">
                        {stats.activeAccessPoints}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        of {stats.totalAccessPoints} configured
                    </p>
                </div>

                {/* Peak Hour */}
                <div className="stat-card-premium rounded-xl border p-5">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Peak Hour</span>
                        <div className="rounded-lg p-2 bg-gradient-to-br from-amber-500 to-amber-600">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold gradient-text-teal">{stats.peakHour}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.peakHourCount} check-ins
                    </p>
                </div>
            </div>

            {/* ===== Middle: Live Feed + Access Points ===== */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Live Scan Feed - 3/5 */}
                <Card className="lg:col-span-3 card-premium">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-teal-600" />
                            Live Scan Feed
                            {refreshing && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            )}
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchStats(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats.recentScans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <QrCode className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground">No scans recorded yet</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Scans will appear here in real-time as attendees check in
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                                {stats.recentScans.slice(0, 20).map((scan) => (
                                    <div
                                        key={scan.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-14">
                                                <Clock className="h-3 w-3" />
                                                {scan.time}
                                            </div>
                                            <span className="font-medium text-sm truncate">
                                                {scan.attendeeName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant={resultBadgeVariant(scan.result) as "success" | "destructive" | "warning" | "secondary"}>
                                                {scan.result}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                {scan.scanType}
                                            </span>
                                            <span className="text-xs text-muted-foreground hidden md:inline">
                                                {scan.accessPointName}
                                            </span>
                                            {scan.direction === "IN" ? (
                                                <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                                            ) : (
                                                <ArrowUpRight className="h-3.5 w-3.5 text-orange-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Access Points - 2/5 */}
                <Card className="lg:col-span-2 card-premium">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-violet-600" />
                            Access Points
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    resetPointForm();
                                    setAddPointOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    window.open(
                                        `/dashboard/events/${eventId}/scan`,
                                        "_blank"
                                    )
                                }
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open Scanner
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.accessPoints.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Shield className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No access points configured</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Add entry gates, food counters, and more
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                                {stats.accessPoints.map((ap) => (
                                    <div
                                        key={ap.id}
                                        className="flex items-center justify-between gap-2 p-3 rounded-lg border hover:border-primary/30 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{ap.name}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className={typeBadgeClass(ap.type)}
                                                >
                                                    {ap.type}
                                                </Badge>
                                                {ap.hallName && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {ap.hallName}
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {directionLabel(ap.direction)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Switch
                                                checked={ap.active}
                                                onCheckedChange={(v) =>
                                                    handleToggleAccessPoint(ap.id, v)
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleEditAccessPoint(ap)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteAccessPoint(ap.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ===== Hourly Check-ins Chart ===== */}
            <Card className="card-premium">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                        Hourly Check-ins
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-48 pt-4">
                        {stats.hourlyCheckins.map((h) => {
                            const heightPercent = Math.max(
                                (h.count / maxHourlyCount) * 100,
                                2
                            );
                            return (
                                <div
                                    key={h.hour}
                                    className="flex-1 flex flex-col items-center gap-1"
                                >
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {h.count > 0 ? h.count : ""}
                                    </span>
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-teal-600 to-cyan-400 transition-all duration-500"
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        {h.hour.replace(":00", "")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ===== Food Distribution ===== */}
            <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Utensils className="h-5 w-5 text-emerald-600" />
                        Food Distribution
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setFoodZoneName("");
                            setFoodZoneMax("");
                            setAddFoodZoneOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Food Zone
                    </Button>
                </CardHeader>
                <CardContent>
                    {stats.foodZones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Utensils className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                No food zones configured
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Add food distribution zones to track meal servings
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {stats.foodZones.map((zone) => {
                                const percent =
                                    zone.maxServings > 0
                                        ? Math.round(
                                              (zone.served / zone.maxServings) * 100
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={zone.id}
                                        className="rounded-lg border p-4 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-medium text-sm">{zone.name}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteFoodZone(zone.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="text-2xl font-bold gradient-text-teal">
                                            {zone.served}
                                            <span className="text-sm font-normal text-muted-foreground">
                                                {" "}
                                                / {zone.maxServings}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(percent, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {percent}% distributed
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ===== Add/Edit Access Point Dialog ===== */}
            <Dialog
                open={addPointOpen}
                onOpenChange={(open) => {
                    if (!open) resetPointForm();
                    setAddPointOpen(open);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editPointId ? "Edit Access Point" : "Add Access Point"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                placeholder="e.g., Main Gate, Food Counter A"
                                value={pointName}
                                onChange={(e) => setPointName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={pointType}
                                onValueChange={(v) =>
                                    setPointType(v as "ACCESS" | "FOOD")
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACCESS">Access Gate</SelectItem>
                                    <SelectItem value="FOOD">Food Counter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Hall / Location</label>
                            <Input
                                placeholder="e.g., Hall A, Ground Floor"
                                value={pointHall}
                                onChange={(e) => setPointHall(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Direction</label>
                            <Select
                                value={pointDirection}
                                onValueChange={(v) =>
                                    setPointDirection(v as "IN" | "OUT" | "BOTH")
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN">Entry Only</SelectItem>
                                    <SelectItem value="OUT">Exit Only</SelectItem>
                                    <SelectItem value="BOTH">Both</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetPointForm();
                                setAddPointOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAccessPoint}
                            disabled={!pointName.trim()}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        >
                            {editPointId ? "Update" : "Add"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Add Food Zone Dialog ===== */}
            <Dialog open={addFoodZoneOpen} onOpenChange={setAddFoodZoneOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Food Zone</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Zone Name</label>
                            <Input
                                placeholder="e.g., Lunch Counter, Tea Stall"
                                value={foodZoneName}
                                onChange={(e) => setFoodZoneName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Max Servings</label>
                            <Input
                                type="number"
                                placeholder="e.g., 500"
                                value={foodZoneMax}
                                onChange={(e) => setFoodZoneMax(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAddFoodZoneOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveFoodZone}
                            disabled={!foodZoneName.trim()}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
