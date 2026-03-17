import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { generateCertificateCode } from "@/lib/auth-utils";
import * as z from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const updateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED"]).optional(),
});

// GET /api/events/[id]/quizzes - List quizzes for event
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();

    const { id: eventId } = await context!.params;

    const quizzes = await prisma.quiz.findMany({
      where: { eventId },
      include: {
        _count: { select: { participants: true, certificates: true } },
        participants: {
          include: {
            registration: { select: { id: true, name: true, email: true } },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(quizzes);
  }
);

// POST /api/events/[id]/quizzes - Create quiz or perform actions
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();
    if (!canAccess(session.user.role, "events"))
      return Errors.forbidden("No permission");

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, tenantId: true },
    });
    if (!event) return Errors.notFound("Event");
    if (!isTenantOwner(session, event.tenantId))
      return Errors.forbidden("No access");

    const body = await parseBody(request) as Record<string, string | number | boolean | null> | null;
    if (!body) return Errors.badRequest("Invalid body");

    // Action: generate quiz certificates
    if (body.action === "generate_certificates" && body.quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: String(body.quizId) },
        include: {
          participants: {
            include: {
              registration: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      if (!quiz) return Errors.notFound("Quiz");

      const existingCerts = await prisma.certificate.findMany({
        where: { quizId: quiz.id },
        select: { registrationId: true, certificateType: true },
      });
      const existingSet = new Set(
        existingCerts.map((c) => `${c.registrationId}_${c.certificateType}`)
      );

      const certsToCreate: Array<Record<string, unknown>> = [];

      for (const p of quiz.participants) {
        if (p.isWinner && p.position) {
          const key = `${p.registrationId}_QUIZ_WINNER`;
          if (!existingSet.has(key)) {
            const posLabel =
              p.position === 1 ? "1st" : p.position === 2 ? "2nd" : p.position === 3 ? "3rd" : `${p.position}th`;
            certsToCreate.push({
              certificateCode: generateCertificateCode(),
              registrationId: p.registrationId,
              eventId,
              quizId: quiz.id,
              certificateType: "QUIZ_WINNER",
              recipientName: p.registration.name,
              recipientEmail: p.registration.email,
              title: `Winner Certificate (${posLabel} Place) - ${quiz.title}`,
              position: p.position,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        }

        if (p.isFinalist && !p.isWinner) {
          const key = `${p.registrationId}_QUIZ_FINALIST`;
          if (!existingSet.has(key)) {
            certsToCreate.push({
              certificateCode: generateCertificateCode(),
              registrationId: p.registrationId,
              eventId,
              quizId: quiz.id,
              certificateType: "QUIZ_FINALIST",
              recipientName: p.registration.name,
              recipientEmail: p.registration.email,
              title: `Finalist Certificate - ${quiz.title}`,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        }

        // Participation cert for everyone
        if (!p.isWinner && !p.isFinalist) {
          const key = `${p.registrationId}_QUIZ_PARTICIPATION`;
          if (!existingSet.has(key)) {
            certsToCreate.push({
              certificateCode: generateCertificateCode(),
              registrationId: p.registrationId,
              eventId,
              quizId: quiz.id,
              certificateType: "QUIZ_PARTICIPATION",
              recipientName: p.registration.name,
              recipientEmail: p.registration.email,
              title: `Participation Certificate - ${quiz.title}`,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        }
      }

      if (certsToCreate.length === 0) {
        return Errors.badRequest("All participants already have certificates");
      }

      const result = await prisma.certificate.createMany({
        data: certsToCreate as never,
      });

      return successResponse(
        { created: result.count },
        `${result.count} quiz certificates created`,
        201
      );
    }

    // Action: add participant
    if (body.action === "add_participant" && body.quizId && body.registrationId) {
      const qId = String(body.quizId);
      const rId = String(body.registrationId);
      const participant = await prisma.quizParticipant.upsert({
        where: {
          quizId_registrationId: { quizId: qId, registrationId: rId },
        },
        create: {
          quizId: qId,
          registrationId: rId,
          score: typeof body.score === "number" ? body.score : null,
          position: typeof body.position === "number" ? body.position : null,
          isFinalist: body.isFinalist === true,
          isWinner: body.isWinner === true,
        },
        update: {
          score: typeof body.score === "number" ? body.score : undefined,
          position: typeof body.position === "number" ? body.position : undefined,
          isFinalist: typeof body.isFinalist === "boolean" ? body.isFinalist : undefined,
          isWinner: typeof body.isWinner === "boolean" ? body.isWinner : undefined,
        },
      });
      return successResponse(participant, "Participant updated");
    }

    // Default: create quiz
    const parsed = createQuizSchema.safeParse(body);
    if (!parsed.success) return Errors.validationError(parsed.error);

    const quiz = await prisma.quiz.create({
      data: {
        ...parsed.data,
        eventId,
      },
    });

    return successResponse(quiz, "Quiz created", 201);
  }
);

// PUT /api/events/[id]/quizzes - Update quiz
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();
    if (!canAccess(session.user.role, "events"))
      return Errors.forbidden("No permission");

    const { id: eventId } = await context!.params;
    const body = await parseBody(request);
    if (!body || !body.quizId) return Errors.badRequest("quizId required");

    const quizId = String(body.quizId);
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { event: { select: { tenantId: true } } },
    });
    if (!quiz) return Errors.notFound("Quiz");
    if (!isTenantOwner(session, quiz.event.tenantId))
      return Errors.forbidden("No access");

    const parsed = updateQuizSchema.safeParse(body);
    if (!parsed.success) return Errors.validationError(parsed.error);

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: parsed.data,
    });

    return successResponse(updated, "Quiz updated");
  }
);

// DELETE /api/events/[id]/quizzes - Delete quiz
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();
    if (!canAccess(session.user.role, "events"))
      return Errors.forbidden("No permission");

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    if (!quizId) return Errors.badRequest("quizId required");

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { event: { select: { tenantId: true } } },
    });
    if (!quiz) return Errors.notFound("Quiz");
    if (!isTenantOwner(session, quiz.event.tenantId))
      return Errors.forbidden("No access");

    await prisma.quiz.delete({ where: { id: quizId } });

    return successResponse({ id: quizId }, "Quiz deleted");
  }
);
