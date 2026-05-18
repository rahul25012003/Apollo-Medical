import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://careneuromodulationaiims.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/events", "/t/"],
        disallow: ["/dashboard/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
