import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { z } from "zod";

const paymentSettingsSchema = z.object({
  paymentMode: z.enum(["NONE", "RAZORPAY", "QR_CODE"]),
  razorpayKeyId: z.string().optional().nullable(),
  razorpayKeySecret: z.string().optional().nullable(),
  paymentQrCode: z.string().optional().nullable(),
  paymentUpiId: z.string().optional().nullable(),
  paymentInstructions: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankIfscCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankBeneficiary: z.string().optional().nullable(),
});

// GET /api/tenants/my/payment - Get current tenant's payment settings
export const GET = withErrorHandler(async () => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to view payment settings");
  }

  const tenantId = (session.user as any).tenantId;
  if (!tenantId) {
    return Errors.badRequest("No tenant associated with your account");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      paymentMode: true,
      razorpayKeyId: true,
      razorpayKeySecret: true,
      paymentQrCode: true,
      paymentUpiId: true,
      paymentInstructions: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankName: true,
      bankBeneficiary: true,
    },
  });

  if (!tenant) {
    return Errors.notFound("Tenant");
  }

  // Mask Razorpay secret for non-super admins
  const data = {
    ...tenant,
    razorpayKeySecret: tenant.razorpayKeySecret
      ? "••••••••" + tenant.razorpayKeySecret.slice(-4)
      : null,
  };

  return successResponse(data);
});

// PUT /api/tenants/my/payment - Update current tenant's payment settings
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  // Only ADMIN and SUPER_ADMIN can update payment settings
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return Errors.forbidden("Only administrators can update payment settings");
  }

  const tenantId = (session.user as any).tenantId;
  if (!tenantId) {
    return Errors.badRequest("No tenant associated with your account");
  }

  const body = await parseBody(request);
  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = paymentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const data = parsed.data;

  // If switching away from a mode, clear its fields
  const updateData: Record<string, unknown> = {
    paymentMode: data.paymentMode,
  };

  if (data.paymentMode === "RAZORPAY") {
    if (data.razorpayKeyId !== undefined) updateData.razorpayKeyId = data.razorpayKeyId || null;
    // Only update secret if it's not the masked value
    if (data.razorpayKeySecret && !data.razorpayKeySecret.startsWith("••••")) {
      updateData.razorpayKeySecret = data.razorpayKeySecret;
    }
    // Clear QR fields when switching to Razorpay
    updateData.paymentQrCode = null;
    updateData.paymentUpiId = null;
    updateData.paymentInstructions = null;
  } else if (data.paymentMode === "QR_CODE") {
    if (data.paymentQrCode !== undefined) updateData.paymentQrCode = data.paymentQrCode || null;
    if (data.paymentUpiId !== undefined) updateData.paymentUpiId = data.paymentUpiId || null;
    if (data.paymentInstructions !== undefined) updateData.paymentInstructions = data.paymentInstructions || null;
    if (data.bankAccountNumber !== undefined) updateData.bankAccountNumber = data.bankAccountNumber || null;
    if (data.bankIfscCode !== undefined) updateData.bankIfscCode = data.bankIfscCode || null;
    if (data.bankName !== undefined) updateData.bankName = data.bankName || null;
    if (data.bankBeneficiary !== undefined) updateData.bankBeneficiary = data.bankBeneficiary || null;
    // Clear Razorpay fields when switching to QR
    updateData.razorpayKeyId = null;
    updateData.razorpayKeySecret = null;
  } else {
    // NONE - clear all payment fields
    updateData.razorpayKeyId = null;
    updateData.razorpayKeySecret = null;
    updateData.paymentQrCode = null;
    updateData.paymentUpiId = null;
    updateData.paymentInstructions = null;
    updateData.bankAccountNumber = null;
    updateData.bankIfscCode = null;
    updateData.bankName = null;
    updateData.bankBeneficiary = null;
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
    select: {
      paymentMode: true,
      razorpayKeyId: true,
      paymentQrCode: true,
      paymentUpiId: true,
      paymentInstructions: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankName: true,
      bankBeneficiary: true,
    },
  });

  return successResponse(tenant, "Payment settings updated successfully");
});
