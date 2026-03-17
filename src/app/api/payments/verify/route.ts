import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/payments/verify
// Verifies a Razorpay payment signature
export async function POST(request: NextRequest) {
  try {
    const { registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json();

    if (!registrationId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Missing required payment verification fields" } },
        { status: 400 }
      );
    }

    // Get registration with tenant for the secret
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: { tenant: true },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Registration not found" } },
        { status: 404 }
      );
    }

    const tenant = registration.event.tenant;

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Event has no associated tenant" } },
        { status: 400 }
      );
    }

    if (!tenant.razorpayKeySecret) {
      return NextResponse.json(
        { success: false, error: { code: "PAYMENT_NOT_CONFIGURED", message: "Payment verification not configured" } },
        { status: 400 }
      );
    }

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", tenant.razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, error: { code: "PAYMENT_VERIFICATION_FAILED", message: "Payment verification failed. Signature mismatch." } },
        { status: 400 }
      );
    }

    // Payment verified - update registration
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "razorpay",
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        paymentId: razorpayPaymentId,
        paidAt: new Date(),
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Payment verified successfully" },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to verify payment" } },
      { status: 500 }
    );
  }
}
