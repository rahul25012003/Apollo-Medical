"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_LINKS, CTA_LINKS, CONFERENCE } from "@/content/ifpc-2026";

export function IfpcHeader({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const base = `/t/${tenantSlug}`;

  // Same existing-feature login link as the legacy tenant header — on
  // localhost it needs ?tenant=, on production the middleware injects it.
  const [isLocal, setIsLocal] = useState(false);
  useEffect(() => {
    setIsLocal(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }, []);
  const loginHref = isLocal ? `/auth/login?tenant=${tenantSlug}` : "/auth/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    const full = `${base}${href}`;
    return href === "" ? pathname === base || pathname === `${base}/` : pathname.startsWith(full);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-slate-200 shadow-sm"
          : "bg-white/70 backdrop-blur-md border-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
          <Link href={base} className="flex items-center gap-3 min-w-0 group">
            <span className="flex h-10 w-10 lg:h-12 lg:w-12 flex-none items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 p-1 overflow-hidden">
              <img src="/ifpc/nimhans-logo.png" alt="NIMHANS" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm lg:text-base font-bold text-slate-900 font-serif">
                {CONFERENCE.shortName}
              </span>
              <span className="block truncate text-[11px] lg:text-xs text-slate-500">
                &ldquo;{CONFERENCE.theme}&rdquo;
              </span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={`${base}${l.href}`}
                className={cn(
                  "px-3 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap",
                  isActive(l.href)
                    ? "text-[hsl(var(--primary))] bg-[hsl(var(--accent))]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-2 flex-none">
            <Button asChild size="sm" variant="outline">
              <Link href={`${base}${CTA_LINKS.submitAbstract.href}`}>{CTA_LINKS.submitAbstract.label}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`${base}${CTA_LINKS.registerNow.href}`}>
                {CTA_LINKS.registerNow.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={loginHref}>
                <LogIn className="mr-1.5 h-3.5 w-3.5" /> Login
              </Link>
            </Button>
          </div>

          <button
            className="xl:hidden flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-slate-200 bg-white shadow-lg">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={`${base}${l.href}`}
                className={cn(
                  "px-3 py-2.5 rounded-md text-sm font-medium",
                  isActive(l.href) ? "text-[hsl(var(--primary))] bg-[hsl(var(--accent))]" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={`${base}${CTA_LINKS.submitAbstract.href}`}>{CTA_LINKS.submitAbstract.label}</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link href={`${base}${CTA_LINKS.registerNow.href}`}>{CTA_LINKS.registerNow.label}</Link>
              </Button>
            </div>
            <Button asChild size="sm" variant="ghost" className="mt-2">
              <Link href={loginHref}><LogIn className="mr-1.5 h-3.5 w-3.5" /> Login</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
