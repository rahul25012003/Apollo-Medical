import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

// GET /api/users/me/speaker-sessions - Get sessions where current user is a speaker
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const email = session.user.email?.toLowerCase();
  if (!email) return successResponse({ sessions: [], events: [] });

  // Find speaker record by email
  const speaker = await prisma.speaker.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!speaker) return successResponse({ sessions: [], events: [] });

  // Get all sessions this speaker is assigned to
  const sessionSpeakers = await prisma.sessionSpeaker.findMany({
    where: { speakerId: speaker.id },
    include: {
      session: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              city: true,
            },
          },
          hall: { select: { name: true } },
          sessionSpeakers: {
            include: {
              speaker: {
                select: { id: true, name: true, photo: true, designation: true },
              },
            },
          },
        },
      },
    },
    orderBy: { session: { sessionDate: "asc" } },
  });

  // Also check EventSpeaker for event-level assignments
  const eventSpeakers = await prisma.eventSpeaker.findMany({
    where: { speakerId: speaker.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          city: true,
        },
      },
    },
  });

  const sessions = sessionSpeakers.map((ss) => ({
    id: ss.session.id,
    title: ss.session.title,
    description: ss.session.description,
    sessionType: ss.session.sessionType,
    sessionDate: ss.session.sessionDate,
    startTime: ss.session.startTime,
    endTime: ss.session.endTime,
    status: ss.session.status,
    hall: ss.session.hall?.name || ss.session.venue,
    talkTitle: ss.talkTitle,
    talkDescription: ss.talkDescription,
    event: ss.session.event,
    coSpeakers: ss.session.sessionSpeakers
      .filter((s) => s.speakerId !== speaker.id)
      .map((s) => ({
        name: s.speaker.name,
        photo: s.speaker.photo,
        designation: s.speaker.designation,
      })),
  }));

  // Events where assigned but not to specific sessions
  const sessionEventIds = new Set(sessions.map((s) => s.event.id));
  const events = eventSpeakers
    .filter((es) => !sessionEventIds.has(es.event.id))
    .map((es) => ({
      eventId: es.event.id,
      eventTitle: es.event.title,
      topic: es.topic,
      sessionDate: es.sessionDate,
      sessionTime: es.sessionTime,
      event: es.event,
    }));

  return successResponse({ sessions, events });
});
