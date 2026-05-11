import path from "path";
import { existsSync, readFileSync } from "fs";
import React from "react";

export interface CertificateTemplateConfig {
  templateImage: string;
  nameY: number;       // 0-100 % from top
  fontSize: number;    // pt, e.g. 33
  fontColor: string;   // hex, e.g. "#000000"
  fontFamily?: string; // PDF built-in font name
}

// Fonts available for certificate name overlay
export const CERT_FONTS: { label: string; value: string; preview: string }[] = [
  { label: "Script (like Alex Brush)",   value: "Times-Italic",      preview: "italic"       },
  { label: "Bold Script",                value: "Times-BoldItalic",   preview: "bold italic"  },
  { label: "Bold Serif",                 value: "Times-Bold",         preview: "bold"         },
  { label: "Regular Serif",              value: "Times-Roman",        preview: "normal"       },
  { label: "Bold Sans",                  value: "Helvetica-Bold",     preview: "bold"         },
  { label: "Regular Sans",              value: "Helvetica",           preview: "normal"       },
];

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
    fontFamily: config.fontFamily || "Times-Italic",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(element);
  return Buffer.from(buffer);
}
