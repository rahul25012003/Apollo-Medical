import path from "path";
import { existsSync, readFileSync } from "fs";
import React from "react";

export interface CertificateTemplateConfig {
  templateImage: string;  // public URL like /uploads/certificates/abc.jpg
  nameY: number;          // 0-100 percentage from top of page
  fontSize: number;       // font size in pt, e.g. 33
  fontColor: string;      // hex color, e.g. "#5a3825"
}

// A4 landscape height in PDF points
const PAGE_HEIGHT_PT = 595.28;

export async function generateCertificatePDF({
  config,
  name,
}: {
  config: CertificateTemplateConfig;
  name: string;
}): Promise<Buffer> {
  const imageAbsPath = path.join(process.cwd(), "public", config.templateImage);

  if (!existsSync(imageAbsPath)) {
    throw new Error(`Template image not found: ${config.templateImage}. Please re-upload the template.`);
  }

  // Read as base64 data URI — works cross-platform without file:// URL issues
  const imageBuffer = readFileSync(imageAbsPath);
  const ext = path.extname(imageAbsPath).toLowerCase().replace(".", "");
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  const imageSrc = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  // Convert nameY % to absolute PDF points
  const nameTopPt = (config.nameY / 100) * PAGE_HEIGHT_PT;

  // Import the JSX component and renderToBuffer at runtime (server-only, avoids client bundle)
  const [{ CertificatePDFDoc }, { renderToBuffer }] = await Promise.all([
    import("./certificate-pdf-doc"),
    import("@react-pdf/renderer"),
  ]);

  const element = React.createElement(CertificatePDFDoc, {
    imageSrc,
    name,
    nameTopPt,
    fontSize: config.fontSize,
    fontColor: config.fontColor,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(element);
  return Buffer.from(buffer);
}
