import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SplashScreen } from "@/components/splash-screen";
import { PwaRegister } from "@/components/ifpc/PwaRegister";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://careneuromodulationaiims.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Tenant pages use their own generateMetadata — this is only shown for non-tenant pages
const isCareNS = BASE_URL.includes("careneuromodulation") || BASE_URL.includes("aiims") || BASE_URL.includes("carens");
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: isCareNS ? "CareNeuromodulation AIIMS — Medical Conference & CME Events" : "Medical Conference Portal",
    template: "%s",
  },
  description: isCareNS
    ? "Official portal for CareNeuromodulation AIIMS medical conferences, CME workshops, and seminars."
    : "Medical Conference & CME Events Portal",
  keywords: [
    "AIIMS conference", "neuromodulation", "CME credits", "medical workshop",
    "rTMS", "neurology conference", "medical seminar", "careneuromodulation",
    "AIIMS Delhi", "medical event registration",
  ],
  authors: [{ name: "CareNeuromodulation AIIMS" }],
  creator: "CareNeuromodulation AIIMS",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "CareNeuromodulation AIIMS",
    title: "CareNeuromodulation AIIMS — Medical Conferences & CME Events",
    description:
      "Register for medical conferences, CME workshops, and seminars. Earn CME credits and download certificates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareNeuromodulation AIIMS — Medical Conferences & CME",
    description: "Register for medical conferences, CME workshops, and seminars.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

// IFPC 2026 deployment (apollo-medical served at the site root): every page is
// part of the installable app, so the manifest must be in the initial HTML of
// every page (not just the home page) for browsers to offer "Install app".
// Any other deployment renders exactly as before.
const IFPC_SITE = process.env.DEFAULT_TENANT_SLUG === "apollo-medical";
// Chrome can fire beforeinstallprompt before React hydrates; keep it for the banner.
const CAPTURE_INSTALL_PROMPT =
  'window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__ifpcInstallPrompt=e;window.dispatchEvent(new Event("ifpc-installable"));});';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning {...(IFPC_SITE ? { "data-ifpc-pwa": "global" } : {})}>
      {IFPC_SITE && (
        <head>
          <link rel="manifest" href="/manifest-ifpc-root.json" />
          <meta name="theme-color" content="#1e3a5f" />
          <link rel="apple-touch-icon" sizes="180x180" href="/ifpc/nimhans-icon-180.png" />
          <script dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL_PROMPT }} />
        </head>
      )}
      <body className={`${jakarta.className} ${jakarta.variable}`} suppressHydrationWarning>
        <SplashScreen />
        <Providers>{children}</Providers>
        {IFPC_SITE && <PwaRegister global />}
      </body>
    </html>
  );
}