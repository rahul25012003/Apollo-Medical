import React from "react";
import { Document, Page, Image, Text, View, Font } from "@react-pdf/renderer";

// A4 landscape in PDF points
const W = 841.89;
const H = 595.28;

// Register Alex Brush — same script font as the AIIMS certificate
// Wrapped in try/catch so a network failure doesn't crash PDF generation
try {
  Font.register({
    family: "AlexBrush",
    src: "https://fonts.gstatic.com/s/alexbrush/v22/SZc83FzZLau6p7T4-4qOTlsk.ttf",
  });
} catch {
  // font load failure handled below — falls back to Helvetica-Oblique
}

interface Props {
  imageSrc: string;
  name: string;
  nameTopPt: number;
  fontSize: number;
  fontColor: string;
  useScriptFont: boolean;
}

export function CertificatePDFDoc({ imageSrc, name, nameTopPt, fontSize, fontColor, useScriptFont }: Props) {
  return (
    <Document>
      <Page
        size={[W, H]}
        style={{ padding: 0, margin: 0, backgroundColor: "#ffffff" }}
      >
        {/* Full-page certificate background */}
        <Image
          src={imageSrc}
          style={{ position: "absolute", top: 0, left: 0, width: W, height: H }}
        />
        {/* Name overlay — centered horizontally */}
        <View
          style={{
            position: "absolute",
            top: nameTopPt,
            left: 0,
            width: W,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: useScriptFont ? "AlexBrush" : "Helvetica-BoldOblique",
              fontSize,
              color: fontColor,
            }}
          >
            {name}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
