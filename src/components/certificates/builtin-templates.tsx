"use client";

import React from "react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import type { CertificateData } from "./certificate-template";

export const BUILTIN_TEMPLATE_IDS = ["classic", "modern", "premium", "apollo"] as const;
export type BuiltinTemplateId = (typeof BUILTIN_TEMPLATE_IDS)[number];

export interface BuiltinTemplateMeta {
  id: BuiltinTemplateId;
  name: string;
  description: string;
  previewBg: string;   // CSS gradient or color for thumbnail card
  accent: string;
}

export const BUILTIN_TEMPLATES: BuiltinTemplateMeta[] = [
  {
    id: "classic",
    name: "Classic Medical",
    description: "Traditional double-border with corner flourishes and serif font",
    previewBg: "linear-gradient(135deg, #f5f0e8 0%, #ede4d0 100%)",
    accent: "#8b6914",
  },
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Clean layout with bold colored sidebar and contemporary typography",
    previewBg: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
    accent: "#2563eb",
  },
  {
    id: "premium",
    name: "Premium Dark",
    description: "Luxurious dark navy with gold accents — prestigious and elegant",
    previewBg: "linear-gradient(135deg, #0a0f1e 0%, #1e293b 100%)",
    accent: "#d4a017",
  },
  {
    id: "apollo",
    name: "Apollo Medical",
    description: "Apollo-branded blue & gold — professional healthcare identity",
    previewBg: "linear-gradient(135deg, #2582A1 0%, #1a5f87 100%)",
    accent: "#FDB931",
  },
];

// ── Shared helpers ─────────────────────────────────────────────────────────

function fmtDate(d: string) {
  try { return format(new Date(d), "MMMM d, yyyy"); } catch { return d; }
}
function fmtRange(start: string, end?: string) {
  const s = fmtDate(start);
  if (!end || start === end) return s;
  return `${s} – ${fmtDate(end)}`;
}
function certTypeLabel(type?: string) {
  const map: Record<string, string> = {
    SPEAKER_SESSION: "Certificate of Presentation",
    ORGANIZATION: "Certificate of Appreciation",
    JUDGE: "Certificate of Adjudication",
    VOLUNTEER: "Certificate of Volunteering",
    CHAIRPERSON: "Certificate of Chairmanship",
    QUIZ_WINNER: "Certificate of Excellence",
    QUIZ_FINALIST: "Certificate — Finalist",
    QUIZ_PARTICIPATION: "Certificate of Participation",
    ATTENDANCE: "Certificate of Attendance",
  };
  return map[type ?? ""] ?? "Certificate of Participation";
}
function certAction(type?: string, eventType?: string) {
  if (type === "SPEAKER_SESSION") return "has presented a talk at";
  if (type === "ORGANIZATION") return "has served as an organizer of";
  if (type === "JUDGE") return "has served as judge/adjudicator at";
  if (type === "VOLUNTEER") return "has volunteered at";
  if (type === "CHAIRPERSON") return "has chaired sessions at";
  if (type?.startsWith("QUIZ_")) return "has participated in";
  if (eventType === "WORKSHOP") return "has successfully completed";
  return "has attended";
}

// Role → accent color for per-template use
function roleAccent(type?: string): string {
  const m: Record<string, string> = {
    SPEAKER_SESSION: "#d97706",
    ORGANIZATION: "#7c3aed",
    JUDGE: "#b45309",
    VOLUNTEER: "#059669",
    CHAIRPERSON: "#1d4ed8",
    QUIZ_WINNER: "#ca8a04",
    QUIZ_FINALIST: "#6b7280",
    QUIZ_PARTICIPATION: "#10b981",
    ATTENDANCE: "#2563eb",
  };
  return m[type ?? ""] ?? "#2563eb";
}

