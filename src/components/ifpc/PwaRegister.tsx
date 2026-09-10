"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Makes the IFPC 2026 home page (and anything under /t/apollo-medical/...,
 * e.g. the badge print page) installable:
 * - the <link rel="manifest"> is injected only while this component is
 *   mounted (rendered only for tenantSlug === "apollo-medical"), so no other
 *   tenant's <head> is touched;
 * - the service worker registers with a scope matching wherever the tenant
 *   is actually served (root in production, /t/apollo-medical locally), so
 *   the browser itself refuses to let it control the dashboard or any other
 *   tenant, no matter where this component happens to be rendered from.
 */

const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";
const NAVY = "#132845";
const GOLD = "#c9a227";

type Phase = "hidden" | "visible" | "closing";

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [installed, setInstalled] = useState(false);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [showHelp, setShowHelp] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    window.addEventListener("appinstalled", close);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const onMotionChange = () => setReducedMotion(motionQuery.matches);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      window.removeEventListener("appinstalled", close);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  useEffect(() => {
    // Production serves this tenant at the site root (DEFAULT_TENANT_SLUG),
    // while locally it lives under /t/apollo-medical. The manifest scope must
    // contain the page you're actually on or the browser refuses to install,
    // so pick the matching manifest/scope instead of hardcoding one.
    const servedAtRoot = !window.location.pathname.startsWith("/t/");
    const scope = servedAtRoot ? "/" : "/t/apollo-medical";

    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = servedAtRoot ? "/manifest-ifpc-root.json" : "/manifest-ifpc.json";
    document.head.appendChild(link);

    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#1e3a5f";
    document.head.appendChild(themeColor);

    // Real NIMHANS logo for iOS "Add to Home Screen" (iOS ignores the manifest icons)
    // iOS ignores manifest icons and needs a square, opaque icon of its own
    // (the raw logo file is 375x364 — not square, which iOS renders oddly).
    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = "/ifpc/nimhans-icon-180.png";
    document.head.appendChild(appleIcon);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-ifpc.js", { scope }).catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as never);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(themeColor);
      document.head.removeChild(appleIcon);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  // A short, deliberate delay before the banner appears — it shouldn't
  // compete with the page's own entrance, and a considered arrival reads as
  // more intentional than an instant pop-in.
  useEffect(() => {
    if (installed) return;
    const t = setTimeout(() => setPhase("visible"), 900);
    return () => clearTimeout(t);
  }, [installed]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  function close() {
    setShowHelp(false);
    setPhase((p) => (p === "hidden" ? p : "closing"));
    closeTimer.current = setTimeout(() => setPhase("hidden"), reducedMotion ? 0 : 220);
  }

  if (installed || phase === "hidden") return null;

  const open = phase === "visible";
  const enter = (transform: string) => ({
    transitionProperty: "transform, opacity",
    transitionDuration: open ? (reducedMotion ? "160ms" : "420ms") : "180ms",
    transitionTimingFunction: EASE_OUT,
    transform: reducedMotion ? "none" : open ? "none" : transform,
    opacity: open ? 1 : 0,
  });

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
      <style>{`
        @keyframes ifpc-pwa-ring {
          0% { transform: scale(0.85); opacity: 0.55; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>
      <div className="w-[min(92vw,23rem)]" style={enter("translateY(20px) scale(0.95)")}>
        {/* Help panel — anchored above the pill, like a popover on its trigger */}
        <div
          className="overflow-hidden"
          style={{ display: "grid", gridTemplateRows: showHelp ? "1fr" : "0fr", transition: `grid-template-rows 260ms ${EASE_OUT}` }}
        >
          <div className="min-h-0">
            <div
              className="mb-2 origin-bottom rounded-2xl border border-white/10 p-4 text-white shadow-2xl backdrop-blur-xl"
              style={{
                background: `${NAVY}f2`,
                transition: `transform 220ms ${EASE_OUT}, opacity 220ms ${EASE_OUT}`,
                transform: showHelp ? "scale(1)" : "scale(0.94)",
                opacity: showHelp ? 1 : 0,
              }}
            >
              <p className="mb-1.5 text-[13px] font-semibold" style={{ color: GOLD }}>Add to your home screen</p>
              <p className="text-[13px] leading-relaxed text-white/75">{installHelp()}</p>
            </div>
          </div>
        </div>

        {/* Main pill */}
        <div
          className="flex items-center gap-3 rounded-2xl border border-white/10 py-2.5 pl-3 pr-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          style={{ background: `${NAVY}f2` }}
        >
          <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${GOLD}, #96741b)` }}>
            {!reducedMotion && (
              <span
                className="absolute inset-0 rounded-xl"
                style={{ background: GOLD, animation: "ifpc-pwa-ring 1.15s cubic-bezier(0,0,0.2,1) 2" }}
              />
            )}
            <Smartphone className="relative h-5 w-5" style={{ color: NAVY }} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-white">Install IFPC 2026</p>
            <p className="truncate text-[11px] leading-tight text-white/55">Offline access, one tap away</p>
          </div>

          <Button
            size="sm"
            className="h-8 flex-none px-3 text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.97]"
            style={{ background: GOLD, color: NAVY }}
            onClick={async () => {
              // Native prompt when the browser gave us one; otherwise explain
              // how to install, since iOS never fires it and Chrome only does
              // after its own engagement heuristic is satisfied.
              if (installPrompt) {
                installPrompt.prompt();
                await installPrompt.userChoice;
                setInstallPrompt(null);
                close();
                return;
              }
              setShowHelp((v) => !v);
            }}
          >
            <Download className="mr-1 h-3.5 w-3.5" /> Install
          </Button>

          <button
            onClick={close}
            aria-label="Dismiss"
            className="grid h-7 w-7 flex-none place-items-center rounded-full text-white/50 transition-all duration-150 ease-out hover:rotate-90 hover:bg-white/10 hover:text-white active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function installHelp() {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "Tap the Share button at the bottom of Safari, then choose “Add to Home Screen”.";
  }
  if (/Android/i.test(ua)) {
    return "Open your browser menu (⋮) and choose “Install app” or “Add to Home screen”.";
  }
  return "In Chrome or Edge, click the install icon at the right of the address bar, or open the ⋮ menu and choose “Install”.";
}
