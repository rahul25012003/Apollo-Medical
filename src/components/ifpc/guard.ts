"use client";

import { useParams, notFound } from "next/navigation";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";

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