// ══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 1 — CLASSIC MEDICAL
// ══════════════════════════════════════════════════════════════════════════
export function ClassicTemplate({ data }: { data: CertificateData }) {
  const accent = roleAccent(data.certificateType);
  const gold = "#9a6e18";
  const navy = "#1a2d4f";

  const Sig = ({ name, title }: { name: string; title: string }) => (
    <div style={{ textAlign: "center", minWidth: "120px" }}>
      <div style={{ borderTop: `1.5px solid ${gold}`, marginBottom: "4px", width: "100%" }} />
      <div style={{ fontSize: "9pt", fontWeight: "bold", color: navy }}>{name}</div>
      <div style={{ fontSize: "7.5pt", color: "#666" }}>{title}</div>
    </div>
  );

  return (
    <div style={{
      width: "297mm", height: "210mm", background: "#fdf8f0",
      fontFamily: "'Times New Roman', Georgia, serif",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
    }}>
      {/* Outer border */}
      <div style={{ position: "absolute", inset: "6mm", border: `2.5px solid ${gold}`, borderRadius: "3px" }} />
      {/* Inner border */}
      <div style={{ position: "absolute", inset: "9mm", border: `1px solid ${gold}`, borderRadius: "2px", opacity: 0.6 }} />

      {/* Corner ornaments */}
      {[
        { top: "7mm", left: "7mm" }, { top: "7mm", right: "7mm" },
        { bottom: "7mm", left: "7mm" }, { bottom: "7mm", right: "7mm" },
      ].map((pos, i) => (
        <svg key={i} style={{ position: "absolute", ...pos, width: "18mm", height: "18mm" }} viewBox="0 0 60 60">
          <path d="M5,5 L55,5 L55,15 M5,5 L5,55 M5,55 L15,55" stroke={gold} strokeWidth="2" fill="none" />
          <circle cx="30" cy="30" r="4" fill={gold} opacity="0.5" />
          <line x1="30" y1="18" x2="30" y2="42" stroke={gold} strokeWidth="0.8" opacity="0.4" />
          <line x1="18" y1="30" x2="42" y2="30" stroke={gold} strokeWidth="0.8" opacity="0.4" />
        </svg>
      ))}

      {/* Content */}
      <div style={{
        position: "absolute", inset: "13mm",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", textAlign: "center",
      }}>
        {/* Header */}
        <div style={{ width: "100%" }}>
          {data.organizer && (
            <p style={{ fontSize: "10pt", color: gold, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" }}>
              {data.organizer}
            </p>
          )}
          <div style={{
            display: "inline-block", padding: "2px 16px",
            border: `1px solid ${gold}`, color: gold, fontSize: "8pt",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: "6px",
          }}>
            {certTypeLabel(data.certificateType)}
          </div>
          <h1 style={{
            fontSize: "28pt", fontWeight: "normal", color: navy, margin: "4px 0",
            letterSpacing: "2px", textShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}>
            {data.certificateTitle || certTypeLabel(data.certificateType)}
          </h1>
          <p style={{ fontSize: "10pt", color: "#777", marginTop: "4px" }}>This is to certify that</p>
        </div>

        {/* Recipient */}
        <div>
          <h2 style={{
            fontSize: "30pt", fontStyle: "italic", color: accent,
            fontWeight: "normal", margin: "0 0 4px",
            borderBottom: `2px solid ${gold}`, paddingBottom: "4px",
          }}>
            {data.recipientName}
          </h2>
          {data.position && (
            <div style={{ fontSize: "11pt", color: gold, fontWeight: "bold", marginTop: "4px" }}>
              {data.position === 1 ? "1st Place" : data.position === 2 ? "2nd Place" : "3rd Place"}
            </div>
          )}
        </div>

        {/* Event description */}
        <div style={{ maxWidth: "75%", lineHeight: 1.5 }}>
          <p style={{ fontSize: "11pt", color: "#444" }}>
            {certAction(data.certificateType, data.eventType)}
          </p>
          {data.sessionTitle && (
            <p style={{ fontSize: "10pt", fontWeight: "bold", color: navy, margin: "2px 0" }}>
              &ldquo;{data.sessionTitle}&rdquo;
            </p>
          )}
          <p style={{ fontSize: "13pt", fontWeight: "bold", color: navy, margin: "4px 0" }}>
            {data.eventTitle}
          </p>
          <p style={{ fontSize: "9.5pt", color: "#666" }}>
            {fmtRange(data.eventDate, data.eventEndDate)}
            {data.eventLocation && ` · ${data.eventLocation}`}
          </p>
          {data.cmeCredits && (
            <p style={{ fontSize: "9pt", color: gold, marginTop: "3px" }}>
              CME Credits: {data.cmeCredits}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* Left: date + code */}
          <div style={{ fontSize: "8pt", color: "#888", textAlign: "left", lineHeight: 1.6 }}>
            {data.issuedAt && <div>Date: {fmtDate(data.issuedAt)}</div>}
            <div style={{ fontFamily: "monospace", letterSpacing: "1px" }}>{data.certificateCode}</div>
          </div>

          {/* Center: signatories */}
          {data.signatories && data.signatories.length > 0 && (
            <div style={{ display: "flex", gap: "24px", justifyContent: "center", flex: 1 }}>
              {data.signatories.map((s, i) => <Sig key={i} name={s.name} title={s.title} />)}
            </div>
          )}

          {/* Right: QR */}
          {data.verifyUrl && (
            <div style={{ textAlign: "center" }}>
              <QRCodeSVG value={data.verifyUrl} size={52} level="M" />
              <div style={{ fontSize: "6pt", color: "#aaa", marginTop: "2px" }}>Verify</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 2 — MODERN MINIMAL
// ══════════════════════════════════════════════════════════════════════════
export function ModernTemplate({ data }: { data: CertificateData }) {
  const accent = roleAccent(data.certificateType);

  const Sig = ({ name, title }: { name: string; title: string }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ height: "1px", background: "#e2e8f0", marginBottom: "6px" }} />
      <div style={{ fontSize: "8.5pt", fontWeight: "700", color: "#1e293b" }}>{name}</div>
      <div style={{ fontSize: "7pt", color: "#94a3b8" }}>{title}</div>
    </div>
  );

  return (
    <div style={{
      width: "297mm", height: "210mm", background: "#fff",
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      display: "flex", overflow: "hidden",
    }}>
      {/* Left sidebar */}
      <div style={{
        width: "22mm", background: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, position: "relative",
      }}>
        <p style={{
          writingMode: "vertical-rl" as const, transform: "rotate(180deg)",
          fontSize: "9pt", fontWeight: "800", letterSpacing: "4px", color: "rgba(255,255,255,0.9)",
          textTransform: "uppercase",
        }}>
          Certificate
        </p>
        {/* Dot pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.12,
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }} />
      </div>

      {/* Right content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: "10mm 14mm 8mm 12mm",
      }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "auto" }}>
          <div>
            <div style={{
              display: "inline-block", padding: "3px 12px",
              background: accent + "18", color: accent, fontSize: "7.5pt",
              fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase",
              borderRadius: "20px", marginBottom: "6px",
            }}>
              {certTypeLabel(data.certificateType)}
            </div>
            {data.organizer && (
              <p style={{ fontSize: "8.5pt", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>
                {data.organizer}
              </p>
            )}
          </div>
          {/* Decorative geometric */}
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ opacity: 0.15 }}>
            <circle cx="30" cy="30" r="28" stroke={accent} strokeWidth="1.5" fill="none" />
            <circle cx="30" cy="30" r="20" stroke={accent} strokeWidth="1" fill="none" />
            <circle cx="30" cy="30" r="4" fill={accent} />
          </svg>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: "10pt", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>
            This is to certify that
          </p>
          <h2 style={{
            fontSize: "34pt", fontWeight: "800", color: "#0f172a", margin: "0 0 2px",
            lineHeight: 1.1, letterSpacing: "-1px",
          }}>
            {data.recipientName}
          </h2>
          <div style={{ height: "3px", width: "60px", background: accent, borderRadius: "2px", margin: "8px 0" }} />

          <p style={{ fontSize: "10pt", color: "#475569", lineHeight: 1.5, margin: "0" }}>
            {certAction(data.certificateType, data.eventType)}{" "}
            {data.sessionTitle ? (
              <><strong>&ldquo;{data.sessionTitle}&rdquo;</strong>{" at "}</>
            ) : null}
            <strong style={{ color: "#1e293b" }}>{data.eventTitle}</strong>
          </p>
          <p style={{ fontSize: "9pt", color: "#94a3b8", marginTop: "4px" }}>
            {fmtRange(data.eventDate, data.eventEndDate)}
            {data.eventLocation && ` · ${data.eventLocation}`}
          </p>
          {data.cmeCredits && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              marginTop: "6px", padding: "3px 10px",
              background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: "4px", fontSize: "8.5pt", color: "#166534",
            }}>
              ✓ CME Credits: {data.cmeCredits}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
          <div>
            {data.signatories && data.signatories.length > 0 && (
              <div style={{ display: "flex", gap: "20px" }}>
                {data.signatories.map((s, i) => <Sig key={i} name={s.name} title={s.title} />)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: "4px" }}>
            {data.issuedAt && (
              <p style={{ fontSize: "7.5pt", color: "#94a3b8" }}>Issued {fmtDate(data.issuedAt)}</p>
            )}
            {data.verifyUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "6.5pt", color: "#94a3b8", marginBottom: "2px" }}>Verify</p>
                  <p style={{ fontSize: "6pt", color: "#cbd5e1", fontFamily: "monospace" }}>{data.certificateCode}</p>
                </div>
                <QRCodeSVG value={data.verifyUrl} size={44} level="M" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 3 — PREMIUM DARK
// ══════════════════════════════════════════════════════════════════════════
export function PremiumTemplate({ data }: { data: CertificateData }) {
  const gold = "#d4a017";
  const goldLight = "#f0c040";

  const Sig = ({ name, title }: { name: string; title: string }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ height: "1px", background: gold + "60", marginBottom: "5px" }} />
      <div style={{ fontSize: "8.5pt", fontWeight: "600", color: goldLight }}>{name}</div>
      <div style={{ fontSize: "7pt", color: "#94a3b8" }}>{title}</div>
    </div>
  );

  return (
    <div style={{
      width: "297mm", height: "210mm", background: "#0d1525",
      fontFamily: "'Times New Roman', Georgia, serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background texture — subtle diagonal lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px)",
      }} />

      {/* Gold border */}
      <div style={{ position: "absolute", inset: "6mm", border: `1.5px solid ${gold}60`, borderRadius: "4px" }} />
      <div style={{ position: "absolute", inset: "8mm", border: `0.5px solid ${gold}30`, borderRadius: "3px" }} />

      {/* Top decorative band */}
      <div style={{
        position: "absolute", top: "10mm", left: "10mm", right: "10mm",
        height: "1px", background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
      }} />
      {/* Bottom decorative band */}
      <div style={{
        position: "absolute", bottom: "10mm", left: "10mm", right: "10mm",
        height: "1px", background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
      }} />

      {/* Corner diamonds */}
      {[
        { top: "7.5mm", left: "7.5mm" }, { top: "7.5mm", right: "7.5mm" },
        { bottom: "7.5mm", left: "7.5mm" }, { bottom: "7.5mm", right: "7.5mm" },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: "6px", height: "6px", background: gold,
          transform: "rotate(45deg)",
        }} />
      ))}

      {/* Content */}
      <div style={{
        position: "absolute", inset: "13mm",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        textAlign: "center",
      }}>
        {/* Header */}
        <div>
          {data.organizer && (
            <p style={{ fontSize: "9pt", color: gold + "aa", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "5px" }}>
              {data.organizer}
            </p>
          )}
          <p style={{ fontSize: "8pt", color: gold + "80", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "4px" }}>
            {certTypeLabel(data.certificateType)}
          </p>
          <h1 style={{
            fontSize: "30pt", fontWeight: "normal", color: "#f8f0d8",
            margin: "2px 0 6px", letterSpacing: "4px",
          }}>
            {data.certificateTitle || certTypeLabel(data.certificateType)}
          </h1>
          {/* Gold divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ height: "1px", width: "40px", background: gold + "60" }} />
            <div style={{ width: "5px", height: "5px", background: gold, transform: "rotate(45deg)" }} />
            <div style={{ height: "1px", width: "40px", background: gold + "60" }} />
          </div>
          <p style={{ fontSize: "9.5pt", color: "#8899bb", fontStyle: "italic" }}>This is to certify that</p>
        </div>

        {/* Recipient */}
        <div>
          <h2 style={{
            fontSize: "32pt", fontWeight: "normal", fontStyle: "italic",
            color: goldLight, margin: "0 0 4px",
            textShadow: `0 0 20px ${gold}50`,
          }}>
            {data.recipientName}
          </h2>
          {data.position && (
            <div style={{ fontSize: "10pt", color: gold, fontWeight: "bold", letterSpacing: "1px" }}>
              {data.position === 1 ? "1st Place Winner" : data.position === 2 ? "2nd Place" : "3rd Place"}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ maxWidth: "78%", lineHeight: 1.5 }}>
          <p style={{ fontSize: "10pt", color: "#8899bb" }}>
            {certAction(data.certificateType, data.eventType)}
          </p>
          {data.sessionTitle && (
            <p style={{ fontSize: "10pt", color: "#bbc5d5", fontStyle: "italic", margin: "2px 0" }}>
              &ldquo;{data.sessionTitle}&rdquo;
            </p>
          )}
          <p style={{ fontSize: "13pt", color: "#e2e8f0", fontWeight: "bold", margin: "3px 0" }}>
            {data.eventTitle}
          </p>
          <p style={{ fontSize: "9pt", color: "#64748b" }}>
            {fmtRange(data.eventDate, data.eventEndDate)}
            {data.eventLocation && ` · ${data.eventLocation}`}
          </p>
          {data.cmeCredits && (
            <p style={{ fontSize: "8.5pt", color: gold + "cc", marginTop: "3px" }}>
              CME Credits: {data.cmeCredits}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: "7.5pt", color: "#4a5568", textAlign: "left", lineHeight: 1.6 }}>
            {data.issuedAt && <div>Date: {fmtDate(data.issuedAt)}</div>}
            <div style={{ fontFamily: "monospace", letterSpacing: "1px", color: "#374151" }}>{data.certificateCode}</div>
          </div>
          {data.signatories && data.signatories.length > 0 && (
            <div style={{ display: "flex", gap: "24px" }}>
              {data.signatories.map((s, i) => <Sig key={i} name={s.name} title={s.title} />)}
            </div>
          )}
          {data.verifyUrl && (
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "white", padding: "4px", borderRadius: "3px", display: "inline-block" }}>
                <QRCodeSVG value={data.verifyUrl} size={46} level="M" />
              </div>
              <div style={{ fontSize: "6pt", color: "#4a5568", marginTop: "2px" }}>Verify</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 4 — APOLLO MEDICAL
// ══════════════════════════════════════════════════════════════════════════
export function ApolloTemplate({ data }: { data: CertificateData }) {
  const blue = "#2582A1";
  const gold = "#FDB931";
  const darkBlue = "#1a5f87";

  const Sig = ({ name, title }: { name: string; title: string }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ height: "2px", background: `linear-gradient(90deg, ${blue}, ${gold})`, marginBottom: "5px", borderRadius: "1px" }} />
      <div style={{ fontSize: "8.5pt", fontWeight: "700", color: darkBlue }}>{name}</div>
      <div style={{ fontSize: "7pt", color: "#64748b" }}>{title}</div>
    </div>
  );

  return (
    <div style={{
      width: "297mm", height: "210mm", background: "#ffffff",
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Header band */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "16mm",
        background: `linear-gradient(135deg, ${blue} 0%, ${darkBlue} 100%)`,
      }}>
        {/* Gold accent strip */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: gold }} />
        {/* Dot pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.1,
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }} />
      </div>

      {/* Footer band */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "10mm",
        background: `linear-gradient(135deg, ${darkBlue} 0%, ${blue} 100%)`,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: gold }} />
      </div>

      {/* Logo area in header */}
      <div style={{
        position: "absolute", top: "2mm", left: "8mm",
        height: "12mm", display: "flex", alignItems: "center", gap: "6px",
      }}>
        {/* Apollo text logo */}
        <div style={{
          fontSize: "13pt", fontWeight: "900", color: "white", letterSpacing: "-0.5px",
        }}>
          Apollo
        </div>
        <div style={{ width: "1px", height: "8mm", background: "rgba(255,255,255,0.3)" }} />
        <div style={{ fontSize: "7pt", color: "rgba(255,255,255,0.7)", letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1.3 }}>
          Hospitals<br />Medical Conference
        </div>
      </div>

      {/* Cert type badge in header right */}
      <div style={{
        position: "absolute", top: "3.5mm", right: "8mm",
        padding: "2px 10px", background: gold,
        borderRadius: "2px", fontSize: "7pt", fontWeight: "700",
        color: darkBlue, letterSpacing: "2px", textTransform: "uppercase",
      }}>
        {certTypeLabel(data.certificateType)}
      </div>

      {/* Side decorative bar */}
      <div style={{
        position: "absolute", left: "8mm", top: "18mm", bottom: "12mm",
        width: "2px", background: `linear-gradient(180deg, ${blue}60, ${gold}60)`,
        borderRadius: "1px",
      }} />

      {/* Main content */}
      <div style={{
        position: "absolute",
        top: "20mm", left: "14mm", right: "8mm", bottom: "14mm",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
      }}>
        {/* Top: title */}
        <div>
          <h1 style={{
            fontSize: "22pt", fontWeight: "800", color: darkBlue,
            margin: "0 0 2px", letterSpacing: "-0.5px",
          }}>
            {data.certificateTitle || certTypeLabel(data.certificateType)}
          </h1>
          <p style={{ fontSize: "9pt", color: "#64748b", margin: 0 }}>This certifies that</p>
        </div>

        {/* Recipient */}
        <div>
          <h2 style={{
            fontSize: "36pt", fontWeight: "700", color: blue,
            margin: "0 0 4px", letterSpacing: "-1px", lineHeight: 1,
          }}>
            {data.recipientName}
          </h2>
          <div style={{
            height: "3px", width: "80px",
            background: `linear-gradient(90deg, ${blue}, ${gold})`,
            borderRadius: "2px",
          }} />
          {data.position && (
            <div style={{
              marginTop: "6px", display: "inline-block",
              padding: "3px 12px", background: gold, borderRadius: "3px",
              fontSize: "10pt", fontWeight: "700", color: darkBlue,
            }}>
              {data.position === 1 ? "1st Place Winner" : data.position === 2 ? "2nd Place" : "3rd Place"}
            </div>
          )}
        </div>

        {/* Event details */}
        <div style={{ lineHeight: 1.5 }}>
          <p style={{ fontSize: "10.5pt", color: "#475569", margin: "0 0 3px" }}>
            {certAction(data.certificateType, data.eventType)}
          </p>
          {data.sessionTitle && (
            <p style={{ fontSize: "10pt", color: darkBlue, fontStyle: "italic", margin: "2px 0", fontWeight: "600" }}>
              &ldquo;{data.sessionTitle}&rdquo;
            </p>
          )}
          <p style={{ fontSize: "14pt", fontWeight: "700", color: "#0f172a", margin: "2px 0" }}>
            {data.eventTitle}
          </p>
          <p style={{ fontSize: "9pt", color: "#64748b" }}>
            {fmtRange(data.eventDate, data.eventEndDate)}
            {data.eventLocation && ` · ${data.eventLocation}`}
          </p>
          {data.cmeCredits && (
            <div style={{
              display: "inline-flex", marginTop: "4px",
              padding: "3px 10px", background: `${blue}15`,
              border: `1px solid ${blue}40`, borderRadius: "3px",
              fontSize: "8.5pt", color: blue, fontWeight: "600",
            }}>
              CME Credits: {data.cmeCredits}
            </div>
          )}
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* Signatories */}
          <div style={{ display: "flex", gap: "22px" }}>
            {data.signatories?.map((s, i) => <Sig key={i} name={s.name} title={s.title} />)}
          </div>

          {/* Right: QR + code */}
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: "4px" }}>
            {data.issuedAt && (
              <p style={{ fontSize: "7.5pt", color: "#94a3b8", margin: 0 }}>
                Issued: {fmtDate(data.issuedAt)}
              </p>
            )}
            {data.verifyUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "6.5pt", color: "#94a3b8", margin: 0 }}>Scan to verify</p>
                  <p style={{ fontSize: "6pt", color: "#cbd5e1", fontFamily: "monospace", margin: "2px 0 0" }}>{data.certificateCode}</p>
                </div>
                <QRCodeSVG value={data.verifyUrl} size={50} level="M" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dispatcher ─────────────────────────────────────────────────────────────

export function BuiltinCertificateDisplay({
  templateId,
  data,
  className = "",
}: {
  templateId: BuiltinTemplateId;
  data: CertificateData;
  className?: string;
}) {
  const map: Record<BuiltinTemplateId, React.FC<{ data: CertificateData }>> = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    premium: PremiumTemplate,
    apollo: ApolloTemplate,
  };
  const Component = map[templateId] ?? ClassicTemplate;
  return (
    <div className={className} style={{ display: "inline-block" }}>
      <Component data={data} />
    </div>
  );
}
