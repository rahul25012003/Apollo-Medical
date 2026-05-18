"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Award,
  ArrowRight,
  Building2,
  Users,
  Eye,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EVENT_TYPE_LABELS: Record<string, string> = {
  CONFERENCE: "Conference", WORKSHOP: "Workshop", CME: "CME",
  SEMINAR: "Seminar", WEBINAR: "Webinar", SYMPOSIUM: "Symposium",
};
const typeLabel = (t: string) => EVENT_TYPE_LABELS[t?.toUpperCase()] ?? t;

export interface EventCardData {
  id: string;
  title: string;
  shortDescription: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  type: string;
  registrations: number;
  capacity: number;
  status: string;
  price: number;
  earlyBirdPrice: number | null;
  cmeCredits: number | null;
  image: string | null;
  currency: string;
  tenantSlug: string | null;
  tenantName: string | null;
  registrationOpensDate: string | null;
  registrationDeadline: string | null;
  isVirtual?: boolean;
  earlyBirdDeadline?: string | null;
}

interface EventCardProps {
  event: EventCardData;
  variant?: "grid" | "list";
  themeColor?: string;
  hrefPrefix?: string;
  darkBg?: boolean;
}

function getRegStatus(event: EventCardData) {
  const now = new Date();
  const opens = event.registrationOpensDate ? new Date(event.registrationOpensDate) : null;
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const end = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
  const endOfDay = new Date(end.getTime() + 86400000);

  if (now > endOfDay) return { kind: "ended" as const, label: "Event Ended" };
  if (opens && now < opens) {
    const diffDays = Math.ceil((opens.getTime() - now.getTime()) / 86400000);
    return { kind: "upcoming" as const, label: `Opens in ${diffDays} ${diffDays === 1 ? "day" : "days"}`, opens };
  }
  if (deadline && now > deadline) return { kind: "closed" as const, label: "Registration Closed" };
  const soldOut = event.capacity > 0 && event.registrations >= event.capacity;
  if (soldOut) return { kind: "closed" as const, label: "Registration Closed" };
  if (deadline) {
    const diffMs = deadline.getTime() - now.getTime();
    const diffHrs = diffMs / 3600000;
    if (diffHrs <= 48) {
      const hrs = Math.max(0, Math.floor(diffHrs));
      return { kind: "closing" as const, label: `Closes in ${hrs} ${hrs === 1 ? "hour" : "hours"}`, deadline };
    }
    const days = Math.ceil(diffHrs / 24);
    return { kind: "open" as const, label: `Closes in ${days} ${days === 1 ? "day" : "days"}`, deadline };
  }
  return { kind: "open" as const, label: "Registration Open" };
}

function fmtDateBadge(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
  };
}

function fmtMoney(amount: number, currency: string) {
  if (!amount || amount <= 0) return "Free";
  const sym = currency === "INR" ? "₹" : currency === "EUR" ? "€" : "₹";
  return `${sym}${Number(amount).toLocaleString()}`;
}

