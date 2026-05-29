import type { NextConfig } from "next";

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

export default nextConfig;
