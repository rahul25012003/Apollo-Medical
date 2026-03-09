import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  output: "standalone",
  poweredByHeader: false,
  // Force-include packages that standalone trace misses
  serverExternalPackages: ["@prisma/adapter-pg"],
  // Image optimization with external images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
