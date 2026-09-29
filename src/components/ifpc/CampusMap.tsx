"use client";

import { useState } from "react";
import { Building2, Flower2, Home, Landmark, Footprints, MapPin, ExternalLink, ChevronRight } from "lucide-react";
import { CAMPUS_POINTS } from "@/content/ifpc-2026";
import { useTenant } from "@/lib/tenant/context";
import "./campus-map.css";

type PointId = "conventionCentre" | "yogaCentre" | "guestHouse" | "administrativeBlock";

// Layout (position, icon, colour) is structural and fixed; label/note/address/
// mapUrl are content and can be overridden by the admin (Locations page).
const LAYOUT: Record<PointId, { x: number; y: number; icon: typeof Building2; color: string }> = {
  yogaCentre: { x: 165, y: 130, icon: Flower2, color: "#0d9488" },
  guestHouse: { x: 250, y: 360, icon: Home, color: "#d97706" },
  conventionCentre: { x: 570, y: 250, icon: Building2, color: "#4f46e5" },
  administrativeBlock: { x: 470, y: 110, icon: Landmark, color: "#9333ea" },
};
const POINT_IDS = Object.keys(LAYOUT) as PointId[];

// Decorative scenery: a few blocks, trees and a pond, so the schematic reads
// as a campus. Not to scale and not real positions.
const TREES: [number, number][] = [[60, 60], [700, 60], [40, 420], [720, 410], [400, 40], [60, 250], [700, 300], [380, 430], [120, 200], [640, 150], [330, 250], [520, 410], [240, 60], [610, 370]];
const BLOCKS: [number, number, number, number][] = [[95, 300, 70, 44], [610, 60, 80, 46], [330, 150, 60, 40], [660, 200, 56, 70], [420, 330, 70, 40]];

/**
 * Hand-drawn interactive campus schematic — not a real GPS map, since no
 * verified building-level coordinates exist for the NIMHANS campus. Pins are
 * clickable, the dashed line traces the Yoga Centre → Convention Centre
 * walking route. Every pin and place card opens that place in Google Maps.
 */
