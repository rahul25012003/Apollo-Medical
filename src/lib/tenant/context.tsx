"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { TenantConfig, TenantTheme } from "./types";

function normalizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return "/" + url;
}
import { defaultTenantConfig, mergeTenantConfig } from "./defaults";

// ---------------------------------------------------------------------------
// Theme helpers (shared by both cache-restore and live application)
// ---------------------------------------------------------------------------
const THEME_CACHE_KEY = "icms_tenant_theme";

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hsl = (c: { h: number; s: number; l: number }) => `hsl(${c.h} ${c.s}% ${c.l}%)`;

/** Apply a TenantTheme's colors to the document root as CSS custom properties. */
function applyThemeToDOM(theme: TenantTheme) {
  const root = document.documentElement;
  const primary = hexToHSL(theme.primaryColor);
  const secondary = hexToHSL(theme.secondaryColor);
  const accent = hexToHSL(theme.accentColor);

  root.style.setProperty("--primary", theme.primaryColor);
  root.style.setProperty("--primary-foreground", primary.l > 55 ? "#0a0a0a" : "#fafafa");
  root.style.setProperty("--secondary", hsl({ h: secondary.h, s: Math.round(secondary.s * 0.3), l: 94 }));
  root.style.setProperty("--secondary-foreground", hsl({ h: secondary.h, s: Math.round(secondary.s * 0.6), l: 25 }));
  root.style.setProperty("--accent", hsl({ h: accent.h, s: Math.round(accent.s * 0.25), l: 93 }));
  root.style.setProperty("--accent-foreground", hsl({ h: accent.h, s: Math.round(accent.s * 0.5), l: 22 }));
  root.style.setProperty("--muted", hsl({ h: primary.h, s: Math.round(primary.s * 0.08), l: 95 }));
  root.style.setProperty("--muted-foreground", hsl({ h: primary.h, s: Math.round(primary.s * 0.15), l: 45 }));
  root.style.setProperty("--border", hsl({ h: primary.h, s: Math.round(primary.s * 0.1), l: 90 }));
  root.style.setProperty("--input", hsl({ h: primary.h, s: Math.round(primary.s * 0.08), l: 92 }));
  root.style.setProperty("--ring", theme.primaryColor);
  root.style.setProperty("--sidebar-bg", hsl({ h: primary.h, s: Math.min(primary.s, 60), l: Math.min(primary.l, 22) }));
  root.style.setProperty("--chart-1", theme.primaryColor);
  root.style.setProperty("--chart-2", theme.secondaryColor);
  root.style.setProperty("--chart-3", theme.accentColor);
  root.style.setProperty("--chart-4", hsl({ h: primary.h, s: Math.round(primary.s * 0.7), l: 60 }));
  root.style.setProperty("--chart-5", hsl({ h: secondary.h, s: Math.round(secondary.s * 0.7), l: 55 }));
  root.style.setProperty("--primary-hex", theme.primaryColor);
  root.style.setProperty("--secondary-hex", theme.secondaryColor);
  root.style.setProperty("--accent-hex", theme.accentColor);
}

function cacheTheme(theme: TenantTheme) {
  try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch { /* noop */ }
}

function getCachedTheme(): TenantTheme | null {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.primaryColor && parsed?.secondaryColor && parsed?.accentColor) return parsed;
  } catch { /* noop */ }
  return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface TenantContextType {
  tenant: TenantConfig;
  isLoading: boolean;
  error: string | null;
  tenantSlug: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: defaultTenantConfig,
  isLoading: false,
  error: null,
  tenantSlug: null,
});

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

interface TenantProviderProps {
  children: React.ReactNode;
  tenantSlug?: string | null;
  tenantId?: string | null;
  initialConfig?: TenantConfig | null;
}

