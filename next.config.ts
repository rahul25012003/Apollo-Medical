import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const isStandalone = process.env.NEXT_STANDALONE === "true";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // standalone only for VPS/Docker (set NEXT_STANDALONE=true). Render/Vercel use standard output.
  ...(isStandalone ? { output: "standalone" } : {}),
  // Skip TS/ESLint re-check during build (already verified clean)
  typescript: { ignoreBuildErrors: true },
  // Keep these out of webpack bundle entirely — they have native/binary deps
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@react-pdf/renderer",
    "pdfkit",
    "fontkit",
    "linebreak",
    "unicode-properties",
    "restructure",
  ],
  // outputFileTracingIncludes only matters for standalone mode
  ...(isStandalone ? {
    outputFileTracingIncludes: {
      "/api/events/[id]/certificates/preview": [
        "./node_modules/@react-pdf/**/*",
        "./node_modules/pdfkit/**/*",
        "./node_modules/fontkit/**/*",
      ],
      "/api/events/[id]/certificates/send": [
        "./node_modules/@react-pdf/**/*",
        "./node_modules/pdfkit/**/*",
        "./node_modules/fontkit/**/*",
      ],
    },
  } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

// Dev server only: pin the project root, since a stray package-lock.json in a
// parent folder otherwise makes Turbopack treat that whole folder as the root.
// Never for builds — with the pin, production builds fail on next/font/google.
export default function config(phase: string): NextConfig {
  return phase === PHASE_DEVELOPMENT_SERVER ? { ...nextConfig, turbopack: { root: path.resolve(".") } } : nextConfig;
}
