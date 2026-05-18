import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://careneuromodulationaiims.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event
    .findFirst({
      where: { id, isPublished: true },
      select: {
        title: true,
        description: true,
        bannerImage: true,
        thumbnailImage: true,
        city: true,
        startDate: true,
        type: true,
      },
    })
    .catch(() => null);

  if (!event) {
    return { title: "Event | CareNeuromodulation AIIMS" };
  }

  const image = event.bannerImage || event.thumbnailImage || null;
  const desc = event.description
    ? event.description.slice(0, 160)
    : `Join ${event.title} — a ${event.type.toLowerCase()} organised by CareNeuromodulation AIIMS.`;

  return {
    title: event.title,
    description: desc,
    openGraph: {
      title: event.title,
      description: desc,
      url: `${BASE_URL}/events/${id}`,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: event.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: event.title,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function EventDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
