import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { issueAttendeeBadgeAndCertificate } from "@/lib/ifpc-automation";

// POST /api/payments/webhook
// Razorpay webhook: independent confirmation path for payments, so a
// registration can't get stuck PENDING forever if the browser never makes it
// back to /api/payments/verify (tab closed, network dropped, device slept)
// after Razorpay itself has already captured the money. The client-side
// verify call remains the fast path for an immediate confirmation; this is
// the safety net.
//
// Setup (per tenant, since each tenant has its own Razorpay account):
// in the Razorpay dashboard, Settings > Webhooks, add this exact URL as the
// webhook, subscribe to the "payment.captured" event, and paste the secret
// Razorpay generates into this tenant's Payment Settings page here.
//
// Design note: this one URL serves every tenant. The order's `notes` (set
// in create-order/route.ts) carry tenantId + registrationId, so the tenant
// is identified from the payload itself — but nothing is acted on until the
// raw-body HMAC is verified against THAT tenant's own webhook secret, so a
// forged tenantId in the notes still can't produce a valid signature.
export async function POST(request: NextRequest) {
  try {
    // Must read the raw bytes before any JSON parsing — Razorpay's signature
    // is an HMAC of the exact raw body, not the re-serialized JSON.
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Missing signature" } }, { status: 400 });
    }

    let payload: {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } } };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON" } }, { status: 400 });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const notes = paymentEntity?.notes || {};
    const tenantId = notes.tenantId;
    const registrationId = notes.registrationId;

    // Not one of our orders (or malformed) — nothing to verify against, ack
    // and move on rather than erroring, so Razorpay doesn't keep retrying.
    if (!tenantId || !registrationId) {
      return NextResponse.json({ success: true, data: { ignored: true } });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { razorpayWebhookSecret: true },
    });
    if (!tenant?.razorpayWebhookSecret) {
      // Webhook not (yet) configured for this tenant — ack, don't retry.
      return NextResponse.json({ success: true, data: { ignored: true } });
    }

    const expectedSignature = crypto
      .createHmac("sha256", tenant.razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, error: { code: "PAYMENT_VERIFICATION_FAILED", message: "Signature mismatch" } }, { status: 400 });
    }

    // Signature verified. Only act on a captured payment — ignore
    // payment.failed, order.paid, etc. (still 200, so Razorpay doesn't retry).
    if (payload.event !== "payment.captured" || !paymentEntity?.order_id) {
      return NextResponse.json({ success: true, data: { ignored: true } });
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { id: true, razorpayOrderId: true, paymentStatus: true },
    });

    // Registration missing, or this payment doesn't match the order we have
    // on file for it — don't touch anything.
    if (!registration || registration.razorpayOrderId !== paymentEntity.order_id) {
      return NextResponse.json({ success: true, data: { ignored: true } });
    }

    // Idempotent: Razorpay delivers at-least-once, and this can race with a
    // successful client-side /verify call for the same payment. Only the
    // request that actually flips PENDING -> PAID proceeds to issue the
    // badge/certificate.
    const updated = await prisma.registration.updateMany({
      where: { id: registrationId, paymentStatus: { not: "PAID" } },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "razorpay",
        razorpayPaymentId: paymentEntity.id,
        paymentId: paymentEntity.id,
        paidAt: new Date(),
        status: "CONFIRMED",
      },
    });

    if (updated.count > 0) {
      // No-op for every tenant except apollo-medical — see ifpc-automation.ts.
      issueAttendeeBadgeAndCertificate(registrationId).catch((err) => console.error("Badge/certificate automation error:", err));
    }

    return NextResponse.json({ success: true, data: { processed: updated.count > 0 } });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to process webhook" } }, { status: 500 });
  }
}
