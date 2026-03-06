"use client";

import React from "react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export type EventType = "CONFERENCE" | "WORKSHOP" | "SEMINAR" | "WEBINAR" | "CME" | "SYMPOSIUM";

export interface CertificateData {
    recipientName: string;
    eventTitle: string;
    eventType: EventType;
    eventDate: string;
    eventEndDate?: string;
    eventLocation?: string;
    certificateCode: string;
    cmeCredits?: number;
    creditHours?: number;
    description?: string;
    organizer?: string;
    signatories?: {
        name: string;
        title: string;
        signature?: string;
    }[];
    issuedAt?: string;
    verifyUrl?: string;
}

interface CertificateTemplateProps {
    data: CertificateData;
    className?: string;
}

// Color schemes for different event types
const eventTypeStyles: Record<EventType, {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    title: string;
    certType: string;
}> = {
    CONFERENCE: {
        primary: "#1e3a5f",
        secondary: "#2563eb",
        accent: "#dbeafe",
        border: "#1e40af",
        title: "Certificate of Attendance",
        certType: "Conference Attendance Certificate",
    },
    WORKSHOP: {
        primary: "#065f46",
        secondary: "#059669",
        accent: "#d1fae5",
        border: "#047857",
        title: "Certificate of Completion",
        certType: "Workshop Completion Certificate",
    },
    SEMINAR: {
        primary: "#7c2d12",
        secondary: "#ea580c",
        accent: "#ffedd5",
        border: "#c2410c",
        title: "Certificate of Participation",
        certType: "Seminar Participation Certificate",
    },
    WEBINAR: {
        primary: "#581c87",
        secondary: "#9333ea",
        accent: "#f3e8ff",
        border: "#7e22ce",
        title: "Certificate of Attendance",
        certType: "Webinar Attendance Certificate",
    },
    CME: {
        primary: "#991b1b",
        secondary: "#dc2626",
        accent: "#fee2e2",
        border: "#b91c1c",
        title: "CME Credit Certificate",
        certType: "Continuing Medical Education Certificate",
    },
    SYMPOSIUM: {
        primary: "#0f766e",
        secondary: "#14b8a6",
        accent: "#ccfbf1",
        border: "#0d9488",
        title: "Certificate of Participation",
        certType: "Symposium Participation Certificate",
    },
};

