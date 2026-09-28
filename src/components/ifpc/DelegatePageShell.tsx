"use client";

import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import { useTenant } from "@/lib/tenant/context";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";

/**
 * Frame for the public, at-the-venue delegate pages (Schedule, Route Map,
 * Help Line, Food Menu): emblem, page name, a way home. Public on purpose —
 * people reach these from printed QR codes and signage, often not signed in.
 */
export function DelegatePageShell({
  title,
  icon: Icon,
  actions,
  children,
}: {
  title: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { tenant } = useTenant();
  const accent = tenant?.theme?.primaryColor || "#2582A1";
  const home = `/t/${IFPC_TENANT_SLUG}`;
  const onHelp = usePathname()?.endsWith("/help");
  const router = useRouter();
  const { status } = useSession();
  // Signed in, Back returns to the page you came from inside the app. If this
  // page is the one the browser first loaded (a fresh tab, a scanned QR, a
  // reload) there is no earlier in-app page — the tab's history would lead
  // off the site, to a blank or new-tab page — so it goes to the dashboard.
  // history.length can't tell those apart; the document's own URL can.
  const goBack = () => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const arrivedInApp = !!entry && new URL(entry.name).pathname !== window.location.pathname;
    if (arrivedInApp) router.back();
    else router.push("/dashboard");
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href={home} className="flex min-w-0 items-center gap-2.5">
            <img src="/ifpc/ifpc-icon-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">IFPC 2026</span>
              <span className="block text-xs text-slate-500">{title}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Emergency numbers stay one tap away from every venue page. */}
            {!onHelp && (
              <Link href={`${home}/help`} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100">
                <LifeBuoy className="h-4 w-4" /> Help
              </Link>
            )}
            {status === "authenticated" ? (
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <Link href={home} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Home
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Icon className="h-5 w-5" style={{ color: accent }} /> {title}
          </h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
