"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    QrCode,
    Loader2,
    CheckCircle2,
    Printer,
    Users,
    CreditCard,
    RefreshCw,
    Settings,
    Camera,
    FileText,
    Image,
    Palette,
    Plus,
    Trash2,
    Edit,
    Save,
    X,
    Filter,
} from "lucide-react";
import { badgesService, BadgeRegistration, BadgeCategory, DEFAULT_BADGE_CATEGORIES } from "@/services/badges";
import { QRCodeSVG } from "qrcode.react";

interface BadgesTabProps {
    eventId: string;
    eventTitle: string;
}

export function BadgesTab({ eventId, eventTitle }: BadgesTabProps) {
    const [registrations, setRegistrations] = useState<BadgeRegistration[]>([]);
    const [settings, setSettings] = useState({ requirePhoto: false, singleSided: true });
    const [badgeCategories, setBadgeCategories] = useState<BadgeCategory[]>(DEFAULT_BADGE_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [previewReg, setPreviewReg] = useState<BadgeRegistration | null>(null);
    const [blankCardCount, setBlankCardCount] = useState(10);
    const [printingBlanks, setPrintingBlanks] = useState(false);

    // Category editor state
    const [editingCategories, setEditingCategories] = useState(false);
    const [tempCategories, setTempCategories] = useState<BadgeCategory[]>([]);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [newCategory, setNewCategory] = useState<BadgeCategory>({ id: "", label: "", color: "#0d9488", bgColor: "#f0fdfa", borderColor: "#99f6e4" });

    const printRef = useRef<HTMLDivElement>(null);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const res = await badgesService.getRegistrations(eventId);
            if (res.success && res.data) {
                setRegistrations(res.data.registrations);
                setSettings({ requirePhoto: res.data.settings.requirePhoto, singleSided: res.data.settings.singleSided });
                setBadgeCategories(res.data.badgeCategories || DEFAULT_BADGE_CATEGORIES);
            }
        } catch (err) {
            console.error("Failed to fetch badge registrations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, [eventId]);

    // Get the category config for a registration's role
    const getCategoryForReg = (reg: BadgeRegistration): BadgeCategory => {
        const role = (reg.participantRole || reg.category || "delegate").toLowerCase();
        return badgeCategories.find(c => c.id === role || c.label.toLowerCase() === role)
            || badgeCategories[0]
            || DEFAULT_BADGE_CATEGORIES[0];
    };

    const filtered = registrations.filter((r) => {
        const matchesStatus = statusFilter === "all"
            || (statusFilter === "generated" && r.badgeGenerated)
            || (statusFilter === "pending" && !r.badgeGenerated && r.status === "CONFIRMED")
            || (statusFilter === "confirmed" && r.status === "CONFIRMED");
        const matchesRole = roleFilter === "all"
            || (r.participantRole || r.category || "").toLowerCase() === roleFilter.toLowerCase()
            || getCategoryForReg(r).id === roleFilter;
        return matchesStatus && matchesRole;
    });

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const toggleAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map((r) => r.id)));
    };

    const handleGenerateBadges = async (ids?: string[]) => {
        setGenerating(true);
        try {
            const res = await badgesService.generateBadges(eventId, ids);
            if (res.success) {
                await fetchRegistrations();
                setSelected(new Set());
            }
        } catch (err) {
            console.error("Failed to generate badges:", err);
        } finally {
            setGenerating(false);
        }
    };

    const handleUpdateSetting = async (key: string, value: boolean) => {
        setSavingSettings(true);
        try {
            const res = await badgesService.updateSettings(eventId, { [key]: value });
            if (res.success && res.data) {
                setSettings({ requirePhoto: res.data.requirePhoto ?? settings.requirePhoto, singleSided: res.data.singleSided ?? settings.singleSided });
            }
        } catch (err) {
            console.error("Failed to update settings:", err);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveCategories = async () => {
        setSavingSettings(true);
        try {
            const res = await badgesService.updateSettings(eventId, { badgeCategories: tempCategories });
            if (res.success && res.data) {
                setBadgeCategories(res.data.badgeCategories || tempCategories);
                setEditingCategories(false);
            }
        } catch (err) {
            console.error("Failed to save categories:", err);
        } finally {
            setSavingSettings(false);
        }
    };

    const addNewCategory = () => {
        if (!newCategory.label.trim()) return;
        const id = newCategory.label.trim().toLowerCase().replace(/\s+/g, "_");
        setTempCategories([...tempCategories, { ...newCategory, id }]);
        setNewCategory({ id: "", label: "", color: "#0d9488", bgColor: "#f0fdfa", borderColor: "#99f6e4" });
        setAddCategoryOpen(false);
    };

    const removeCategory = (id: string) => {
        setTempCategories(tempCategories.filter(c => c.id !== id));
    };

    const updateCategoryField = (id: string, field: keyof BadgeCategory, value: string) => {
        setTempCategories(tempCategories.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Derive bgColor and borderColor from main color
    const deriveColors = (hex: string) => {
        // Simple: make bgColor very light version, borderColor medium version
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const bgColor = `rgba(${r}, ${g}, ${b}, 0.06)`;
        const borderColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
        return { bgColor, borderColor };
    };

    // ==================== ID CARD HTML GENERATION ====================
    const getCardStyles = (cat: BadgeCategory) => `
        @page { size: 3.375in 5.375in; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; min-height: 100vh; gap: 20px; background: #f8fafc; }
        .card { width: 3.375in; height: 5.375in; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.08); page-break-after: always; position: relative; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, ${cat.color}, ${cat.color}dd, ${cat.color}88); }
        .header { background: linear-gradient(135deg, ${cat.color}, ${cat.color}dd); padding: 18px 16px 14px; text-align: center; color: white; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 20px; background: white; border-radius: 20px 20px 0 0; }
        .header h3 { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.95; }
        .role-badge { display: inline-block; margin-top: 6px; padding: 3px 14px; background: rgba(255,255,255,0.25); border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.3); }
        .body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12px 20px 16px; gap: 6px; position: relative; z-index: 1; }
        .photo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid ${cat.color}; box-shadow: 0 2px 12px ${cat.color}30; }
        .photo-placeholder { width: 72px; height: 72px; border-radius: 50%; border: 2px dashed ${cat.color}50; display: flex; align-items: center; justify-content: center; background: ${cat.bgColor}; }
        .name { font-size: 20px; font-weight: 800; text-align: center; color: #0f172a; line-height: 1.2; margin-top: 4px; letter-spacing: -0.3px; }
        .org { font-size: 11px; color: #64748b; text-align: center; font-weight: 500; }
        .designation { font-size: 10px; color: #94a3b8; text-align: center; }
        .category-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 14px; background: ${cat.bgColor}; color: ${cat.color}; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1.5px solid ${cat.borderColor}; letter-spacing: 0.3px; margin-top: 2px; }
        .category-dot { width: 6px; height: 6px; border-radius: 50%; background: ${cat.color}; }
        .qr-section { margin-top: auto; padding: 8px; background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .qr-placeholder { width: 100px; height: 100px; border: 2px dashed #cbd5e1; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .footer { background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 8px 16px; text-align: center; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .footer-text { font-size: 8px; color: #94a3b8; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
        .footer-dot { width: 3px; height: 3px; border-radius: 50%; background: ${cat.color}; }
        .back .body { justify-content: center; gap: 20px; }
        .back-name { font-size: 14px; font-weight: 700; color: #334155; text-align: center; }
        .back-id { font-size: 10px; color: #94a3b8; text-align: center; letter-spacing: 1px; }
    `;

    const buildCardHTML = (reg: BadgeRegistration | null, cat: BadgeCategory, isFront: boolean) => {
        const isBlank = !reg;
        const name = reg?.name || "";
        const org = reg?.organization || "";
        const designation = reg?.designation || "";
        const category = reg?.category || reg?.participantRole || cat.label;
        const role = reg?.participantRole || cat.label;
        const photoUrl = reg?.photo || "";

        if (isFront) {
            return `
                <div class="card">
                    <div class="header">
                        <h3>${eventTitle}</h3>
                        <div class="role-badge">${isBlank ? cat.label : role}</div>
                    </div>
                    <div class="body">
                        ${(settings.requirePhoto && photoUrl) ? `<img src="${photoUrl}" class="photo" />` : (settings.requirePhoto && !isBlank) ? `<div class="photo-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${cat.color}" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>` : ""}
                        <div class="name">${isBlank ? "&nbsp;" : name}</div>
                        ${org || isBlank ? `<div class="org">${isBlank ? "&nbsp;" : org}</div>` : ""}
                        ${designation ? `<div class="designation">${designation}</div>` : ""}
                        <div class="category-badge"><span class="category-dot"></span>${isBlank ? cat.label : category}</div>
                        ${settings.singleSided && !isBlank ? `<div class="qr-section" id="qr-container"></div>` : ""}
                        ${settings.singleSided && isBlank ? `<div class="qr-placeholder"></div>` : ""}
                    </div>
                    <div class="footer">
                        <span class="footer-dot"></span>
                        <span class="footer-text">ICMS Conference</span>
                        <span class="footer-dot"></span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="card back">
                    <div class="header">
                        <h3>${eventTitle}</h3>
                    </div>
                    <div class="body">
                        ${!isBlank ? `<div class="qr-section" id="qr-container"></div>` : `<div class="qr-placeholder"></div>`}
                        <div>
                            <div class="back-name">${isBlank ? "&nbsp;" : name}</div>
                            <div class="back-id">${isBlank ? "&nbsp;" : `ID: ${reg?.id?.slice(0, 8) || ""}`}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <span class="footer-dot"></span>
                        <span class="footer-text">Scan QR for verification</span>
                        <span class="footer-dot"></span>
                    </div>
                </div>
            `;
        }
    };

    const handlePrintBadge = (reg: BadgeRegistration) => {
        const cat = getCategoryForReg(reg);
        const printWindow = window.open("", "_blank", "width=400,height=600");
        if (!printWindow) return;

        const front = buildCardHTML(reg, cat, true);
        const back = !settings.singleSided ? buildCardHTML(reg, cat, false) : "";

        printWindow.document.write(`<html><head><title>Badge - ${reg.name}</title><style>${getCardStyles(cat)}</style></head><body>${front}${back}
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
            <script>
                var containers = document.querySelectorAll('#qr-container');
                var done = 0, total = containers.length;
                if (!total) setTimeout(() => window.print(), 300);
                containers.forEach(function(el) {
                    QRCode.toCanvas(document.createElement('canvas'), '${reg.qrCode || `ICMS:${reg.id}`}', { width: 100, margin: 0 }, function(err, canvas) {
                        if (!err) el.appendChild(canvas);
                        if (++done >= total) setTimeout(() => window.print(), 500);
                    });
                });
            <\/script></body></html>`);
        printWindow.document.close();
    };

    const handlePrintBlankCards = (categoryId?: string) => {
        if (blankCardCount < 1 || blankCardCount > 100) return;
        setPrintingBlanks(true);
        const cat = categoryId
            ? (badgeCategories.find(c => c.id === categoryId) || badgeCategories[0])
            : badgeCategories[0];
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) { setPrintingBlanks(false); return; }

        const cards = [];
        for (let i = 0; i < blankCardCount; i++) {
            cards.push(buildCardHTML(null, cat, true));
            if (!settings.singleSided) cards.push(buildCardHTML(null, cat, false));
        }
        printWindow.document.write(`<html><head><title>Blank Cards (${blankCardCount})</title><style>${getCardStyles(cat)}</style></head><body>${cards.join("")}<script>setTimeout(() => window.print(), 300);<\/script></body></html>`);
        printWindow.document.close();
        setPrintingBlanks(false);
    };

    const handlePrintByRole = (categoryId: string) => {
        const cat = badgeCategories.find(c => c.id === categoryId) || badgeCategories[0];
        const roleRegs = registrations.filter(r => {
            const role = (r.participantRole || r.category || "").toLowerCase();
            return (role === cat.id || role === cat.label.toLowerCase()) && r.badgeGenerated;
        });
        if (roleRegs.length === 0) return;

        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) return;

        const cards = roleRegs.map(r => {
            let html = buildCardHTML(r, cat, true);
            if (!settings.singleSided) html += buildCardHTML(r, cat, false);
            return html;
        }).join("");

        printWindow.document.write(`<html><head><title>${cat.label} Badges</title><style>${getCardStyles(cat)}</style></head><body>${cards}
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
            <script>
                var containers = document.querySelectorAll('#qr-container');
                var done = 0, total = containers.length;
                if (!total) setTimeout(() => window.print(), 300);
                containers.forEach(function(el, i) {
                    var values = [${roleRegs.map(r => `'${r.qrCode || `ICMS:${r.id}`}'`).join(",")}];
                    QRCode.toCanvas(document.createElement('canvas'), values[Math.floor(i / ${settings.singleSided ? 1 : 2})], { width: 100, margin: 0 }, function(err, canvas) {
                        if (!err) el.appendChild(canvas);
                        if (++done >= total) setTimeout(() => window.print(), 500);
                    });
                });
            <\/script></body></html>`);
        printWindow.document.close();
    };

    const stats = {
        total: registrations.length,
        confirmed: registrations.filter((r) => r.status === "CONFIRMED" || r.status === "ATTENDED").length,
        generated: registrations.filter((r) => r.badgeGenerated).length,
        pending: registrations.filter((r) => !r.badgeGenerated && r.status === "CONFIRMED").length,
    };

    // Role counts
    const roleCounts: Record<string, number> = {};
    badgeCategories.forEach(cat => {
        roleCounts[cat.id] = registrations.filter(r => {
            const role = (r.participantRole || r.category || "").toLowerCase();
            return role === cat.id || role === cat.label.toLowerCase();
        }).length;
    });

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Registrations", value: stats.total, icon: Users, gradient: "from-blue-500/15 to-blue-600/5", text: "text-blue-600", accent: "from-blue-500 to-blue-600" },
                    { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, gradient: "from-emerald-500/15 to-emerald-600/5", text: "text-emerald-600", accent: "from-emerald-500 to-emerald-600" },
                    { label: "Badges Generated", value: stats.generated, icon: CreditCard, gradient: "from-teal-500/15 to-teal-600/5", text: "text-teal-600", accent: "from-teal-500 to-cyan-600" },
                    { label: "Pending", value: stats.pending, icon: QrCode, gradient: "from-amber-500/15 to-amber-600/5", text: "text-amber-600", accent: "from-amber-500 to-orange-500" },
                ].map((s, i) => (
                    <Card key={i} className="card-premium overflow-hidden">
                        <div className={`h-1 bg-gradient-to-r ${s.accent}`} />
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.gradient}`}>
                                    <s.icon className={`h-5 w-5 ${s.text}`} />
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold animate-count ${s.text}`}>{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Role-based overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {badgeCategories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setRoleFilter(roleFilter === cat.id ? "all" : cat.id)}
                        className={`card-premium p-4 text-center transition-all cursor-pointer ${roleFilter === cat.id ? "ring-2 ring-offset-2" : ""}`}
                        style={{ borderColor: roleFilter === cat.id ? cat.color : undefined, "--tw-ring-color": cat.color } as React.CSSProperties}
                    >
                        <div
                            className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                            style={{ backgroundColor: cat.bgColor, border: `2px solid ${cat.borderColor}` }}
                        >
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        </div>
                        <p className="font-semibold text-sm" style={{ color: cat.color }}>{cat.label}</p>
                        <p className="text-xl font-bold mt-1">{roleCounts[cat.id] || 0}</p>
                        <p className="text-xs text-muted-foreground">registered</p>
                    </button>
                ))}
            </div>

            {/* ID Card & Photo Settings */}
            <Card className="card-premium">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500/15 to-cyan-500/10">
                                    <Settings className="h-4 w-4 text-teal-600" />
                                </div>
                                ID Card & Photo Settings
                            </CardTitle>
                            <CardDescription>Configure photo requirements, card layout, and role categories</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Toggles row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-slate-50/80 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-500/10">
                                    <Camera className="h-4 w-4 text-violet-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Require Photo</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {settings.requirePhoto ? "Photos required on ID cards" : "No photos needed"}
                                    </p>
                                </div>
                            </div>
                            <Switch checked={settings.requirePhoto} onCheckedChange={(v) => handleUpdateSetting("requirePhoto", v)} disabled={savingSettings} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-slate-50/80 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Single-Sided</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {settings.singleSided ? "QR on front side" : "QR on back (double-sided)"}
                                    </p>
                                </div>
                            </div>
                            <Switch checked={settings.singleSided} onCheckedChange={(v) => handleUpdateSetting("singleSided", v)} disabled={savingSettings} />
                        </div>
                    </div>

                    {/* Badge Role Categories */}
                    <div className="p-4 rounded-xl border bg-gradient-to-r from-violet-50/30 to-purple-50/20 border-violet-200/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-violet-600" />
                                <p className="font-medium text-sm">Badge Role Categories</p>
                            </div>
                            {!editingCategories ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setEditingCategories(true); setTempCategories([...badgeCategories]); }}
                                    className="h-8"
                                >
                                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingCategories(false)}>
                                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
                                        onClick={handleSaveCategories}
                                        disabled={savingSettings}
                                    >
                                        {savingSettings ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>

                        {!editingCategories ? (
                            <div className="flex flex-wrap gap-2">
                                {badgeCategories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium"
                                        style={{ backgroundColor: cat.bgColor, borderColor: cat.borderColor, color: cat.color }}
                                    >
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.label}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tempCategories.map((cat) => (
                                    <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border">
                                        <input
                                            type="color"
                                            value={cat.color}
                                            onChange={(e) => {
                                                const { bgColor, borderColor } = deriveColors(e.target.value);
                                                setTempCategories(tempCategories.map(c =>
                                                    c.id === cat.id ? { ...c, color: e.target.value, bgColor, borderColor } : c
                                                ));
                                            }}
                                            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                                        />
                                        <Input
                                            value={cat.label}
                                            onChange={(e) => updateCategoryField(cat.id, "label", e.target.value)}
                                            className="flex-1 h-8 text-sm"
                                            placeholder="Role name"
                                        />
                                        <div className="px-3 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: cat.bgColor, color: cat.color, border: `1px solid ${cat.borderColor}` }}>
                                            Preview
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => removeCategory(cat.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-9 border-dashed"
                                    onClick={() => setAddCategoryOpen(true)}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Print Blank Cards */}
                    <div className="p-4 rounded-xl border bg-gradient-to-r from-amber-50/50 to-orange-50/30 border-amber-200/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <FileText className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Print Empty / Blank ID Cards</p>
                                <p className="text-xs text-muted-foreground">Print blank cards for walk-in registrations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={blankCardCount}
                                onChange={(e) => setBlankCardCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                className="w-20 h-9 text-center"
                            />
                            <Select onValueChange={(v) => handlePrintBlankCards(v)}>
                                <SelectTrigger className="w-48 h-9">
                                    <SelectValue placeholder="Select role to print" />
                                </SelectTrigger>
                                <SelectContent>
                                    {badgeCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                {cat.label} Cards
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Registrations Table */}
            <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <QrCode className="h-5 w-5" />
                            ID Cards / Badges
                        </CardTitle>
                        <CardDescription>Generate and print role-based ID cards</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchRegistrations} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        {selected.size > 0 ? (
                            <Button size="sm" onClick={() => handleGenerateBadges(Array.from(selected))} disabled={generating} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <QrCode className="h-4 w-4 mr-1" />}
                                Generate ({selected.size})
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => handleGenerateBadges()} disabled={generating || stats.pending === 0} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <QrCode className="h-4 w-4 mr-1" />}
                                Generate All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="generated">Generated</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {badgeCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                            {cat.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>

                        {/* Print by role buttons */}
                        {roleFilter !== "all" && (
                            <Button size="sm" variant="outline" onClick={() => handlePrintByRole(roleFilter)} className="ml-auto">
                                <Printer className="h-3.5 w-3.5 mr-1" />
                                Print All {badgeCategories.find(c => c.id === roleFilter)?.label || ""} Badges
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
                                <QrCode className="h-8 w-8 text-teal-500/50" />
                            </div>
                            <p className="font-medium text-muted-foreground">No registrations found</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Confirm registrations to generate badges</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border overflow-hidden">
                            <Table className="table-premium">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                                        </TableHead>
                                        {settings.requirePhoto && <TableHead className="w-14">Photo</TableHead>}
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Organization</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Badge</TableHead>
                                        <TableHead className="w-24">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((reg) => {
                                        const cat = getCategoryForReg(reg);
                                        return (
                                            <TableRow key={reg.id}>
                                                <TableCell>
                                                    <Checkbox checked={selected.has(reg.id)} onCheckedChange={() => toggleSelect(reg.id)} />
                                                </TableCell>
                                                {settings.requirePhoto && (
                                                    <TableCell>
                                                        {reg.photo ? (
                                                            <img src={reg.photo} alt={reg.name} className="w-9 h-9 rounded-full object-cover" style={{ border: `2px solid ${cat.color}` }} />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: cat.borderColor, backgroundColor: cat.bgColor }}>
                                                                <Image className="h-3.5 w-3.5" style={{ color: cat.color }} />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <p className="font-medium text-sm">{reg.name}</p>
                                                    <p className="text-xs text-muted-foreground">{reg.email}</p>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-sm">{reg.organization || "-"}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                        style={{ backgroundColor: cat.bgColor, color: cat.color, border: `1px solid ${cat.borderColor}` }}
                                                    >
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                        {cat.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {reg.badgeGenerated ? (
                                                        <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Generated
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {reg.badgeGenerated && (
                                                            <>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewReg(reg)} title="Preview">
                                                                    <QrCode className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handlePrintBadge(reg)} title="Print">
                                                                    <Printer className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Badge Preview Dialog */}
            <Dialog open={!!previewReg} onOpenChange={() => setPreviewReg(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Badge Preview</DialogTitle>
                    </DialogHeader>
                    {previewReg && (() => {
                        const cat = getCategoryForReg(previewReg);
                        return (
                            <div ref={printRef} className="mx-auto space-y-4">
                                {/* Front side */}
                                <div className="w-[280px] rounded-2xl overflow-hidden shadow-xl mx-auto border" style={{ borderColor: `${cat.color}20` }}>
                                    <div className="relative">
                                        <div className="px-4 py-4 text-center text-white" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` }}>
                                            <h3 className="font-bold text-sm tracking-wide uppercase opacity-95">{eventTitle}</h3>
                                            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                                                style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.3)" }}>
                                                {previewReg.participantRole || cat.label}
                                            </span>
                                        </div>
                                        <div className="h-4 bg-white rounded-t-[20px] -mt-3 relative z-10" />
                                    </div>
                                    <div className="flex flex-col items-center px-4 pb-4 gap-2 bg-white -mt-2">
                                        {settings.requirePhoto && (
                                            previewReg.photo ? (
                                                <img src={previewReg.photo} alt={previewReg.name} className="w-16 h-16 rounded-full object-cover" style={{ border: `3px solid ${cat.color}`, boxShadow: `0 2px 12px ${cat.color}30` }} />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: cat.borderColor, backgroundColor: cat.bgColor }}>
                                                    <Camera className="h-5 w-5" style={{ color: cat.color }} />
                                                </div>
                                            )
                                        )}
                                        <h2 className="text-lg font-extrabold text-center text-slate-900 leading-tight">{previewReg.name}</h2>
                                        {previewReg.organization && <p className="text-xs text-slate-500 text-center">{previewReg.organization}</p>}
                                        {previewReg.designation && <p className="text-[11px] text-slate-400 text-center">{previewReg.designation}</p>}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                            style={{ backgroundColor: cat.bgColor, color: cat.color, border: `1.5px solid ${cat.borderColor}` }}>
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                            {previewReg.category || cat.label}
                                        </span>
                                        {settings.singleSided && (
                                            <div className="mt-2 p-2 rounded-xl border border-slate-200">
                                                <QRCodeSVG value={previewReg.qrCode || `ICMS:${previewReg.id}`} size={100} level="M" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 text-center border-t flex items-center justify-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">ICMS Conference</span>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    </div>
                                </div>

                                {/* Back side */}
                                {!settings.singleSided && (
                                    <>
                                        <p className="text-xs text-center text-muted-foreground font-medium">Back Side</p>
                                        <div className="w-[280px] rounded-2xl overflow-hidden shadow-xl mx-auto border" style={{ borderColor: `${cat.color}20` }}>
                                            <div className="px-4 py-3 text-center text-white" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` }}>
                                                <h3 className="font-bold text-sm tracking-wide uppercase opacity-95">{eventTitle}</h3>
                                            </div>
                                            <div className="flex flex-col items-center justify-center py-8 px-4 gap-4 bg-white">
                                                <div className="p-2 rounded-xl border border-slate-200">
                                                    <QRCodeSVG value={previewReg.qrCode || `ICMS:${previewReg.id}`} size={130} level="M" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate-700">{previewReg.name}</p>
                                                    <p className="text-xs text-slate-400 mt-1 tracking-wider">ID: {previewReg.id.slice(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 px-4 py-2 text-center border-t">
                                                <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">Scan QR for verification</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-center gap-2 mt-3">
                                    <Button size="sm" variant="outline" onClick={() => handlePrintBadge(previewReg)}>
                                        <Printer className="h-4 w-4 mr-1" /> Print
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Add Category Dialog */}
            <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Badge Category</DialogTitle>
                        <DialogDescription>Create a new role category with custom color</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Role Name</Label>
                            <Input value={newCategory.label} onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })} placeholder="e.g. Faculty, Guest, Media" />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={newCategory.color}
                                    onChange={(e) => {
                                        const { bgColor, borderColor } = deriveColors(e.target.value);
                                        setNewCategory({ ...newCategory, color: e.target.value, bgColor, borderColor });
                                    }}
                                    className="w-12 h-10 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <div className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                                    style={{ backgroundColor: newCategory.bgColor, color: newCategory.color, border: `1.5px solid ${newCategory.borderColor}` }}>
                                    {newCategory.label || "Preview"}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
                        <Button onClick={addNewCategory} disabled={!newCategory.label.trim()} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                            Add Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
