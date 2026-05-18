import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Domain → Tenant slug mapping (cached in memory, refreshed every 5 minutes)
// ---------------------------------------------------------------------------
let domainCache: Record<string, string> = {};
let domainCacheTime = 0;
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTenantSlugByDomain(domain: string): Promise<string | null> {
  const now = Date.now();
  if (now - domainCacheTime > DOMAIN_CACHE_TTL) {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { domain: true, slug: true },
      });
      domainCache = {};
      let tenantsWithDomain = 0;
      for (const t of tenants) {
        if (t.domain) {
          domainCache[t.domain.toLowerCase()] = t.slug;
          tenantsWithDomain++;
        }
      }
      // Fallback: if no tenant has a domain configured but we're NOT on localhost,
      // and there's exactly 1 active tenant, use it as default for the production domain
      if (tenantsWithDomain === 0 && tenants.length >= 1) {
        // Use the first tenant as fallback for any non-localhost domain
        domainCache["__fallback__"] = tenants[0].slug;
      }
      domainCacheTime = now;
    } catch {
      // On error, use stale cache
    }
  }
  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
  if (isLocalhost) {
    // Allow overriding the tenant slug locally via NEXT_PUBLIC_DEV_TENANT_SLUG env var
    const devSlug = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG;
    return devSlug || null;
  }
  return domainCache[domain.toLowerCase()] || domainCache["__fallback__"] || null;
}

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/api/users", "/api/events", "/api/registrations", "/api/speakers", "/api/sponsors", "/api/certificates", "/api/upload", "/api/dashboard", "/api/communications", "/api/reports"];

// Routes that are public
const publicRoutes = ["/", "/auth", "/events", "/api/auth", "/api/events/public", "/api/events/gallery-photos", "/api/certificates/verify", "/api/registrations/public", "/api/health"];

// Routes that require specific roles (admin/staff only — ATTENDEE cannot access)
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER", "CERTIFICATE_MANAGER"];
const roleRoutes: Record<string, string[]> = {
  "/dashboard/users": ["SUPER_ADMIN", "ADMIN"],
  "/api/users": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/events/create": ADMIN_ROLES,
  "/dashboard/events/new": ADMIN_ROLES,
  "/dashboard/registrations": ADMIN_ROLES,
  "/dashboard/certificates": ADMIN_ROLES,
  "/dashboard/speakers": ADMIN_ROLES,
  "/dashboard/sponsors": ADMIN_ROLES,
  "/dashboard/settings": ADMIN_ROLES,
  "/dashboard/tenants": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/id-cards": ADMIN_ROLES,
  "/dashboard/scientific-program": ADMIN_ROLES,
  "/dashboard/access-control": ADMIN_ROLES,
  "/dashboard/scanner": ADMIN_ROLES,
  "/dashboard/engagement": ADMIN_ROLES,
  "/dashboard/communications": ADMIN_ROLES,
  "/dashboard/reports": ADMIN_ROLES,
  "/api/communications": ADMIN_ROLES,
  "/api/reports": ADMIN_ROLES,
};

// Routes that are exceptions to role-based access (accessible by any authenticated user)
const roleExceptions = [
  "/api/users/me",
  "/api/users/me/registrations",
  "/api/users/me/certificates",
  "/api/users/me/speaker-sessions",
  "/dashboard/browse-events",
  "/dashboard/my-sessions",
  "/dashboard/my-registrations",
  "/dashboard/my-certificates",
  "/dashboard/profile",
];

// ---------------------------------------------------------------------------
// CORS helper: compute allowed origin and attach headers to any response
// ---------------------------------------------------------------------------
function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return "";
  const hostWithoutPort = host.split(":")[0];
  const allowed =
    origin === `https://${host}` ||
    origin === `http://${host}` ||
    origin === `https://${hostWithoutPort}` ||
    origin === `http://${hostWithoutPort}`;
  return allowed ? origin : "";
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

function withCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  withSecurityHeaders(response);
  if (!request.nextUrl.pathname.startsWith("/api/")) return response;
  const allowedOrigin = getCorsOrigin(request);
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }
  response.headers.set("Vary", "Origin");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------------------------------------------------------
  // CORS preflight — respond immediately for OPTIONS on API routes
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const allowedOrigin = getCorsOrigin(request);
    const preflightHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    if (allowedOrigin) {
      preflightHeaders["Access-Control-Allow-Origin"] = allowedOrigin;
    }
    const preflightResponse = new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    });
    return withSecurityHeaders(preflightResponse);
  }

  // ---------------------------------------------------------------------------
  // Domain-based tenant rewriting: serve /t/[slug] content at root URL
  // The client never sees /t/slug in the URL bar.
  // ---------------------------------------------------------------------------
  const rawHostname = request.headers.get("host")?.split(":")[0] || "";
  // Strip www. prefix for consistent domain matching
  const hostname = rawHostname.replace(/^www\./, "");
  const tenantSlug = await getTenantSlugByDomain(hostname);

  if (tenantSlug) {
    // On custom domains, redirect /t/slug root to / so URLs stay clean
    // But allow sub-paths like /t/slug/gallery to pass through unchanged
    if (pathname.startsWith("/t/")) {
      const rootPaths = [`/t/${tenantSlug}`, `/t/${tenantSlug}/`];
      if (rootPaths.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return withCorsHeaders(NextResponse.redirect(url), request);
      }
      // Sub-paths (/t/slug/gallery etc.) — serve them directly
      return withCorsHeaders(NextResponse.next(), request);
    }

    // App-level routes that should NOT be rewritten to /t/[slug]
    const isAppRoute = pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next");

    // Inject tenant param into /auth/login so the login page knows which tenant
    if (pathname.startsWith("/auth") && !request.nextUrl.searchParams.has("tenant")) {
      const url = request.nextUrl.clone();
      url.searchParams.set("tenant", tenantSlug);
      return withCorsHeaders(NextResponse.rewrite(url), request);
    }

    if (!isAppRoute) {
      if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = `/t/${tenantSlug}`;
        return withCorsHeaders(NextResponse.rewrite(url), request);
      }

      // For event pages on tenant domains, rewrite internally with tenant param
      // Use rewrite (not redirect) so the URL stays clean without ?tenant=xxx
      if (pathname.startsWith("/events") && !request.nextUrl.searchParams.has("tenant")) {
        const url = request.nextUrl.clone();
        url.searchParams.set("tenant", tenantSlug);
        return withCorsHeaders(NextResponse.rewrite(url), request);
      }

      // For gallery pages on tenant domains
      if (pathname === "/gallery") {
        const url = request.nextUrl.clone();
        url.pathname = `/t/${tenantSlug}/gallery`;
        return withCorsHeaders(NextResponse.rewrite(url), request);
      }
    }
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    return withCorsHeaders(NextResponse.next(), request);
  }

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtectedRoute) {
    return withCorsHeaders(NextResponse.next(), request);
  }

  // Get session
  const session = await auth();

  if (!session) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return withCorsHeaders(
        NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          { status: 401 }
        ),
        request
      );
    }

    // For pages, redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if route is an exception to role-based access
  const isRoleException = roleExceptions.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
    // Allow any authenticated user to view individual certificate pages (for download)
    || /^\/dashboard\/certificates\/[^/]+\/view/.test(pathname)
    // Allow any authenticated user to fetch individual certificate data
    || /^\/api\/certificates\/[^/]+$/.test(pathname);

  // Check role-based access (skip if it's an exception)
  if (!isRoleException) {
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(session.user.role)) {
          // For API routes, return 403
          if (pathname.startsWith("/api/")) {
            return withCorsHeaders(
              NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
              ),
              request
            );
          }

          // For pages, redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  }

  return withCorsHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|uploads).*)",
  ],
};
