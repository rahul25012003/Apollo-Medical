"use client";

import { useEffect, useState, useRef } from "react";

export function SplashScreen() {
  const [progress, setProgress] = useState(5);
  const [status, setStatus] = useState("Connecting...");
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const doneRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect which tenant page this is
  const [showSplash, setShowSplash] = useState(false);
  const [tenantKey, setTenantKey] = useState<"carens" | "apollo" | null>(null);
  const checkedRef = useRef(false);
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    const p = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const hostname = window.location.hostname.toLowerCase();

    // carens / AIIMS pages
    const isCarensDomain = hostname.includes("carens") || hostname.includes("aiims") || hostname.includes("careneuromodulation");
    const isCarensPage = p.startsWith("/t/carens")
      || params.get("tenant") === "carens"
      || (!isLocalhost && isCarensDomain && (p === "/" || p.startsWith("/events") || p.startsWith("/auth") || p.startsWith("/gallery")));

    // Apollo Hospitals pages
    const isApolloDomain = hostname.includes("apollo");
    const isApolloPage = p.startsWith("/t/apollo-medical")
      || params.get("tenant") === "apollo-medical"
      || (!isLocalhost && isApolloDomain && (p === "/" || p.startsWith("/events") || p.startsWith("/auth") || p.startsWith("/gallery")));

    if (isCarensPage) {
      setTenantKey("carens");
      setShowSplash(true);
    } else if (isApolloPage) {
      setTenantKey("apollo");
      setShowSplash(true);
    } else {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (doneRef.current) return;

    const stages = [
      [10, "Loading resources..."],
      [35, "Fetching data..."],
      [65, "Rendering interface..."],
      [90, "Almost ready..."],
    ] as const;

    function updateStatus(pct: number) {
      for (let i = stages.length - 1; i >= 0; i--) {
        if (pct >= stages[i][0]) {
          setStatus(stages[i][1]);
          break;
        }
      }
    }

    function hide() {
      if (doneRef.current) return;
      doneRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setStatus("Ready");
      setTimeout(() => {
        setFading(true);
        setTimeout(() => setVisible(false), 500);
      }, 300);
    }

    // Gradual increment based on real time / connectivity
    let pct = 5;
    intervalRef.current = setInterval(() => {
      if (doneRef.current) return;
      if (pct < 85) {
        pct += 2;
        setProgress(pct);
        updateStatus(pct);
      }
    }, 300);

    // readyState
    const onStateChange = () => {
      if (document.readyState === "interactive" && pct < 50) {
        pct = 50;
        setProgress(50);
        updateStatus(50);
      }
      if (document.readyState === "complete") {
        pct = 90;
        setProgress(90);
        updateStatus(90);
        setTimeout(hide, 200);
      }
    };
    document.addEventListener("readystatechange", onStateChange);
    if (document.readyState === "complete") {
      pct = 90;
      setProgress(90);
      updateStatus(90);
      setTimeout(hide, 200);
    }

    // load event
    const onLoad = () => {
      pct = 95;
      setProgress(95);
      updateStatus(95);
      setTimeout(hide, 150);
    };
    window.addEventListener("load", onLoad);

    // Safety: max 6s
    const safety = setTimeout(hide, 6000);

    return () => {
      document.removeEventListener("readystatechange", onStateChange);
      window.removeEventListener("load", onLoad);
      clearTimeout(safety);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible || !showSplash) return null;

  // Per-tenant brand tokens
  const isApollo = tenantKey === "apollo";
  const brand = isApollo
    ? {
        primary: "#2582A1",
        secondary: "#FDB931",
        tertiary: "#1a5f87",
        orb1: "rgba(37,130,161,0.10)",
        orb2: "rgba(253,185,49,0.08)",
        orb3: "rgba(26,95,135,0.05)",
        gridStroke: "#2582A1",
        glow: "rgba(37,130,161,0.14)",
        shadowColor: "rgba(37,130,161,0.2)",
        ring: "conic-gradient(from 0deg, #2582A1, #FDB931, #1a5f87, #2582A1)",
        bar: "linear-gradient(90deg, #2582A1, #FDB931)",
        barGlow: "rgba(37,130,161,0.4)",
        name: "Apollo Hospitals",
        subtitle: "Medical Conference Portal",
      }
    : {
        primary: "#0d9488",
        secondary: "#06b6d4",
        tertiary: "#6366f1",
        orb1: "rgba(13,148,136,0.08)",
        orb2: "rgba(6,182,212,0.06)",
        orb3: "rgba(99,102,241,0.04)",
        gridStroke: "#0d9488",
        glow: "rgba(13,148,136,0.12)",
        shadowColor: "rgba(13,148,136,0.2)",
        ring: "conic-gradient(from 0deg, #0d9488, #06b6d4, #6366f1, #0d9488)",
        bar: "linear-gradient(90deg, #0d9488, #06b6d4)",
        barGlow: "rgba(13,148,136,0.4)",
        name: "CareNS",
        subtitle: "Conference Management System",
      };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brand.orb1} 0%, transparent 70%)`,
            animation: "sp-orb1 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "45%",
            height: "45%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brand.orb2} 0%, transparent 70%)`,
            animation: "sp-orb2 10s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "60%",
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brand.orb3} 0%, transparent 70%)`,
            animation: "sp-orb3 12s ease-in-out infinite",
          }}
        />
        {/* Grid */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 }}>
          <defs>
            <pattern id="sp-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke={brand.gridStroke} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sp-grid)" />
        </svg>
      </div>

      {/* Center */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2.5rem",
        }}
      >
        {/* Logo */}
        <div style={{ position: "relative", animation: "sp-fadeUp 0.8s ease-out" }}>
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              inset: "-20px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${brand.glow} 0%, transparent 60%)`,
              animation: "sp-glow 3s ease-in-out infinite",
            }}
          />
          {/* Conic ring */}
          <div
            style={{
              position: "absolute",
              inset: "-6px",
              borderRadius: "50%",
              padding: "2px",
              background: brand.ring,
              animation: "sp-spin 4s linear infinite",
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#ffffff" }} />
          </div>
          {/* Logo circle */}
          <div
            style={{
              position: "relative",
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: `0 20px 60px -15px ${brand.shadowColor}, 0 0 0 1px ${brand.orb1}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "16px",
            }}
          >
            {isApollo ? (
              /* Apollo: styled text logo until /apollo-logo.png is uploaded */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  AH
                </span>
                <span
                  style={{
                    fontSize: "0.45rem",
                    fontWeight: 700,
                    color: brand.primary,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginTop: "4px",
                  }}
                >
                  Hospitals
                </span>
              </div>
            ) : (
              <img
                src="/aiims-logo.jpg"
                alt="AIIMS"
                style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
              />
            )}
          </div>
        </div>

        {/* Text + progress */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            animation: "sp-fadeUp 0.8s ease-out 0.2s both",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.03em",
              }}
            >
              {brand.name}
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#64748b",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {brand.subtitle}
            </p>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "220px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "3px",
                borderRadius: "3px",
                background: `${brand.orb1}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: "3px",
                  background: brand.bar,
                  transition: "width 0.3s ease",
                  boxShadow: `0 0 8px ${brand.barGlow}`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                color: "#94a3b8",
                letterSpacing: "0.03em",
              }}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes sp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes sp-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes sp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sp-orb1 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(5%,8%); } }
        @keyframes sp-orb2 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-6%,-5%); } }
        @keyframes sp-orb3 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-8%,6%); } }
      `}</style>
    </div>
  );
}
