import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { sendEmail, abstractStatusUpdatedHtml } from "@/lib/notifications";
import { issuePresentationCertificate } from "@/lib/ifpc-automation";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string; abstractId: string }> };

const updateSchema = z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "ACCEPTED_ORAL", "ACCEPTED_POSTER", "REJECTED", "WITHDRAWN"]).optional(),
  presentationMode: z.string().optional().nullable(),
  posterBoardNumber: z.string().optional().nullable(),
  reviewNotes: z.string().optional().nullable(),
});

// PATCH /api/events/[id]/abstracts/[abstractId] — admin review: accept/reject, assign mode/board number
export const PATCH = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "events")) return Errors.forbidden("You don't have permission to review abstracts");

  const { id: eventId, abstractId } = await context!.params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, tenantId: true, title: true } });
  if (!event) return Errors.notFound("Event");
  if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden("You don't have access to this event");

  const existing = await prisma.abstract.findUnique({ where: { id: abstractId } });
  if (!existing || existing.eventId !== eventId) return Errors.notFound("Abstract");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);
  const data = parsed.data;

  const updated = await prisma.abstract.update({
    where: { id: abstractId },
    data: {
      ...(data.status !== undefined ? { status: data.status, reviewedAt: new Date() } : {}),
      ...(data.presentationMode !== undefined ? { presentationMode: data.presentationMode } : {}),
      ...(data.posterBoardNumber !== undefined ? { posterBoardNumber: data.posterBoardNumber } : {}),
      ...(data.reviewNotes !== undefined ? { reviewNotes: data.reviewNotes } : {}),
    },
  });

  const statusChanged = data.status !== undefined && data.status !== existing.status;
  if (statusChanged) {
    sendEmail({
      to: updated.presentingAuthorEmail,
      subject: `Abstract Update — ${event.title}`,
      html: abstractStatusUpdatedHtml({
        name: updated.presentingAuthorName,
        eventTitle: event.title,
        title: updated.title,
        status: updated.status,
        presentationMode: updated.presentationMode,
        posterBoardNumber: updated.posterBoardNumber,
        reviewNotes: updated.reviewNotes,
      }),
      tenantId: event.tenantId,
    }).catch((err) => console.error("Abstract status email error:", err));

    if (updated.status === "ACCEPTED_ORAL" || updated.status === "ACCEPTED_POSTER") {
      issuePresentationCertificate(abstractId).catch((err) => console.error("Presentation certificate error:", err));
    }
  }

  return successResponse(updated, "Abstract updated");
});