export function TenantProvider({
  children,
  tenantSlug,
  tenantId,
  initialConfig,
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig>(
    initialConfig || defaultTenantConfig
  );
  const [isLoading, setIsLoading] = useState(!initialConfig && !!(tenantSlug || tenantId));
  const [error, setError] = useState<string | null>(null);
  const themeApplied = useRef(false);

  // Restore cached theme IMMEDIATELY on first mount (before any paint)
  // This eliminates the flash between default CSS and tenant colors.
  if (!themeApplied.current && typeof window !== "undefined") {
    const cached = initialConfig?.theme || getCachedTheme();
    if (cached) {
      applyThemeToDOM(cached);
      themeApplied.current = true;
    }
  }

  // Fetch tenant config if slug or id is provided and no initial config
  // On dashboard without tenant context, try to load first available tenant for branding
  useEffect(() => {
    if (initialConfig) return;

    if (!tenantSlug && !tenantId) {
      // No tenant context — try loading default tenant for favicon/title on dashboard
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
        fetch("/api/tenants?limit=1").then(r => r.json()).then(data => {
          if (data.success && data.data?.length > 0) {
            const t = data.data[0];
            const config = {
              ...defaultTenantConfig,
              id: t.id,
              slug: t.slug,
              branding: {
                ...defaultTenantConfig.branding,
                name: t.branding?.name || t.name || defaultTenantConfig.branding.name,
                favicon: t.branding?.favicon || t.favicon || defaultTenantConfig.branding.favicon,
                logo: t.branding?.logo || t.logo || defaultTenantConfig.branding.logo,
              },
            };
            setTenant(config as TenantConfig);
          }
        }).catch(() => {});
      }
      return;
    }

    async function fetchTenantConfig() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch by slug (public, returns TenantConfig) or by ID (auth, returns raw DB model)
        const url = tenantSlug
          ? `/api/tenants/${tenantSlug}`
          : `/api/tenants/by-id/${tenantId}`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            setTenant(defaultTenantConfig);
          } else {
            throw new Error("Failed to fetch tenant configuration");
          }
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          if (tenantSlug) {
            // /api/tenants/[slug] already returns TenantConfig format
            setTenant(mergeTenantConfig(data.data));
          } else {
            // /api/tenants/by-id/[id] returns raw DB model — convert client-side
            const raw = data.data;
            setTenant(mergeTenantConfig({
              id: raw.id,
              slug: raw.slug,
              isActive: raw.isActive,
              branding: {
                name: raw.name,
                logo: normalizeUrl(raw.logo),
                favicon: normalizeUrl(raw.favicon),
                secondaryLogo: normalizeUrl(raw.secondaryLogo),
                tagline: raw.tagline || undefined,
              },
              theme: {
                primaryColor: raw.primaryColor,
                secondaryColor: raw.secondaryColor,
                accentColor: raw.accentColor,
              },
              contact: {
                email: raw.email || undefined,
                phone: raw.phone || undefined,
                address: raw.address || undefined,
                city: raw.city || undefined,
                state: raw.state || undefined,
                country: raw.country || undefined,
                website: raw.website || undefined,
              },
              social: {
                facebook: raw.facebook || undefined,
                twitter: raw.twitter || undefined,
                linkedin: raw.linkedin || undefined,
                instagram: raw.instagram || undefined,
                youtube: raw.youtube || undefined,
              },
              sections: raw.sections || undefined,
              hero: {
                title: raw.heroTitle || undefined,
                subtitle: raw.heroSubtitle || undefined,
                bgImage: normalizeUrl(raw.heroBgImage),
              },
              about: {
                title: raw.aboutTitle || undefined,
                description: raw.aboutDescription || undefined,
                features: raw.aboutFeatures || undefined,
              },
              gallery: {
                images: raw.galleryImages || undefined,
                videos: raw.galleryVideos || undefined,
              },
              testimonials: raw.testimonials || undefined,
              footer: {
                text: raw.footerText || undefined,
                copyrightText: raw.copyrightText || undefined,
              },
              settings: {
                defaultCurrency: raw.defaultCurrency,
                defaultTimezone: raw.defaultTimezone,
              },
            }));
          }
        } else {
          setTenant(defaultTenantConfig);
        }
      } catch (err) {
        console.error("Error fetching tenant config:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setTenant(defaultTenantConfig);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantConfig();
  }, [tenantSlug, tenantId, initialConfig]);

  // Apply theme CSS variables whenever tenant changes & persist to cache
  useEffect(() => {
    if (tenant?.theme) {
      applyThemeToDOM(tenant.theme);
      cacheTheme(tenant.theme);
    }
  }, [tenant?.theme]);

  // Update favicon and title from tenant branding — works on ALL pages
  useEffect(() => {
    if (!tenant?.branding) return;

    // Update ALL favicon links — Next.js may generate multiple
    if (tenant.branding.favicon) {
      const faviconUrl = tenant.branding.favicon;
      // Update all existing icon links
      const existingIcons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
      if (existingIcons.length > 0) {
        existingIcons.forEach(icon => { icon.href = faviconUrl; });
      } else {
        // Create new link if none exists
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
      // Also update apple-touch-icon if it exists
      const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (appleIcon) appleIcon.href = faviconUrl;
    }

    // Update title on ALL pages when tenant is loaded
    if (tenant.branding.name) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath.startsWith('/dashboard')) {
        document.title = `${tenant.branding.name} — Dashboard`;
      } else if (currentPath.startsWith('/auth')) {
        document.title = `${tenant.branding.name} — Login`;
      } else {
        document.title = tenant.branding.name;
      }
    }
  }, [tenant?.branding, tenantSlug]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        error,
        tenantSlug: tenantSlug || null,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

// HOC to wrap components with tenant context
export function withTenant<P extends object>(
  Component: React.ComponentType<P & { tenant: TenantConfig }>
) {
  return function WithTenantComponent(props: P) {
    const { tenant } = useTenant();
    return <Component {...props} tenant={tenant} />;
  };
}
