"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPinned, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

interface LocationPoint {
  id: string;
  label: string;
  note: string;
  address: string;
  mapUrl: string;
}
interface LocationRoute { from: string; to: string; note: string }

export default function LocationsPage() {
  // IFPC (apollo-medical) only — this page doesn't exist for other tenants.
  const ifpcCheck = useIsIfpcDashboard();
  if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();

  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [routes, setRoutes] = useState<LocationRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ifpcCheck.isIfpc) return;
    fetch("/api/tenants/my/locations")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setPoints((json.data.points ?? []).map((p: Partial<LocationPoint>) => ({ id: p.id, label: p.label || "", note: p.note || "", address: p.address || "", mapUrl: p.mapUrl || "" })));
          setRoutes(json.data.routes ?? []);
        }
      })
      .catch(() => toast.error("Could not load locations"))
      .finally(() => setLoading(false));
  }, [ifpcCheck.isIfpc]);

  const update = (id: string, patch: Partial<LocationPoint>) =>
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function save() {
    for (const p of points) {
      if (!p.label.trim()) { toast.error("Every location needs a name"); return; }
      if (p.mapUrl && !/^https?:\/\//.test(p.mapUrl)) { toast.error(`"${p.label}": map link must start with http(s)://`); return; }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tenants/my/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points, routes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not save locations");
        return;
      }
      toast.success("Locations saved");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="Locations" subtitle="Names, addresses and Google Maps links for the On-Campus Map">
      {ifpcCheck.loading || loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPinned className="h-4 w-4" /> These four places appear on the On-Campus Map and Campus Tour photo slideshow. Changes take effect immediately — no redeploy needed.
          </p>
          {points.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{p.label || p.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={p.label} onChange={(e) => update(p.id, { label: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={2} value={p.note} onChange={(e) => update(p.id, { note: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input value={p.address} onChange={(e) => update(p.id, { address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Google Maps link</Label>
                  <Input
                    value={p.mapUrl}
                    onChange={(e) => update(p.id, { mapUrl: e.target.value })}
                    placeholder="https://maps.google.com/?cid=…"
                  />
                  <p className="text-xs text-muted-foreground">Open the place on Google Maps, tap Share, and copy the link.</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save locations
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
