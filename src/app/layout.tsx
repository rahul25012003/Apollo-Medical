import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SplashScreen } from "@/components/splash-screen";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.className} ${jakarta.variable}`} suppressHydrationWarning>
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}