import { prisma } from "./prisma";
import { IFPC_TENANT_SLUG } from "./ifpc-constants";

// Server-side "is this the IFPC (apollo-medical) tenant?" checks. Every IFPC
// change to shared code branches on these so other tenants keep their
// original behaviour.

export async function isIfpcTenantId(tenantId: string | null | undefined): Promise<boolean> {
  if (!tenantId) return false;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
  return tenant?.slug === IFPC_TENANT_SLUG;
}

export async function isIfpcEvent(eventId: string | null | undefined): Promise<boolean> {
  if (!eventId) return false;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { tenant: { select: { slug: true } } } });
  return event?.tenant?.slug === IFPC_TENANT_SLUG;
}

export async function isIfpcRegistration(registrationId: string | null | undefined): Promise<boolean> {
  if (!registrationId) return false;
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { event: { select: { tenant: { select: { slug: true } } } } },
  });
  return reg?.event?.tenant?.slug === IFPC_TENANT_SLUG;
}
