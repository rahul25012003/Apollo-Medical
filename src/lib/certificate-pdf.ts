import path from "path";
import { pathToFileURL } from "url";
import { existsSync } from "fs";
import React from "react";

export interface CertificateTemplateConfig {
  templateImage: string;  // public URL like /uploads/certificates/abc.jpg
  nameY: number;          // 0-100 percentage from top of page
  fontSize: number;       // font size in pt, e.g. 36
  fontColor: string;      // hex color, e.g. "#000000"
}

export async function generateCertificatePDF({
  config,
  name,
}: {
  config: CertificateTemplateConfig;
  name: string;
}): Promise<Buffer> {
  const imageAbsPath = path.join(process.cwd(), "public", config.templateImage);

  if (!existsSync(imageAbsPath)) {
    throw new Error(`Template image not found on server: ${config.templateImage}`);
  }

  // Convert OS path to file:// URL so @react-pdf/renderer loads it on both Windows and Linux
  const imageSrc = pathToFileURL(imageAbsPath).href;

  // A4 landscape: 841.89 x 595.28 pt — nameY is % from top
  const nameTopPt = (config.nameY / 100) * 595.28;

  // Use dynamic import (ESM-compatible)
  const ReactPDF = await import("@react-pdf/renderer");
  const { Document, Page, Image, Text, View, renderToBuffer } = ReactPDF;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(
    Document as React.ComponentType<React.PropsWithChildren<object>>,
    null,
    React.createElement(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Page as React.ComponentType<React.PropsWithChildren<{ size: any; orientation: any; style: object }>>,
      { size: "A4", orientation: "landscape", style: { padding: 0, margin: 0 } },
      React.createElement(
        Image as React.ComponentType<{ src: string; style: object }>,
        {
          src: imageSrc,
          style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
        }
      ),
      React.createElement(
        View as React.ComponentType<React.PropsWithChildren<{ style: object }>>,
        {
          style: {
            position: "absolute",
            top: nameTopPt,
            left: 0,
            right: 0,
            alignItems: "center",
          },
        },
        React.createElement(
          Text as React.ComponentType<React.PropsWithChildren<{ style: object }>>,
          {
            style: {
              fontSize: config.fontSize,
              color: config.fontColor,
              fontFamily: "Helvetica-Bold",
            },
          },
          name
        )
      )
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any);
  return Buffer.from(buffer);
}
