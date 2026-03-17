"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertCircle,
    Camera,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    Eye,
    ArrowLeft,
    GraduationCap,
    Play,
    Video,
    ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryImage, GalleryVideo } from "@/lib/tenant/types";

export default function GalleryPage() {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [galleryVideos, setGalleryVideos] = useState<GalleryVideo[]>([]);
    const [activeTab, setActiveTab] = useState<"photos" | "videos">("photos");
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState("All");
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch gallery data from the tenant API
    const fetchGallery = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/tenants");
            if (!res.ok) {
                throw new Error("Failed to load gallery data");
            }
            const data = await res.json();
            // Handle both single tenant object and array response
            const tenant = Array.isArray(data) ? data[0] : data;
            if (tenant) {
                setGalleryImages(tenant.galleryImages || []);
                setGalleryVideos(tenant.galleryVideos || []);
            }
        } catch {
            setError("Unable to load the gallery. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    // Get unique categories for photos and videos
    const photoCategories = ["All", ...Array.from(new Set(galleryImages.map(img => img.category)))];
    const videoCategories = ["All", ...Array.from(new Set(galleryVideos.map(vid => vid.category)))];

    // Get current categories based on active tab
    const categories = activeTab === "photos" ? photoCategories : videoCategories;

    // Filter images by category
    const filteredImages = activeCategory === "All"
        ? galleryImages
        : galleryImages.filter(img => img.category === activeCategory);

    // Filter videos by category
    const filteredVideos = activeCategory === "All"
        ? galleryVideos
        : galleryVideos.filter(vid => vid.category === activeCategory);

    // Reset category when switching tabs
    const handleTabChange = (tab: "photos" | "videos") => {
        setActiveTab(tab);
        setActiveCategory("All");
    };

    // Lightbox handlers
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
    };

    const prevImage = () => {
        setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    };

    // Video modal handlers
    const openVideoModal = (video: GalleryVideo) => {
        setSelectedVideo(video);
        setVideoModalOpen(true);
    };

    const closeVideoModal = () => {
        setVideoModalOpen(false);
        setSelectedVideo(null);
    };

    const hasNoContent = galleryImages.length === 0 && galleryVideos.length === 0;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 lg:h-20 items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl gradient-medical flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-lg lg:text-xl leading-none tracking-tight">MedConf</h1>
                                <p className="text-xs text-muted-foreground">Medical Conference Portal</p>
                            </div>
                        </Link>

                        <Link href="/dashboard">
                            <Button variant="outline" className="gap-2 rounded-full">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 bg-gradient-to-br from-[#061c2e] via-[#0a3d5c] to-[#0d5c7a] overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-3xl -top-40 -left-40" />
                    <div className="absolute w-[400px] h-[400px] bg-blue-400/15 rounded-full blur-3xl top-1/3 -right-40" />
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
                    <Badge className="mb-4 bg-white/10 backdrop-blur-sm text-white border-white/20 px-5 py-1.5 rounded-full">
                        <Camera className="h-3.5 w-3.5 mr-2" />
                        Event Gallery
                    </Badge>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Moments from Our Events
                    </h1>
                    <p className="text-white/70 max-w-2xl mx-auto text-lg">
                        Explore highlights from our past conferences, workshops, and networking sessions
                    </p>
                </div>

                {/* Wave */}
                <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="#f8fafc" />
                </svg>
            </section>

            {/* Gallery Content */}
            <section className="py-12 lg:py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-muted-foreground">Loading gallery...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                                <AlertCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
                            <p className="text-muted-foreground max-w-md mb-8">
                                {error}
                            </p>
                            <Button onClick={fetchGallery} className="gap-2 rounded-full">
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && hasNoContent && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <Camera className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">No gallery items yet</h2>
                            <p className="text-muted-foreground max-w-md mb-8">
                                Photos and videos from events will appear here once they are uploaded.
                            </p>
                            <Link href="/dashboard">
                                <Button variant="outline" className="gap-2 rounded-full">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Tabs for Photos/Videos */}
                    {!loading && !error && !hasNoContent && (
                    <>
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-white rounded-full p-1.5 shadow-lg border">
                            <button
                                onClick={() => handleTabChange("photos")}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                                    activeTab === "photos"
                                        ? "bg-primary text-white shadow-md"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ImageIcon className="h-4 w-4" />
                                Photos
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                    {galleryImages.length}
                                </span>
                            </button>
                            <button
                                onClick={() => handleTabChange("videos")}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                                    activeTab === "videos"
                                        ? "bg-primary text-white shadow-md"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Video className="h-4 w-4" />
                                Videos
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs",
                                    activeTab === "videos" ? "bg-white/20" : "bg-muted"
                                )}>
                                    {galleryVideos.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={cn(
                                    "px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 border",
                                    activeCategory === category
                                        ? "bg-primary text-white border-primary shadow-lg"
                                        : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Results count */}
                    <p className="text-center text-muted-foreground mb-8">
                        Showing {activeTab === "photos" ? filteredImages.length : filteredVideos.length}{" "}
                        {activeTab === "photos"
                            ? (filteredImages.length === 1 ? 'photo' : 'photos')
                            : (filteredVideos.length === 1 ? 'video' : 'videos')
                        }
                        {activeCategory !== "All" && ` in ${activeCategory}`}
                    </p>

                    {/* Photos Grid */}
                    {activeTab === "photos" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                            {filteredImages.map((image, index) => (
                                <div
                                    key={image.id}
                                    className={cn(
                                        "relative group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300",
                                        (index + 1) % 5 === 0 ? "md:col-span-2" : "",
                                        (index + 1) % 5 === 0 ? "h-[250px] md:h-[300px]" : "h-[200px] md:h-[250px]"
                                    )}
                                    onClick={() => openLightbox(index)}
                                >
                                    <Image
                                        src={image.src}
                                        alt={image.alt}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                                    <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        <Badge className="w-fit mb-2 bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                                            {image.category}
                                        </Badge>
                                        <p className="text-white font-medium text-sm line-clamp-1">
                                            {image.alt}
                                        </p>
                                        <p className="text-white/70 text-xs mt-1">
                                            {image.event}
                                        </p>
                                    </div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                                        <Eye className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Videos Grid */}
                    {activeTab === "videos" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVideos.map((video) => (
                                <div
                                    key={video.id}
                                    className="relative group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300"
                                    onClick={() => openVideoModal(video)}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-[200px] md:h-[220px]">
                                        <Image
                                            src={video.thumbnail}
                                            alt={video.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                                        {/* Play Button */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
                                        </div>

                                        {/* Duration Badge */}
                                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
                                            {video.duration}
                                        </div>

                                        {/* Category Badge */}
                                        <div className="absolute top-3 left-3">
                                            <Badge className="bg-primary/90 text-white border-0 text-xs">
                                                {video.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Video Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                            {video.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {video.event}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </>
                    )}
                </div>
            </section>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        onClick={closeLightbox}
                        aria-label="Close lightbox"
                    >
                        <X className="h-6 w-6 text-white" />
                    </button>

                    {/* Navigation - Previous */}
                    <button
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </button>

                    {/* Navigation - Next */}
                    <button
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6 text-white" />
                    </button>

                    {/* Image Container */}
                    <div className="relative max-w-5xl max-h-[85vh] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={filteredImages[lightboxIndex].src}
                            alt={filteredImages[lightboxIndex].alt}
                            width={1200}
                            height={800}
                            className="object-contain max-h-[85vh] rounded-lg"
                        />

                        {/* Image Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                            <Badge className="mb-2 bg-white/20 backdrop-blur-sm text-white border-0">
                                {filteredImages[lightboxIndex].category}
                            </Badge>
                            <p className="text-white font-medium text-lg">
                                {filteredImages[lightboxIndex].alt}
                            </p>
                            <p className="text-white/60 text-sm mt-1">
                                {filteredImages[lightboxIndex].event} &bull; {lightboxIndex + 1} of {filteredImages.length}
                            </p>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full max-w-[90vw] overflow-x-auto">
                        {filteredImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0",
                                    index === lightboxIndex
                                        ? "w-6 bg-white"
                                        : "bg-white/40 hover:bg-white/60"
                                )}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {videoModalOpen && selectedVideo && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={closeVideoModal}>
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        onClick={closeVideoModal}
                        aria-label="Close video"
                    >
                        <X className="h-6 w-6 text-white" />
                    </button>

                    {/* Video Container */}
                    <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        {/* YouTube Embed */}
                        <div className="relative pt-[56.25%] rounded-xl overflow-hidden bg-black">
                            <iframe
                                className="absolute inset-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                                title={selectedVideo.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Video Info */}
                        <div className="mt-4 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-primary text-white border-0">
                                    {selectedVideo.category}
                                </Badge>
                                <span className="text-white/60 text-sm">{selectedVideo.duration}</span>
                            </div>
                            <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                            <p className="text-white/60 mt-1">{selectedVideo.event}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-8 bg-white border-t">
                <div className="container mx-auto px-4 lg:px-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; 2025 MedConf. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
