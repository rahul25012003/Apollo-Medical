import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://careneuromodulationaiims.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await prisma.event.findMany({
    where: { isPublished: true, status: { notIn: ["DRAFT", "CANCELLED"] } },
    select: { id: true, updatedAt: true },
    orderBy: { startDate: "desc" },
  }).catch(() => []);

  const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE_URL}/events/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...eventUrls,
  ];
}
