import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

// POST /api/payments/create-order
// Creates a Razorpay order for a registration
export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json();

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Registration ID is required" } },
        { status: 400 }
      );
    }

    // Get registration with event and tenant
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

    if (tenant.paymentMode !== "RAZORPAY" || !tenant.razorpayKeyId || !tenant.razorpayKeySecret) {
      return NextResponse.json(
        { success: false, error: { code: "PAYMENT_NOT_CONFIGURED", message: "Razorpay is not configured for this tenant" } },
        { status: 400 }
      );
    }

    const amount = Number(registration.amount);
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "No payment required for free registrations" } },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: tenant.razorpayKeyId,
      key_secret: tenant.razorpayKeySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: registration.currency || "INR",
      receipt: registrationId,
      notes: {
        registrationId,
        eventId: registration.eventId,
        tenantId: tenant.id,
      },
    });

    // Save order ID to registration
    await prisma.registration.update({
      where: { id: registrationId },
      data: { razorpayOrderId: order.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: tenant.razorpayKeyId,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create payment order" } },
      { status: 500 }
    );
  }
}
