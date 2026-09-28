"use client";

import { notFound, useParams } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { DelegatePageShell } from "@/components/ifpc/DelegatePageShell";
import { RouteMap } from "@/components/ifpc/RouteMap";

/** Routes to the Conference Hall and the Yoga Hall. Public, like the schedule. */
export default function RouteMapPage() {
  const params = useParams();
  if ((params.tenant as string) !== IFPC_TENANT_SLUG) notFound();
  return (
    <DelegatePageShell title="Route Map" icon={MapIcon}>
      <RouteMap />
    </DelegatePageShell>
  );
}
