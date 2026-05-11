import React from "react";
import { Document, Page, Image, Text, View, Font, StyleSheet } from "@react-pdf/renderer";

// A4 landscape in PDF points
const W = 841.89;
const H = 595.28;

// Alex Brush — matches the AIIMS certificate script style
Font.register({
  family: "AlexBrush",
  src: "https://fonts.gstatic.com/s/alexbrush/v22/SZc83FzZLau6p7T4-4qOTlsk.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 0,
    width: W,
    height: H,
    backgroundColor: "#ffffff",
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    height: H,
  },
  nameWrap: {
    position: "absolute",
    left: 0,
    width: W,
    alignItems: "center",
  },
  name: {
    fontFamily: "AlexBrush",
    textAlign: "center",
  },
});

interface Props {
  imageSrc: string;   // base64 data URI
  name: string;
  nameTopPt: number;  // absolute Y in points from page top
  fontSize: number;
  fontColor: string;
}

export function CertificatePDFDoc({ imageSrc, name, nameTopPt, fontSize, fontColor }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Image src={imageSrc} style={styles.bg} />
        <View style={[styles.nameWrap, { top: nameTopPt }]}>
          <Text style={[styles.name, { fontSize, color: fontColor }]}>{name}</Text>
        </View>
      </Page>
    </Document>
  );
}
