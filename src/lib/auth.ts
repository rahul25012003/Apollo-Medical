import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./auth-utils";
import { loginSchema } from "./validations/auth";
import type { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      image?: string | null;
      tenantId?: string | null;
    };
    sessionId?: string;
  }

  interface User {
    role: UserRole;
    tenantId?: string | null;
  }

  interface JWT {
    id: string;
    role: UserRole;
    sessionId?: string;
    tenantId?: string | null;
  }
}

// Helper to parse device info from user agent
function parseDeviceInfo(userAgent: string | null) {
  if (!userAgent) {
    return {
      deviceName: "Unknown Device",
      deviceType: "desktop",
      browser: "Unknown",
      os: "Unknown",
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown";
  const os = result.os.name || "Unknown";
  const deviceType = result.device.type || "desktop";

  return {
    deviceName: `${browser} on ${os}`,
    deviceType,
    browser,
    os,
  };
}

// Helper to create session record
async function createSessionRecord(userId: string, userAgent: string | null, ipAddress: string | null) {
  const deviceInfo = parseDeviceInfo(userAgent);

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: crypto.randomUUID(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ...deviceInfo,
      ipAddress,
    },
  });

  return session.id;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Trust the host header — required for multi-domain/multi-tenant production deployment
  // Without this, NextAuth rejects requests from domains that don't match NEXTAUTH_URL
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const tenantSlug = credentials?.tenantSlug as string | undefined;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
            avatar: true,
            tenantId: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
          return null;
        }

        // Tenant isolation for password login
        if (tenantSlug) {
          // Tenant-specific login (e.g., CareNS, Apollo, Fortis)
          // Super admin can login anywhere
          if (user.role !== "SUPER_ADMIN") {
            const loginTenant = await prisma.tenant.findUnique({
              where: { slug: tenantSlug },
              select: { id: true },
            });
            if (loginTenant && user.tenantId && user.tenantId !== loginTenant.id) {
              throw new Error("WRONG_TENANT");
            }
            if (loginTenant && !user.tenantId) {
              throw new Error("WRONG_TENANT");
            }
          }
        } else {
          // ICMS home login (no tenant) — only super admin allowed
          if (user.role !== "SUPER_ADMIN") {
            throw new Error("ICMS_SUPER_ADMIN_ONLY");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.tenantId = user.tenantId || null;

        // Create session record on sign in
        try {
          const headersList = await headers();
          const userAgent = headersList.get("user-agent");
          const forwardedFor = headersList.get("x-forwarded-for");
          const ipAddress = forwardedFor?.split(",")[0]?.trim() || headersList.get("x-real-ip") || null;

          const sessionId = await createSessionRecord(user.id as string, userAgent, ipAddress);
          token.sessionId = sessionId;
        } catch (error) {
          console.error("Failed to create session record:", error);
        }
      }

      // Auto-fix: if non-super-admin has no tenantId in token, re-fetch from DB
      // This handles cases where tenantId was updated after the user logged in
      if (token.id && token.role !== "SUPER_ADMIN" && !token.tenantId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tenantId: true, role: true },
          });
          if (dbUser?.tenantId) {
            token.tenantId = dbUser.tenantId;
          }
          if (dbUser?.role) {
            token.role = dbUser.role;
          }
        } catch {
          // Silently fail — don't break auth
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string | null | undefined;
        session.sessionId = token.sessionId as string | undefined;
      }
      return session;
    },
  },
});

// Helper to get current user in server components
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

// Helper to check if user has specific role(s)
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Role hierarchy for permission checks
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["*"], // Full platform access
  ADMIN: ["*"], // Full access within own tenant
  EVENT_MANAGER: ["events", "registrations", "speakers", "sponsors", "certificates", "communications", "reports"],
  REGISTRATION_MANAGER: ["registrations", "attendees"],
  CERTIFICATE_MANAGER: ["certificates"],
  ATTENDEE: ["profile", "registrations:own", "certificates:own"],
} as const;

// Check if user can access a resource
export function canAccess(
  userRole: UserRole,
  resource: string,
  ownerId?: string,
  userId?: string
): boolean {
  // Super admin and admin can do everything (admin is tenant-scoped at the API level)
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return true;
  }

  const permissions = ROLE_PERMISSIONS[userRole];

  // Check if user has wildcard access
  if (permissions.includes("*" as never)) {
    return true;
  }

  // Check for direct resource access
  if (permissions.includes(resource as never)) {
    return true;
  }

  // Check for own resource access (e.g., "registrations:own")
  if (ownerId && userId && ownerId === userId) {
    if (permissions.includes(`${resource}:own` as never)) {
      return true;
    }
  }

  return false;
}
