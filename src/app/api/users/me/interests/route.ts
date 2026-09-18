import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

// GET /api/users/me/interests - Sessions the current delegate has expressed
// interest in (matched by email, same convention as SessionInterest.email).
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const interests = await prisma.sessionInterest.findMany({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      session: {
        select: {
          id: true,
          title: true,
          description: true,
          sessionType: true,
          sessionDate: true,
          startTime: true,
          endTime: true,
          capacity: true,
          venue: true,
          hall: { select: { name: true } },
          event: {
            select: { id: true, title: true, startDate: true, endDate: true, location: true, city: true },
          },
        },
      },
    },
  });

  const mapped = interests.map((i) => ({
    interestId: i.id,
    registeredAt: i.createdAt,
    session: {
      id: i.session.id,
      title: i.session.title,
      description: i.session.description,
      sessionType: i.session.sessionType,
      sessionDate: i.session.sessionDate,
      startTime: i.session.startTime,
      endTime: i.session.endTime,
      capacity: i.session.capacity,
      venue: i.session.venue || i.session.hall?.name || null,
      event: i.session.event,
    },
  }));

  return successResponse(mapped);
});
