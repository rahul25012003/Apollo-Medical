"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Award,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown,
  Eye,
  Ticket,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getEventImage } from "@/lib/event-utils";
import { eventsService, Event, EventFilters } from "@/services/events";
import { EventCard, EventCardData, getRegStatus } from "@/components/events/EventCard";

function pickActiveEvent(events: EventCardData[]): EventCardData | null {
  const now = new Date();
  const visible = events.filter(e => {
    const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
    return new Date(end.getTime() + 86400000) >= now;
  });
  const sorted = [...visible].sort((a, b) => {
    const ak = new Date(a.registrationOpensDate || a.startDate).getTime();
    const bk = new Date(b.registrationOpensDate || b.startDate).getTime();
    if (ak !== bk) return ak - bk;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  const open = sorted.find(e => {
    const dl = e.registrationDeadline ? new Date(e.registrationDeadline) : null;
    const opens = e.registrationOpensDate ? new Date(e.registrationOpensDate) : null;
    if (opens && now < opens) return false;
    return !dl || now <= dl;
  });
  return open || sorted[0] || null;
}

function fmtCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function fmtMoney(amount: number, currency: string) {
  if (!amount || amount <= 0) return "Free";
  const sym = currency === "INR" ? "₹" : currency + " ";
  return `${sym}${Number(amount).toLocaleString()}`;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="flex justify-between pt-3">
          <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function PublicEventsPage() {
  const router = useRouter();

  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantThemeColor, setTenantThemeColor] = useState<string>("#0f766e");
  const [tenantBranding, setTenantBranding] = useState<{ name?: string; logo?: string | null } | null>(null);
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Carousel state
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Tick countdown every minute (second precision not needed on listing page)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Resolve tenant from URL or hostname
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tenant");
    if (t) {
      setTenantSlug(t);
      return;
    }
    const host = window.location.hostname.replace(/^www\./, "");
    if (host !== "localhost" && !host.startsWith("127.") && !host.endsWith(".local")) {
      fetch(`/api/tenants/by-domain?domain=${encodeURIComponent(host)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.slug) setTenantSlug(data.slug);
        })
        .catch(() => { });
    }
  }, []);

  // Load tenant branding (theme color)
  useEffect(() => {
    if (!tenantSlug) return;
    fetch(`/api/tenants/${tenantSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const t = data?.tenant || data?.data || data;
        if (t?.theme?.primaryColor) setTenantThemeColor(t.theme.primaryColor);
        if (t?.branding) setTenantBranding({ name: t.branding.name || t.name, logo: t.branding.logo });
      })
      .catch(() => { });
  }, [tenantSlug]);

  // Fetch events
  useEffect(() => {
    let cancelled = false;
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, string | number | boolean> = { limit: 100 };
        if (tenantSlug) filters.tenantSlug = tenantSlug;
        const response = await eventsService.getPublic(filters as EventFilters);
        if (cancelled) return;
        if (response.success && response.data) {
          const list = Array.isArray(response.data) ? response.data : [];
          const mapped: EventCardData[] = list.map((event: Event) => ({
            id: event.id,
            title: event.title,
            shortDescription: event.shortDescription,
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            location: [event.location, event.city].filter(Boolean).join(", ") || (event.isVirtual ? "Virtual Event" : "TBA"),
            type: event.type,
            typeTags: event.typeTags || [],
            registrations: event._count?.registrations || 0,
            capacity: event.capacity,
            status: event.status,
            price: event.price,
            currency: event.currency || "INR",
            earlyBirdPrice: event.earlyBirdPrice,
            cmeCredits: event.cmeCredits,
            image: getEventImage(event.bannerImage, event.thumbnailImage, event.type),
            tenantSlug: event.tenant?.slug || null,
            tenantName: event.tenant?.name || null,
            registrationOpensDate: event.registrationOpensDate,
            registrationDeadline: event.registrationDeadline,
            isVirtual: event.isVirtual,
          }));
          setEvents(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch events:", err);
          setError("Failed to load events. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEvents();
    return () => { cancelled = true; };
  }, [tenantSlug]);

  // Carousel: responsive items per view
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setItemsPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Carousel: measure container width
  useEffect(() => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Split past vs visible
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming: EventCardData[] = [];
    const past: EventCardData[] = [];
    const today = new Date();
    for (const e of events) {
      if (!e.startDate) continue;
      const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      const endOfDay = new Date(end.getTime() + 86400000);
      if (today > endOfDay) past.push(e);
      else upcoming.push(e);
    }
    upcoming.sort((a, b) => {
      const ak = new Date(a.registrationOpensDate || a.startDate).getTime();
      const bk = new Date(b.registrationOpensDate || b.startDate).getTime();
      if (ak !== bk) return ak - bk;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    past.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  // Featured event (computed before grid so we can exclude it from the grid)
  const featuredEvent = useMemo(() => pickActiveEvent(upcomingEvents), [upcomingEvents]);

  // Grid source = all upcoming events EXCEPT the featured one (no duplication)
  const gridSource = useMemo(
    () => upcomingEvents.filter(e => e.id !== featuredEvent?.id),
    [upcomingEvents, featuredEvent]
  );

  // Carousel: computed values
  const gap = 24;
  const cardWidth = containerWidth > 0
    ? (containerWidth - (itemsPerView - 1) * gap) / itemsPerView
    : 0;
  const maxIdx = Math.max(0, gridSource.length - itemsPerView);
  const totalDots = maxIdx + 1;

  // Carousel: auto-advance every 5 seconds
  useEffect(() => {
    if (paused || gridSource.length <= itemsPerView) return;
    const id = setInterval(() => {
      setCarouselIdx(prev => (prev >= maxIdx ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(id);
  }, [paused, gridSource.length, itemsPerView, maxIdx]);

  // Reset carousel index when gridSource changes
  useEffect(() => {
    setCarouselIdx(0);
  }, [gridSource.length]);

  const carouselPrev = useCallback(() => {
    setCarouselIdx(prev => (prev <= 0 ? maxIdx : prev - 1));
  }, [maxIdx]);

  const carouselNext = useCallback(() => {
    setCarouselIdx(prev => (prev >= maxIdx ? 0 : prev + 1));
  }, [maxIdx]);

  // Countdown for hero (uses featuredEvent computed above)
  const heroCountdown = useMemo(() => {
    if (!featuredEvent) return null;
    const reg = getRegStatus(featuredEvent);
    if (reg.kind === "open" || reg.kind === "closing") {
      return featuredEvent.registrationDeadline ? { type: "closes" as const, target: new Date(featuredEvent.registrationDeadline) } : null;
    }
    if (reg.kind === "upcoming") {
      return featuredEvent.registrationOpensDate ? { type: "opens" as const, target: new Date(featuredEvent.registrationOpensDate) } : null;
    }
    return null;
  }, [featuredEvent, now]);

  const cd = heroCountdown ? fmtCountdown(heroCountdown.target) : null;
  const isUrgent = cd && cd.d === 0 && cd.h < 24;

  const tUrl = useCallback((path: string) => tenantSlug ? `${path}${path.includes("?") ? "&" : "?"}tenant=${tenantSlug}` : path, [tenantSlug]);

  const brandName = tenantBranding?.name || "Conference";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href={tUrl("/")} className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: `linear-gradient(135deg, ${tenantThemeColor}, ${tenantThemeColor}dd)` }}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">{brandName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href={tUrl("/")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href={tUrl("/events")} className="text-sm font-semibold" style={{ color: tenantThemeColor }}>Events</Link>
              <Link href={tUrl("/#about")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href={tUrl("/#contact")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </nav>
            <Link href={tenantSlug ? `/auth/login?tenant=${tenantSlug}` : "/auth/login"}>
              <Button variant="outline" size="sm" className="rounded-full">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SPOTLIGHT */}
      {!loading && featuredEvent && (() => {
        const reg = getRegStatus(featuredEvent);
        const slotsLeft = Math.max(0, featuredEvent.capacity - featuredEvent.registrations);
        const fillPct = featuredEvent.capacity > 0 ? Math.min(100, (featuredEvent.registrations / featuredEvent.capacity) * 100) : 0;
        return (
          <section className="relative overflow-hidden">
            <div className="absolute inset-0">
              {featuredEvent.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredEvent.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${tenantThemeColor}, ${tenantThemeColor}88)` }} />
              )}
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 60%, ${tenantThemeColor}ee 100%)` }} />
            </div>

            <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-32">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="text-sm font-semibold text-white tracking-wide">Featured Event</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge className="rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 hover:bg-white/20">{featuredEvent.type}</Badge>
                  {(featuredEvent.cmeCredits ?? 0) > 0 && (
                    <Badge className="rounded-full bg-amber-500/90 text-white border-0 gap-1">
                      <Award className="h-3 w-3" />{featuredEvent.cmeCredits} CME Credits
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                  {featuredEvent.title}
                </h1>
                {featuredEvent.shortDescription && (
                  <p className="text-lg md:text-xl text-white/85 mb-6 max-w-2xl leading-relaxed">{featuredEvent.shortDescription}</p>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/90 mb-8">
                  <span className="flex items-center gap-2"><Calendar className="h-5 w-5" />{new Date(featuredEvent.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {featuredEvent.startTime && <span className="flex items-center gap-2"><Clock className="h-5 w-5" />{featuredEvent.startTime} IST</span>}
                  <span className="flex items-center gap-2"><MapPin className="h-5 w-5" />{featuredEvent.location}</span>
                </div>

                {/* Countdown */}
                {cd && (
                  <div className="mb-8">
                    <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-2">
                      {heroCountdown?.type === "closes" ? "Registration Closes In" : "Registration Opens In"}
                    </p>
                    <div className="flex gap-3">
                      {[
                        { v: cd.d, l: "Days" },
                        { v: cd.h, l: "Hours" },
                        { v: cd.m, l: "Minutes" },
                        { v: cd.s, l: "Seconds" },
                      ].map(({ v, l }) => (
                        <div key={l} className={cn("flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-2xl backdrop-blur-md border", isUrgent ? "bg-red-500/30 border-red-300/50" : "bg-white/15 border-white/20")}>
                          <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{String(v).padStart(2, "0")}</span>
                          <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacity bar */}
                {featuredEvent.capacity > 0 && (
                  <div className="mb-8 max-w-md">
                    <div className="flex items-center justify-between text-white/80 text-sm mb-2">
                      <span>{featuredEvent.registrations} / {featuredEvent.capacity} registered</span>
                      <span className="font-semibold">{slotsLeft <= 0 ? "Registration Closed" : `${slotsLeft} spots left`}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/20 overflow-hidden backdrop-blur">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? "linear-gradient(90deg, #fca5a5, #dc2626)" : "linear-gradient(90deg, #ffffff, #ffffff99)" }} />
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {(reg.kind === "open" || reg.kind === "closing") && (
                    <Link href={tUrl(`/events/${featuredEvent.id}/register`)}>
                      <Button size="lg" className="rounded-2xl text-base font-bold gap-2 h-14 px-8 bg-white text-slate-900 hover:bg-white/90 shadow-2xl">
                        <Ticket className="h-5 w-5" />
                        Register Now
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  <Link href={tUrl(`/events/${featuredEvent.id}`)}>
                    <Button size="lg" variant="outline" className="rounded-2xl text-base font-bold gap-2 h-14 px-8 bg-white/10 text-white border-white/40 hover:bg-white/20 backdrop-blur-md">
                      <Eye className="h-5 w-5" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* UPCOMING EVENTS CAROUSEL */}
      {(loading || error || gridSource.length > 0 || upcomingEvents.length === 0 || pastEvents.length > 0) && (
      <section className="py-16">
        <div className="container mx-auto px-4">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => location.reload()} className="rounded-xl text-white" style={{ background: tenantThemeColor }}>
                Retry
              </Button>
            </div>
          )}

          {/* No events at all */}
          {!loading && !error && upcomingEvents.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: `${tenantThemeColor}15` }}>
                <Calendar className="h-12 w-12" style={{ color: tenantThemeColor }} />
              </div>
              <h3 className="text-2xl font-bold mb-3">No upcoming events yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Stay tuned — new events are coming soon.</p>
            </div>
          )}

          {/* Carousel: only when 1+ other events exist */}
          {!loading && !error && gridSource.length > 0 && (
            <>
              {/* Section header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="h-8 w-1.5 rounded-full" style={{ background: tenantThemeColor }} />
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">More Upcoming Events</h2>
                    <span className="inline-flex items-center justify-center h-7 min-w-[1.75rem] px-2 rounded-full text-xs font-bold text-white" style={{ background: tenantThemeColor }}>
                      {gridSource.length}
                    </span>
                  </div>
                  <p className="text-muted-foreground ml-[1.375rem] text-sm">Swipe or use arrows to browse</p>
                </div>
                {/* Desktop arrows in header */}
                {gridSource.length > itemsPerView && (
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={carouselPrev}
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={carouselNext}
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Next"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Carousel viewport */}
              <div
                ref={carouselRef}
                className="relative"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
              >
                {/* Gradient fade edges */}
                {gridSource.length > itemsPerView && carouselIdx > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, var(--background, #fff), transparent)" }} />
                )}
                {gridSource.length > itemsPerView && carouselIdx < maxIdx && (
                  <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, var(--background, #fff), transparent)" }} />
                )}

                {/* Track */}
                <div className="overflow-hidden">
                  <div
                    className="flex"
                    style={{
                      gap: `${gap}px`,
                      transform: `translateX(-${carouselIdx * (cardWidth + gap)}px)`,
                      transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}
                  >
                    {gridSource.map((event) => (
                      <div
                        key={event.id}
                        style={cardWidth > 0 ? { minWidth: `${cardWidth}px`, maxWidth: `${cardWidth}px` } : { flex: `0 0 calc(${100 / itemsPerView}% - ${gap * (itemsPerView - 1) / itemsPerView}px)` }}
                      >
                        <EventCard event={event} variant="grid" themeColor={tenantThemeColor} hrefPrefix="" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile prev/next overlay arrows */}
                {gridSource.length > itemsPerView && (
                  <>
                    <button
                      onClick={carouselPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/90 backdrop-blur shadow-xl border flex items-center justify-center sm:hidden"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={carouselNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/90 backdrop-blur shadow-xl border flex items-center justify-center sm:hidden"
                      aria-label="Next"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Dot indicators */}
              {totalDots > 1 && totalDots <= 10 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalDots }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIdx(i)}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        i === carouselIdx ? "w-8 h-2.5" : "w-2.5 h-2.5 opacity-40 hover:opacity-70"
                      )}
                      style={{ background: tenantThemeColor }}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Progress bar for many events */}
              {totalDots > 10 && (
                <div className="flex justify-center mt-8">
                  <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${((carouselIdx + 1) / totalDots) * 100}%`, background: tenantThemeColor }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Single event — no carousel, just center it */}
          {!loading && !error && gridSource.length === 1 && itemsPerView >= gridSource.length && (
            <div className="hidden" /> // Already rendered in carousel with 1 card — will show fine without animation
          )}

          {/* Past events toggle */}
          {!loading && pastEvents.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <button
                onClick={() => setShowPast(v => !v)}
                className="mx-auto flex items-center gap-2 px-6 py-3 rounded-full border-2 hover:bg-muted transition-colors font-semibold"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showPast && "rotate-180")} />
                {showPast ? "Hide" : "Show"} {pastEvents.length} past event{pastEvents.length === 1 ? "" : "s"}
              </button>
              {showPast && (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} variant="grid" themeColor="#94a3b8" hrefPrefix="" />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>
      )}

      {/* Mobile sticky CTA */}
      {!loading && featuredEvent && (() => {
        const reg = getRegStatus(featuredEvent);
        if (reg.kind !== "open" && reg.kind !== "closing") return null;
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 bg-background/95 backdrop-blur-xl border-t shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Featured Event</p>
                <p className="font-bold truncate text-sm">{featuredEvent.title}</p>
              </div>
              <Link href={tUrl(`/events/${featuredEvent.id}/register`)} className="shrink-0">
                <Button className="rounded-full text-white shadow-lg" style={{ background: tenantThemeColor }}>
                  Register <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <footer className="border-t py-10 bg-muted/30 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tenantThemeColor}, ${tenantThemeColor}cc)` }}>
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg">{brandName}</span>
                <p className="text-sm text-muted-foreground">Conference Management System</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
