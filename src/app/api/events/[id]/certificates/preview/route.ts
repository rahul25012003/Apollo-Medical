import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Errors } from "@/lib/api-utils";
import { generateCertificatePDF, type CertificateTemplateConfig } from "@/lib/certificate-pdf";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/events/[id]/certificates/preview
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context.params;
  const body = await req.json();
  const { category, sampleName = "Dr. Sample Name" } = body as {
    category: string;
    sampleName?: string;
  };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { certificateConfig: true },
  });
  if (!event) return Errors.notFound("Event");

  const config = (event.certificateConfig as Record<string, unknown> | null) ?? {};
  const templates = (config.templates as Record<string, unknown> | undefined) ?? {};
  const tpl = templates[category] as CertificateTemplateConfig | undefined;

  if (!tpl?.templateImage) {
    return NextResponse.json(
      { error: "No template configured for this category" },
      { status: 400 }
    );
  }

  try {
    const pdfBuffer = await generateCertificatePDF({ config: tpl, name: sampleName });
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview-${safeCategory}.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Certificate preview error:", msg);
    return NextResponse.json(
      { error: `PDF generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
