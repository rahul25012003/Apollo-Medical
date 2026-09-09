"use client";

import { useState } from "react";
import { Building2, Flower2, Home, Footprints, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPUS_POINTS } from "@/content/ifpc-2026";

type PointId = "conventionCentre" | "yogaCentre" | "guestHouse";

const POINTS: Record<PointId, { x: number; y: number; icon: typeof Building2; color: string }> = {
  yogaCentre: { x: 165, y: 130, icon: Flower2, color: "#0d9488" },
  guestHouse: { x: 250, y: 360, icon: Home, color: "#b45309" },
  conventionCentre: { x: 570, y: 250, icon: Building2, color: "#1e3a5f" },
};

/**
 * Hand-drawn interactive campus schematic — not a real GPS map, since no
 * verified building-level coordinates exist for the NIMHANS campus. Pins are
 * clickable, the dashed line traces the Yoga Centre → Convention Centre
 * walking route. "Get Directions" (elsewhere on the page) still links out to
 * Google Maps for real turn-by-turn navigation to the venue address.
 */
export function CampusMap() {
  const [active, setActive] = useState<PointId>("conventionCentre");

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-3 sm:p-5 shadow-sm overflow-hidden">
        <svg viewBox="0 0 760 460" className="w-full h-auto" role="img" aria-label="NIMHANS campus schematic showing the Convention Centre, Yoga Centre, and Guest House">
          {/* ground */}
          <rect x="0" y="0" width="760" height="460" rx="20" fill="#f4f8f4" />
          <rect x="0" y="0" width="760" height="460" rx="20" fill="url(#groundGradient)" opacity="0.5" />
          <defs>
            <radialGradient id="groundGradient" cx="30%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#d1fae5" />
              <stop offset="100%" stopColor="#f4f8f4" />
            </radialGradient>
          </defs>

          {/* decorative trees */}
          {[[60,60],[700,60],[40,420],[720,410],[400,40],[60,250],[700,300],[380,430]].map(([cx,cy],i) => (
            <g key={i} opacity="0.5">
              <circle cx={cx} cy={cy} r="14" fill="#86efac" />
              <circle cx={cx+8} cy={cy+4} r="10" fill="#6ee7b7" />
            </g>
          ))}

          {/* campus boundary path (decorative) */}
          <rect x="20" y="20" width="720" height="420" rx="24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="2 8" />

          {/* walking route: Yoga Centre -> Convention Centre */}
          <path
            d={`M ${POINTS.yogaCentre.x} ${POINTS.yogaCentre.y} Q 340 80, ${POINTS.conventionCentre.x - 40} ${POINTS.conventionCentre.y - 60}`}
            fill="none"
            stroke="#0d9488"
            strokeWidth="4"
            strokeDasharray="1 14"
            strokeLinecap="round"
          />
          <g transform={`translate(340, 95)`}>
            <rect x="-58" y="-14" width="116" height="24" rx="12" fill="white" stroke="#0d9488" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">≈ 8 min walk</text>
          </g>
          <foreignObject x={325} y={60} width="24" height="24">
            <Footprints className="h-5 w-5 text-teal-600" />
          </foreignObject>

          {/* connector: Guest House -> Convention Centre (short walk) */}
          <path
            d={`M ${POINTS.guestHouse.x} ${POINTS.guestHouse.y} Q 420 340, ${POINTS.conventionCentre.x - 30} ${POINTS.conventionCentre.y + 40}`}
            fill="none"
            stroke="#b45309"
            strokeWidth="3"
            strokeDasharray="1 12"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* pins */}
          {(Object.keys(POINTS) as PointId[]).map((id) => {
            const p = POINTS[id];
            const Icon = p.icon;
            const isActive = active === id;
            return (
              <g
                key={id}
                transform={`translate(${p.x}, ${p.y})`}
                onClick={() => setActive(id)}
                className="cursor-pointer"
              >
                {isActive && <circle r="26" fill={p.color} opacity="0.15">
                  <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite" />
                </circle>}
                <circle r="18" fill={p.color} stroke="white" strokeWidth="3" />
                <foreignObject x={-9} y={-9} width="18" height="18">
                  <Icon className="h-[18px] w-[18px] text-white" />
                </foreignObject>
                <rect x={-60} y={24} width="120" height="20" rx="10" fill="white" stroke={p.color} strokeWidth="1" opacity={isActive ? 1 : 0.85} />
                <text x="0" y="38" textAnchor="middle" fontSize="10" fontWeight={isActive ? 700 : 500} fill={p.color}>
                  {CAMPUS_POINTS[id].label.split(" — ")[0].split(",")[0].slice(0, 20)}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="text-center text-xs text-slate-400 mt-2">Schematic for orientation only — not to scale. Tap a pin for details.</p>
      </div>

      <div className="space-y-3">
        {(Object.keys(POINTS) as PointId[]).map((id) => {
          const p = POINTS[id];
          const Icon = p.icon;
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-all",
                isActive ? "border-transparent shadow-md" : "border-slate-200 hover:border-slate-300"
              )}
              style={isActive ? { background: `${p.color}0d`, borderColor: p.color } : undefined}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white" style={{ background: p.color }}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900">{CAMPUS_POINTS[id].label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{CAMPUS_POINTS[id].note}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1">
                    <MapPin className="h-3 w-3 flex-none mt-0.5" /> {CAMPUS_POINTS[id].address}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 flex-none mt-0.5" />
          All three points are within the same NIMHANS campus. For turn-by-turn navigation to the campus, use the &ldquo;Get Directions&rdquo; link above.
        </div>
      </div>
    </div>
  );
}
