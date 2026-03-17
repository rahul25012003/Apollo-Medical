"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
    Plus,
    Trash2,
    Edit2,
    RotateCcw,
    Save,
    Loader2,
    Palette,
    Tag,
    Users,
    Award,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    getParticipantRoles,
    getSessionTypes,
    DEFAULT_PARTICIPANT_ROLES,
    DEFAULT_SESSION_TYPES,
    type ParticipantRoleConfig,
    type SessionTypeConfig,
} from "@/lib/config/event-defaults";

interface EventConfigTabProps {
    eventId: string;
}

// ---------------------------------------------------------------------------
// Empty form helpers
// ---------------------------------------------------------------------------

function emptyRole(): ParticipantRoleConfig {
    return {
        id: "",
        label: "",
        showOnPublicRegistration: true,
        certificate: {
            title: "Certificate of Attendance",
            certificateType: "ATTENDANCE",
            bodyText: "has successfully attended the",
            colors: { primary: "#1e3a5f", secondary: "#2563eb", accent: "#dbeafe", border: "#1e40af" },
        },
    };
}

function emptySessionType(): SessionTypeConfig {
    return {
        id: "",
        label: "",
        icon: "📋",
        colors: { bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-700" },
    };
}

function labelToId(label: string): string {
    return label.trim().toUpperCase().replace(/\s+/g, "_");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventConfigTab({ eventId }: EventConfigTabProps) {
    // --- Data state ---
    const [roles, setRoles] = useState<ParticipantRoleConfig[]>([]);
    const [sessionTypes, setSessionTypes] = useState<SessionTypeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // --- Role dialog ---
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
    const [roleForm, setRoleForm] = useState<ParticipantRoleConfig>(emptyRole());

    // --- Session type dialog ---
    const [stDialogOpen, setStDialogOpen] = useState(false);
    const [editingStIndex, setEditingStIndex] = useState<number | null>(null);
    const [stForm, setStForm] = useState<SessionTypeConfig>(emptySessionType());

    // --- Reset confirm ---
    const [resetRolesOpen, setResetRolesOpen] = useState(false);
    const [resetStOpen, setResetStOpen] = useState(false);

    // --- Certificate preview ---
    const [previewRoleId, setPreviewRoleId] = useState<string>("");

    // --- Fetch ---
    const fetchEvent = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}`);
            const json = await res.json();
            const event = json.data ?? json;
            setRoles(getParticipantRoles(event));
            setSessionTypes(getSessionTypes(event));
            if (getParticipantRoles(event).length > 0) {
                setPreviewRoleId(getParticipantRoles(event)[0].id);
            }
        } catch {
            // fallback to defaults
            setRoles(DEFAULT_PARTICIPANT_ROLES);
            setSessionTypes(DEFAULT_SESSION_TYPES);
            if (DEFAULT_PARTICIPANT_ROLES.length > 0) {
                setPreviewRoleId(DEFAULT_PARTICIPANT_ROLES[0].id);
            }
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    // --- Save ---
    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/events/${eventId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantRoles: roles, sessionTypes }),
            });
            setDirty(false);
        } catch (err) {
            console.error("Failed to save config", err);
        } finally {
            setSaving(false);
        }
    };

    // -----------------------------------------------------------------------
    // ROLE CRUD
    // -----------------------------------------------------------------------

    const openAddRole = () => {
        setEditingRoleIndex(null);
        setRoleForm(emptyRole());
        setRoleDialogOpen(true);
    };

    const openEditRole = (index: number) => {
        setEditingRoleIndex(index);
        setRoleForm(structuredClone(roles[index]));
        setRoleDialogOpen(true);
    };

    const saveRole = () => {
        const updated = [...roles];
        const entry = { ...roleForm, id: roleForm.id || labelToId(roleForm.label) };
        if (editingRoleIndex !== null) {
            updated[editingRoleIndex] = entry;
        } else {
            updated.push(entry);
        }
        setRoles(updated);
        setDirty(true);
        setRoleDialogOpen(false);
    };

    const deleteRole = (index: number) => {
        setRoles((prev) => prev.filter((_, i) => i !== index));
        setDirty(true);
    };

    const resetRoles = () => {
        setRoles(structuredClone(DEFAULT_PARTICIPANT_ROLES));
        setDirty(true);
        setResetRolesOpen(false);
    };

    // -----------------------------------------------------------------------
    // SESSION TYPE CRUD
    // -----------------------------------------------------------------------

    const openAddSt = () => {
        setEditingStIndex(null);
        setStForm(emptySessionType());
        setStDialogOpen(true);
    };

    const openEditSt = (index: number) => {
        setEditingStIndex(index);
        setStForm(structuredClone(sessionTypes[index]));
        setStDialogOpen(true);
    };

    const saveSt = () => {
        const updated = [...sessionTypes];
        const entry = { ...stForm, id: stForm.id || labelToId(stForm.label) };
        if (editingStIndex !== null) {
            updated[editingStIndex] = entry;
        } else {
            updated.push(entry);
        }
        setSessionTypes(updated);
        setDirty(true);
        setStDialogOpen(false);
    };

    const deleteSt = (index: number) => {
        setSessionTypes((prev) => prev.filter((_, i) => i !== index));
        setDirty(true);
    };

    const resetSt = () => {
        setSessionTypes(structuredClone(DEFAULT_SESSION_TYPES));
        setDirty(true);
        setResetStOpen(false);
    };

    // -----------------------------------------------------------------------
    // Certificate preview role
    // -----------------------------------------------------------------------
    const previewRole = roles.find((r) => r.id === previewRoleId) ?? roles[0];

    // -----------------------------------------------------------------------
    // RENDER
    // -----------------------------------------------------------------------

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Save bar */}
            {dirty && (
                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">You have unsaved changes.</p>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            )}

            {/* ============================================================= */}
            {/* Section 1: Participant Roles                                   */}
            {/* ============================================================= */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" /> Participant Roles
                            </CardTitle>
                            <CardDescription>Manage roles for registrations, badges, and certificates</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setResetRolesOpen(true)}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset to Defaults
                            </Button>
                            <Button size="sm" onClick={openAddRole}>
                                <Plus className="mr-2 h-4 w-4" /> Add Role
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role ID</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Public Registration</TableHead>
                                    <TableHead>Certificate Title</TableHead>
                                    <TableHead>Colors</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No roles configured. Add a role or reset to defaults.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {roles.map((role, idx) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-mono text-xs">{role.id}</TableCell>
                                        <TableCell className="font-medium">{role.label}</TableCell>
                                        <TableCell>
                                            <Badge variant={role.showOnPublicRegistration ? "default" : "secondary"}>
                                                {role.showOnPublicRegistration ? "Yes" : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{role.certificate.title}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: role.certificate.colors.primary }} title="Primary" />
                                                <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: role.certificate.colors.secondary }} title="Secondary" />
                                                <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: role.certificate.colors.accent }} title="Accent" />
                                                <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: role.certificate.colors.border }} title="Border" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditRole(idx)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteRole(idx)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================= */}
            {/* Section 2: Session Types                                       */}
            {/* ============================================================= */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" /> Session Types
                            </CardTitle>
                            <CardDescription>Manage session categories for the scientific program</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setResetStOpen(true)}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset to Defaults
                            </Button>
                            <Button size="sm" onClick={openAddSt}>
                                <Plus className="mr-2 h-4 w-4" /> Add Session Type
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Icon</TableHead>
                                    <TableHead>Badge Preview</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessionTypes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No session types configured. Add a type or reset to defaults.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sessionTypes.map((st, idx) => (
                                    <TableRow key={st.id}>
                                        <TableCell className="font-mono text-xs">{st.id}</TableCell>
                                        <TableCell className="font-medium">{st.label}</TableCell>
                                        <TableCell className="text-lg">{st.icon}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.colors.badge}`}>
                                                {st.icon} {st.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditSt(idx)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteSt(idx)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================= */}
            {/* Section 3: Certificate Preview                                 */}
            {/* ============================================================= */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" /> Certificate Preview
                            </CardTitle>
                            <CardDescription>Preview how certificates look for each role</CardDescription>
                        </div>
                        <div className="w-56">
                            <Select value={previewRoleId} onValueChange={setPreviewRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {previewRole ? (
                        <div
                            className="relative rounded-lg border-2 p-6 max-w-lg mx-auto"
                            style={{ borderColor: previewRole.certificate.colors.border }}
                        >
                            {/* Top accent strip */}
                            <div
                                className="absolute top-0 left-0 right-0 h-2 rounded-t-md"
                                style={{ backgroundColor: previewRole.certificate.colors.primary }}
                            />
                            <div className="mt-2 space-y-3 text-center">
                                <h3
                                    className="text-lg font-bold"
                                    style={{ color: previewRole.certificate.colors.primary }}
                                >
                                    {previewRole.certificate.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">This is to certify that</p>
                                <p className="text-base font-semibold" style={{ color: previewRole.certificate.colors.secondary }}>
                                    Participant Name
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {previewRole.certificate.bodyText}
                                </p>
                                <p className="text-sm font-medium">Event Title</p>
                            </div>
                            {/* Color swatches */}
                            <div className="mt-4 flex items-center justify-center gap-3">
                                {(Object.entries(previewRole.certificate.colors) as [string, string][]).map(([key, color]) => (
                                    <div key={key} className="flex flex-col items-center gap-1">
                                        <span
                                            className="inline-block h-6 w-6 rounded-full border"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No roles available for preview. Add a participant role first.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ============================================================= */}
            {/* Role Add/Edit Dialog                                           */}
            {/* ============================================================= */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRoleIndex !== null ? "Edit Role" : "Add Role"}</DialogTitle>
                        <DialogDescription>
                            {editingRoleIndex !== null
                                ? "Update the participant role configuration."
                                : "Create a new participant role for this event."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Label */}
                        <div className="space-y-1.5">
                            <Label>Label</Label>
                            <Input
                                value={roleForm.label}
                                onChange={(e) => {
                                    const label = e.target.value;
                                    setRoleForm((prev) => ({
                                        ...prev,
                                        label,
                                        id: editingRoleIndex !== null ? prev.id : labelToId(label),
                                    }));
                                }}
                                placeholder="e.g. Delegate"
                            />
                        </div>

                        {/* ID */}
                        <div className="space-y-1.5">
                            <Label>ID</Label>
                            <Input
                                value={roleForm.id}
                                onChange={(e) => setRoleForm((prev) => ({ ...prev, id: e.target.value }))}
                                placeholder="AUTO_GENERATED"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">Auto-generated from label (uppercase snake_case). Editable.</p>
                        </div>

                        {/* Public registration */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label>Show on Public Registration</Label>
                                <p className="text-xs text-muted-foreground">Visible as a registration option to the public</p>
                            </div>
                            <Switch
                                checked={roleForm.showOnPublicRegistration}
                                onCheckedChange={(checked) => setRoleForm((prev) => ({ ...prev, showOnPublicRegistration: checked }))}
                            />
                        </div>

                        {/* Certificate title */}
                        <div className="space-y-1.5">
                            <Label>Certificate Title</Label>
                            <Input
                                value={roleForm.certificate.title}
                                onChange={(e) =>
                                    setRoleForm((prev) => ({
                                        ...prev,
                                        certificate: { ...prev.certificate, title: e.target.value },
                                    }))
                                }
                                placeholder="Certificate of Attendance"
                            />
                        </div>

                        {/* Certificate body text */}
                        <div className="space-y-1.5">
                            <Label>Certificate Body Text</Label>
                            <Input
                                value={roleForm.certificate.bodyText}
                                onChange={(e) =>
                                    setRoleForm((prev) => ({
                                        ...prev,
                                        certificate: { ...prev.certificate, bodyText: e.target.value },
                                    }))
                                }
                                placeholder="has successfully attended the"
                            />
                        </div>

                        {/* Colors */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Palette className="h-4 w-4" /> Colors
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                {(["primary", "secondary", "accent", "border"] as const).map((colorKey) => (
                                    <div key={colorKey} className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={roleForm.certificate.colors[colorKey]}
                                            onChange={(e) =>
                                                setRoleForm((prev) => ({
                                                    ...prev,
                                                    certificate: {
                                                        ...prev.certificate,
                                                        colors: { ...prev.certificate.colors, [colorKey]: e.target.value },
                                                    },
                                                }))
                                            }
                                            className="h-8 w-8 cursor-pointer rounded border p-0.5"
                                        />
                                        <span className="text-sm capitalize">{colorKey}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveRole} disabled={!roleForm.label.trim()}>
                            {editingRoleIndex !== null ? "Update Role" : "Add Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============================================================= */}
            {/* Session Type Add/Edit Dialog                                   */}
            {/* ============================================================= */}
            <Dialog open={stDialogOpen} onOpenChange={setStDialogOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>{editingStIndex !== null ? "Edit Session Type" : "Add Session Type"}</DialogTitle>
                        <DialogDescription>
                            {editingStIndex !== null
                                ? "Update the session type configuration."
                                : "Create a new session type for the scientific program."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Label */}
                        <div className="space-y-1.5">
                            <Label>Label</Label>
                            <Input
                                value={stForm.label}
                                onChange={(e) => {
                                    const label = e.target.value;
                                    setStForm((prev) => ({
                                        ...prev,
                                        label,
                                        id: editingStIndex !== null ? prev.id : labelToId(label),
                                    }));
                                }}
                                placeholder="e.g. Workshop"
                            />
                        </div>

                        {/* ID */}
                        <div className="space-y-1.5">
                            <Label>ID</Label>
                            <Input
                                value={stForm.id}
                                onChange={(e) => setStForm((prev) => ({ ...prev, id: e.target.value }))}
                                placeholder="AUTO_GENERATED"
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* Icon */}
                        <div className="space-y-1.5">
                            <Label>Icon (emoji)</Label>
                            <Input
                                value={stForm.icon}
                                onChange={(e) => setStForm((prev) => ({ ...prev, icon: e.target.value }))}
                                placeholder="📋"
                                className="text-lg"
                            />
                        </div>

                        {/* Badge color class */}
                        <div className="space-y-1.5">
                            <Label>Badge Color Class</Label>
                            <Input
                                value={stForm.colors.badge}
                                onChange={(e) =>
                                    setStForm((prev) => ({
                                        ...prev,
                                        colors: { ...prev.colors, badge: e.target.value },
                                    }))
                                }
                                placeholder="bg-slate-100 text-slate-700"
                                className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">Tailwind classes for the badge. e.g. &quot;bg-blue-100 text-blue-700&quot;</p>
                        </div>

                        {/* Preview */}
                        {stForm.label && (
                            <div className="space-y-1.5">
                                <Label>Preview</Label>
                                <div>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${stForm.colors.badge}`}>
                                        {stForm.icon} {stForm.label}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSt} disabled={!stForm.label.trim()}>
                            {editingStIndex !== null ? "Update Type" : "Add Type"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============================================================= */}
            {/* Confirm dialogs                                                */}
            {/* ============================================================= */}
            <ConfirmDialog
                open={resetRolesOpen}
                onOpenChange={setResetRolesOpen}
                title="Reset Participant Roles?"
                description="This will replace all current roles with the system defaults. Any custom roles will be lost."
                confirmText="Reset to Defaults"
                variant="warning"
                onConfirm={resetRoles}
            />
            <ConfirmDialog
                open={resetStOpen}
                onOpenChange={setResetStOpen}
                title="Reset Session Types?"
                description="This will replace all current session types with the system defaults. Any custom types will be lost."
                confirmText="Reset to Defaults"
                variant="warning"
                onConfirm={resetSt}
            />
        </div>
    );
}
