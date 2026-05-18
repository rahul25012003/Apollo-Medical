"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ImagePlus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventPhoto {
    id: string;
    src: string;
    alt: string;
    caption?: string;
    uploadedAt: string;
}

interface PhotosTabProps {
    eventId: string;
    eventTitle?: string;
}

export function PhotosTab({ eventId, eventTitle }: PhotosTabProps) {
    const [photos, setPhotos] = useState<EventPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPhotos();
    }, [eventId]);

    useEffect(() => {
        if (!lightboxIdx === null) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxIdx(null);
            if (e.key === "ArrowLeft") setLightboxIdx((p) => p !== null ? Math.max(0, p - 1) : null);
            if (e.key === "ArrowRight") setLightboxIdx((p) => p !== null ? Math.min(photos.length - 1, p + 1) : null);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [photos.length]);

    async function fetchPhotos() {
        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/photos`);
            const data = await res.json();
            if (data.success) setPhotos(data.data || []);
        } catch {
            setError("Failed to load photos");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(files: FileList | null) {
        if (!files || files.length === 0) return;
        setUploading(true);
        setError(null);
        setSuccess(null);

        let successCount = 0;
        let failCount = 0;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) {
                failCount++;
                continue;
            }
            try {
                // Upload file
                const fd = new FormData();
                fd.append("file", file);
                fd.append("folder", "events/photos");
                const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
                const uploadData = await uploadRes.json();
                if (!uploadData.success || !uploadData.data?.url) {
                    failCount++;
                    continue;
                }

                // Add to event photos
                const addRes = await fetch(`/api/events/${eventId}/photos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        src: uploadData.data.url,
                        alt: file.name.replace(/\.[^.]+$/, ""),
                        caption: "",
                    }),
                });
                const addData = await addRes.json();
                if (addData.success) {
                    setPhotos((prev) => [...prev, addData.data]);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (successCount > 0) setSuccess(`${successCount} photo${successCount > 1 ? "s" : ""} uploaded successfully`);
        if (failCount > 0) setError(`${failCount} photo${failCount > 1 ? "s" : ""} failed to upload`);
    }

    async function handleDelete(photoId: string) {
        setDeletingId(photoId);
        try {
            const res = await fetch(`/api/events/${eventId}/photos?photoId=${photoId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setPhotos((prev) => prev.filter((p) => p.id !== photoId));
                if (lightboxIdx !== null && lightboxIdx >= photos.length - 1) {
                    setLightboxIdx(Math.max(0, photos.length - 2) || null);
                }
            } else {
                setError("Failed to delete photo");
            }
        } catch {
            setError("Failed to delete photo");
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Event Photos
                    </CardTitle>
                    <CardDescription>
                        Upload photos from {eventTitle || "this event"} — they will appear in the public gallery
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {success}
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                            uploading ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
                        )}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (!uploading) handleUpload(e.dataTransfer.files);
                        }}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium text-primary">Uploading photos...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <ImagePlus className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Click to upload or drag & drop</p>
                                    <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP — multiple files allowed</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" className="gap-2 mt-1">
                                    <Upload className="h-4 w-4" />
                                    Choose Photos
                                </Button>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                </CardContent>
            </Card>

            {/* Photos Grid */}
            {photos.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Camera className="h-14 w-14 text-muted-foreground/25 mb-4" />
                        <p className="font-medium text-muted-foreground">No photos yet</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Upload photos above to create the event gallery</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">{photos.length} Photo{photos.length !== 1 ? "s" : ""}</CardTitle>
                            <CardDescription>Click a photo to preview. Hover to delete.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {photos.map((photo, idx) => (
                                <div
                                    key={photo.id}
                                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all"
                                >
                                    <img
                                        src={photo.src}
                                        alt={photo.alt || `Photo ${idx + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onClick={() => setLightboxIdx(idx)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center gap-2">
                                        <button
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-white/90 hover:bg-white text-slate-700"
                                            onClick={(e) => { e.stopPropagation(); setLightboxIdx(idx); }}
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                                            disabled={deletingId === photo.id}
                                        >
                                            {deletingId === photo.id
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Trash2 className="h-4 w-4" />
                                            }
                                        </button>
                                    </div>
                                    {photo.caption && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 line-clamp-1">
                                            {photo.caption}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lightbox */}
            {lightboxIdx !== null && photos.length > 0 && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
                    onClick={() => setLightboxIdx(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                        onClick={() => setLightboxIdx(null)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    {lightboxIdx > 0 && (
                        <button
                            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                            onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p as number) - 1); }}
                        >
                            <ChevronLeft className="h-7 w-7" />
                        </button>
                    )}
                    {lightboxIdx < photos.length - 1 && (
                        <button
                            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                            onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p as number) + 1); }}
                        >
                            <ChevronRight className="h-7 w-7" />
                        </button>
                    )}
                    <div
                        className="max-w-5xl max-h-[85vh] w-full mx-8 flex flex-col items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={photos[lightboxIdx].src}
                            alt={photos[lightboxIdx].alt || ""}
                            className="max-h-[75vh] max-w-full object-contain rounded-lg"
                        />
                        {photos[lightboxIdx].caption && (
                            <p className="text-white/80 text-sm text-center px-4">{photos[lightboxIdx].caption}</p>
                        )}
                        <p className="text-white/50 text-xs">{lightboxIdx + 1} / {photos.length}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