export function CampusMap() {
  const { tenant } = useTenant();
  const [active, setActive] = useState<PointId>("conventionCentre");

  // Admin override (src/app/dashboard/locations) merged over the built-in
  // defaults, by id — a saved point replaces only the fields it sets.
  const overrides = new Map((tenant?.campusLocations?.points ?? []).map((p) => [p.id, p]));
  const contentOf = (id: PointId) => ({ ...CAMPUS_POINTS[id], ...overrides.get(id) });
  const shortLabel = (id: PointId) => contentOf(id).label.split(" — ")[0].split(",")[0].slice(0, 32);

  return (
    <div className="ifpc-cm">
      <div className="ifpc-cm-map">
        <svg viewBox="0 0 760 460" role="group" aria-label="NIMHANS campus schematic showing the Convention Centre, Administrative Block, Yoga Centre, and Guest House">
          <defs>
            <radialGradient id="cmGround" cx="30%" cy="20%" r="90%">
              <stop offset="0%" stopColor="#e8f7ee" />
              <stop offset="100%" stopColor="#eef4fb" />
            </radialGradient>
            <linearGradient id="cmPond" x1="0" x2="1">
              <stop offset="0" stopColor="#bae6fd" />
              <stop offset="1" stopColor="#7dd3fc" />
            </linearGradient>
            <filter id="cmShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0b1a4a" floodOpacity="0.18" />
            </filter>
          </defs>

          <rect x="0" y="0" width="760" height="460" rx="22" fill="url(#cmGround)" />

          {/* roads */}
          <path d="M0 400 C 200 380, 300 440, 520 430 S 760 380, 760 380" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
          <path d="M0 400 C 200 380, 300 440, 520 430 S 760 380, 760 380" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="10 10" />
          <path d="M300 0 C 320 120, 420 200, 470 460" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" />

          {/* pond */}
          <ellipse cx="640" cy="330" rx="52" ry="30" fill="url(#cmPond)" opacity="0.8" />

          {/* buildings */}
          {BLOCKS.map(([x, y, w, h], i) => (
            <g key={i} opacity="0.55">
              <rect x={x} y={y + 6} width={w} height={h} rx="6" fill="#cbd5e1" />
              <rect x={x} y={y} width={w} height={h} rx="6" fill="#fff" stroke="#e2e8f0" />
            </g>
          ))}

          {/* trees */}
          {TREES.map(([cx, cy], i) => (
            <g key={i} opacity="0.75">
              <circle cx={cx} cy={cy + 3} r="12" fill="#a7f3d0" />
              <circle cx={cx} cy={cy} r="11" fill="#6ee7b7" />
              <circle cx={cx - 3} cy={cy - 3} r="5" fill="#a7f3d0" />
            </g>
          ))}

          {/* walking route: Yoga Centre -> Convention Centre */}
          <path
            d={`M ${LAYOUT.yogaCentre.x} ${LAYOUT.yogaCentre.y} Q 340 80, ${LAYOUT.conventionCentre.x - 40} ${LAYOUT.conventionCentre.y - 60}`}
            fill="none" stroke="#0d9488" strokeWidth="4" strokeDasharray="1 12" strokeLinecap="round" className="ifpc-cm-route"
          />
          <g transform="translate(340, 95)" filter="url(#cmShadow)">
            <rect x="-62" y="-15" width="124" height="26" rx="13" fill="white" />
            <text x="8" y="3" textAnchor="middle" fontSize="11.5" fill="#0d9488" fontWeight="700">≈ 8 min walk</text>
          </g>
          <foreignObject x={286} y={84} width="18" height="18">
            <Footprints className="h-[18px] w-[18px] text-teal-600" />
          </foreignObject>

          {/* connector: Guest House -> Convention Centre (short walk) */}
          <path
            d={`M ${LAYOUT.guestHouse.x} ${LAYOUT.guestHouse.y} Q 420 340, ${LAYOUT.conventionCentre.x - 30} ${LAYOUT.conventionCentre.y + 40}`}
            fill="none" stroke="#d97706" strokeWidth="3" strokeDasharray="1 10" strokeLinecap="round" opacity="0.7" className="ifpc-cm-route"
          />
          {/* connector: Administrative Block -> Convention Centre */}
          <path
            d={`M ${LAYOUT.administrativeBlock.x} ${LAYOUT.administrativeBlock.y} Q 520 160, ${LAYOUT.conventionCentre.x - 20} ${LAYOUT.conventionCentre.y - 30}`}
            fill="none" stroke="#9333ea" strokeWidth="3" strokeDasharray="1 10" strokeLinecap="round" opacity="0.6" className="ifpc-cm-route"
          />

          {/* pins */}
          {POINT_IDS.map((id) => {
            const p = LAYOUT[id];
            const content = contentOf(id);
            const Icon = p.icon;
            const isActive = active === id;
            const label = shortLabel(id);
            const w = Math.max(90, label.length * 6.6 + 24);
            return (
              <a key={id} href={content.mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${content.label} in Google Maps`} onClick={() => setActive(id)}>
                <g transform={`translate(${p.x}, ${p.y})`} className="ifpc-cm-pin">
                  {isActive && (
                    <circle r="26" fill={p.color} opacity="0.18">
                      <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* the pin: a drop with the place's icon */}
                  <path d="M0 16 C -14 2, -18 -6, -18 -14 A 18 18 0 1 1 18 -14 C 18 -6, 14 2, 0 16 Z" fill={p.color} stroke="white" strokeWidth="3" filter="url(#cmShadow)" transform="translate(0,-6)" />
                  <foreignObject x={-9} y={-29} width="18" height="18">
                    <Icon className="h-[18px] w-[18px] text-white" />
                  </foreignObject>
                  <g filter="url(#cmShadow)">
                    <rect x={-w / 2} y={18} width={w} height="24" rx="12" fill="white" stroke={isActive ? p.color : "white"} strokeWidth="1.5" />
                    <text x="0" y="34" textAnchor="middle" fontSize="11" fontWeight={isActive ? 700 : 600} fill={isActive ? p.color : "#0b1a4a"}>{label}</text>
                  </g>
                </g>
              </a>
            );
          })}
        </svg>

        {/* legend */}
        <div className="ifpc-cm-legend">
          {POINT_IDS.map((id) => (
            <span key={id}><MapPin style={{ color: LAYOUT[id].color }} aria-hidden="true" />{shortLabel(id)}</span>
          ))}
        </div>
        <p className="ifpc-cm-note">Schematic for orientation only — not to scale. Tap a pin to open it in Google Maps.</p>
      </div>

      <div className="ifpc-cm-list">
        {POINT_IDS.map((id) => {
          const p = LAYOUT[id];
          const content = contentOf(id);
          const Icon = p.icon;
          const isActive = active === id;
          return (
            <a
              key={id}
              href={content.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setActive(id)}
              className="ifpc-cm-place"
              data-active={isActive}
              style={{ "--tone": p.color } as React.CSSProperties}
            >
              <span className="ifpc-cm-icon" aria-hidden="true"><Icon /></span>
              <span className="ifpc-cm-body">
                <span className="ifpc-cm-title">{content.label}</span>
                <span className="ifpc-cm-text">{content.note}</span>
                <span className="ifpc-cm-addr"><MapPin aria-hidden="true" /> {content.address}</span>
                <span className="ifpc-cm-link">Open in Google Maps <ExternalLink aria-hidden="true" /></span>
              </span>
              <ChevronRight className="ifpc-cm-chev" aria-hidden="true" />
            </a>
          );
        })}
        <p className="ifpc-cm-tip">
          <MapPin aria-hidden="true" />
          All four places are on the NIMHANS campus. Tap any of them to open it in Google Maps for directions.
        </p>
      </div>
    </div>
  );
}
