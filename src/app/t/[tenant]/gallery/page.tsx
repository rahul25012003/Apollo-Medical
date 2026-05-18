"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTenant } from "@/lib/tenant/context";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Play, ZoomIn, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventPhoto {
    id: string;
    src: string;
    alt: string;
    caption?: string;
}

interface EventGallery {
    id: string;
    title: string;
    startDate: string;
    photos: EventPhoto[];
}

export default function TenantGalleryPage() {
    const params = useParams();
    const tenantSlug = params.tenant as string;
    const { tenant, isLoading } = useTenant();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [filter, setFilter] = useState<"all" | "photos" | "videos">("all");
    const [eventGalleries, setEventGalleries] = useState<EventGallery[]>([]);
    const [eventLightbox, setEventLightbox] = useState<{ eventIdx: number; photoIdx: number } | null>(null);

    const branding = tenant?.branding;
    const theme = tenant?.theme;
    const gallery = tenant?.gallery;
    const images = gallery?.images || [];
    const videos = gallery?.videos || [];

    const filteredImages = filter === "videos" ? [] : images;
    const filteredVideos = filter === "photos" ? [] : videos;

    // Fetch event galleries
    useEffect(() => {
        if (!tenantSlug) return;
        fetch(`/api/events/gallery-photos?tenant=${tenantSlug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data)) {
                    setEventGalleries(data.data);
                }
            })
            .catch(() => {});
    }, [tenantSlug]);

    // Keyboard nav for tenant gallery lightbox
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxOpen(false);
            if (e.key === "ArrowLeft") setLightboxIndex((p) => (p - 1 + images.length) % images.length);
            if (e.key === "ArrowRight") setLightboxIndex((p) => (p + 1) % images.length);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [lightboxOpen, images.length]);

    // Keyboard nav for event gallery lightbox
    useEffect(() => {
        if (!eventLightbox) return;
        const photos = eventGalleries[eventLightbox.eventIdx]?.photos || [];
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setEventLightbox(null);
            if (e.key === "ArrowLeft") setEventLightbox((p) => p ? { ...p, photoIdx: Math.max(0, p.photoIdx - 1) } : null);
            if (e.key === "ArrowRight") setEventLightbox((p) => p ? { ...p, photoIdx: Math.min(photos.length - 1, p.photoIdx + 1) } : null);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [eventLightbox, eventGalleries]);

    const totalEventPhotos = eventGalleries.reduce((sum, eg) => sum + eg.photos.length, 0);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const hasContent = images.length > 0 || videos.length > 0 || totalEventPhotos > 0;

    if (!tenant || !hasContent) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
                <h1 className="text-2xl font-bold mb-4">No Gallery Items</h1>
                <p className="text-muted-foreground mb-6">No photos or videos have been uploaded yet.</p>
                <Link href={`/t/${tenantSlug}`}>
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        );
    }

    const primaryColor = theme?.primaryColor || "#0d9488";
    const secondaryColor = theme?.secondaryColor || "#0891b2";

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl shadow-sm border-b border-slate-200/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link
                            href={`/t/${tenantSlug}`}
                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to {branding?.name || "Home"}
                        </Link>
                        <h1 className="text-lg font-bold tracking-tight">{branding?.name || "Gallery"}</h1>
                        <div className="w-24" />
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div
                className="py-12 lg:py-16 text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}06, #f8fafc)` }}
            >
                <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-3">Event Gallery</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto px-4">
                    Highlights and memories from {branding?.name || "our events"}
                </p>
                {(images.length > 0 || videos.length > 0) && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                        {["all", "photos", "videos"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as typeof filter)}
                                className={cn(
                                    "px-5 py-2 rounded-full text-sm font-medium transition-all",
                                    filter === f
                                        ? "text-white shadow-lg"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                                )}
                                style={filter === f ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
                            >
                                {f === "all" ? `All (${images.length + videos.length})` : f === "photos" ? `Photos (${images.length})` : `Videos (${videos.length})`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Gallery Grid */}
            <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                {/* Tenant-level Photos */}
                {filteredImages.length > 0 && (
                    <div className="mb-12">
                        {filter === "all" && videos.length > 0 && (
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ZoomIn className="w-5 h-5" style={{ color: primaryColor }} />
                                Photos
                            </h3>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {filteredImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
                                    onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                                >
                                    <img
                                        src={typeof img === "string" ? img : (img as any).src || (img as any).url || img}
                                        alt={(img as any)?.alt || `Gallery ${idx + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Videos */}
                {filteredVideos.length > 0 && (
                    <div className="mb-12">
                        {filter === "all" && images.length > 0 && (
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Play className="w-5 h-5" style={{ color: primaryColor }} />
                                Videos
                            </h3>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredVideos.map((video, idx) => {
                                const videoUrl = typeof video === "string" ? video : (video as any).src || (video as any).url || video;
                                const isYoutube = String(videoUrl).includes("youtube") || String(videoUrl).includes("youtu.be");
                                const youtubeId = isYoutube ? String(videoUrl).match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1] : null;

                                return (
                                    <div key={idx} className="rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500">
                                        {youtubeId ? (
                                            <div className="aspect-video">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                                    title={`Video ${idx + 1}`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        ) : (
                                            <video controls className="w-full aspect-video bg-black">
                                                <source src={String(videoUrl)} />
                                            </video>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Event-specific photo galleries */}
                {eventGalleries.length > 0 && (
                    <div className="space-y-12">
                        {(images.length > 0 || videos.length > 0) && (
                            <div className="border-t border-slate-100 pt-8">
                                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                    <Camera className="w-6 h-6" style={{ color: primaryColor }} />
                                    Event Galleries
                                </h3>
                                <p className="text-muted-foreground text-sm mb-8">Photos from individual events</p>
                            </div>
                        )}
                        {eventGalleries.map((eg, eventIdx) => (
                            <div key={eg.id}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-xl font-bold">{eg.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {new Date(eg.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                            {" · "}
                                            {eg.photos.length} photo{eg.photos.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <Link href={`/events/${eg.id}`} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                                        View event →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {eg.photos.map((photo, photoIdx) => (
                                        <div
                                            key={photo.id}
                                            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
                                            onClick={() => setEventLightbox({ eventIdx, photoIdx })}
                                        >
                                            <img
                                                src={photo.src}
                                                alt={photo.alt || `${eg.title} - Photo ${photoIdx + 1}`}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>
                                            {photo.caption && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {photo.caption}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 text-center border-t border-slate-200/50">
                <Link
                    href={`/t/${tenantSlug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    &larr; Back to {branding?.name || "Home"}
                </Link>
            </footer>

            {/* Tenant gallery lightbox */}
            {lightboxOpen && images.length > 0 && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p - 1 + images.length) % images.length); }}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p + 1) % images.length); }}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                    <img
                        src={typeof images[lightboxIndex] === "string" ? images[lightboxIndex] : (images[lightboxIndex] as any).src || (images[lightboxIndex] as any).url || images[lightboxIndex]}
                        alt={(images[lightboxIndex] as any)?.alt || `Gallery ${lightboxIndex + 1}`}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}

            {/* Event gallery lightbox */}
            {eventLightbox !== null && (() => {
                const eg = eventGalleries[eventLightbox.eventIdx];
                if (!eg) return null;
                const photo = eg.photos[eventLightbox.photoIdx];
                if (!photo) return null;
                return (
                    <div
                        className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
                        onClick={() => setEventLightbox(null)}
                    >
                        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10" onClick={() => setEventLightbox(null)}>
                            <X className="w-6 h-6" />
                        </button>
                        {eventLightbox.photoIdx > 0 && (
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                                onClick={(e) => { e.stopPropagation(); setEventLightbox((p) => p ? { ...p, photoIdx: p.photoIdx - 1 } : null); }}>
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        {eventLightbox.photoIdx < eg.photos.length - 1 && (
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                                onClick={(e) => { e.stopPropagation(); setEventLightbox((p) => p ? { ...p, photoIdx: p.photoIdx + 1 } : null); }}>
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}
                        <div className="max-w-5xl max-h-[85vh] w-full mx-8 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <p className="text-white/60 text-sm font-medium">{eg.title}</p>
                            <img src={photo.src} alt={photo.alt || ""} className="max-h-[75vh] max-w-full object-contain rounded-lg" />
                            {photo.caption && <p className="text-white/80 text-sm text-center px-4">{photo.caption}</p>}
                            <p className="text-white/50 text-xs">{eventLightbox.photoIdx + 1} / {eg.photos.length}</p>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
