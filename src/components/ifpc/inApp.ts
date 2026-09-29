"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";

/**
 * Signed-in IFPC users stay inside the signed-in area — the dashboard plus the
 * venue pages its sidebar links to (under /t/apollo-medical locally, at the
 * site root in production). Only Logout takes them back to the public site.
 */
const IN_APP = new RegExp(`^/(dashboard|(t/${IFPC_TENANT_SLUG}/)?(schedule|route-map|help|food-menu))(/|$)`);

// Signed-in pages seen since this page load, oldest first. Only consulted by
// browsers without the Navigation API, which reports the real previous page.
const trail: string[] = [];

type NavigationApi = { currentEntry: { index: number } | null; entries(): { url: string | null }[] };

/** Where Logout lands: the public IFPC home page. */
export function ifpcPublicHome(): string {
  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return local ? `/t/${IFPC_TENANT_SLUG}` : "/";
}

/**
 * Back that never leaves the signed-in area: returns to the previous page when
 * that page is inside it, otherwise opens the dashboard (instead of the login
 * page or the public site the tab happened to visit first).
 */
export function useInAppBack(): () => void {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    if (trail.at(-2) === pathname) trail.pop();
    else if (trail.at(-1) !== pathname) trail.push(pathname);
  }, [pathname]);

  return () => {
    const nav = (window as unknown as { navigation?: NavigationApi }).navigation;
    const prev = nav?.currentEntry ? nav.entries()[nav.currentEntry.index - 1]?.url : trail.at(-2);
    if (prev && IN_APP.test(new URL(prev, window.location.href).pathname)) router.back();
    else router.push("/dashboard");
  };
}
