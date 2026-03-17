"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTenant } from "@/lib/tenant/context";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Play, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TenantGalleryPage() {
    const params = useParams();
    const tenantSlug = params.tenant as string;
    const { tenant, isLoading } = useTenant();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [filter, setFilter] = useState<"all" | "photos" | "videos">("all");

    const branding = tenant?.branding;
    const theme = tenant?.theme;
    const gallery = tenant?.gallery;
    const images = gallery?.images || [];
    const videos = gallery?.videos || [];

    const filteredImages = filter === "videos" ? [] : images;
    const filteredVideos = filter === "photos" ? [] : videos;

    // Keyboard nav for lightbox
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!tenant || (images.length === 0 && videos.length === 0)) {
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
            </div>

            {/* Gallery Grid */}
            <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                {/* Photos */}
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
                                        src={typeof img === "string" ? img : (img as any).url || img}
                                        alt={`Gallery ${idx + 1}`}
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
                    <div>
                        {filter === "all" && images.length > 0 && (
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Play className="w-5 h-5" style={{ color: primaryColor }} />
                                Videos
                            </h3>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredVideos.map((video, idx) => {
                                const videoUrl = typeof video === "string" ? video : (video as any).url || video;
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

            {/* Lightbox */}
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
                        src={typeof images[lightboxIndex] === "string" ? images[lightboxIndex] : (images[lightboxIndex] as any).url || images[lightboxIndex]}
                        alt={`Gallery ${lightboxIndex + 1}`}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
