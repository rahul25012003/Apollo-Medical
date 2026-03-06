import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

// GET /api/users/me/sessions - Get all active sessions for current user
export const GET = withErrorHandler(async (request: NextRequest) => {
  const authSession = await auth();

  if (!authSession) {
    return Errors.unauthorized();
  }

  const sessions = await prisma.session.findMany({
    where: {
      userId: authSession.user.id,
      expires: { gt: new Date() }, // Only non-expired sessions
    },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      browser: true,
      os: true,
      ipAddress: true,
      location: true,
      lastActiveAt: true,
      createdAt: true,
      expires: true,
    },
    orderBy: { lastActiveAt: "desc" },
  });

  // Get current session ID from auth session
  const currentSessionId = authSession.sessionId || null;

  const sessionsWithCurrent = sessions.map((s) => ({
    ...s,
    isCurrent: s.id === currentSessionId,
  }));

  return successResponse(sessionsWithCurrent);
});

// DELETE /api/users/me/sessions - Revoke all sessions except current
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const authSession = await auth();

  if (!authSession) {
    return Errors.unauthorized();
  }

  // Get current session ID from auth session
  const currentSessionId = authSession.sessionId;

  // Delete all sessions except current
  const result = await prisma.session.deleteMany({
    where: {
      userId: authSession.user.id,
      id: currentSessionId ? { not: currentSessionId } : undefined,
    },
  });

  return successResponse(
    { revokedCount: result.count },
    `Logged out from ${result.count} device(s)`
  );
});
