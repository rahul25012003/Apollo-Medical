"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Download,
    MoreHorizontal,
    Award,
    Send,
    Plus,
    Eye,
    Mail,
    Trash2,
    CheckCircle2,
    Clock,
    RefreshCw,
    Printer,
    Copy,
    ExternalLink,
    Loader2,
    X,
    FileText,
    Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { certificatesService } from "@/services/certificates";
import { eventsService, Event } from "@/services/events";
import { registrationsService } from "@/services/registrations";
import { CertificateTemplate, CertificateData, EventType } from "@/components/certificates/certificate-template";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

interface Certificate {
    id: string;
    certificateCode: string;
    recipientName: string;
    recipientEmail: string;
    title: string | null;
    description: string | null;
    cmeCredits: number | null;
    status: "PENDING" | "ISSUED" | "REVOKED";
    issuedAt: string | null;
    downloadCount: number;
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

// Template previews for different event types
const templatePreviews = [
    { type: "CONFERENCE" as EventType, name: "Conference", color: "linear-gradient(135deg, #1e40af, #3b82f6)", description: "Certificate of Attendance" },
    { type: "WORKSHOP" as EventType, name: "Workshop", color: "linear-gradient(135deg, #047857, #10b981)", description: "Certificate of Completion" },
    { type: "SEMINAR" as EventType, name: "Seminar", color: "linear-gradient(135deg, #c2410c, #f97316)", description: "Certificate of Participation" },
    { type: "CME" as EventType, name: "CME", color: "linear-gradient(135deg, #b91c1c, #ef4444)", description: "CME Credit Certificate" },
    { type: "WEBINAR" as EventType, name: "Webinar", color: "linear-gradient(135deg, #6d28d9, #a855f7)", description: "Certificate of Attendance" },
    { type: "SYMPOSIUM" as EventType, name: "Symposium", color: "linear-gradient(135deg, #0f766e, #14b8a6)", description: "Certificate of Participation" },
];

export default function CertificatesPage() {
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);
    const [selectedTemplateType, setSelectedTemplateType] = useState<EventType | null>(null);
    const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    // Revoke dialog state
    const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState("");
    const [certToRevoke, setCertToRevoke] = useState<string | null>(null);

    // Generate form state
    const [generateForm, setGenerateForm] = useState({
        eventId: "",
        recipients: "attended",
        cmeCredits: "",
        signatory1Name: "",
        signatory1Title: "",
        signatory2Name: "",
        signatory2Title: "",
        autoEmail: true,
        enableDownload: true,
    });
    const [generating, setGenerating] = useState(false);

    // Custom certificate state
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [customForm, setCustomForm] = useState({
        eventId: "",
        registrationId: "",
        certificateType: "",
        sessionId: "",
        title: "",
        cmeCredits: "",
    });
    const [customDelegateSearch, setCustomDelegateSearch] = useState("");
    const [customTitleSearch, setCustomTitleSearch] = useState("");
    const [customRegistrations, setCustomRegistrations] = useState<any[]>([]);
    const [customSessions, setCustomSessions] = useState<any[]>([]);
    const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
    const [customIssuing, setCustomIssuing] = useState(false);

    // Fetch registrations for custom cert delegate search
    useEffect(() => {
        if (!customForm.eventId) { setCustomRegistrations([]); return; }
        const fetchRegs = async () => {
            try {
                const res = await registrationsService.getAll({ eventId: customForm.eventId, limit: 500, ...tenantFilterParams });
                if (res.success && Array.isArray(res.data)) setCustomRegistrations(res.data);
            } catch { /* */ }
        };
        fetchRegs();
    }, [customForm.eventId]);

