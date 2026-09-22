"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, ExternalLink, Smartphone, X } from "lucide-react";
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
 *
 * On the IFPC production deployment the root layout renders one `global`
 * instance for every page (manifest + install-prompt capture already in the
 * initial HTML); the per-page instances then stand down.
 */

const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";
const NAVY = "#132845";
const GOLD = "#c9a227";

type Phase = "hidden" | "visible" | "closing";
type InstallPromptEvent = Event & { prompt: () => Promise<void> | void; userChoice: Promise<{ outcome: string }> };
type IfpcWindow = Window & { __ifpcInstallPrompt?: InstallPromptEvent | null };

const DISMISS_KEY = "ifpc-pwa-dismissed-at";
const INSTALLED_KEY = "ifpc-pwa-installed";
const DISMISS_FOR_MS = 3 * 24 * 60 * 60 * 1000;
// Full-screen tools where a floating banner would get in the way.
const HIDDEN_ON = /\/(scan|scanner)(\/|$)|\/badge(\/|$)/;

function readStore(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writeStore(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* private mode etc. */ }
}

export function PwaRegister({ global = false }: { global?: boolean }) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [showHelp, setShowHelp] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One banner per page: per-page instances stand down when the root layout
  // has mounted the site-wide one.
  useEffect(() => {
    setActive(global || document.documentElement.dataset.ifpcPwa !== "global");
  }, [global]);

  useEffect(() => {
    if (!active) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalled(standalone || readStore(INSTALLED_KEY) === "1");
    const onInstalled = () => { writeStore(INSTALLED_KEY, "1"); close(); };
    window.addEventListener("appinstalled", onInstalled);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const onMotionChange = () => setReducedMotion(motionQuery.matches);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      motionQuery.removeEventListener("change", onMotionChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active) return;
    // Production serves this tenant at the site root (DEFAULT_TENANT_SLUG),
    // while locally it lives under /t/apollo-medical. The manifest scope must
    // contain the page you're actually on or the browser refuses to install,
    // so pick the matching manifest/scope instead of hardcoding one.
    const servedAtRoot = !window.location.pathname.startsWith("/t/");
    const scope = servedAtRoot ? "/" : "/t/apollo-medical";

    // The site-wide instance's manifest/theme/icon tags are already in the
    // server HTML; only add them when they aren't there.
    const added: HTMLElement[] = [];
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = servedAtRoot ? "/manifest-ifpc-root.json" : "/manifest-ifpc.json";
      added.push(link);

      const themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      themeColor.content = "#1e3a5f";
      added.push(themeColor);

      // iOS ignores manifest icons and needs a square, opaque icon of its own
      // (the raw logo file is 375x364 — not square, which iOS renders oddly).
      const appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.href = "/ifpc/nimhans-icon-180.png";
      added.push(appleIcon);
      added.forEach((el) => document.head.appendChild(el));
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-ifpc.js", { scope }).catch(() => {});
    }

    // The prompt may already have been captured by the inline head script.
    const w = window as IfpcWindow;
    if (w.__ifpcInstallPrompt) setInstallPrompt(w.__ifpcInstallPrompt);
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      w.__ifpcInstallPrompt = e as InstallPromptEvent;
      setInstallPrompt(e as InstallPromptEvent);
    };
    const onCaptured = () => { if (w.__ifpcInstallPrompt) setInstallPrompt(w.__ifpcInstallPrompt); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("ifpc-installable", onCaptured);

    return () => {
      added.forEach((el) => el.remove());
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("ifpc-installable", onCaptured);
    };
  }, [active]);

  // A short, deliberate delay before the banner appears — it shouldn't
  // compete with the page's own entrance, and a considered arrival reads as
  // more intentional than an instant pop-in.
  useEffect(() => {
    if (!active || installed) return;
    const dismissedAt = Number(readStore(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;
    const t = setTimeout(() => setPhase("visible"), 900);
    return () => clearTimeout(t);
  }, [active, installed]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  function close() {
    setShowHelp(false);
    setPhase((p) => (p === "hidden" ? p : "closing"));
    closeTimer.current = setTimeout(() => setPhase("hidden"), reducedMotion ? 0 : 220);
  }

  function dismiss() {
    writeStore(DISMISS_KEY, String(Date.now()));
    close();
  }

  async function runPrompt(prompt: InstallPromptEvent) {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    (window as IfpcWindow).__ifpcInstallPrompt = null;
    setInstallPrompt(null);
    if (outcome === "accepted") writeStore(INSTALLED_KEY, "1");
    close();
  }

  async function onInstallClick() {
    const w = window as IfpcWindow;
    const prompt = installPrompt || w.__ifpcInstallPrompt;
    if (prompt) return runPrompt(prompt);

    // In-app browsers (WhatsApp, Instagram, Facebook…) can't install apps —
    // reopen this page in Chrome, which can.
    if (isAndroidInAppBrowser()) {
      const { host, pathname: path, search } = window.location;
      window.location.href = `intent://${host}${path}${search}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // Chrome/Edge/Samsung often signal "installable" only moments after the
    // first tap. Wait briefly — still inside this tap's activation window.
    if (supportsInstallPrompt()) {
      setWaiting(true);
      const late = await waitForInstallPrompt(3000);
      setWaiting(false);
      if (late) return runPrompt(late);
    }
    setShowHelp((v) => !v);
  }

  if (!active || installed || phase === "hidden" || HIDDEN_ON.test(pathname || "")) return null;
  const inApp = isAndroidInAppBrowser();

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
              <p className="mb-1.5 text-[13px] font-semibold" style={{ color: GOLD }}>Install the app</p>
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
            <p className="truncate text-[11px] leading-tight text-white/55">
              {inApp ? "Open in Chrome to install" : installPrompt ? "Ready to install — one tap" : "Offline access, one tap away"}
            </p>
          </div>

          <Button
            size="sm"
            className="h-8 flex-none px-3 text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.97]"
            style={{ background: GOLD, color: NAVY }}
            disabled={waiting}
            onClick={onInstallClick}
          >
            {inApp ? (
              <><ExternalLink className="mr-1 h-3.5 w-3.5" /> Open in Chrome</>
            ) : (
              <><Download className="mr-1 h-3.5 w-3.5" /> {waiting ? "Preparing…" : "Install"}</>
            )}
          </Button>

          <button
            onClick={dismiss}
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

// Resolves with the install prompt if the browser offers it within `ms`.
function waitForInstallPrompt(ms: number): Promise<InstallPromptEvent | null> {
  const w = window as IfpcWindow;
  return new Promise((resolve) => {
    if (w.__ifpcInstallPrompt) return resolve(w.__ifpcInstallPrompt);
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener("ifpc-installable", done);
      window.removeEventListener("beforeinstallprompt", done);
      // Let the capture listeners store the event first.
      setTimeout(() => resolve(w.__ifpcInstallPrompt || null), 0);
    };
    const timer = setTimeout(done, ms);
    window.addEventListener("ifpc-installable", done);
    window.addEventListener("beforeinstallprompt", done);
  });
}

// Android WebViews inside other apps (the "; wv)" marker) and the common
// social in-app browsers. None of them can install a web app.
function isAndroidInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && (/; wv\)/.test(ua) || /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|LinkedInApp/i.test(ua));
}

// Browsers that fire beforeinstallprompt (Chromium family, incl. Samsung Internet).
function supportsInstallPrompt() {
  return typeof window !== "undefined" && "onbeforeinstallprompt" in window;
}

function installHelp() {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return /CriOS|FxiOS|EdgiOS/i.test(ua)
      ? "On iPhone, open this page in Safari, tap the Share button, then choose “Add to Home Screen”."
      : "Tap the Share button at the bottom of Safari, then choose “Add to Home Screen”.";
  }
  if (/Android/i.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) return "Tap the menu (☰) at the bottom right, then “Add page to” → “Home screen”. For the full app, you can also open this page in Chrome and tap Install.";
    if (/Firefox/i.test(ua)) return "Open the menu (⋮) and choose “Install”.";
    if (/EdgA/i.test(ua)) return "Open the menu (⋯) and choose “Add to phone”.";
    if (/OPR|Opera/i.test(ua)) return "Open the menu (⋮) and choose “Home screen” → “Install”.";
    if (/MiuiBrowser|HeyTapBrowser|VivoBrowser|UCBrowser|Opera Mini/i.test(ua)) return "This browser can only add a shortcut. Open this page in Chrome and tap Install for the full app.";
    return "Open Chrome’s menu (⋮) and choose “Install app” (or “Add to Home screen” → “Install”).";
  }
  return "In Chrome or Edge, click the install icon at the right of the address bar, or open the ⋮ menu and choose “Install”.";
}
