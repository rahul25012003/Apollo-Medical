import type { PrismaClient } from "@prisma/client";

/**
 * The IFPC 2026 selectable programme: workshops, yoga and campus-tour slots.
 *
 *   Workshops  Day 1–3 × Morning/Afternoon × Audi 1/2/3   (one pick per slot)
 *   Yoga       Day 2–4, 7:00–8:00 AM                       (pick any number)
 *   Tour       3/4/5 Nov × Morning/Evening                  (pick exactly one)
 *
 * Additive and safe to re-run: a session that already exists in its slot is
 * left exactly as it is, so titles, times or capacities an admin has edited
 * are never overwritten. Only halls and these sessions are touched — unlike
 * the full IFPC seed, nothing about the site's content is rewritten.
 */

export const IFPC_DAYS = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"] as const;
export const AUDIS = ["Audi 1", "Audi 2", "Audi 3"] as const;

// Placeholder timings until the final programme is confirmed. The clash rule
// works from whatever times the sessions carry, so editing them later is safe.
export const WORKSHOP_SLOTS = {
  am: { label: "Morning", start: "09:00", end: "12:30" },
  pm: { label: "Afternoon", start: "14:00", end: "17:30" },
} as const;
export const TOUR_SLOTS = {
  am: { label: "Morning", start: "10:00", end: "12:00" },
  pm: { label: "Evening", start: "16:00", end: "18:00" },
} as const;
export const YOGA_SLOT = { start: "07:00", end: "08:00" } as const;

const WORKSHOP_DAYS = [IFPC_DAYS[0], IFPC_DAYS[1], IFPC_DAYS[2]];
const YOGA_DAYS = [IFPC_DAYS[1], IFPC_DAYS[2], IFPC_DAYS[3]];
const TOUR_DAYS = [IFPC_DAYS[1], IFPC_DAYS[2], IFPC_DAYS[3]];

// The single generic listings the programme replaces. Retired, not deleted,
// when any delegate has already chosen them — nobody's pick is dropped.
const RETIRED_TITLES = ["Pre-Conference Workshops", "Morning Yoga Sessions", "NIMHANS Campus Tour"];

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export async function syncIfpcProgramme(prisma: PrismaClient, eventId: string) {
  const log: string[] = [];

  // Halls — unique per event, so upsert is exact.
  const halls: Record<string, string> = {};
  for (const [i, name] of AUDIS.entries()) {
    const h = await prisma.eventHall.upsert({
      where: { eventId_name: { eventId, name } },
      update: {},
      create: { eventId, name, displayOrder: i + 1 },
      select: { id: true },
    });
    halls[name] = h.id;
  }
  log.push(`Halls ready: ${AUDIS.join(", ")}`);

  let created = 0, kept = 0;
  let order = 100;

  // Workshops: identified by day + start time + hall, never by title.
  for (const [dayIdx, date] of WORKSHOP_DAYS.entries()) {
    for (const half of ["am", "pm"] as const) {
      const slot = WORKSHOP_SLOTS[half];
      for (const audi of AUDIS) {
        order++;
        const exists = await prisma.eventSession.findFirst({
          where: { eventId, sessionType: "WORKSHOP", sessionDate: day(date), hallId: halls[audi], startTime: half === "am" ? { lt: "13:00" } : { gte: "13:00" } },
          select: { id: true },
        });
        if (exists) { kept++; continue; }
        await prisma.eventSession.create({ data: {
          eventId, title: `${audi}: Title`, sessionType: "WORKSHOP",
          description: `Day ${dayIdx + 1} ${slot.label.toLowerCase()} workshop in ${audi}. Title to be announced.`,
          sessionDate: day(date), startTime: slot.start, endTime: slot.end,
          hallId: halls[audi], sessionOrder: order, status: "scheduled", isPublished: true, capacity: 100,
        }});
        created++;
      }
    }
  }

  // Yoga: one session per day, any number may be chosen.
  for (const [i, date] of YOGA_DAYS.entries()) {
    order++;
    const exists = await prisma.eventSession.findFirst({
      where: { eventId, sessionDate: day(date), title: { contains: "Yoga", mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) { kept++; continue; }
    await prisma.eventSession.create({ data: {
      eventId, title: `Yoga Session — Day ${i + 2}`, sessionType: "SEMINAR",
      description: "Complimentary morning yoga by the Department of Integrative Medicine, NIMHANS, at the Yoga Hall. Comfortable, loose-fitting clothing recommended; practised barefoot; mats provided.",
      venue: "Yoga Hall, Department of Integrative Medicine",
      sessionDate: day(date), startTime: YOGA_SLOT.start, endTime: YOGA_SLOT.end,
      sessionOrder: order, status: "scheduled", isPublished: true, capacity: 30,
    }});
    created++;
  }

  // Campus tour: six slots, exactly one may be chosen.
  for (const date of TOUR_DAYS) {
    for (const half of ["am", "pm"] as const) {
      order++;
      const slot = TOUR_SLOTS[half];
      const exists = await prisma.eventSession.findFirst({
        where: { eventId, sessionDate: day(date), title: { contains: "Tour", mode: "insensitive" }, startTime: half === "am" ? { lt: "13:00" } : { gte: "13:00" } },
        select: { id: true },
      });
      if (exists) { kept++; continue; }
      await prisma.eventSession.create({ data: {
        eventId, title: `NIMHANS Campus Tour — ${shortDate(date)} ${slot.label}`, sessionType: "SEMINAR",
        description: "A guided, approximately 2-hour tour of the historic NIMHANS campus, showcasing its legacy and its clinical, academic and research facilities. Meet at the Registration Desk.",
        venue: "Starts at the Registration Desk",
        sessionDate: day(date), startTime: slot.start, endTime: slot.end,
        sessionOrder: order, status: "scheduled", isPublished: true, capacity: 40,
      }});
      created++;
    }
  }
  log.push(`Programme sessions: ${created} created, ${kept} already present (left untouched)`);

  // Retire the old single listings so they stop competing with the real slots.
  for (const title of RETIRED_TITLES) {
    const old = await prisma.eventSession.findFirst({
      where: { eventId, title, hallId: null },
      select: { id: true, isPublished: true, _count: { select: { interests: true } } },
    });
    if (!old) continue;
    if (old._count.interests === 0) {
      await prisma.eventSession.delete({ where: { id: old.id } });
      log.push(`Removed "${title}" (no delegate had chosen it)`);
    } else if (old.isPublished) {
      await prisma.eventSession.update({ where: { id: old.id }, data: { isPublished: false, capacity: null } });
      log.push(`Retired "${title}" — kept because ${old._count.interests} delegate(s) chose it; hidden and closed to new picks`);
    }
  }

  return log;
}
