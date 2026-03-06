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
    { type: "CONFERENCE" as EventType, name: "Conference", color: "from-blue-500 to-blue-700", description: "Certificate of Attendance" },
    { type: "WORKSHOP" as EventType, name: "Workshop", color: "from-green-500 to-green-700", description: "Certificate of Completion" },
    { type: "SEMINAR" as EventType, name: "Seminar", color: "from-orange-500 to-orange-700", description: "Certificate of Participation" },
    { type: "CME" as EventType, name: "CME", color: "from-red-500 to-red-700", description: "CME Credit Certificate" },
    { type: "WEBINAR" as EventType, name: "Webinar", color: "from-purple-500 to-purple-700", description: "Certificate of Attendance" },
    { type: "SYMPOSIUM" as EventType, name: "Symposium", color: "from-teal-500 to-teal-700", description: "Certificate of Participation" },
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

    // Fetch data
    useEffect(() => {
        if (sessionLoading) return;
        async function fetchData() {
            try {
                setLoading(true);
                const [certsRes, eventsRes] = await Promise.all([
                    certificatesService.getAll({ ...tenantFilterParams }),
                    eventsService.getAll({ ...tenantFilterParams }),
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
            ISSUED: { class: "bg-green-50 text-green-700", icon: CheckCircle2, label: "Issued" },
            PENDING: { class: "bg-amber-50 text-amber-700", icon: Clock, label: "Pending" },
            REVOKED: { class: "bg-red-50 text-red-700", icon: X, label: "Revoked" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={cn("gap-1 border-0", config.class)}>
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
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
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
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-teal h-10 w-10 sm:h-12 sm:w-12">
                                    <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">{certificates.length}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-green h-10 w-10 sm:h-12 sm:w-12">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">{issuedCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Issued</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-orange h-10 w-10 sm:h-12 sm:w-12">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">{pendingCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="icon-container icon-container-blue h-10 w-10 sm:h-12 sm:w-12">
                                    <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">
                                        {certificates.reduce((acc, c) => acc + c.downloadCount, 0)}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Downloads</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificate Templates */}
                <Card className="border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Certificate Templates by Event Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                            {templatePreviews.map((template) => (
                                <div
                                    key={template.type}
                                    onClick={() => handleTemplateClick(template.type)}
                                    className="p-3 sm:p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className={`h-12 sm:h-16 w-full rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform`}>
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
                                className="pl-10"
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
                            className="gap-2 gradient-medical text-white hover:opacity-90"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Generate Certificates
                        </Button>
                    </div>
                </div>

                {/* Generate Certificates Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-2xl">
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
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
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
                                        className="gap-2"
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
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
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

                {/* Certificates Table */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1">
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
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
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
                                            className="animate-fadeIn table-row-hover"
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
                                                <Badge variant="outline">{cert.event.type}</Badge>
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
                                <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No certificates found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {selectedTab === "all"
                                        ? "Generate your first certificate to get started"
                                        : "No certificates match this filter"}
                                </p>
                                {selectedTab === "all" && (
                                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
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
