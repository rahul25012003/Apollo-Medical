// Tenant detection utilities

/**
 * Extract tenant slug from various URL patterns:
 * 1. Subdomain: tenant.medconf.com
 * 2. Path: medconf.com/t/tenant
 * 3. Query: medconf.com?tenant=slug
 * 4. Custom domain lookup (requires API call)
 */

export interface TenantDetectionResult {
  slug: string | null;
  source: "subdomain" | "path" | "query" | "domain" | "default";
}

// Main domains that should not be treated as tenant subdomains
const MAIN_DOMAINS = [
  "localhost",
  "medconf.com",
  "www.medconf.com",
  "app.medconf.com",
  "admin.medconf.com",
  "api.medconf.com",
];

// Reserved slugs that cannot be used as tenant identifiers
const RESERVED_SLUGS = [
  "www",
  "app",
  "admin",
  "api",
  "auth",
  "login",
  "register",
  "dashboard",
  "settings",
  "help",
  "support",
  "about",
  "contact",
  "pricing",
  "blog",
  "docs",
];

/**
 * Check if a domain is a main/reserved domain
 */
export function isMainDomain(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  return MAIN_DOMAINS.some(
    (domain) =>
      lowerHostname === domain ||
      lowerHostname === `www.${domain}` ||
      lowerHostname.endsWith(`.${domain}`)
  );
}

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Extract tenant from subdomain
 * e.g., "abc.medconf.com" -> "abc"
 */
export function getTenantFromSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");

  // Need at least 3 parts (subdomain.domain.tld) for production
  // or 2 parts for localhost (subdomain.localhost)
  if (parts.length >= 2) {
    const subdomain = parts[0].toLowerCase();

    // Check if it's a reserved subdomain
    if (isReservedSlug(subdomain)) {
      return null;
    }

    // For localhost with port
    if (hostname.includes("localhost")) {
      if (parts.length >= 2 && parts[0] !== "localhost") {
        return parts[0];
      }
      return null;
    }

    // For production domains (subdomain.medconf.com)
    if (parts.length >= 3 && subdomain !== "www") {
      return subdomain;
    }
  }

  return null;
}

/**
 * Extract tenant from URL path
 * e.g., "/t/abc/events" -> "abc"
 */
export function getTenantFromPath(pathname: string): string | null {
  // Match /t/{tenant} or /tenant/{tenant} pattern
  const pathMatch = pathname.match(/^\/(t|tenant)\/([a-zA-Z0-9-_]+)/);

  if (pathMatch && pathMatch[2]) {
    const slug = pathMatch[2].toLowerCase();
    if (!isReservedSlug(slug)) {
      return slug;
    }
  }

  return null;
}

/**
 * Extract tenant from query parameter
 * e.g., "?tenant=abc" -> "abc"
 */
export function getTenantFromQuery(searchParams: URLSearchParams): string | null {
  const tenant = searchParams.get("tenant");

  if (tenant && !isReservedSlug(tenant.toLowerCase())) {
    return tenant.toLowerCase();
  }

  return null;
}

/**
 * Detect tenant from request URL using multiple strategies
 */
export function detectTenant(url: URL): TenantDetectionResult {
  // 1. Check subdomain first (highest priority for custom domains)
  const subdomainTenant = getTenantFromSubdomain(url.hostname);
  if (subdomainTenant) {
    return { slug: subdomainTenant, source: "subdomain" };
  }

  // 2. Check path parameter
  const pathTenant = getTenantFromPath(url.pathname);
  if (pathTenant) {
    return { slug: pathTenant, source: "path" };
  }

  // 3. Check query parameter
  const queryTenant = getTenantFromQuery(url.searchParams);
  if (queryTenant) {
    return { slug: queryTenant, source: "query" };
  }

  // 4. Default (no tenant detected)
  return { slug: null, source: "default" };
}

/**
 * Client-side tenant detection
 */
export function detectTenantClient(): TenantDetectionResult {
  if (typeof window === "undefined") {
    return { slug: null, source: "default" };
  }

  return detectTenant(new URL(window.location.href));
}

/**
 * Build URL with tenant context
 */
export function buildTenantUrl(
  basePath: string,
  tenantSlug: string | null,
  source: TenantDetectionResult["source"]
): string {
  if (!tenantSlug) {
    return basePath;
  }

  switch (source) {
    case "path":
      return `/t/${tenantSlug}${basePath}`;
    case "query":
      const separator = basePath.includes("?") ? "&" : "?";
      return `${basePath}${separator}tenant=${tenantSlug}`;
    case "subdomain":
    case "domain":
    default:
      return basePath;
  }
}

/**
 * Strip tenant prefix from path
 */
export function stripTenantFromPath(pathname: string): string {
  return pathname.replace(/^\/(t|tenant)\/[a-zA-Z0-9-_]+/, "");
}
