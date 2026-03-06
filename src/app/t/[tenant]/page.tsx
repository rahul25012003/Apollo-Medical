"use client";

import { useTenant } from "@/lib/tenant";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Calendar,
  MapPin,
  Users,
  Award,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Camera,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Play,
  Sparkles,
  Heart,
  Clock,
  Ticket,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { eventsService, Event } from "@/services/events";
import { sponsorsService, Sponsor } from "@/services/sponsors";
import { defaultTestimonials } from "@/lib/tenant/defaults";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Users,
  Globe,
  Award,
  Calendar,
  Star,
  Heart,
  Sparkles,
  BrainCircuit,
};

// Decorative background component
function DecorativeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -top-40 -right-40 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-3xl bottom-20 -left-40 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute w-[300px] h-[300px] bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl top-1/2 left-1/2 animate-pulse" style={{ animationDelay: "2s" }} />
    </div>
  );
}

// Wave SVG component
function WaveDivider({ fill = "white", flip = false }: { fill?: string; flip?: boolean }) {
  return (
    <svg
      className={cn("absolute left-0 right-0 w-full h-16 md:h-24", flip ? "top-0 rotate-180" : "bottom-0")}
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
        fill={fill}
      />
    </svg>
  );
}


export default function TenantHomePage() {
  const { tenant, isLoading, tenantSlug } = useTenant();
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [heroStats, setHeroStats] = useState({ events: 0, registrations: 0, speakers: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [testimonialSlide, setTestimonialSlide] = useState(0);

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch events, sponsors, and stats
  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, sponsorsRes] = await Promise.all([
          eventsService.getPublic({ limit: 6 }),
          sponsorsService.getAll({ isActive: true }),
        ]);

        if (eventsRes.success && eventsRes.data) {
          const eventsData = Array.isArray(eventsRes.data)
            ? eventsRes.data
            : (eventsRes.data as any).events || [];
          setEvents(eventsData);
        }
        if (sponsorsRes.success && sponsorsRes.data) {
          setSponsors(sponsorsRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    async function fetchStats() {
      if (!tenantSlug) return;
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}/stats`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setHeroStats(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchData();
    fetchStats();
  }, [tenantSlug]);

  // Auto-rotate carousel
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(events.length, 3));
    }, 5000);
    return () => clearInterval(timer);
  }, [events.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const { branding, theme, sections, hero, about, gallery, contact, social, footer, testimonials: tenantTestimonials } = tenant;
  const galleryImages = gallery.images || [];
  const galleryVideos = gallery.videos || [];
  const testimonials = tenantTestimonials && tenantTestimonials.length > 0 ? tenantTestimonials : defaultTestimonials;
  const featuredEvents = events.slice(0, 3);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out forwards; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s ease-out forwards; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              {branding.logo ? (
                <Image
                  src={branding.logo}
                  alt={branding.name}
                  width={48}
                  height={48}
                  className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl object-contain transition-transform group-hover:scale-110"
                />
              ) : (
                <div
                  className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:shadow-xl group-hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                >
                  <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg lg:text-xl leading-none tracking-tight">{branding.name}</h1>
                {branding.tagline && (
                  <p className="text-xs text-muted-foreground">{branding.tagline}</p>
                )}
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {sections.hero && <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>}
              {sections.events && <a href="#events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Events</a>}
              {sections.gallery && <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Gallery</a>}
              {sections.sponsors && <a href="#sponsors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sponsors</a>}
              {sections.testimonials && <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>}
              {sections.about && <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>}
              {sections.contact && <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>}
            </nav>

            <Link href={`/auth/login?tenant=${tenantSlug}`}>
              <Button
                className="text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                Login / Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {sections.hero && (
        <section
          id="hero"
          className="relative min-h-[90vh] flex items-center overflow-hidden"
          style={{
            background: hero.bgImage
              ? `url(${hero.bgImage}) center/cover`
              : `linear-gradient(135deg, ${theme.primaryColor}08 0%, ${theme.secondaryColor}08 50%, ${theme.accentColor}08 100%)`,
          }}
        >
          <DecorativeBackground />

          {/* Floating decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-20 animate-float"
              style={{ backgroundColor: theme.primaryColor, animationDelay: "0s" }}
            />
            <div
              className="absolute top-40 right-20 w-32 h-32 rounded-full opacity-10 animate-float"
              style={{ backgroundColor: theme.secondaryColor, animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-40 left-1/4 w-16 h-16 rounded-full opacity-15 animate-float"
              style={{ backgroundColor: theme.accentColor, animationDelay: "2s" }}
            />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className={cn(
              "text-center max-w-4xl mx-auto",
              isVisible ? "animate-fadeInUp" : "opacity-0"
            )}>
              <Badge
                className="mb-6 px-6 py-2 rounded-full text-white border-0 shadow-lg animate-scaleIn"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {branding.tagline || "Welcome"}
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
                {hero.title || `Welcome to ${branding.name}`}
              </h1>

              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animation-delay-200 animate-fadeInUp">
                {hero.subtitle || "Register for upcoming conferences, workshops, and CME programs."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animation-delay-400 animate-fadeInUp">
                <a href="#events">
                  <Button
                    size="lg"
                    className="text-white rounded-full px-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                  >
                    Browse Events
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
                <a href="#about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 border-2 hover:bg-white/50 transition-all"
                  >
                    Learn More
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animation-delay-600 animate-fadeInUp">
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold" style={{ color: theme.primaryColor }}>
                    {heroStats.events > 0 ? heroStats.events : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">Events</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold" style={{ color: theme.primaryColor }}>
                    {heroStats.registrations > 0 ? (heroStats.registrations >= 1000 ? `${(heroStats.registrations / 1000).toFixed(1).replace(/\.0$/, "")}K` : heroStats.registrations) : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">Attendees</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold" style={{ color: theme.primaryColor }}>
                    {heroStats.speakers > 0 ? heroStats.speakers : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">Speakers</p>
                </div>
              </div>
            </div>
          </div>

          <WaveDivider fill="#ffffff" />
        </section>
      )}

      {/* Events Carousel Section */}
      {sections.events && featuredEvents.length > 0 && (
        <section id="events" className="py-20 lg:py-28 bg-white relative overflow-hidden">
          <DecorativeBackground />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Calendar className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Upcoming Events
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Featured Events</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover our upcoming conferences, workshops, and training programs
              </p>
            </div>

            {/* Carousel */}
            <div className="relative max-w-5xl mx-auto">
              <div className="overflow-hidden rounded-3xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {featuredEvents.map((event, index) => (
                    <div key={event.id} className="w-full flex-shrink-0 px-4">
                      <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden group">
                        {event.bannerImage ? (
                          <Image
                            src={event.bannerImage}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <Badge className="mb-4 bg-white/20 backdrop-blur-sm border-0">
                            {event.type || "Conference"}
                          </Badge>
                          <h3 className="text-2xl md:text-3xl font-bold mb-3">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm mb-6">
                            {event.startDate && (
                              <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          <Link href={`/events/${event.id}`}>
                            <Button className="rounded-full bg-white text-black hover:bg-white/90">
                              Register Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Navigation */}
              {featuredEvents.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ color: theme.primaryColor }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredEvents.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ color: theme.primaryColor }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Dots */}
                  <div className="flex justify-center gap-2 mt-8">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          currentSlide === index ? "w-8" : "w-2 bg-gray-300 hover:bg-gray-400"
                        )}
                        style={{ backgroundColor: currentSlide === index ? theme.primaryColor : undefined }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Event Cards Grid */}
            {events.length > 3 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
                {events.slice(3, 6).map((event, index) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {event.bannerImage ? (
                        <Image
                          src={event.bannerImage}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                        >
                          <Calendar className="h-12 w-12" style={{ color: theme.primaryColor }} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge
                          className="text-white border-0"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          {event.type || "Event"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {event.startDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <Link href={`/events/${event.id}`}>
                        <Button
                          className="w-full text-white"
                          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                        >
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/events">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 border-2 hover:scale-105 transition-all"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                  View All Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Sponsors Section */}
      {sections.sponsors && sponsors.length > 0 && (
        <section
          id="sponsors"
          className="py-20 lg:py-28 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}05, ${theme.secondaryColor}05)` }}
        >
          <WaveDivider fill="#ffffff" flip />

          <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-12">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Heart className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Our Partners
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Trusted By</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Leading organizations supporting medical education excellence
              </p>
            </div>

            {/* Sponsors Logo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
              {sponsors.map((sponsor, index) => (
                <div
                  key={sponsor.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center h-24"
                >
                  {sponsor.logo ? (
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      width={120}
                      height={60}
                      className="object-contain max-h-12 grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="font-semibold text-muted-foreground">{sponsor.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <WaveDivider fill="#ffffff" />
        </section>
      )}

      {/* Gallery Section */}
      {sections.gallery && (
        <section id="gallery" className="py-20 lg:py-28 bg-white relative overflow-hidden">
          <DecorativeBackground />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Camera className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Gallery
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Event Highlights</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Moments captured from our past events and conferences
              </p>
            </div>

            {galleryImages.length > 0 ? (
              <>
                {/* Masonry Gallery */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.slice(0, 8).map((image, index) => {
                    const isFeatured = index === 0 || index === 5;
                    return (
                    <div
                      key={image.id}
                      className={cn(
                        "relative group cursor-pointer overflow-hidden rounded-2xl",
                        isFeatured ? "col-span-2 row-span-2" : "",
                        isFeatured ? "h-[300px] md:h-[400px]" : "h-[180px] md:h-[200px]"
                      )}
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                        <Badge className="w-fit mb-2 bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                          {image.category}
                        </Badge>
                        <p className="text-white font-medium text-sm">{image.alt}</p>
                      </div>

                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    );
                  })}
                </div>

                <div className="text-center mt-12">
                  <Link href="/gallery">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full px-8 border-2 hover:scale-105 transition-all"
                      style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                    >
                      View Full Gallery
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Gallery coming soon</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {sections.testimonials && (
        <section
          id="testimonials"
          className="py-20 lg:py-28 relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${theme.primaryColor}0a, ${theme.secondaryColor}12, ${theme.accentColor}08)` }}
        >
          <WaveDivider fill="#ffffff" flip />

          {/* 3D floating bubbles & shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large glassmorphic sphere — top left */}
            <div
              className="absolute -top-12 -left-12 w-64 h-64 rounded-full animate-[float_8s_ease-in-out_infinite]"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${theme.primaryColor}18, ${theme.primaryColor}06 60%, transparent 70%)`,
                boxShadow: `inset -8px -8px 20px ${theme.primaryColor}08, inset 6px 6px 16px rgba(255,255,255,0.4), 0 8px 32px ${theme.primaryColor}0a`,
              }}
            />
            {/* Medium sphere — right */}
            <div
              className="absolute top-[18%] -right-8 w-48 h-48 rounded-full animate-[float_6s_ease-in-out_1s_infinite]"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${theme.secondaryColor}20, ${theme.secondaryColor}08 55%, transparent 70%)`,
                boxShadow: `inset -6px -6px 16px ${theme.secondaryColor}0a, inset 4px 4px 12px rgba(255,255,255,0.5), 0 6px 24px ${theme.secondaryColor}08`,
              }}
            />
            {/* Small sphere — bottom left */}
            <div
              className="absolute bottom-[12%] left-[8%] w-28 h-28 rounded-full animate-[float_7s_ease-in-out_2s_infinite]"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${theme.accentColor}22, ${theme.accentColor}08 55%, transparent 70%)`,
                boxShadow: `inset -4px -4px 10px ${theme.accentColor}0a, inset 3px 3px 8px rgba(255,255,255,0.5), 0 4px 16px ${theme.accentColor}08`,
              }}
            />
            {/* Tiny bubble — center top */}
            <div
              className="absolute top-[10%] left-[45%] w-14 h-14 rounded-full animate-[float_5s_ease-in-out_0.5s_infinite]"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${theme.primaryColor}25, transparent 65%)`,
                boxShadow: `inset -2px -2px 6px ${theme.primaryColor}08, inset 2px 2px 4px rgba(255,255,255,0.6)`,
              }}
            />
            {/* Tiny bubble — bottom right */}
            <div
              className="absolute bottom-[20%] right-[12%] w-20 h-20 rounded-full animate-[float_6s_ease-in-out_3s_infinite]"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${theme.secondaryColor}22, transparent 60%)`,
                boxShadow: `inset -3px -3px 8px ${theme.secondaryColor}0a, inset 2px 2px 6px rgba(255,255,255,0.5)`,
              }}
            />

            {/* Diamond shape — left center */}
            <div
              className="absolute top-[55%] left-[4%] w-16 h-16 rotate-45 rounded-lg animate-[float_9s_ease-in-out_1.5s_infinite]"
              style={{
                background: `linear-gradient(135deg, ${theme.accentColor}15, ${theme.primaryColor}08)`,
                boxShadow: `inset -3px -3px 8px ${theme.accentColor}08, inset 2px 2px 6px rgba(255,255,255,0.4), 0 4px 12px ${theme.accentColor}06`,
              }}
            />
            {/* Rounded square — right bottom */}
            <div
              className="absolute bottom-[35%] right-[5%] w-20 h-20 rotate-12 rounded-2xl animate-[float_8s_ease-in-out_2.5s_infinite]"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}12, ${theme.secondaryColor}08)`,
                boxShadow: `inset -3px -3px 10px ${theme.primaryColor}08, inset 2px 2px 8px rgba(255,255,255,0.4), 0 4px 16px ${theme.primaryColor}06`,
              }}
            />
            {/* Ring — top right area */}
            <div
              className="absolute top-[30%] right-[25%] w-24 h-24 rounded-full animate-[float_7s_ease-in-out_4s_infinite]"
              style={{
                border: `2px solid ${theme.primaryColor}12`,
                boxShadow: `0 0 20px ${theme.primaryColor}06, inset 0 0 20px ${theme.primaryColor}04`,
              }}
            />

            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(${theme.primaryColor} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-12">
            {/* Section header */}
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full backdrop-blur-sm"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: "rgba(255,255,255,0.8)" }}
              >
                <Star className="h-3.5 w-3.5 mr-2 fill-yellow-400 text-yellow-400" />
                Testimonials
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
                Trusted by{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
                  Professionals
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Hear from professionals who have attended our events
              </p>
            </div>

            {/* Testimonial cards */}
            {(() => {
              const renderTestimonialCard = (testimonial: typeof testimonials[0], index: number) => (
                <div
                  key={testimonial.id}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor})` }}
                  />

                  <div className="p-7">
                    {/* Stars + Quote icon row */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4 transition-colors",
                              i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <Quote className="h-8 w-8 opacity-10 group-hover:opacity-20 transition-opacity duration-300" style={{ color: theme.primaryColor }} />
                    </div>

                    {/* Testimonial content */}
                    <blockquote className="text-gray-700 leading-relaxed mb-6 text-[15px] min-h-[72px]">
                      &ldquo;{testimonial.content}&rdquo;
                    </blockquote>

                    {/* Divider */}
                    <div className="h-px w-full mb-5" style={{ background: `linear-gradient(90deg, transparent, ${theme.primaryColor}20, transparent)` }} />

                    {/* Author info */}
                    <div className="flex items-center gap-3.5">
                      {testimonial.avatar ? (
                        <div className="relative">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            width={52}
                            height={52}
                            className="rounded-full object-cover w-[52px] h-[52px] ring-2 ring-white shadow-md"
                          />
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                          >
                            <Quote className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div
                            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white"
                            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                          >
                            {testimonial.name.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})` }}
                          >
                            <Quote className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm font-medium" style={{ color: theme.primaryColor }}>{testimonial.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 1px ${theme.primaryColor}20` }}
                  />
                </div>
              );

              return testimonials.length <= 3 ? (
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                  {testimonials.map((t, i) => renderTestimonialCard(t, i))}
                </div>
              ) : (
                <div className="relative max-w-5xl mx-auto">
                  {/* Carousel viewport */}
                  <div className="overflow-hidden rounded-xl">
                    <div
                      className="flex transition-transform duration-500 ease-in-out -mx-3"
                      style={{ transform: `translateX(-${testimonialSlide * (100 / 3)}%)` }}
                    >
                      {testimonials.map((t, i) => (
                        <div key={t.id} className="w-1/3 flex-shrink-0 px-3">
                          {renderTestimonialCard(t, i)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation arrows */}
                  {testimonialSlide > 0 && (
                    <button
                      onClick={() => setTestimonialSlide((s) => s - 1)}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 transition-all duration-300 z-10 hover:shadow-xl"
                      style={{ color: theme.primaryColor }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {testimonialSlide < testimonials.length - 3 && (
                    <button
                      onClick={() => setTestimonialSlide((s) => s + 1)}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 transition-all duration-300 z-10 hover:shadow-xl"
                      style={{ color: theme.primaryColor }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}

                  {/* Dots */}
                  <div className="flex justify-center gap-2 mt-10">
                    {Array.from({ length: testimonials.length - 2 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTestimonialSlide(i)}
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-300",
                          testimonialSlide === i ? "w-8" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                        )}
                        style={{ backgroundColor: testimonialSlide === i ? theme.primaryColor : undefined }}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <WaveDivider fill="#ffffff" />
        </section>
      )}

      {/* About Section */}
      {sections.about && (
        <section id="about" className="py-20 lg:py-28 bg-white relative overflow-hidden">
          <DecorativeBackground />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Award className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                About Us
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
                {about.title || `Why Choose ${branding.name}?`}
              </h2>
              {about.description && (
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  {about.description}
                </p>
              )}
            </div>

            {about.features && about.features.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {about.features.map((feature, index) => {
                  const IconComponent = iconMap[feature.icon] || Award;
                  return (
                    <Card
                      key={index}
                      className="text-center p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                      >
                        <span style={{ color: theme.primaryColor }}>
                          <IconComponent className="h-8 w-8" />
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact Section */}
      {sections.contact && (() => {
        const contactAddress = [contact.address, contact.city, contact.state, contact.country].filter(Boolean).join(", ");
        const hasContact = contact.email || contact.phone || contact.website || contactAddress;
        const hasSocial = social.facebook || social.twitter || social.linkedin || social.instagram || social.youtube;
        if (!hasContact && !hasSocial) return null;

        const contactCards = [
          contact.email && { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
          contact.phone && { icon: Phone, label: "Phone", value: contact.phone, href: `tel:${contact.phone}` },
          contactAddress && { icon: MapPin, label: "Address", value: contactAddress, href: undefined },
          contact.website && { icon: Globe, label: "Website", value: contact.website.replace(/^https?:\/\//, ""), href: contact.website, external: true },
        ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string; external?: boolean }[];

        // Grid column count adapts to how many cards there are
        const gridCols = contactCards.length >= 4 ? "md:grid-cols-4" : contactCards.length === 3 ? "md:grid-cols-3" : contactCards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1 max-w-md";

        return (
        <section
          id="contact"
          className="py-20 lg:py-28 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}05, ${theme.secondaryColor}05)` }}
        >
          <WaveDivider fill="#ffffff" flip />

          <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-12">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full bg-white"
                style={{ borderColor: `${theme.primaryColor}30` }}
              >
                <Mail className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Contact
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Get In Touch</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Have questions? We&apos;d love to hear from you.
              </p>
            </div>

            <div className={cn("max-w-5xl mx-auto grid gap-6", gridCols)}>
              {contactCards.map((card) => {
                const content = (
                  <Card key={card.label} className="text-center p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                    >
                      <card.icon className="h-7 w-7" style={{ color: theme.primaryColor }} />
                    </div>
                    <h3 className="font-bold mb-2">{card.label}</h3>
                    <p className="text-muted-foreground text-sm break-words">{card.value}</p>
                  </Card>
                );
                return card.href ? (
                  <a key={card.label} href={card.href} target={card.external ? "_blank" : undefined} rel={card.external ? "noopener noreferrer" : undefined} className="hover:no-underline">
                    {content}
                  </a>
                ) : (
                  <div key={card.label}>{content}</div>
                );
              })}
            </div>

            {/* Social Links */}
            {hasSocial && (
              <div className="flex justify-center gap-4 mt-12">
                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ color: theme.primaryColor }}
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {social.twitter && (
                  <a
                    href={social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ color: theme.primaryColor }}
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {social.linkedin && (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ color: theme.primaryColor }}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ color: theme.primaryColor }}
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {social.youtube && (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ color: theme.primaryColor }}
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
        );
      })()}

      {/* Footer */}
      <footer
        className="py-16 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -top-20 -left-20" />
          <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -bottom-20 -right-20" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-xl">{branding.name}</p>
                  {branding.tagline && <p className="text-sm text-white/70">{branding.tagline}</p>}
                </div>
              </div>
              {footer.text && <p className="text-white/70 max-w-md">{footer.text}</p>}
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#events" className="hover:text-white transition-colors">Events</a></li>
                <li><a href="#gallery" className="hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-white/70">
                {contact.email && <li>{contact.email}</li>}
                {contact.phone && <li>{contact.phone}</li>}
                {contact.city && contact.country && <li>{contact.city}, {contact.country}</li>}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/70">
              &copy; {new Date().getFullYear()} {footer.copyrightText || `${branding.name}. All rights reserved.`}
            </p>
            <p className="text-sm text-white/50">
              Powered by ICMS
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxOpen && galleryImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); }}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % galleryImages.length); }}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="max-w-5xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryImages[lightboxIndex].src}
              alt={galleryImages[lightboxIndex].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <div className="text-center mt-4">
              <p className="text-white font-medium">{galleryImages[lightboxIndex].alt}</p>
              <p className="text-white/60 text-sm">{lightboxIndex + 1} of {galleryImages.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
