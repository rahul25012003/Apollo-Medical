import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/users/me/sessions/[id] - Revoke a specific session
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const authSession = await auth();

    if (!authSession) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    // Check if session exists and belongs to user
    const targetSession = await prisma.session.findFirst({
      where: {
        id,
        userId: authSession.user.id,
      },
    });

    if (!targetSession) {
      return Errors.notFound("Session");
    }

    // Check if trying to revoke current session
    if (targetSession.id === authSession.sessionId) {
      return Errors.badRequest("Cannot revoke current session. Use logout instead.");
    }

    // Delete the session
    await prisma.session.delete({
      where: { id },
    });

    return successResponse(
      { id },
      "Session revoked successfully"
    );
  }
);
