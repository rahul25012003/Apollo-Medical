import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

interface ImportScheduleBody {
  sourceEventId: string;
  mode?: "replace" | "append";
  shiftDates?: boolean;
  includeSpeakers?: boolean;
  includeHalls?: boolean;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getDaysDiff(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// POST /api/events/[id]/import-schedule
// Copies the schedule (sessions, halls, session-speaker links) from one event into another.
// Body: { sourceEventId, mode, shiftDates, includeSpeakers, includeHalls }
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to edit events");
    }

    const { id: targetEventId } = await context!.params;

    const body = await parseBody<ImportScheduleBody>(request);

    if (!body?.sourceEventId || typeof body.sourceEventId !== "string") {
      return Errors.badRequest("sourceEventId is required");
    }

    if (body.sourceEventId === targetEventId) {
      return Errors.badRequest("Source and target event cannot be the same");
    }

    const mode: "replace" | "append" = body.mode === "replace" ? "replace" : "append";
    const shiftDates = body.shiftDates !== false;
    const includeSpeakers = body.includeSpeakers !== false;
    const includeHalls = body.includeHalls !== false;

    // Load both events — tenant-scoped where applicable
    const [targetEvent, sourceEvent] = await Promise.all([
      prisma.event.findUnique({
        where: { id: targetEventId },
        select: { id: true, startDate: true, tenantId: true, halls: true },
      }),
      prisma.event.findUnique({
        where: { id: body.sourceEventId },
        select: {
          id: true,
          startDate: true,
          tenantId: true,
          halls: {
            select: { id: true, name: true, displayOrder: true },
          },
          eventSessions: {
            select: {
              id: true,
              title: true,
              description: true,
              sessionType: true,
              sessionDate: true,
              startTime: true,
              endTime: true,
              venue: true,
              hallId: true,
              speakerId: true,
              sessionOrder: true,
              status: true,
              isPublished: true,
              sessionSpeakers: {
                select: {
                  speakerId: true,
                  talkTitle: true,
                  talkDescription: true,
                  talkDuration: true,
                  displayOrder: true,
                },
              },
            },
            orderBy: [{ sessionDate: "asc" }, { sessionOrder: "asc" }],
          },
        },
      }),
    ]);

    if (!targetEvent) {
      return Errors.notFound("Target event");
    }
    if (!sourceEvent) {
      return Errors.notFound("Source event");
    }

    // Tenant isolation — non-super-admin can only import across their own tenant
    if (session.user.role !== "SUPER_ADMIN") {
      const userTenantId = session.user.tenantId;
      if (
        !userTenantId ||
        targetEvent.tenantId !== userTenantId ||
        sourceEvent.tenantId !== userTenantId
      ) {
        return Errors.forbidden("You can only import schedules between events in your tenant");
      }
    }

    if (sourceEvent.eventSessions.length === 0) {
      return Errors.badRequest("Source event has no sessions to import");
    }

    // Calculate date offset if shifting is enabled
    let offsetDays = 0;
    if (shiftDates && sourceEvent.startDate && targetEvent.startDate) {
      offsetDays = getDaysDiff(sourceEvent.startDate, targetEvent.startDate);
    }

    // Build hall name → existing target hallId map
    const existingTargetHallsByName = new Map<string, string>();
    for (const h of targetEvent.halls) {
      existingTargetHallsByName.set(h.name.toLowerCase().trim(), h.id);
    }

    // Import in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // If REPLACE mode, delete existing sessions and their session-speaker links
      let deletedCount = 0;
      if (mode === "replace") {
        const existingSessions = await tx.eventSession.findMany({
          where: { eventId: targetEventId },
          select: { id: true },
        });
        if (existingSessions.length > 0) {
          await tx.sessionSpeaker.deleteMany({
            where: { sessionId: { in: existingSessions.map((s) => s.id) } },
          });
          const del = await tx.eventSession.deleteMany({
            where: { eventId: targetEventId },
          });
          deletedCount = del.count;
        }
      }

      // Build source hallId → target hallId map (create halls as needed if includeHalls)
      const sourceHallIdToTargetHallId = new Map<string, string>();
      for (const sourceHall of sourceEvent.halls) {
        const key = sourceHall.name.toLowerCase().trim();
        const existing = existingTargetHallsByName.get(key);
        if (existing) {
          sourceHallIdToTargetHallId.set(sourceHall.id, existing);
        } else if (includeHalls) {
          const created = await tx.eventHall.create({
            data: {
              eventId: targetEventId,
              name: sourceHall.name,
              displayOrder: sourceHall.displayOrder,
            },
          });
          sourceHallIdToTargetHallId.set(sourceHall.id, created.id);
          existingTargetHallsByName.set(key, created.id);
        }
      }

      // Create each session individually so we can also create its sessionSpeakers
      let createdCount = 0;
      for (const s of sourceEvent.eventSessions) {
        let newSessionDate = s.sessionDate;
        if (shiftDates && offsetDays !== 0 && s.sessionDate) {
          newSessionDate = addDays(s.sessionDate, offsetDays);
        }

        const mappedHallId = s.hallId ? sourceHallIdToTargetHallId.get(s.hallId) ?? null : null;

        const newSession = await tx.eventSession.create({
          data: {
            eventId: targetEventId,
            title: s.title,
            description: s.description,
            sessionType: s.sessionType,
            sessionDate: newSessionDate,
            startTime: s.startTime,
            endTime: s.endTime,
            venue: s.venue,
            hallId: mappedHallId,
            speakerId: includeSpeakers ? s.speakerId : null,
            sessionOrder: s.sessionOrder,
            status: "scheduled",
            isPublished: s.isPublished,
          },
        });

        if (includeSpeakers && s.sessionSpeakers.length > 0) {
          await tx.sessionSpeaker.createMany({
            data: s.sessionSpeakers.map((ss) => ({
              sessionId: newSession.id,
              speakerId: ss.speakerId,
              talkTitle: ss.talkTitle,
              talkDescription: ss.talkDescription,
              talkDuration: ss.talkDuration,
              displayOrder: ss.displayOrder,
            })),
          });
        }

        createdCount++;
      }

      return { created: createdCount, deleted: deletedCount };
    }, { timeout: 30000 });

    return successResponse({
      imported: result.created,
      replaced: result.deleted,
      mode,
      shiftDates,
      offsetDays,
    }, `Imported ${result.created} session${result.created === 1 ? "" : "s"} successfully`);
  }
);
