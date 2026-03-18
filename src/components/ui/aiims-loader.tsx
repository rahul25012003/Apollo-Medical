"use client";

import { useTenant } from "@/lib/tenant/context";
import { useId } from "react";

interface AiimsLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullPage?: boolean;
}

export function AiimsLoader({ size = "md", text = "Loading", fullPage = false }: AiimsLoaderProps) {
  const uid = useId().replace(/:/g, "");
  let tenantLogo: string | null = null;
  try {
    const { tenant } = useTenant();
    // Use tenant's uploaded logo if available, otherwise AIIMS logo
    tenantLogo = tenant?.branding?.logo || null;
  } catch {
    // Outside TenantProvider
  }

  // Always show AIIMS logo as default — it's the primary tenant
  // Only use tenant logo if it's a different uploaded image
  const logoSrc = tenantLogo || "/aiims-logo.jpg";

  const dims = size === "sm" ? 56 : size === "md" ? 90 : 120;
  const pad = size === "sm" ? 8 : size === "md" ? 14 : 18;
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";
  const gap = size === "sm" ? "gap-3" : "gap-5";
  const ringW = size === "sm" ? 2 : 2.5;

  const gradId = `loader-conic-${uid}`;

  const content = (
    <div className={`flex flex-col items-center ${gap}`}>
      {/* Logo with animated conic-gradient ring */}
      <div className="relative" style={{ width: dims + 12, height: dims + 12 }}>
        {/* Glow pulse */}
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            inset: "-10px",
            background: "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 65%)",
          }}
        />
        {/* Rotating conic border */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 0,
            padding: `${ringW}px`,
            background: `conic-gradient(from 0deg, #0d9488, #06b6d4, #6366f1, #0d9488)`,
            animation: "loader-ring-spin 3s linear infinite",
          }}
        >
          <div className="w-full h-full rounded-full bg-white" />
        </div>
        {/* Logo */}
        <div
          className="absolute rounded-full bg-white flex items-center justify-center overflow-hidden"
          style={{
            inset: `${ringW + 4}px`,
            padding: `${pad - 6}px`,
          }}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Loading"
              className="w-full h-full object-contain"
              style={{ mixBlendMode: "multiply" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span className="font-extrabold bg-gradient-to-br from-teal-600 to-cyan-600 bg-clip-text text-transparent" style={{ fontSize: dims * 0.22 }}>
              CareNS
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      {text && (
        <div className="text-center space-y-1.5">
          <p className={`font-semibold text-slate-700 tracking-tight ${textSize}`}>{text}</p>
          {/* Mini progress shimmer */}
          <div className="mx-auto overflow-hidden rounded-full" style={{ width: size === "sm" ? 60 : 100, height: 2.5 }}>
            <div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, #0d9488, #06b6d4, transparent)",
                animation: "loader-shimmer 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes loader-ring-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes loader-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      {content}
    </div>
  );
}
