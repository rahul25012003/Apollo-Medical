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
        where: { domain: { not: null }, isActive: true },
        select: { domain: true, slug: true },
      });
      domainCache = {};
      for (const t of tenants) {
        if (t.domain) domainCache[t.domain.toLowerCase()] = t.slug;
      }
      domainCacheTime = now;
    } catch {
      // On error, use stale cache
    }
  }
  return domainCache[domain.toLowerCase()] || null;
}

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/api/users", "/api/events", "/api/registrations", "/api/speakers", "/api/sponsors", "/api/certificates", "/api/upload", "/api/dashboard"];

// Routes that are public
const publicRoutes = ["/", "/auth", "/events", "/api/auth", "/api/events/public", "/api/certificates/verify", "/api/registrations/public", "/api/health"];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  "/dashboard/users": ["SUPER_ADMIN", "ADMIN"],
  "/api/users": ["SUPER_ADMIN", "ADMIN"],
};

// Routes that are exceptions to role-based access (accessible by any authenticated user)
const roleExceptions = ["/api/users/me", "/api/users/me/registrations", "/api/users/me/certificates"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------------------------------------------------------
  // Domain-based tenant rewriting: serve /t/[slug] content at root URL
  // The client never sees /t/slug in the URL bar.
  // ---------------------------------------------------------------------------
  const hostname = request.headers.get("host")?.split(":")[0] || "";
  const tenantSlug = await getTenantSlugByDomain(hostname);

  if (tenantSlug && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/t/${tenantSlug}`;
    return NextResponse.rewrite(url);
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  if (!session) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
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
  );

  // Check role-based access (skip if it's an exception)
  if (!isRoleException) {
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(session.user.role)) {
          // For API routes, return 403
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
              { status: 403 }
            );
          }

          // For pages, redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  }

  return NextResponse.next();
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
