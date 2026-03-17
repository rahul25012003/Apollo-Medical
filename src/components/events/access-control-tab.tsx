"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Shield,
    Plus,
    Trash2,
    Loader2,
    Save,
    CheckCircle2,
    XCircle,
    DoorOpen,
} from "lucide-react";
import { zonesService, EventZone } from "@/services/zones";

interface AccessControlTabProps {
    eventId: string;
    categories: string[]; // pricing category names from event
}

interface ZoneFormData {
    id?: string;
    name: string;
    description: string;
    displayOrder: number;
    rules: { category: string; allowed: boolean }[];
}

export function AccessControlZonesTab({ eventId, categories }: AccessControlTabProps) {
    const [zones, setZones] = useState<EventZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formZones, setFormZones] = useState<ZoneFormData[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newZoneName, setNewZoneName] = useState("");
    const [newZoneDesc, setNewZoneDesc] = useState("");

    const fetchZones = async () => {
        setLoading(true);
        try {
            const res = await zonesService.getAll(eventId);
            if (res.success && res.data) {
                setZones(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch zones:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, [eventId]);

    const startEdit = () => {
        setFormZones(
            zones.map((z) => ({
                id: z.id,
                name: z.name,
                description: z.description || "",
                displayOrder: z.displayOrder,
                rules: categories.map((cat) => {
                    const existing = z.accessRules?.find((r) => r.category === cat);
                    return { category: cat, allowed: existing ? existing.allowed : false };
                }),
            }))
        );
        setEditMode(true);
    };

    const handleAddZone = () => {
        if (!newZoneName.trim()) return;
        setFormZones([
            ...formZones,
            {
                name: newZoneName.trim(),
                description: newZoneDesc.trim(),
                displayOrder: formZones.length,
                rules: categories.map((cat) => ({ category: cat, allowed: false })),
            },
        ]);
        setNewZoneName("");
        setNewZoneDesc("");
        setAddDialogOpen(false);
    };

    const removeFormZone = (idx: number) => {
        setFormZones(formZones.filter((_, i) => i !== idx));
    };

    const toggleRule = (zoneIdx: number, catIdx: number) => {
        const updated = [...formZones];
        updated[zoneIdx] = {
            ...updated[zoneIdx],
            rules: updated[zoneIdx].rules.map((r, i) =>
                i === catIdx ? { ...r, allowed: !r.allowed } : r
            ),
        };
        setFormZones(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await zonesService.bulkUpdate(
                eventId,
                formZones.map((z) => ({
                    id: z.id,
                    name: z.name,
                    description: z.description || undefined,
                    displayOrder: z.displayOrder,
                    rules: z.rules,
                }))
            );
            if (res.success) {
                await fetchZones();
                setEditMode(false);
            }
        } catch (err) {
            console.error("Failed to save zones:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        try {
            await zonesService.delete(eventId, zoneId);
            await fetchZones();
        } catch (err) {
            console.error("Failed to delete zone:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5" />
                            Access Control Zones
                        </CardTitle>
                        <CardDescription>
                            Define zones and control which categories can access them
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {editMode ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditMode(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setAddDialogOpen(true)}
                                    variant="outline"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Zone
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1" />
                                    )}
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                onClick={startEdit}
                                variant="outline"
                            >
                                {zones.length === 0 ? (
                                    <>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Setup Zones
                                    </>
                                ) : (
                                    "Edit Access Rules"
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {categories.length === 0 && (
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 mb-4">
                            No pricing categories found for this event. Add pricing categories first to setup access control rules.
                        </div>
                    )}

                    {!editMode ? (
                        /* View Mode */
                        zones.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <DoorOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground">No access zones configured</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Create zones like &quot;Main Hall&quot;, &quot;VIP Lounge&quot;, &quot;Workshop Room&quot; and set access rules per category
                                </p>
                                {categories.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-4"
                                        onClick={startEdit}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Setup Access Zones
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Access Matrix View */}
                                <div className="rounded-lg border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="min-w-[180px] font-semibold">Zone</TableHead>
                                                {categories.map((cat) => (
                                                    <TableHead key={cat} className="text-center min-w-[100px]">
                                                        <Badge variant="outline" className="text-xs">{cat}</Badge>
                                                    </TableHead>
                                                ))}
                                                <TableHead className="w-16">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {zones.map((zone) => (
                                                <TableRow key={zone.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">{zone.name}</p>
                                                            {zone.description && (
                                                                <p className="text-xs text-muted-foreground">{zone.description}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    {categories.map((cat) => {
                                                        const rule = zone.accessRules?.find((r) => r.category === cat);
                                                        const allowed = rule?.allowed ?? false;
                                                        return (
                                                            <TableCell key={cat} className="text-center">
                                                                {allowed ? (
                                                                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                                                ) : (
                                                                    <XCircle className="h-5 w-5 text-red-300 mx-auto" />
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                            onClick={() => handleDeleteZone(zone.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Access Allowed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <XCircle className="h-3.5 w-3.5 text-red-300" /> Access Denied
                                    </span>
                                </div>
                            </div>
                        )
                    ) : (
                        /* Edit Mode - Interactive Matrix */
                        formZones.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-muted-foreground mb-3">No zones yet. Add your first zone to get started.</p>
                                <Button
                                    size="sm"
                                    onClick={() => setAddDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Zone
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="min-w-[180px] font-semibold">Zone</TableHead>
                                            {categories.map((cat) => (
                                                <TableHead key={cat} className="text-center min-w-[100px]">
                                                    <Badge variant="outline" className="text-xs">{cat}</Badge>
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formZones.map((zone, zoneIdx) => (
                                            <TableRow key={zoneIdx}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{zone.name}</p>
                                                        {zone.description && (
                                                            <p className="text-xs text-muted-foreground">{zone.description}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {zone.rules.map((rule, catIdx) => (
                                                    <TableCell key={catIdx} className="text-center">
                                                        <Checkbox
                                                            checked={rule.allowed}
                                                            onCheckedChange={() => toggleRule(zoneIdx, catIdx)}
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                        onClick={() => removeFormZone(zoneIdx)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Add Zone Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Access Zone</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Zone Name</label>
                            <Input
                                placeholder="e.g., Main Hall, VIP Lounge, Workshop Room"
                                value={newZoneName}
                                onChange={(e) => setNewZoneName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description (optional)</label>
                            <Input
                                placeholder="e.g., Ground floor main auditorium"
                                value={newZoneDesc}
                                onChange={(e) => setNewZoneDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddZone} disabled={!newZoneName.trim()}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** @deprecated Use AccessControlZonesTab instead */
export const AccessControlTab = AccessControlZonesTab;
