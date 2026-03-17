import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { getEffectiveTenantId, tenantWhereClause } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

// GET /api/communications/templates — List templates for tenant
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to view templates");
  }

  const tenantId = getEffectiveTenantId(session, request.nextUrl.searchParams);

  const templates = await prisma.messageTemplate.findMany({
    where: {
      ...tenantWhereClause(tenantId),
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(templates);
});

// POST /api/communications/templates — Create template
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to create templates");
  }

  const body = await parseBody<{
    name: string;
    subject: string;
    body: string;
    type?: string;
  }>(request);

  if (!body || !body.name || !body.subject || !body.body) {
    return Errors.badRequest("name, subject, and body are required");
  }

  const tenantId = getEffectiveTenantId(session, request.nextUrl.searchParams);

  const template = await prisma.messageTemplate.create({
    data: {
      tenantId,
      name: body.name,
      subject: body.subject,
      body: body.body,
      type: body.type || "EMAIL",
    },
  });

  return successResponse(template, "Template created successfully", 201);
});

// PUT /api/communications/templates — Update template
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to update templates");
  }

  const body = await parseBody<{
    templateId: string;
    name?: string;
    subject?: string;
    body?: string;
    type?: string;
  }>(request);

  if (!body || !body.templateId) {
    return Errors.badRequest("templateId is required");
  }

  const existing = await prisma.messageTemplate.findUnique({
    where: { id: body.templateId },
  });

  if (!existing) {
    return Errors.notFound("Template");
  }

  const template = await prisma.messageTemplate.update({
    where: { id: body.templateId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.subject && { subject: body.subject }),
      ...(body.body && { body: body.body }),
      ...(body.type && { type: body.type }),
    },
  });

  return successResponse(template, "Template updated successfully");
});

// DELETE /api/communications/templates — Delete template
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to delete templates");
  }

  const templateId = request.nextUrl.searchParams.get("templateId");

  if (!templateId) {
    return Errors.badRequest("templateId is required");
  }

  const existing = await prisma.messageTemplate.findUnique({
    where: { id: templateId },
  });

  if (!existing) {
    return Errors.notFound("Template");
  }

  await prisma.messageTemplate.delete({
    where: { id: templateId },
  });

  return successResponse({ id: templateId }, "Template deleted successfully");
});
