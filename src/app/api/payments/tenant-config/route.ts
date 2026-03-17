import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payments/tenant-config?eventId=xxx
// Returns the tenant's payment configuration for a given event (public, no secrets exposed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Event ID is required" } },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { tenant: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Event not found" } },
        { status: 404 }
      );
    }

    const tenant = event.tenant;

    if (!tenant) {
      return NextResponse.json({
        success: true,
        data: { paymentMode: "NONE", razorpayKeyId: null, paymentQrCode: null, paymentUpiId: null, paymentInstructions: null },
      });
    }

    // Return ONLY public payment info (never expose secrets)
    return NextResponse.json({
      success: true,
      data: {
        paymentMode: tenant.paymentMode,
        razorpayKeyId: tenant.paymentMode === "RAZORPAY" ? tenant.razorpayKeyId : null,
        paymentQrCode: tenant.paymentMode === "QR_CODE" ? tenant.paymentQrCode : null,
        paymentUpiId: tenant.paymentMode === "QR_CODE" ? tenant.paymentUpiId : null,
        paymentInstructions: tenant.paymentMode === "QR_CODE" ? tenant.paymentInstructions : null,
      },
    });
  } catch (error) {
    console.error("Error fetching payment config:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch payment configuration" } },
      { status: 500 }
    );
  }
}
