import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";
import { logActivity } from "@/lib/activity-log";
import { IFPC_MENU_DAYS, emptyFoodMenus } from "@/lib/ifpc-food-menu";
import { z } from "zod";

// Food Menu master (IFPC): lunch and dinner for each conference day, each
// split into vegetarian and non-vegetarian items, plus an optional link to a
// full menu. Admin-editable because menus are confirmed late and change.
const item = z.string().trim().min(1).max(120);
const meal = z.object({
  veg: z.array(item).max(40).default([]),
  nonVeg: z.array(item).max(40).default([]),
  link: z.string().url().or(z.literal("")).optional().default(""),
});
const bodySchema = z.object({
  days: z.array(z.object({
    date: z.enum(IFPC_MENU_DAYS),
    lunch: meal,
    dinner: meal,
  })).length(IFPC_MENU_DAYS.length),
});

const canEdit = (role?: string) => role === "SUPER_ADMIN" || role === "ADMIN" || role === "EVENT_MANAGER";

// GET /api/tenants/my/food-menu — the saved menus, or an empty day-by-day frame
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId! }, select: { foodMenus: true } });
  const saved = tenant?.foodMenus as { days?: unknown[] } | null;
  return successResponse(saved?.days?.length ? saved : emptyFoodMenus());
});

// PUT /api/tenants/my/food-menu — save all four days at once
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canEdit(session.user.role)) return Errors.forbidden("You don't have permission to manage the food menu");
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  await prisma.tenant.update({ where: { id: session.user.tenantId! }, data: { foodMenus: parsed.data } });
  const items = parsed.data.days.reduce((n, d) => n + d.lunch.veg.length + d.lunch.nonVeg.length + d.dinner.veg.length + d.dinner.nonVeg.length, 0);
  await logActivity(session, {
    action: "foodmenu.update",
    summary: `Updated the food menu (${items} items across ${parsed.data.days.length} days)`,
    entityType: "Tenant",
    entityId: session.user.tenantId,
    request,
  });
  return successResponse(parsed.data, "Food menu saved");
});
