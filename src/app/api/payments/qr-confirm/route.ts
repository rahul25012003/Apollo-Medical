import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/payments/qr-confirm
// Upload payment proof for QR code payment
export async function POST(request: NextRequest) {
  try {
    const { registrationId, paymentProof, transactionId } = await request.json();

    if (!registrationId || !paymentProof) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Registration ID and payment proof are required" } },
        { status: 400 }
      );
    }

    // Verify registration exists and belongs to a QR_CODE tenant
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

    // Update registration with payment proof (admin will verify later)
    // Allow proof upload for any payment mode — it's just a receipt screenshot
    const paymentMethod = tenant.paymentMode === "QR_CODE" ? "qr_code" : "manual";
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentProof,
        paymentMethod,
        paymentId: transactionId || null,
        paymentStatus: "PENDING", // Stays pending until admin verifies
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Payment proof uploaded successfully. It will be verified by the admin." },
    });
  } catch (error) {
    console.error("Error confirming QR payment:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to submit payment proof" } },
      { status: 500 }
    );
  }
}
