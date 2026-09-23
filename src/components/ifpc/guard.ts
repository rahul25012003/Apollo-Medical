"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { useTenant } from "@/lib/tenant/context";

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
 *
 * Reads the tenant already resolved by TenantProvider (server-hydrated for
 * every role except SUPER_ADMIN, see dashboard/layout.tsx) instead of a
 * second, redundant client-side tenant lookup — that second lookup's own
 * loading window used to force isIfpc to false for a moment on every page
 * load, flashing the non-IFPC sidebar/header (missing menu items, a generic
 * search bar) before flipping back to the correct one.
 */
export function useIsIfpcDashboard(): { isIfpc: boolean; loading: boolean } {
  const { sessionLoading } = useTenantFilter();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const loading = sessionLoading || tenantLoading;
  return { isIfpc: !loading && tenant.slug === IFPC_TENANT_SLUG, loading };
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

// IFPC (apollo-medical) is a single-event conference by design, so "Browse
// Events" can always go straight to that one event — cached per tenant, not
// per user, since the answer doesn't depend on who's asking.
const soleEventCache = new Map<string, Promise<string | null>>();

function ifpcSoleEventId(tenantId: string): Promise<string | null> {
  if (!soleEventCache.has(tenantId)) {
    soleEventCache.set(
      tenantId,
      fetch(`/api/events/public?limit=200&tenantId=${encodeURIComponent(tenantId)}`)
        .then((r) => r.json())
        .then((eventsJson) => {
          const events: { id: string; tenant?: { slug: string } | null }[] = Array.isArray(eventsJson?.data) ? eventsJson.data : [];
          const mine = events.filter((e) => e.tenant?.slug === IFPC_TENANT_SLUG);
          return mine.length === 1 ? mine[0].id : null;
        })
        .catch(() => { soleEventCache.delete(tenantId); return null; })
    );
  }
  return soleEventCache.get(tenantId)!;
}

/**
 * Where "Browse Events" should point: straight to the event page for IFPC
 * (apollo-medical), which only ever has one event; the usual list otherwise,
 * and always for every other tenant.
 */
export function useBrowseEventsHref(): string {
  const LIST = "/dashboard/browse-events";
  const { isIfpc } = useIsIfpcDashboard();
  const { effectiveTenantId } = useTenantFilter();
  const [href, setHref] = useState(LIST);

  useEffect(() => {
    if (!isIfpc || !effectiveTenantId) { setHref(LIST); return; }
    let cancelled = false;
    ifpcSoleEventId(effectiveTenantId).then((id) => {
      if (!cancelled) setHref(id ? `${LIST}/${id}` : LIST);
    });
    return () => { cancelled = true; };
  }, [isIfpc, effectiveTenantId]);

  return href;
}