export function EventCard({ event, variant = "grid", themeColor = "#0f766e", hrefPrefix = "", darkBg = false }: EventCardProps) {
  const router = useRouter();
  const reg = getRegStatus(event);
  const slotsLeft = Math.max(0, event.capacity - event.registrations);
  const fillPct = event.capacity > 0 ? Math.min(100, (event.registrations / event.capacity) * 100) : 0;
  const dateBadge = fmtDateBadge(event.startDate);
  const detailHref = `${hrefPrefix}/events/${event.id}`;
  const registerHref = `${hrefPrefix}/events/${event.id}/register`;
  const isOpen = reg.kind === "open" || reg.kind === "closing";

  const statusBgGradient =
    reg.kind === "open" ? "linear-gradient(135deg, #10b981, #059669)" :
    reg.kind === "closing" ? "linear-gradient(135deg, #f59e0b, #ea580c)" :
    reg.kind === "upcoming" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" :
    "linear-gradient(135deg, #64748b, #475569)";

  // Color helpers for dark/light bg
  const textPrimary = darkBg ? "#f1f5f9" : undefined;
  const textSecondary = darkBg ? "#94a3b8" : undefined;
  const textMuted = darkBg ? "#64748b" : undefined;
  const cardBg = darkBg ? "rgba(30, 41, 59, 0.6)" : undefined;
  const cardBorder = darkBg
    ? (isOpen ? `rgba(16, 185, 129, 0.3)` : "rgba(255,255,255,0.1)")
    : (isOpen ? `${themeColor}40` : "rgba(0,0,0,0.08)");
  const barBg = darkBg ? "rgba(71, 85, 105, 0.5)" : undefined;
  const borderTopColor = darkBg ? "rgba(255,255,255,0.08)" : undefined;

  if (variant === "list") {
    return (
      <div
        onClick={() => router.push(detailHref)}
        className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
        style={{
          borderColor: cardBorder,
          border: `1px solid ${cardBorder}`,
          boxShadow: isOpen ? `0 0 0 1px ${themeColor}20, 0 8px 32px ${themeColor}15` : "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Full background image */}
        <div className="absolute inset-0">
          {event.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)` }} />
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.7) 100%)" }} />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col min-h-[320px] sm:min-h-[280px]">
          {/* Top row: date badge + status + type */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Date badge */}
              <div className="flex flex-col items-center justify-center w-14 h-16 rounded-xl bg-white/95 shadow-xl backdrop-blur">
                <span className="text-[10px] font-bold tracking-wider mt-1" style={{ color: themeColor }}>{dateBadge.month}</span>
                <span className="text-2xl font-extrabold leading-none text-slate-900">{dateBadge.day}</span>
              </div>
              {/* Status pill */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                style={{ background: statusBgGradient }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: isOpen ? "pulse 1.5s ease-in-out infinite" : undefined }} />
                {reg.label}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-white/15 backdrop-blur-sm">{typeLabel(event.type)}</span>
              {(event.cmeCredits ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/90 text-white backdrop-blur-sm">
                  <Award className="h-3 w-3" />{event.cmeCredits} CME
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 line-clamp-2 group-hover:opacity-90 transition-opacity" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
            {event.title}
          </h3>

          {/* Description */}
          {event.shortDescription && (
            <p className="text-sm text-white/75 line-clamp-2 mb-4 max-w-2xl">{event.shortDescription}</p>
          )}

          {/* Meta info row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80 mb-4">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              {event.endDate ? ` - ${new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </span>
            {event.startTime && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/60" />
                {event.startTime} IST
              </span>
            )}
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/60" />
              {event.location}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/60" />
              {event.registrations}/{event.capacity} registered
            </span>
          </div>

          {/* Bottom row: capacity + price + CTAs */}
          <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            {/* Capacity bar */}
            <div className="w-full sm:max-w-xs">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-white/50">{Math.round(fillPct)}% filled</span>
                <span className="font-semibold flex items-center gap-1" style={{ color: fillPct >= 90 ? "#fca5a5" : fillPct >= 70 ? "#fbbf24" : "#34d399" }}>
                  {slotsLeft <= 10 && slotsLeft > 0 && <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ animation: "pulse 1s ease-in-out infinite" }} />}
                  {slotsLeft <= 0 ? "Registration Closed" : `${slotsLeft} spots left`}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/15">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? "#dc2626" : fillPct >= 70 ? "#f59e0b" : "#10b981" }} />
              </div>
            </div>
            {/* Price + CTAs */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{fmtMoney(event.price, event.currency)}</span>
              <Link href={detailHref} onClick={e => e.stopPropagation()}>
                <Button variant="outline" className="rounded-xl font-bold h-11 px-5 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
                  <Eye className="h-4 w-4 mr-1.5" />
                  Details
                </Button>
              </Link>
              {isOpen ? (
                <Link href={registerHref} onClick={e => e.stopPropagation()}>
                  <Button
                    className="rounded-xl text-white font-bold shadow-lg h-11 px-6"
                    style={{ background: `linear-gradient(135deg, #10b981, #059669)`, boxShadow: "0 6px 20px rgba(16,185,129,0.4)" }}
                  >
                    Register <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              ) : reg.kind === "upcoming" ? (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/15 text-white backdrop-blur-sm border border-white/20">
                  <Clock className="h-4 w-4" />
                  {reg.label}
                </span>
              ) : reg.kind === "closed" ? (
                <span className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white/60 backdrop-blur-sm border border-white/10">
                  Registration Closed
                </span>
              ) : reg.kind === "ended" ? (
                <span className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white/60 backdrop-blur-sm border border-white/10">
                  Event Ended
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div
      onClick={() => router.push(detailHref)}
      className="group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
      style={{
        background: cardBg,
        backdropFilter: darkBg ? "blur(12px)" : undefined,
        borderColor: cardBorder,
        boxShadow: isOpen ? `0 0 0 1px ${themeColor}15, 0 4px 20px ${themeColor}10` : darkBg ? "0 4px 20px rgba(0,0,0,0.2)" : undefined,
      }}
    >
      {/* Banner */}
      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
            <Calendar className="h-20 w-20 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Status pill top-left */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
            style={{ background: statusBgGradient }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: isOpen ? "pulse 1.5s ease-in-out infinite" : undefined }} />
            {reg.label}
          </span>
        </div>

        {/* Date tear-off top-right */}
        <div className="absolute top-3 right-3 flex flex-col items-center justify-center w-14 h-16 rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur">
          <span className="text-[10px] font-bold tracking-wider mt-1" style={{ color: themeColor }}>{dateBadge.month}</span>
          <span className="text-2xl font-extrabold leading-none text-slate-900 dark:text-white">{dateBadge.day}</span>
        </div>

        {/* Type + CME pills bottom-left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs font-bold text-slate-900 dark:text-white">
            {typeLabel(event.type)}
          </span>
          {(event.cmeCredits ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur text-xs font-bold text-white">
              <Award className="h-3 w-3" />{event.cmeCredits} CME
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-bold mb-1 line-clamp-2 group-hover:opacity-80 transition-opacity min-h-[3.5rem]" style={{ color: textPrimary }}>
          {event.title}
        </h3>
        {event.tenantName && (
          <p className="text-xs mb-2 flex items-center gap-1" style={{ color: textMuted }}>
            <Building2 className="h-3 w-3" />
            {event.tenantName}
          </p>
        )}
        {event.shortDescription && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: textSecondary }}>{event.shortDescription}</p>
        )}
        <div className="space-y-1.5 text-sm mb-3" style={{ color: textSecondary }}>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: darkBg ? themeColor : undefined }} />
            <span className="truncate">{event.location}</span>
          </div>
          {event.startTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: darkBg ? themeColor : undefined }} />
              <span>{event.startTime} IST</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" style={{ color: darkBg ? themeColor : undefined }} />
            <span>{event.registrations}/{event.capacity} registered</span>
          </div>
        </div>

        {/* View Event Details link */}
        <Link href={detailHref} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-sm font-semibold mb-3 hover:underline transition-colors" style={{ color: darkBg ? "#34d399" : themeColor }}>
          <Eye className="h-3.5 w-3.5" />
          View Event Details
        </Link>

        {/* Capacity bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="font-medium" style={{ color: textMuted }}>{Math.round(fillPct)}% filled</span>
            <span className="font-semibold flex items-center gap-1" style={{ color: fillPct >= 90 ? "#dc2626" : fillPct >= 70 ? "#ea580c" : (darkBg ? "#34d399" : themeColor) }}>
              {slotsLeft <= 10 && slotsLeft > 0 && <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ animation: "pulse 1s ease-in-out infinite" }} />}
              {slotsLeft <= 0 ? "Registration Closed" : `${slotsLeft} spots left`}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: barBg || "#e2e8f0" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? "#dc2626" : fillPct >= 70 ? "#ea580c" : themeColor }} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${borderTopColor || "rgba(0,0,0,0.08)"}` }}>
          <span className="text-2xl font-extrabold" style={{ color: darkBg ? "#34d399" : themeColor }}>
            {fmtMoney(event.price, event.currency)}
          </span>
          {isOpen ? (
            <Link href={registerHref} onClick={e => e.stopPropagation()}>
              <Button
                className="rounded-xl text-white font-bold shadow-lg"
                style={{ background: themeColor, boxShadow: `0 6px 20px ${themeColor}40` }}
              >
                Register <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : reg.kind === "upcoming" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: darkBg ? "rgba(59,130,246,0.25)" : "#eff6ff", color: darkBg ? "#93c5fd" : "#1d4ed8", border: `1px solid ${darkBg ? "rgba(59,130,246,0.3)" : "#bfdbfe"}` }}>
              <Clock className="h-3 w-3" />
              {reg.label}
            </span>
          ) : reg.kind === "closed" ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: darkBg ? "rgba(239,68,68,0.2)" : "#fef2f2", color: darkBg ? "#fca5a5" : "#dc2626", border: `1px solid ${darkBg ? "rgba(239,68,68,0.3)" : "#fecaca"}` }}>
              Closed
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: darkBg ? "rgba(100,116,139,0.25)" : "#f1f5f9", color: darkBg ? "#94a3b8" : "#64748b", border: `1px solid ${darkBg ? "rgba(100,116,139,0.3)" : "#e2e8f0"}` }}>
              Ended
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { getRegStatus };
