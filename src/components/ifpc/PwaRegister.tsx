"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Makes the IFPC 2026 home page (and anything under /t/apollo-medical/...,
 * e.g. the badge print page) installable:
 * - the <link rel="manifest"> is injected only while this component is
 *   mounted (rendered only for tenantSlug === "apollo-medical"), so no other
 *   tenant's <head> is touched;
 * - the service worker registers with scope "/t/apollo-medical", so the
 *   browser itself refuses to let it control the dashboard or any other
 *   tenant, no matter where this component happens to be rendered from.
 */
export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
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
    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = "/ifpc/nimhans-logo.png";
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

  // Already installed / running as an app — nothing to offer.
  if (installed || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,26rem)]">
      {showHelp && (
        <div className="mb-2 rounded-2xl bg-slate-900 text-white p-4 shadow-xl text-xs leading-relaxed">
          <p className="font-semibold mb-2">Add IFPC 2026 to your home screen</p>
          <p className="text-white/80">{installHelp()}</p>
        </div>
      )}
      <div className="flex items-center gap-3 rounded-full bg-slate-900 text-white pl-4 pr-2 py-2 shadow-xl">
        <span className="text-xs font-medium">Install the IFPC 2026 app</span>
        <Button
          size="sm"
          className="h-7 px-3 text-xs bg-white text-slate-900 hover:bg-slate-100"
          onClick={async () => {
            // Native prompt when the browser gave us one; otherwise explain
            // how to install, since iOS never fires it and Chrome only does
            // after its own engagement heuristic is satisfied.
            if (installPrompt) {
              installPrompt.prompt();
              await installPrompt.userChoice;
              setInstallPrompt(null);
              return;
            }
            setShowHelp((v) => !v);
          }}
        >
          <Download className="h-3 w-3 mr-1" /> Install
        </Button>
        <button onClick={() => setDismissed(true)} className="p-1 text-white/60 hover:text-white" aria-label="Dismiss">
          <X className="h-3.5 w-3.5" />
        </button>
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
