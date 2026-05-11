import path from "path";
import { existsSync, readFileSync } from "fs";
import React from "react";

export interface CertificateTemplateConfig {
  templateImage: string;
  nameY: number;       // 0-100 % from top
  fontSize: number;    // pt, e.g. 33
  fontColor: string;   // hex, e.g. "#000000"
}

const PAGE_H = 595.28; // A4 landscape height in PDF points

export async function generateCertificatePDF({
  config,
  name,
}: {
  config: CertificateTemplateConfig;
  name: string;
}): Promise<Buffer> {
  const imageAbsPath = path.join(process.cwd(), "public", config.templateImage);

  if (!existsSync(imageAbsPath)) {
    throw new Error(
      `Template image not found (${config.templateImage}). Please re-upload the template image.`
    );
  }

  const imageBuffer = readFileSync(imageAbsPath);
  const ext = path.extname(imageAbsPath).toLowerCase().replace(".", "");
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  const imageSrc = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  const nameTopPt = (config.nameY / 100) * PAGE_H;

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
