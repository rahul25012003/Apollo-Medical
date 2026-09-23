import { prisma } from "@/lib/prisma";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { choicesWindow, type ChoicesWindow } from "@/lib/ifpc-deadline";

// Server-only half of ifpc-deadline: importing prisma from the shared module
// would pull `pg` (and so `dns`/`fs`) into every client bundle that wants the
// pure helpers.

/** The window for the IFPC event, read once per request. */
export async function ifpcChoicesWindow(eventId?: string | null): Promise<ChoicesWindow> {
  const event = eventId
    ? await prisma.event.findUnique({ where: { id: eventId }, select: { registrationDeadline: true } })
    : await prisma.event.findFirst({
        where: { tenant: { slug: IFPC_TENANT_SLUG } },
        orderBy: { startDate: "desc" },
        select: { registrationDeadline: true },
      });
  return choicesWindow(event?.registrationDeadline);
}