    // Fetch sessions for custom cert title search
    useEffect(() => {
        if (!customForm.eventId) { setCustomSessions([]); return; }
        const fetchSessions = async () => {
            try {
                const res = await fetch(`/api/events/${customForm.eventId}/sessions`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) setCustomSessions(data.data);
                }
            } catch { /* */ }
        };
        fetchSessions();
    }, [customForm.eventId]);

    const filteredDelegates = customRegistrations.filter((r: any) =>
        !customDelegateSearch || r.name?.toLowerCase().includes(customDelegateSearch.toLowerCase()) || r.email?.toLowerCase().includes(customDelegateSearch.toLowerCase())
    ).slice(0, 10);

    const filteredSessions = customSessions.filter((s: any) =>
        !customTitleSearch || s.title?.toLowerCase().includes(customTitleSearch.toLowerCase())
    );

    const handleCustomIssue = async () => {
        if (!customForm.registrationId || !customForm.eventId || !selectedDelegate) {
            toast.error("Please select a delegate and certificate type");
            return;
        }
        try {
            setCustomIssuing(true);
            const payload: any = {
                registrationId: customForm.registrationId,
                eventId: customForm.eventId,
                recipientName: selectedDelegate.name,
                recipientEmail: selectedDelegate.email,
                title: customForm.title || undefined,
                cmeCredits: customForm.cmeCredits ? parseInt(customForm.cmeCredits) : undefined,
                status: "ISSUED",
            };

            const res = await certificatesService.create(payload);
            if (res.success) {
                toast.success("Certificate issued successfully!");
                setIsCustomOpen(false);
                setCustomForm({ eventId: "", registrationId: "", certificateType: "", sessionId: "", title: "", cmeCredits: "" });
                setSelectedDelegate(null);
                setCustomDelegateSearch("");
                setCustomTitleSearch("");
                // Refresh
                const certsRes = await certificatesService.getAll({ ...tenantFilterParams, limit: 500 });
                if (certsRes.success && certsRes.data) {
                    setCertificates(Array.isArray(certsRes.data) ? certsRes.data as unknown as Certificate[] : []);
                }
            } else {
                toast.error((res as any).error?.message || "Failed to issue certificate");
            }
        } catch (err) {
            toast.error("Failed to issue certificate");
        } finally {
            setCustomIssuing(false);
        }
    };

    // Fetch data
    useEffect(() => {
        if (sessionLoading) return;
        async function fetchData() {
            try {
                setLoading(true);
                const [certsRes, eventsRes] = await Promise.all([
                    certificatesService.getAll({ ...tenantFilterParams, limit: 500 }),
                    eventsService.getAll({ ...tenantFilterParams, limit: 200 }),
                ]);

                if (certsRes.success && certsRes.data) {
                    setCertificates(Array.isArray(certsRes.data) ? certsRes.data as unknown as Certificate[] : []);
                }
                if (eventsRes.success && eventsRes.data) {
                    setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [sessionLoading, effectiveTenantId]);

    // Filter certificates
    const filteredCertificates = certificates.filter((cert) => {
        const matchesSearch =
            searchQuery === "" ||
            cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.certificateCode.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab =
            selectedTab === "all" ||
            cert.status.toLowerCase() === selectedTab;

        return matchesSearch && matchesTab;
    });

    const issuedCount = certificates.filter((c) => c.status === "ISSUED").length;
    const pendingCount = certificates.filter((c) => c.status === "PENDING").length;
    const revokedCount = certificates.filter((c) => c.status === "REVOKED").length;

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { class: string; icon: React.ElementType; label: string }> = {
            ISSUED: { class: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50 font-semibold shadow-sm", icon: CheckCircle2, label: "Issued" },
            PENDING: { class: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200/50 font-semibold shadow-sm", icon: Clock, label: "Pending" },
            REVOKED: { class: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50 font-semibold shadow-sm", icon: X, label: "Revoked" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={cn("gap-1", config.class)}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const toggleCertificate = (id: string) => {
        setSelectedCertificates((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedCertificates.length === filteredCertificates.length) {
            setSelectedCertificates([]);
        } else {
            setSelectedCertificates(filteredCertificates.map((c) => c.id));
        }
    };

    // Open certificate in new tab
    const handleViewCertificate = (cert: Certificate) => {
        window.open(`/dashboard/certificates/${cert.id}/view`, "_blank");
    };

    // Issue certificate
    const handleIssueCertificate = async (certId: string) => {
        try {
            setActionInProgress(certId);
            const response = await certificatesService.issue(certId);
            if (response.success) {
                // Refresh certificates
                const certsRes = await certificatesService.getAll();
                if (certsRes.success && certsRes.data) {
                    setCertificates(Array.isArray(certsRes.data) ? certsRes.data as unknown as Certificate[] : []);
                }
            }
        } catch (error) {
            console.error("Failed to issue certificate:", error);
        } finally {
            setActionInProgress(null);
        }
    };

    // Open revoke dialog
    const openRevokeDialog = (certId: string) => {
        setCertToRevoke(certId);
        setRevokeReason("");
        setIsRevokeDialogOpen(true);
    };

    // Revoke certificate
    const handleRevokeCertificate = async () => {
        if (!certToRevoke || !revokeReason.trim()) {
            toast.error("Please enter a reason for revocation");
            return;
        }

        try {
            setActionInProgress(certToRevoke);
            const response = await certificatesService.revoke(certToRevoke, revokeReason);
            if (response.success) {
                toast.success("Certificate revoked successfully");
                // Refresh certificates
                const certsRes = await certificatesService.getAll();
                if (certsRes.success && certsRes.data) {
                    setCertificates(Array.isArray(certsRes.data) ? certsRes.data as unknown as Certificate[] : []);
                }
                setIsRevokeDialogOpen(false);
                setCertToRevoke(null);
                setRevokeReason("");
            } else {
                toast.error("Failed to revoke certificate");
            }
        } catch (error) {
            console.error("Failed to revoke certificate:", error);
            toast.error("Failed to revoke certificate");
        } finally {
            setActionInProgress(null);
        }
    };

    // Generate certificates
    const handleGenerateCertificates = async () => {
        if (!generateForm.eventId) return;

        try {
            setGenerating(true);

            // Get registrations for the event with ATTENDED status
            const regsRes = await registrationsService.getAll({
                eventId: generateForm.eventId,
                status: "ATTENDED",
                limit: 500,
            });

            if (!regsRes.success || !regsRes.data) {
                toast.error("Failed to fetch registrations");
                return;
            }

            const registrations = Array.isArray(regsRes.data) ? regsRes.data : [];

            if (registrations.length === 0) {
                toast.warning("No attended registrations found for this event");
                return;
            }

            // Bulk create certificates
            const response = await certificatesService.bulkCreate({
                registrationIds: registrations.map((r) => r.id),
                eventId: generateForm.eventId,
                cmeCredits: generateForm.cmeCredits ? parseInt(generateForm.cmeCredits) : undefined,
            });

            if (response.success) {
                // Refresh certificates
                const certsRes = await certificatesService.getAll();
                if (certsRes.success && certsRes.data) {
                    setCertificates(Array.isArray(certsRes.data) ? certsRes.data as unknown as Certificate[] : []);
                }
                setIsCreateOpen(false);
                setGenerateForm({
                    eventId: "",
                    recipients: "attended",
                    cmeCredits: "",
                    signatory1Name: "",
                    signatory1Title: "",
                    signatory2Name: "",
                    signatory2Title: "",
                    autoEmail: true,
                    enableDownload: true,
                });
            }
        } catch (error) {
            console.error("Failed to generate certificates:", error);
        } finally {
            setGenerating(false);
        }
    };

    // Copy verification link
    const handleCopyLink = async (code: string) => {
        const url = `${window.location.origin}/verify/${code}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Verification link copied to clipboard");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    // Prepare preview data
    const getPreviewData = (cert: Certificate): CertificateData => {
        // Ensure we have a valid event type, default to CONFERENCE if missing
        const eventType: EventType = cert.event?.type || "CONFERENCE";

        // Build signatories array from event data
        const signatories: { name: string; title: string }[] = [];
        if (cert.event?.signatory1Name || cert.event?.signatory1Title) {
            signatories.push({
                name: cert.event.signatory1Name || "",
                title: cert.event.signatory1Title || "",
            });
        }
        if (cert.event?.signatory2Name || cert.event?.signatory2Title) {
            signatories.push({
                name: cert.event.signatory2Name || "",
                title: cert.event.signatory2Title || "",
            });
        }

        return {
            recipientName: cert.recipientName,
            eventTitle: cert.event?.title || "Event",
            eventType: eventType,
            eventDate: cert.event?.startDate || new Date().toISOString(),
            eventEndDate: cert.event?.endDate,
            eventLocation: [cert.event?.location, cert.event?.city].filter(Boolean).join(", ") || undefined,
            certificateCode: cert.certificateCode,
            cmeCredits: cert.cmeCredits || cert.event?.cmeCredits || undefined,
            description: cert.description || undefined,
            organizer: cert.event?.organizer || undefined,
            issuedAt: cert.issuedAt || undefined,
            signatories: signatories.length > 0 ? signatories : undefined,
        };
    };

    // Generate sample template data for preview
    const getSampleTemplateData = (eventType: EventType): CertificateData => {
        const templateInfo = templatePreviews.find(t => t.type === eventType) || templatePreviews[0];
        return {
            recipientName: "Dr. John Smith",
            eventTitle: `Sample ${templateInfo.name} Event 2025`,
            eventType: eventType,
            eventDate: new Date().toISOString(),
            eventEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            eventLocation: "Convention Center, New York",
            certificateCode: "CERT-SAMPLE-001",
            cmeCredits: eventType === "CME" ? 8 : undefined,
            organizer: "Medical Conference Organization",
            issuedAt: new Date().toISOString(),
            signatories: [
                { name: "Dr. Jane Doe", title: "Conference Director" },
                { name: "Dr. Robert Wilson", title: "Scientific Chair" },
            ],
        };
    };

    // Handle template card click
    const handleTemplateClick = (eventType: EventType) => {
        setSelectedTemplateType(eventType);
        setIsTemplatePreviewOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout title="Certificates" subtitle="Generate, manage, and distribute certificates">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Certificates"
            subtitle="Generate, manage, and distribute certificates"
        >
            <div className="space-y-6 animate-fadeIn">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center">
                                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{certificates.length}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{issuedCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Issued</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{pendingCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/10 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center">
                                    <Send className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">
                                        {certificates.reduce((acc, c) => acc + c.downloadCount, 0)}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Downloads</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificate Templates */}
                <Card className="card-premium border-primary/10 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Certificate Templates by Event Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
                            {templatePreviews.map((template) => (
                                <div
                                    key={template.type}
                                    onClick={() => handleTemplateClick(template.type)}
                                    className="p-3 sm:p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                                >
                                    <div className="h-12 sm:h-16 w-full rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform" style={{ background: template.color }}>
                                        <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                    </div>
                                    <h4 className="font-medium text-xs sm:text-sm">{template.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {template.description}
                                    </p>
                                    <p className="text-[10px] text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to preview
                                    </p>
                                </div>
                            ))}
                            {/* Custom Certificate Card */}
                            <div
                                onClick={() => setIsCustomOpen(true)}
                                className="p-3 sm:p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                            >
                                <div className="h-12 sm:h-16 w-full rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg, #18181b, #3f3f46)" }}>
                                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                </div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200">Custom</h4>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                                    Issue to specific delegate
                                </p>
                                <p className="text-[10px] text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                    Click to create
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by recipient, email, or code..."
                                className="pl-10 search-premium rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {selectedCertificates.length > 0 && (
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Download ({selectedCertificates.length})
                            </Button>
                        )}
                        <Button
                            className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Generate Certificates
                        </Button>
                    </div>
                </div>

                {/* Generate Certificates Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Generate Certificates</DialogTitle>
                            <DialogDescription>
                                Create certificates for event participants who attended
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Event *</Label>
                                <Select
                                    value={generateForm.eventId}
                                    onValueChange={(v) => setGenerateForm((prev) => ({ ...prev, eventId: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose an event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map((event) => (
                                            <SelectItem key={event.id} value={event.id}>
                                                {event.title} ({event.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>CME Credits (optional)</Label>
                                <Input
                                    type="number"
                                    placeholder="8"
                                    value={generateForm.cmeCredits}
                                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, cmeCredits: e.target.value }))}
                                />
                            </div>

                            <div className="section-divider-gradient my-2" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Signatory 1 Name</Label>
                                    <Input
                                        placeholder="Dr. Rajesh Kumar"
                                        value={generateForm.signatory1Name}
                                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, signatory1Name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Signatory 1 Title</Label>
                                    <Input
                                        placeholder="Director"
                                        value={generateForm.signatory1Title}
                                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, signatory1Title: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Signatory 2 Name</Label>
                                    <Input
                                        placeholder="Dr. Priya Sharma"
                                        value={generateForm.signatory2Name}
                                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, signatory2Name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Signatory 2 Title</Label>
                                    <Input
                                        placeholder="Course Coordinator"
                                        value={generateForm.signatory2Title}
                                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, signatory2Title: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="section-divider-gradient my-2" />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label>Auto-issue certificates</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Issue certificates immediately after generation
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerateCertificates}
                                disabled={generating || !generateForm.eventId}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Certificates"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Certificate Preview Dialog */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-auto">
                        {selectedCert && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Certificate Preview</DialogTitle>
                                    <DialogDescription>
                                        {selectedCert.certificateCode} - {selectedCert.event?.type || "CONFERENCE"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 overflow-auto">
                                    <div className="transform scale-50 origin-top-left" style={{ width: "200%" }}>
                                        <CertificateTemplate data={getPreviewData(selectedCert)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                                        Close
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => handleViewCertificate(selectedCert)}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Open Full View
                                    </Button>
                                    <Button
                                        className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25"
                                        onClick={() => handleViewCertificate(selectedCert)}
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Template Preview Dialog */}
                <Dialog open={isTemplatePreviewOpen} onOpenChange={setIsTemplatePreviewOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-auto">
                        {selectedTemplateType && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>
                                        {templatePreviews.find(t => t.type === selectedTemplateType)?.name} Certificate Template
                                    </DialogTitle>
                                    <DialogDescription>
                                        {templatePreviews.find(t => t.type === selectedTemplateType)?.description}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 overflow-auto">
                                    <div className="transform scale-50 origin-top-left" style={{ width: "200%" }}>
                                        <CertificateTemplate data={getSampleTemplateData(selectedTemplateType)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsTemplatePreviewOpen(false)}>
                                        Close
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Revoke Certificate Dialog */}
                <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full shrink-0 bg-red-100">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="space-y-1">
                                    <DialogTitle>Revoke Certificate</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. The certificate will be marked as revoked.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="revokeReason">Reason for revocation *</Label>
                            <Input
                                id="revokeReason"
                                placeholder="Enter the reason for revoking this certificate"
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setIsRevokeDialogOpen(false)}
                                disabled={actionInProgress === certToRevoke}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleRevokeCertificate}
                                disabled={actionInProgress === certToRevoke || !revokeReason.trim()}
                            >
                                {actionInProgress === certToRevoke && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Revoke Certificate
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Custom Certificate Dialog */}
                <Dialog open={isCustomOpen} onOpenChange={(open) => {
                    setIsCustomOpen(open);
                    if (!open) { setSelectedDelegate(null); setCustomDelegateSearch(""); setCustomTitleSearch(""); setCustomForm({ eventId: "", registrationId: "", certificateType: "", sessionId: "", title: "", cmeCredits: "" }); }
                }}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, #18181b, #3f3f46)" }}>
                                    <Award className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg">Issue Custom Certificate</DialogTitle>
                                    <DialogDescription>Select a delegate, choose template type, and assign a session title.</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5 py-2">
                            {/* Step 1: Select Event */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold">Event *</Label>
                                <Select value={customForm.eventId} onValueChange={(v) => {
                                    setCustomForm(p => ({ ...p, eventId: v, registrationId: "", sessionId: "", title: "" }));
                                    setSelectedDelegate(null); setCustomDelegateSearch(""); setCustomTitleSearch("");
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                                    <SelectContent>
                                        {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Step 2: Select Delegate */}
                            {customForm.eventId && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold">Delegate Name *</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or email..."
                                            value={customDelegateSearch}
                                            onChange={(e) => { setCustomDelegateSearch(e.target.value); if (selectedDelegate) setSelectedDelegate(null); }}
                                            className="pl-10"
                                        />
                                    </div>
                                    {/* Suggestions dropdown */}
                                    {customDelegateSearch && !selectedDelegate && filteredDelegates.length > 0 && (
                                        <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-lg max-h-48 overflow-y-auto">
                                            {filteredDelegates.map((r: any) => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                                                    onClick={() => {
                                                        setSelectedDelegate(r);
                                                        setCustomDelegateSearch(r.name || r.email);
                                                        setCustomForm(p => ({ ...p, registrationId: r.id }));
                                                    }}
                                                >
                                                    <p className="font-semibold text-sm">{r.name}</p>
                                                    <p className="text-xs text-muted-foreground">{r.email} {r.phone ? `· ${r.phone}` : ""}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {customDelegateSearch && !selectedDelegate && filteredDelegates.length === 0 && (
                                        <p className="text-xs text-muted-foreground px-1">No delegates found matching &ldquo;{customDelegateSearch}&rdquo;</p>
                                    )}
                                    {/* Selected delegate details */}
                                    {selectedDelegate && (
                                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedDelegate.name}</span>
                                                <Badge variant="outline" className="text-[10px]">{selectedDelegate.status || "REGISTERED"}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                <span>Email: {selectedDelegate.email}</span>
                                                {selectedDelegate.phone && <span>Phone: {selectedDelegate.phone}</span>}
                                                {selectedDelegate.institution && <span>Institution: {selectedDelegate.institution}</span>}
                                                {selectedDelegate.participantRole && <span>Role: {selectedDelegate.participantRole}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Certificate Type */}
                            {selectedDelegate && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold">Certificate Type *</Label>
                                    <Select value={customForm.certificateType} onValueChange={(v) => setCustomForm(p => ({ ...p, certificateType: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Select template type..." /></SelectTrigger>
                                        <SelectContent>
                                            {templatePreviews.map(t => <SelectItem key={t.type} value={t.type}>{t.name} — {t.description}</SelectItem>)}
                                            <SelectItem value="ATTENDANCE">Attendance — General Certificate</SelectItem>
                                            <SelectItem value="SPEAKER_SESSION">Speaker Session — Per Session Certificate</SelectItem>
                                            <SelectItem value="ORGANIZATION">Organization — Organizer Certificate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Step 4: Title from Sessions */}
                            {selectedDelegate && customForm.certificateType && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold">Title / Session</Label>
                                    {customSessions.length > 0 ? (
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search sessions..."
                                                    value={customTitleSearch}
                                                    onChange={(e) => setCustomTitleSearch(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm max-h-36 overflow-y-auto">
                                                {filteredSessions.map((s: any) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0 text-sm",
                                                            customForm.sessionId === s.id ? "bg-slate-100 dark:bg-slate-800 font-semibold" : ""
                                                        )}
                                                        onClick={() => {
                                                            setCustomForm(p => ({ ...p, sessionId: s.id, title: s.title }));
                                                            setCustomTitleSearch(s.title);
                                                        }}
                                                    >
                                                        <span className="font-medium">{s.title}</span>
                                                        {s.sessionType && <span className="text-xs text-muted-foreground ml-2">({s.sessionType})</span>}
                                                    </button>
                                                ))}
                                                {filteredSessions.length === 0 && (
                                                    <p className="text-xs text-muted-foreground p-3">No sessions found</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <Input
                                            placeholder="Enter certificate title manually..."
                                            value={customForm.title}
                                            onChange={(e) => setCustomForm(p => ({ ...p, title: e.target.value }))}
                                        />
                                    )}
                                </div>
                            )}

                            {/* CME Credits */}
                            {selectedDelegate && customForm.certificateType && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold">CME Credits (optional)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={customForm.cmeCredits}
                                        onChange={(e) => setCustomForm(p => ({ ...p, cmeCredits: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button variant="outline" onClick={() => setIsCustomOpen(false)} disabled={customIssuing}>Cancel</Button>
                            <Button
                                onClick={handleCustomIssue}
                                disabled={customIssuing || !customForm.registrationId || !customForm.eventId}
                                className="text-white"
                                style={{ background: "linear-gradient(135deg, #18181b, #3f3f46)" }}
                            >
                                {customIssuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Award className="mr-2 h-4 w-4" />
                                Map & Issue Certificate
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Certificates Table */}
                <Card className="card-premium overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="bg-muted/50 rounded-xl w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1">
                                <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    All ({certificates.length})
                                </TabsTrigger>
                                <TabsTrigger value="issued" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Issued ({issuedCount})
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Pending ({pendingCount})
                                </TabsTrigger>
                                <TabsTrigger value="revoked" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Revoked ({revokedCount})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border">
                            <Table className="table-premium">
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedCertificates.length === filteredCertificates.length && filteredCertificates.length > 0}
                                                onCheckedChange={toggleAll}
                                            />
                                        </TableHead>
                                        <TableHead>Certificate Code</TableHead>
                                        <TableHead>Recipient</TableHead>
                                        <TableHead className="hidden md:table-cell">Event</TableHead>
                                        <TableHead className="hidden lg:table-cell">Type</TableHead>
                                        <TableHead className="hidden sm:table-cell">Credits</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCertificates.map((cert, index) => (
                                        <TableRow
                                            key={cert.id}
                                            className="animate-fadeIn table-row-hover hover:bg-teal-50/30 transition-colors"
                                            style={{ animationDelay: `${index * 0.03}s` }}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCertificates.includes(cert.id)}
                                                    onCheckedChange={() => toggleCertificate(cert.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-mono text-sm">{cert.certificateCode}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{cert.recipientName}</p>
                                                    <p className="text-xs text-muted-foreground">{cert.recipientEmail}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <p className="text-sm truncate max-w-[200px]">{cert.event.title}</p>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <Badge variant="outline" className="bg-gradient-to-r from-slate-50 to-slate-100/80">{cert.event.type}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <p className="text-sm font-medium">
                                                    {cert.cmeCredits || cert.event.cmeCredits || 0} CME
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(cert.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setSelectedCert(cert);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {cert.status !== "REVOKED" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleViewCertificate(cert)}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedCert(cert);
                                                                    setIsPreviewOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Preview
                                                            </DropdownMenuItem>
                                                            {cert.status !== "REVOKED" && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleViewCertificate(cert)}>
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        Download PDF
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleViewCertificate(cert)}>
                                                                        <Printer className="mr-2 h-4 w-4" />
                                                                        Print
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleCopyLink(cert.certificateCode)}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Copy Verification Link
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {cert.status === "PENDING" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleIssueCertificate(cert.id)}
                                                                    disabled={actionInProgress === cert.id}
                                                                >
                                                                    {actionInProgress === cert.id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Issue Certificate
                                                                </DropdownMenuItem>
                                                            )}
                                                            {cert.status === "ISSUED" && (
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => openRevokeDialog(cert.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Revoke
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredCertificates.length === 0 && (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 mb-5">
                                    <Award className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No certificates found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {selectedTab === "all"
                                        ? "Generate your first certificate to get started"
                                        : "No certificates match this filter"}
                                </p>
                                {selectedTab === "all" && (
                                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25">
                                        <Plus className="h-4 w-4" />
                                        Generate Certificate
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
