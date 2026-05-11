import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  output: "standalone",
  poweredByHeader: false,
  // Force-include packages that standalone trace misses
  serverExternalPackages: ["@prisma/adapter-pg", "@react-pdf/renderer"],
  // Explicitly copy @react-pdf/* into standalone output — dynamic import not auto-traced
  outputFileTracingIncludes: {
    "/api/events/\\[id\\]/certificates/preview": [
      "./node_modules/@react-pdf/**/*",
      "./node_modules/pdfkit/**/*",
      "./node_modules/fontkit/**/*",
    ],
    "/api/events/\\[id\\]/certificates/send": [
      "./node_modules/@react-pdf/**/*",
      "./node_modules/pdfkit/**/*",
      "./node_modules/fontkit/**/*",
    ],
  },
  // Image optimization with external images
  images: {
    unoptimized: true, // Serve images at full quality (no compression on VPS)
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