export function CertificateTemplate({ data, className = "" }: CertificateTemplateProps) {
    const style = eventTypeStyles[data.eventType] || eventTypeStyles.CONFERENCE;

    const formatEventDate = () => {
        const start = format(new Date(data.eventDate), "MMMM d, yyyy");
        if (data.eventEndDate && data.eventDate !== data.eventEndDate) {
            const end = format(new Date(data.eventEndDate), "MMMM d, yyyy");
            return `${start} - ${end}`;
        }
        return start;
    };

    return (
        <div
            className={`certificate-container ${className}`}
            style={{
                width: "297mm",
                height: "210mm",
                padding: "10mm",
                backgroundColor: "#fff",
                fontFamily: "'Times New Roman', Georgia, serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Decorative Border */}
            <div
                style={{
                    position: "absolute",
                    inset: "8mm",
                    border: `3px solid ${style.border}`,
                    borderRadius: "4px",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: "11mm",
                    border: `1px solid ${style.secondary}`,
                    borderRadius: "2px",
                }}
            />

            {/* Corner Decorations */}
            {[
                { top: "12mm", left: "12mm" },
                { top: "12mm", right: "12mm" },
                { bottom: "12mm", left: "12mm" },
                { bottom: "12mm", right: "12mm" },
            ].map((pos, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        ...pos,
                        width: "25mm",
                        height: "25mm",
                        borderTop: i < 2 ? `2px solid ${style.secondary}` : "none",
                        borderBottom: i >= 2 ? `2px solid ${style.secondary}` : "none",
                        borderLeft: i % 2 === 0 ? `2px solid ${style.secondary}` : "none",
                        borderRight: i % 2 === 1 ? `2px solid ${style.secondary}` : "none",
                    }}
                />
            ))}

            {/* Content Container */}
            <div
                style={{
                    position: "relative",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12mm 20mm 8mm",
                    textAlign: "center",
                }}
            >
                {/* Header */}
                <div style={{ width: "100%" }}>
                    {/* Organization Logo/Name Area */}
                    {data.organizer && (
                        <p
                            style={{
                                fontSize: "14pt",
                                color: style.primary,
                                marginBottom: "5mm",
                                letterSpacing: "2px",
                                textTransform: "uppercase",
                            }}
                        >
                            {data.organizer}
                        </p>
                    )}

                    {/* Certificate Type Badge */}
                    <div
                        style={{
                            display: "inline-block",
                            padding: "2mm 8mm",
                            backgroundColor: style.accent,
                            color: style.primary,
                            fontSize: "10pt",
                            letterSpacing: "3px",
                            textTransform: "uppercase",
                            marginBottom: "5mm",
                            borderRadius: "2px",
                        }}
                    >
                        {style.certType}
                    </div>

                    {/* Main Title */}
                    <h1
                        style={{
                            fontSize: "32pt",
                            fontWeight: "normal",
                            color: style.primary,
                            margin: "3mm 0",
                            fontFamily: "'Times New Roman', Georgia, serif",
                            letterSpacing: "3px",
                        }}
                    >
                        {style.title}
                    </h1>

                    <p
                        style={{
                            fontSize: "11pt",
                            color: "#666",
                            marginTop: "2mm",
                        }}
                    >
                        This is to certify that
                    </p>
                </div>

                {/* Recipient Name */}
                <div style={{ margin: "3mm 0" }}>
                    <h2
                        style={{
                            fontSize: "28pt",
                            fontWeight: "bold",
                            color: style.primary,
                            fontFamily: "'Times New Roman', Georgia, serif",
                            borderBottom: `2px solid ${style.secondary}`,
                            paddingBottom: "2mm",
                            marginBottom: "2mm",
                        }}
                    >
                        {data.recipientName}
                    </h2>
                </div>

                {/* Event Details */}
                <div style={{ maxWidth: "80%" }}>
                    <p
                        style={{
                            fontSize: "12pt",
                            color: "#444",
                            lineHeight: "1.4",
                        }}
                    >
                        has successfully {data.eventType === "WORKSHOP" ? "completed" : "attended"} the
                    </p>
                    <h3
                        style={{
                            fontSize: "18pt",
                            fontWeight: "bold",
                            color: style.secondary,
                            margin: "2mm 0",
                            fontFamily: "'Times New Roman', Georgia, serif",
                        }}
                    >
                        {data.eventTitle}
                    </h3>
                    <p
                        style={{
                            fontSize: "11pt",
                            color: "#666",
                        }}
                    >
                        held on {formatEventDate()}
                        {data.eventLocation && ` at ${data.eventLocation}`}
                    </p>

                    {/* CME Credits Badge */}
                    {data.cmeCredits && data.cmeCredits > 0 && (
                        <div
                            style={{
                                display: "inline-block",
                                marginTop: "3mm",
                                padding: "2mm 6mm",
                                backgroundColor: style.primary,
                                color: "#fff",
                                borderRadius: "3px",
                                fontSize: "10pt",
                            }}
                        >
                            <strong>{data.cmeCredits}</strong> CME Credit{data.cmeCredits > 1 ? "s" : ""} Awarded
                            {data.creditHours && ` (${data.creditHours} Hours)`}
                        </div>
                    )}

                    {/* Description */}
                    {data.description && (
                        <p
                            style={{
                                fontSize: "10pt",
                                color: "#666",
                                marginTop: "3mm",
                                fontStyle: "italic",
                            }}
                        >
                            {data.description}
                        </p>
                    )}
                </div>

                {/* Footer with Signatories and Certificate Info */}
                <div style={{ width: "100%", marginTop: "auto", paddingTop: "3mm" }}>
                    {/* Signatories */}
                    {data.signatories && data.signatories.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-around",
                                marginBottom: "3mm",
                            }}
                        >
                            {data.signatories.map((sig, index) => (
                                <div key={index} style={{ textAlign: "center", minWidth: "40mm" }}>
                                    <div
                                        style={{
                                            height: "8mm",
                                            display: "flex",
                                            alignItems: "flex-end",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {sig.signature ? (
                                            <img
                                                src={sig.signature}
                                                alt="Signature"
                                                style={{ maxHeight: "8mm", maxWidth: "40mm" }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: "40mm",
                                                    borderBottom: `1px solid ${style.primary}`,
                                                }}
                                            />
                                        )}
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "9pt",
                                            fontWeight: "bold",
                                            color: style.primary,
                                            marginTop: "1mm",
                                            marginBottom: "0",
                                        }}
                                    >
                                        {sig.name}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "8pt",
                                            color: "#666",
                                            margin: "0",
                                        }}
                                    >
                                        {sig.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Certificate Code, QR Code and Issue Date */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "3mm",
                            borderTop: `1px solid ${style.accent}`,
                            fontSize: "8pt",
                            color: "#888",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "1mm" }}>
                            <span>
                                Certificate ID: <strong>{data.certificateCode}</strong>
                            </span>
                            {data.issuedAt && (
                                <span>
                                    Issued: <strong>{format(new Date(data.issuedAt), "MMM d, yyyy")}</strong>
                                </span>
                            )}
                        </div>

                        {/* QR Code for verification */}
                        {data.verifyUrl && (
                            <div style={{ display: "flex", alignItems: "center", gap: "3mm" }}>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ display: "block", marginBottom: "1mm" }}>Scan to verify</span>
                                    <span style={{ fontSize: "7pt", color: "#aaa" }}>
                                        {data.verifyUrl.replace(/^https?:\/\//, "")}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        backgroundColor: "#fff",
                                        padding: "2mm",
                                        border: `1px solid ${style.accent}`,
                                        borderRadius: "2px",
                                    }}
                                >
                                    <QRCodeSVG
                                        value={data.verifyUrl}
                                        size={60}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CertificateTemplate;
