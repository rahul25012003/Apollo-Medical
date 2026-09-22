import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { Errors } from "@/lib/api-utils";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import { toCsv } from "@/lib/csv";
import { csvResponse } from "@/lib/csv-response";
import { sharingLabel } from "@/lib/ifpc-constants";
import { logActivity } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const TYPES = ["session-interests", "speaker-interests", "accommodation", "food", "participant-interests", "feedback"] as const;
type ExportType = (typeof TYPES)[number];

const fmtDay = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const yesNo = (v: boolean | null | undefined) => (v == null ? "Not answered" : v ? "Yes" : "No");
const food = (v: string | null | undefined) => (v === "VEG" ? "Vegetarian" : v === "NON_VEG" ? "Non-Vegetarian" : "");

// GET /api/events/[id]/exports?type=... — CSV downloads for the organizing
// team (Excel-compatible). IFPC (apollo-medical) only.
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent(eventId))) return Errors.notFound("Page");

  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "events") && !canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to export this");
  }
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, tenantId: true, title: true } });
  if (!event) return Errors.notFound("Event");
  if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden("You don't have access to this event");

  const type = new URL(request.url).searchParams.get("type") as ExportType | null;
  if (!type || !TYPES.includes(type)) return Errors.badRequest(`type must be one of: ${TYPES.join(", ")}`);

  const registrations = await prisma.registration.findMany({
    where: { eventId },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, email: true, phone: true, organization: true, designation: true, category: true,
      participantRole: true, status: true, registrationCode: true, foodPreference: true,
      accommodationRequired: true, accommodationSharing: true, accommodationChoice: true,
      accommodationCheckIn: true, accommodationCheckOut: true, accommodationRemarks: true, accommodationSelectedAt: true,
    },
  });
  const regByEmail = new Map(registrations.map((r) => [r.email.toLowerCase(), r]));
  const delegateCols = (email: string, fallbackName: string) => {
    const r = regByEmail.get(email.toLowerCase());
    return [r?.registrationCode ?? "", r?.name ?? fallbackName, email, r?.phone ?? "", r?.category ?? "", r?.participantRole ?? "", r ? "Registered" : "Not registered"];
  };
  const DELEGATE_HEADERS = ["Registration ID", "Name", "Email", "Phone", "Category", "Role", "Registration"];

  let headers: string[] = [];
  let rows: (string | number | null | undefined)[][] = [];

  if (type === "session-interests") {
    const interests = await prisma.sessionInterest.findMany({
      where: { session: { eventId } },
      orderBy: [{ session: { sessionDate: "asc" } }, { createdAt: "asc" }],
      select: { name: true, email: true, phone: true, createdAt: true, session: { select: { title: true, sessionType: true, sessionDate: true, startTime: true, endTime: true } } },
    });
    headers = ["Session", "Type", "Date", "Time", ...DELEGATE_HEADERS, "Signed up at"];
    rows = interests.map((i) => [
      i.session.title, i.session.sessionType, fmtDay(i.session.sessionDate),
      [i.session.startTime, i.session.endTime].filter(Boolean).join("–"),
      ...delegateCols(i.email, i.name), i.createdAt.toISOString(),
    ]);
  } else if (type === "speaker-interests") {
    const interests = await prisma.speakerInterest.findMany({
      where: { eventId },
      orderBy: [{ speaker: { name: "asc" } }, { createdAt: "asc" }],
      select: { name: true, email: true, createdAt: true, speaker: { select: { name: true, designation: true } } },
    });
    headers = ["Speaker", "Speaker designation", ...DELEGATE_HEADERS, "Marked at"];
    rows = interests.map((i) => [i.speaker.name, i.speaker.designation ?? "", ...delegateCols(i.email, i.name), i.createdAt.toISOString()]);
  } else if (type === "accommodation") {
    headers = ["Registration ID", "Name", "Email", "Phone", "Category", "Role", "Status", "Accommodation required", "Sharing", "Check-in", "Check-out", "Preferred hotel", "Remarks", "Last updated"];
    rows = registrations
      .filter((r) => r.status === "CONFIRMED" || r.status === "ATTENDED")
      .map((r) => [
        r.registrationCode ?? "", r.name, r.email, r.phone ?? "", r.category ?? "", r.participantRole ?? "", r.status,
        yesNo(r.accommodationRequired), sharingLabel(r.accommodationSharing) ?? "", fmtDay(r.accommodationCheckIn), fmtDay(r.accommodationCheckOut),
        r.accommodationChoice ?? "", r.accommodationRemarks ?? "", r.accommodationSelectedAt?.toISOString() ?? "",
      ]);
  } else if (type === "food") {
    headers = ["Registration ID", "Name", "Email", "Phone", "Category", "Role", "Status", "Food preference"];
    rows = registrations
      .filter((r) => r.status === "CONFIRMED" || r.status === "ATTENDED")
      .map((r) => [r.registrationCode ?? "", r.name, r.email, r.phone ?? "", r.category ?? "", r.participantRole ?? "", r.status, food(r.foodPreference) || "Not chosen"]);
  } else if (type === "participant-interests") {
    const [sessions, speakers] = await Promise.all([
      prisma.sessionInterest.findMany({ where: { session: { eventId } }, select: { email: true, session: { select: { title: true } } } }),
      prisma.speakerInterest.findMany({ where: { eventId }, select: { email: true, speaker: { select: { name: true } } } }),
    ]);
    const group = (list: { email: string; label: string }[]) => {
      const m = new Map<string, string[]>();
      for (const x of list) m.set(x.email.toLowerCase(), [...(m.get(x.email.toLowerCase()) ?? []), x.label]);
      return m;
    };
    const sessionsBy = group(sessions.map((s) => ({ email: s.email, label: s.session.title })));
    const speakersBy = group(speakers.map((s) => ({ email: s.email, label: s.speaker.name })));
    headers = ["Registration ID", "Name", "Email", "Category", "Role", "Status", "Sessions / workshops", "Speakers", "Food", "Accommodation required", "Sharing", "Check-in", "Check-out", "Preferred hotel", "Remarks"];
    rows = registrations.map((r) => {
      const key = r.email.toLowerCase();
      return [
        r.registrationCode ?? "", r.name, r.email, r.category ?? "", r.participantRole ?? "", r.status,
        (sessionsBy.get(key) ?? []).join("; "), (speakersBy.get(key) ?? []).join("; "), food(r.foodPreference),
        yesNo(r.accommodationRequired), sharingLabel(r.accommodationSharing) ?? "", fmtDay(r.accommodationCheckIn), fmtDay(r.accommodationCheckOut),
        r.accommodationChoice ?? "", r.accommodationRemarks ?? "",
      ];
    });
  } else if (type === "feedback") {
    const engagementId = new URL(request.url).searchParams.get("engagementId");
    const engagements = await prisma.eventEngagement.findMany({
      where: { eventId, type: "FEEDBACK", ...(engagementId ? { id: engagementId } : {}) },
      select: { id: true, title: true, content: true, session: { select: { title: true } }, responses: { orderBy: { createdAt: "asc" }, select: { userName: true, createdAt: true, response: true, user: { select: { email: true } } } } },
    });
    // One column per question across the exported forms.
    const questions = Array.from(new Set(engagements.flatMap((e) => ((e.content as { questions?: { text: string }[] } | null)?.questions ?? []).map((q) => q.text))));
    headers = ["Form", "Session", "Name", "Email", "Submitted at", ...questions];
    rows = engagements.flatMap((e) =>
      e.responses.map((r) => {
        const answers = (r.response as { answers?: Record<string, unknown> } | null)?.answers ?? {};
        return [e.title, e.session?.title ?? "Conference (overall)", r.userName ?? "", r.user?.email ?? "", r.createdAt.toISOString(),
          ...questions.map((q) => (answers[q] == null ? "" : String(answers[q])))];
      })
    );
  }

  await logActivity(session, {
    action: "export.download",
    summary: `Downloaded ${type} export (${rows.length} rows) for ${event.title}`,
    entityType: "Event",
    entityId: event.id,
    tenantId: event.tenantId,
    metadata: { type, rows: rows.length },
    request,
  });

  return csvResponse(`${type}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
}
