"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

export { IFPC_TENANT_SLUG };

/**
 * All new IFPC 2026 routes live under the shared /t/[tenant]/ segment so they
 * inherit tenant resolution + 404 handling from layout.tsx. This guard keeps
 * them reachable ONLY on the apollo-medical tenant — any other tenant slug
 * (carens included) 404s exactly as if the route didn't exist for them.
 */

export function useIfpcGuard(): string {
  const params = useParams();
  const tenantSlug = params?.tenant as string;
  if (tenantSlug !== IFPC_TENANT_SLUG) {
    notFound();
  }
  return tenantSlug;
}

/**
 * Dashboard pages: is the signed-in user's tenant IFPC (apollo-medical)?
 * Other tenants keep their original dashboard; while the tenant is still
 * loading, `loading` is true and callers should render nothing tenant-specific.
 */
export function useIsIfpcDashboard(): { isIfpc: boolean; loading: boolean } {
  const { effectiveTenantId, sessionLoading } = useTenantFilter();
  const check = useIsIfpcTenantId(sessionLoading ? undefined : effectiveTenantId);
  const loading = sessionLoading || check.loading;
  return { isIfpc: !loading && check.isIfpc, loading };
}

// tenantId -> slug, and eventId -> tenant slug, fetched once per page load.
const tenantSlugCache = new Map<string, Promise<string | null>>();
const eventSlugCache = new Map<string, Promise<string | null>>();

function tenantSlugOf(tenantId: string): Promise<string | null> {
  if (!tenantSlugCache.has(tenantId)) {
    tenantSlugCache.set(
      tenantId,
      fetch(`/api/tenants/by-id/${tenantId}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((j) => (j?.data?.slug as string) ?? null)
        .catch(() => { tenantSlugCache.delete(tenantId); return null; })
    );
  }
  return tenantSlugCache.get(tenantId)!;
}

function eventTenantSlugOf(eventId: string): Promise<string | null> {
  if (!eventSlugCache.has(eventId)) {
    eventSlugCache.set(
      eventId,
      fetch(`/api/events/${eventId}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((j) => (j?.data?.tenantId ? tenantSlugOf(j.data.tenantId) : null))
        .catch(() => { eventSlugCache.delete(eventId); return null; })
    );
  }
  return eventSlugCache.get(eventId)!;
}

function useSlugCheck(key: string | null | undefined, resolve: (key: string) => Promise<string | null>) {
  const [state, setState] = useState<{ key: string | null | undefined; slug: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!key) return;
    resolve(key).then((slug) => { if (!cancelled) setState({ key, slug }); });
    return () => { cancelled = true; };
  }, [key, resolve]);
  const loading = !!key && state?.key !== key;
  return { isIfpc: !loading && !!key && state?.slug === IFPC_TENANT_SLUG, loading };
}

/** Is this tenant id the IFPC (apollo-medical) tenant? */
export function useIsIfpcTenantId(tenantId: string | null | undefined) {
  return useSlugCheck(tenantId, tenantSlugOf);
}

/** Does this event belong to the IFPC (apollo-medical) tenant? For admin screens. */
export function useIsIfpcEventId(eventId: string | null | undefined) {
  return useSlugCheck(eventId, eventTenantSlugOf);
}
