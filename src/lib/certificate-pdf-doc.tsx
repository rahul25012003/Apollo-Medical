import React from "react";
import { Document, Page, Image, Text, View } from "@react-pdf/renderer";

// A4 landscape in PDF points
const W = 841.89;
const H = 595.28;

interface Props {
  imageSrc: string;
  name: string;
  nameTopPt: number;
  fontSize: number;
  fontColor: string;
}

export function CertificatePDFDoc({ imageSrc, name, nameTopPt, fontSize, fontColor }: Props) {
  return (
    <Document>
      <Page size={[W, H]} style={{ padding: 0, margin: 0, backgroundColor: "#ffffff" }}>
        {/* Certificate background image — full page */}
        <Image
          src={imageSrc}
          style={{ position: "absolute", top: 0, left: 0, width: W, height: H }}
        />
        {/* Delegate name — centered, overlaid at configured Y position */}
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
              fontFamily: "Times-Italic",
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
