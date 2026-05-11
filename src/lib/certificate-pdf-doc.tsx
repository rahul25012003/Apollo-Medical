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
  fontFamily: string;
}

export function CertificatePDFDoc({ imageSrc, name, nameTopPt, fontSize, fontColor, fontFamily }: Props) {
  return (
    <Document>
      <Page size={[W, H]} style={{ padding: 0, margin: 0 }}>
        {/*
          Outer View with explicit W×H acts as the positioning context.
          Without this, the absolutely-positioned Image adds its height to
          the document flow and pushes the name Text onto a second page.
        */}
        <View style={{ width: W, height: H, position: "relative" }}>
          <Image
            src={imageSrc}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H }}
          />
          <Text
            style={{
              position: "absolute",
              top: nameTopPt,
              left: 0,
              width: W,
              textAlign: "center",
              fontFamily,
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
