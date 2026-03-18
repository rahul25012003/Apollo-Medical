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
  Shield,
  FlaskConical,
  ChevronDown,
  HelpCircle,
  Microscope,
  BookOpen,
  Activity,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { eventsService, Event } from "@/services/events";
import { sponsorsService, Sponsor } from "@/services/sponsors";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  GraduationCap,
  Users,
  Globe,
  Award,
  Calendar,
  Star,
  Heart,
  Sparkles,
  BrainCircuit,
  Microscope,
  BookOpen,
  Activity,
  Shield,
  FlaskConical,
};

// Scroll-triggered reveal animation hook
function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-scroll-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// Animated number counter component
function AnimatedCounter({ value, suffix = "" }: { value: string | number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) || 0 : value;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Animate from 0 to target
          const duration = 2000;
          const start = performance.now();
          function animate(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numericValue));
            if (progress < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [numericValue]);

  // Preserve original format (e.g., "500+" should show "500+")
  const originalStr = String(value);
  const prefix = originalStr.match(/^[^0-9]*/)?.[0] || "";
  const suffixFromValue = originalStr.match(/[^0-9]*$/)?.[0] || "";

  return <span ref={ref} className="counter-number">{prefix}{count}{suffixFromValue}{suffix}</span>;
}

// Decorative background component
function DecorativeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -top-40 -right-40 animate-pulse" />
      <div className="absolute w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-3xl bottom-20 -left-40 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl top-1/2 left-1/2 animate-pulse" style={{ animationDelay: "2s" }} />
    </div>
  );
}

// Adaptive grid: centers 1 item, 2 cols for 2, expands for 3+
function adaptiveGrid(count: number, maxCols: 2 | 3 | 4 = 3): string {
  if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto";
  if (maxCols === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  if (maxCols === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto";
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
}



function FAQSection({ theme, faqs }: { theme: { primaryColor: string; secondaryColor: string }; faqs: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section
      id="faq"
      className="py-12 lg:py-20 relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, #ffffff, ${theme.primaryColor}06, ${theme.secondaryColor}04)` }}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
          <Badge
            variant="outline"
            className="mb-4 px-5 py-1.5 rounded-full"
            style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
            FAQ
          </Badge>
          <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our organization and events
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:bg-slate-50/80 transition-all duration-300 overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left gap-4"
              >
                <span className="font-semibold text-base">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                    openIndex === index && "rotate-180"
                  )}
                  style={{ color: theme.primaryColor }}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountdownTimer({ targetDate, theme }: { targetDate: string; theme: { primaryColor: string; secondaryColor: string } }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculateTime() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }
    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {units.map((unit) => (
        <div key={unit.label} className="text-center">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg backdrop-blur-sm border border-white/20"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            {String(unit.value).padStart(2, "0")}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{unit.label}</p>
        </div>
      ))}
    </div>
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
  const [aboutSlide, setAboutSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [testimonialVisibleCount, setTestimonialVisibleCount] = useState(3);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [pricingCategories, setPricingCategories] = useState<any[]>([]);
  const [activeScheduleDay, setActiveScheduleDay] = useState(0);

  // Scroll-triggered reveal animations
  useScrollReveal();

  // Responsive testimonial carousel: 1 on mobile, 2 on tablet, 3 on desktop
  useEffect(() => {
    function updateVisibleCount() {
      if (window.innerWidth < 640) {
        setTestimonialVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setTestimonialVisibleCount(2);
      } else {
        setTestimonialVisibleCount(3);
      }
    }
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  // About slideshow auto-rotate

  // Scroll-aware navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch events, sponsors, and stats (filtered by tenant)
  useEffect(() => {
    async function fetchData() {
      if (!tenant?.id) return;
      try {
        const [eventsRes, sponsorsRes] = await Promise.all([
          eventsService.getPublic({ limit: 6, tenantId: tenant.id }),
          sponsorsService.getPublic({ isActive: true, tenantId: tenant.id }),
        ]);

        let eventsData: any[] = [];
        if (eventsRes.success && eventsRes.data) {
          eventsData = Array.isArray(eventsRes.data)
            ? eventsRes.data
            : (eventsRes.data as any).events || [];
          setEvents(eventsData);
        }
        if (sponsorsRes.success && sponsorsRes.data) {
          setSponsors(sponsorsRes.data || []);
        }

        // Fetch speakers
        try {
          const speakersRes = await fetch(`/api/speakers?tenantId=${tenant.id}&isActive=true`);
          if (speakersRes.ok) {
            const speakersJson = await speakersRes.json();
            setSpeakers(speakersJson.data || speakersJson || []);
          }
        } catch (e) {
          console.error("Error fetching speakers:", e);
        }

        // Fetch sessions for the first event
        if (eventsData.length > 0) {
          try {
            const sessionsRes = await fetch(`/api/events/${eventsData[0].id}/sessions`);
            if (sessionsRes.ok) {
              const sessionsData = await sessionsRes.json();
              setSessions(sessionsData.data || sessionsData || []);
            }
          } catch (e) {
            console.error("Error fetching sessions:", e);
          }

          // Fetch pricing categories
          try {
            if (eventsData[0]?.pricingCategories && eventsData[0].pricingCategories.length > 0) {
              setPricingCategories(eventsData[0].pricingCategories);
            } else {
              const eventRes = await fetch(`/api/events/${eventsData[0].id}`);
              if (eventRes.ok) {
                const eventJson = await eventRes.json();
                const eventDetail = eventJson.data || eventJson;
                setPricingCategories(eventDetail.pricingCategories || []);
              }
            }
          } catch (e) {
            console.error("Error fetching pricing:", e);
          }
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
  }, [tenantSlug, tenant?.id]);

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

  const { branding, theme, sections, hero, about, gallery, contact, social, footer, testimonials: tenantTestimonials, faqs: tenantFaqs, researchItems: tenantResearchItems, yearlyStats } = tenant;
  const galleryImages = gallery.images || [];
  const galleryVideos = gallery.videos || [];
  const testimonials = tenantTestimonials || [];
  const faqs = tenantFaqs || [];
  const researchItems = tenantResearchItems || [];
  const hasRealTestimonials = testimonials.length > 0;
  const featuredEvents = events.slice(0, 3);
  const hasEvents = featuredEvents.length > 0;
  const nextEvent = events.find(e => e.startDate && new Date(e.startDate) > new Date()) || events[0];
  const hasSponsors = sponsors.length > 0;
  const hasGallery = galleryImages.length > 0 || galleryVideos.length > 0;

  // About slideshow auto-rotate
  const aboutImageCount = about.images?.length || 0;
  useEffect(() => {
    if (aboutImageCount <= 1) return;
    const interval = setInterval(() => {
      setAboutSlide((prev) => (prev + 1) % aboutImageCount);
    }, 4000);
    return () => clearInterval(interval);
  }, [aboutImageCount]);

  // Lightbox keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, galleryImages.length]);

  // Video modal Escape key handler
  useEffect(() => {
    if (!playingVideoId) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPlayingVideoId(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [playingVideoId]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-20 md:pb-0">
      {/* Custom CSS for animations */}
      <style jsx global>{`
        /* ── Animations ── */
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
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary-rgb, 13 148 136) / 0.15); }
          50% { box-shadow: 0 0 40px rgba(var(--primary-rgb, 13 148 136) / 0.25); }
        }
        @keyframes borderShift {
          0%, 100% { border-color: rgba(var(--primary-rgb, 13 148 136) / 0.2); }
          50% { border-color: rgba(var(--primary-rgb, 13 148 136) / 0.4); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeInRight { animation: fadeInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }

        /* ── Tenant page premium polish ── */

        /* Header — glass morphism with soft border */
        header.sticky {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Section headings — refined spacing */
        section { scroll-margin-top: 80px; }

        /* Event cards — premium lift + glow on hover */
        .group[class*="rounded-2xl"][class*="border"],
        .group[class*="rounded-xl"][class*="border"] {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 0.3s ease !important;
        }

        .group[class*="rounded-2xl"][class*="border"]:hover,
        .group[class*="rounded-xl"][class*="border"]:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.12),
                      0 0 0 1px rgba(0, 0, 0, 0.03) !important;
        }

        /* CTA buttons — glow effect */
        a[class*="rounded-xl"][class*="text-white"],
        button[class*="rounded-xl"][class*="text-white"] {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        a[class*="rounded-xl"][class*="text-white"]:hover,
        button[class*="rounded-xl"][class*="text-white"]:hover {
          transform: translateY(-2px) !important;
          filter: brightness(1.08);
        }

        /* Stats/countdown numbers — tabular nums */
        .text-3xl.font-bold, .text-4xl.font-bold, .text-5xl.font-bold {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        /* Gallery images — smooth zoom */
        [class*="overflow-hidden"] img {
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [class*="overflow-hidden"]:hover img {
          transform: scale(1.08) !important;
        }

        /* Speaker cards — refined hover */
        [class*="text-center"][class*="group"] {
          transition: transform 0.35s ease, box-shadow 0.35s ease !important;
        }

        /* FAQ items — smooth expand */
        details summary {
          cursor: pointer;
          transition: color 0.2s ease;
        }

        details[open] summary {
          color: var(--primary);
        }

        /* Smooth anchor scrolling for nav */
        html { scroll-behavior: smooth; }

        /* Hero text — refined shadow for readability on images */
        [class*="text-white"][class*="font-bold"][class*="text-5xl"],
        [class*="text-white"][class*="font-bold"][class*="text-6xl"],
        [class*="text-white"][class*="font-bold"][class*="text-4xl"] {
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1);
        }

        /* Footer — subtle top border glow */
        footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Mobile nav — smooth slide */
        [class*="fixed"][class*="inset-0"][class*="bg-white"] {
          animation: fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Testimonial cards — glass feel */
        [class*="bg-white/80"][class*="backdrop-blur"] {
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        [class*="bg-white/80"][class*="backdrop-blur"]:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px -12px rgba(0, 0, 0, 0.1);
        }

        /* Countdown timer boxes — subtle pulse on active */
        [class*="rounded-xl"][class*="shadow-lg"][class*="text-center"] {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        /* Research/about section images — parallax-like depth */
        [class*="rounded-2xl"][class*="shadow-2xl"] img {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        [class*="rounded-2xl"][class*="shadow-2xl"]:hover img {
          transform: scale(1.03);
        }
      `}</style>

      {/* Header */}
      <header className={cn("sticky top-0 z-50 transition-all duration-500", scrolled ? "bg-white/90 backdrop-blur-2xl shadow-xl shadow-slate-900/5 border-b border-slate-200/50 py-0" : "bg-white/60 backdrop-blur-xl border-b border-transparent py-1")}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            <Link href={`/t/${tenantSlug}`} className="flex items-center gap-2 group">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-base lg:text-lg tracking-tight">CARE in Neuromodulation</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {sections.hero && <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>}
              {sections.events && hasEvents && <a href="#events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Events</a>}
              {sections.gallery && hasGallery && <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Gallery</a>}
              {(sections.ongoingResearch !== false) && researchItems.length > 0 && <a href="#research" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Research</a>}
              {sections.testimonials && hasRealTestimonials && <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>}
              {sections.about && <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>}
              {sections.contact && <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>}
              {(sections.faq !== false) && faqs.length > 0 && <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>}
            </nav>

            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link href={"/auth/login"}>
                <Button
                  className="text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs sm:text-sm"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                >
                  Login / Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white/95 backdrop-blur-xl pb-4 px-4">
              <nav className="flex flex-col gap-1 pt-2">
                {sections.hero && <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">Home</a>}
                {sections.events && hasEvents && <a href="#events" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">Events</a>}
                {sections.gallery && hasGallery && <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">Gallery</a>}
                {(sections.ongoingResearch !== false) && researchItems.length > 0 && <a href="#research" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">Research</a>}
                {sections.testimonials && hasRealTestimonials && <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">Testimonials</a>}
                {sections.about && <a href="#about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">About</a>}
                {sections.contact && <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">Contact</a>}
                {(sections.faq !== false) && faqs.length > 0 && <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-lg transition-colors">FAQ</a>}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Background wrapper: hero only */}
      <div className="relative">

      {/* Hero Section */}
      {sections.hero && (
        <section
          id="hero"
          className="relative min-h-screen flex items-center overflow-hidden pb-16 md:pb-20"
          style={hero.bgImage ? {} : {
            background: `linear-gradient(135deg, ${theme.primaryColor}08 0%, ${theme.secondaryColor}08 50%, ${theme.accentColor}08 100%)`,
          }}
        >
          {/* Background image — use img tag for full quality (no compression) */}
          {hero.bgImage && (
            <img
              src={hero.bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          )}

          {!hero.bgImage && <DecorativeBackground />}

          {/* Dark overlay for background image */}
          {hero.bgImage && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60 pointer-events-none" />
          )}

          {/* Hero Logos — absolute left/right on lg+, inline on smaller screens */}
          {branding.logo && (
            <div className="hidden lg:flex absolute left-[5%] xl:left-[8%] 2xl:left-[12%] top-[45%] -translate-y-1/2 z-10">
              <div className="h-28 w-28 xl:h-36 xl:w-36 2xl:h-40 2xl:w-40 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 overflow-hidden">
                <img src={branding.logo} alt={branding.name} className="w-full h-full object-contain" />
              </div>
            </div>
          )}
          {branding.secondaryLogo && (
            <div className="hidden lg:flex absolute right-[5%] xl:right-[8%] 2xl:right-[12%] top-[45%] -translate-y-1/2 z-10">
              <div className="h-28 w-28 xl:h-36 xl:w-36 2xl:h-40 2xl:w-40 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 overflow-hidden">
                <img src={branding.secondaryLogo} alt="Secondary Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-8 sm:pt-10">
            <div className={cn(
              "text-center max-w-4xl mx-auto",
              isVisible ? "animate-fadeInUp" : "opacity-0"
            )}>
              <div className="mb-4 animate-scaleIn flex items-center justify-center gap-4">
                <div className={cn("h-px w-12 lg:w-20", hero.bgImage ? "bg-white/50" : "bg-gray-800/40")} />
                <span className={cn("text-sm lg:text-base font-bold tracking-[0.2em] uppercase", hero.bgImage ? "text-white/90" : "text-gray-800")}>
                  {branding.tagline || "Welcome to"}
                </span>
                <div className={cn("h-px w-12 lg:w-20", hero.bgImage ? "bg-white/50" : "bg-gray-800/40")} />
              </div>

              {/* Mobile/Tablet: logos inline above title */}
              {(branding.logo || branding.secondaryLogo) && (
                <div className="flex lg:hidden items-center justify-center gap-4 sm:gap-6 mb-6">
                  {branding.logo && (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                      <img src={branding.logo} alt={branding.name} className="w-full h-full object-contain" />
                    </div>
                  )}
                  {branding.secondaryLogo && (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                      <img src={branding.secondaryLogo} alt="Secondary Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="text-center mb-4">
                <h1 className={cn("text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight drop-shadow-md", hero.bgImage ? "text-white" : "text-gray-900")}>
                  {hero.title || branding.name}
                </h1>
              </div>

              <p className={cn("text-lg lg:text-xl font-medium max-w-2xl mx-auto mb-6 animation-delay-200 animate-fadeInUp", hero.bgImage ? "text-white/85" : "text-gray-700")}>
                {hero.subtitle || "Register for the upcoming CME and workshop programs."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animation-delay-400 animate-fadeInUp">
                {hasEvents ? (
                  <a href="#events">
                    <Button
                      size="lg"
                      className="text-white rounded-full px-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, boxShadow: `0 8px 30px ${theme.primaryColor}40` }}
                    >
                      Browse Events
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                ) : (
                  <a href="#events">
                    <Button
                      size="lg"
                      className="text-white rounded-full px-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, boxShadow: `0 8px 30px ${theme.primaryColor}40` }}
                    >
                      Explore Events
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                )}
                <a href="#about">
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn("rounded-full px-8 border-2 backdrop-blur-sm transition-all font-semibold", hero.bgImage ? "bg-white/20 border-white/40 text-white hover:bg-white/30" : "bg-white/80 hover:bg-white")}
                  >
                    Learn More
                  </Button>
                </a>
              </div>

              {nextEvent && nextEvent.startDate && new Date(nextEvent.startDate) > new Date() && (
                <div className="mt-6 animation-delay-400 animate-fadeInUp" data-scroll-reveal>
                  <p className={cn("text-sm mb-4 font-medium", hero.bgImage ? "text-white/70" : "text-gray-600")}>
                    Next Event: <span className={cn("font-bold", hero.bgImage ? "text-white" : "text-gray-900")}>{nextEvent.title}</span>
                  </p>
                  <CountdownTimer targetDate={nextEvent.startDate} theme={theme} />
                </div>
              )}
              {/* Yearly Stats */}
              {yearlyStats && (yearlyStats.events || yearlyStats.attendees || yearlyStats.speakers) && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 max-w-xl mx-auto animation-delay-600 animate-fadeInUp">
                  {yearlyStats.events && (
                    <div className="text-center bg-white/70 backdrop-blur-md rounded-2xl py-5 px-3 shadow-lg border border-white/50" data-scroll-reveal data-scroll-delay="1">
                      <p className="text-xl sm:text-3xl lg:text-4xl font-bold" style={{ color: theme.primaryColor }}>
                        <AnimatedCounter value={yearlyStats.events} />
                      </p>
                      <p className="text-xs lg:text-sm text-muted-foreground mt-1">Events in {yearlyStats.year || new Date().getFullYear()}</p>
                    </div>
                  )}
                  {yearlyStats.attendees && (
                    <div className="text-center bg-white/70 backdrop-blur-md rounded-2xl py-5 px-3 shadow-lg border border-white/50" data-scroll-reveal data-scroll-delay="2">
                      <p className="text-xl sm:text-3xl lg:text-4xl font-bold" style={{ color: theme.primaryColor }}>
                        <AnimatedCounter value={yearlyStats.attendees} />
                      </p>
                      <p className="text-xs lg:text-sm text-muted-foreground mt-1">Attendees in {yearlyStats.year || new Date().getFullYear()}</p>
                    </div>
                  )}
                  {yearlyStats.speakers && (
                    <div className="text-center bg-white/70 backdrop-blur-md rounded-2xl py-5 px-3 shadow-lg border border-white/50" data-scroll-reveal data-scroll-delay="3">
                      <p className="text-xl sm:text-3xl lg:text-4xl font-bold" style={{ color: theme.primaryColor }}>
                        <AnimatedCounter value={yearlyStats.speakers} />
                      </p>
                      <p className="text-xs lg:text-sm text-muted-foreground mt-1">Speakers in {yearlyStats.year || new Date().getFullYear()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom gradient fade — dims background into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 pointer-events-none" style={{ background: `linear-gradient(to top, ${hasSponsors ? '#f9fafb' : '#ffffff'} 0%, ${hasSponsors ? 'rgba(249,250,251,0.7)' : 'rgba(255,255,255,0.7)'} 40%, transparent 100%)` }} />
        </section>
      )}

      {/* Trust Signals - Scrolling sponsor logos */}
      {hasSponsors && (
        <div className="relative py-3 bg-gray-50 border-y overflow-hidden">
          <div className="marquee-container">
            <div className="flex animate-marquee gap-12 items-center">
              {[...sponsors, ...sponsors].map((s, i) => (
                <div key={i} className="flex-shrink-0 h-12 w-32 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                  {s.logo ? <img src={s.logo} alt={s.name} className="h-full object-contain" /> : <span className="text-sm font-medium text-muted-foreground">{s.name}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Events — Coming Soon placeholder */}
      {sections.events && featuredEvents.length === 0 && (
        <section id="events" className="py-12 lg:py-20 relative overflow-hidden bg-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-lg mx-auto py-8">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.secondaryColor}15)` }}
              >
                <Calendar className="h-10 w-10" style={{ color: theme.primaryColor }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Events Coming Soon</h2>
              <p className="text-gray-500 mb-5">
                We&apos;re preparing exciting conferences, workshops, and training programs. Stay tuned for updates!
              </p>
              <a href="#contact">
                <Button
                  variant="outline"
                  className="rounded-full px-6 border-2"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Get Notified
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Events Carousel Section */}
      {sections.events && featuredEvents.length > 0 && (
        <section id="events" className="pt-12 pb-8 lg:pt-20 lg:pb-14 relative overflow-hidden bg-white">
          <DecorativeBackground />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            {/* Carousel */}
            <div className="relative max-w-5xl mx-auto">
              <div className="overflow-hidden rounded-3xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {featuredEvents.map((event, index) => (
                    <div key={event.id} className="w-full flex-shrink-0 px-4">
                      <div className="relative h-[250px] sm:h-[300px] md:h-[380px] lg:h-[420px] rounded-3xl overflow-hidden group">
                        {event.bannerImage ? (
                          <Image
                            src={event.bannerImage}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            placeholder="empty"
                            {...(index === 0 ? { priority: true } : {})}
                          />
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
                          <Badge className="mb-4 bg-white/20 backdrop-blur-sm border-0">
                            {event.type || "Conference"}
                          </Badge>
                          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">{event.title}</h3>
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
                          <Link href={`/events/${event.id}/register`}>
                            <Button className="rounded-full bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 relative overflow-hidden">
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
                    aria-label="Previous event slide"
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                    className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-10"
                    style={{ color: theme.primaryColor }}
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    aria-label="Next event slide"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredEvents.length)}
                    className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-10"
                    style={{ color: theme.primaryColor }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Dots */}
                  <div className="flex justify-center gap-2 mt-4">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        aria-label={`Go to event slide ${index + 1}`}
                        onClick={() => setCurrentSlide(index)}
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-300 py-0 min-h-[10px]",
                          currentSlide === index ? "w-8" : "w-2.5 bg-gray-300 hover:bg-gray-400"
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
              <div className={cn("grid gap-6 mt-6", adaptiveGrid(Math.min(events.length - 3, 3)))}>
                {events.slice(3, 6).map((event, index) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-2 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {event.bannerImage ? (
                        <Image
                          src={event.bannerImage}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          placeholder="empty"
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
                      <Link href={`/events/${event.id}/register`}>
                        <Button
                          className="w-full text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 relative overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                        >
                          Register Now
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </section>
      )}

      </div>{/* End background wrapper */}

      {/* Speakers Section */}
      {sections.events && speakers.length > 0 && (
        <section
          id="speakers"
          className="py-12 lg:py-20 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}08, ${theme.secondaryColor}06, #f8fafc)` }}
        >
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Users className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Our Faculty
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Distinguished Speakers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Meet the experts and thought leaders sharing their knowledge
              </p>
            </div>

            <div className={cn("grid gap-6", adaptiveGrid(speakers.length, 4))}>
              {speakers.map((speaker: any, index: number) => (
                <div
                  key={speaker.id || index}
                  className="group text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="relative mx-auto mb-4 h-24 w-24">
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                        padding: '3px',
                        borderRadius: '9999px',
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-white" />
                    </div>
                    {speaker.photo || speaker.photoUrl || speaker.image ? (
                      <img
                        src={speaker.photo || speaker.photoUrl || speaker.image}
                        alt={speaker.name}
                        className="h-24 w-24 rounded-full object-cover relative z-10 ring-2 ring-white shadow-lg"
                      />
                    ) : (
                      <div
                        className="h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold relative z-10 ring-2 ring-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                      >
                        {speaker.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base lg:text-lg group-hover:text-primary transition-colors">{speaker.name}</h3>
                  {speaker.designation && (
                    <p className="text-sm text-muted-foreground mt-1">{speaker.designation}</p>
                  )}
                  {speaker.institution && (
                    <p className="text-xs text-muted-foreground mt-0.5">{speaker.institution}</p>
                  )}
                  {speaker.department && (
                    <p className="text-xs text-muted-foreground mt-0.5">{speaker.department}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schedule / Agenda Section */}
      {sections.events && sessions.length > 0 && (
        <section
          id="schedule"
          className="py-6 lg:py-8 relative overflow-hidden bg-white"
        >
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Calendar className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Schedule
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Event Agenda</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore the full schedule of sessions, workshops, and keynotes
              </p>
            </div>

            {(() => {
              const groupedByDate = sessions.reduce((acc: Record<string, any[]>, session: any) => {
                const dateKey = session.sessionDate || session.date || 'TBD';
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(session);
                return acc;
              }, {});
              const dateKeys = Object.keys(groupedByDate).sort();

              return (
                <div className="max-w-4xl mx-auto">
                  {dateKeys.length > 1 && (
                    <div className="flex justify-center gap-2 mb-10 flex-wrap">
                      {dateKeys.map((dateKey, idx) => (
                        <button
                          key={dateKey}
                          onClick={() => setActiveScheduleDay(idx)}
                          className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                            activeScheduleDay === idx
                              ? "text-white shadow-lg"
                              : "bg-white text-gray-600 hover:bg-gray-50 border"
                          )}
                          style={activeScheduleDay === idx ? {
                            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                          } : undefined}
                        >
                          {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    {(groupedByDate[dateKeys[activeScheduleDay]] || [])
                      .sort((a: any, b: any) => (a.startTime || '').localeCompare(b.startTime || ''))
                      .map((session: any, idx: number) => {
                        const title = (session.title || '').toLowerCase();
                        let accentColor = theme.primaryColor;
                        if (title.includes('keynote')) accentColor = theme.primaryColor;
                        else if (title.includes('workshop')) accentColor = theme.secondaryColor;
                        else if (title.includes('break') || title.includes('lunch')) accentColor = '#9CA3AF';

                        return (
                          <div key={session.id || idx} className="flex gap-4 lg:gap-6 group">
                            <div className="flex-shrink-0 w-28 lg:w-36 text-right pt-4">
                              <p className="font-bold text-sm lg:text-base" style={{ color: accentColor }}>
                                {session.startTime || '--:--'}
                              </p>
                              {session.endTime && (
                                <p className="text-xs text-muted-foreground">{session.endTime}</p>
                              )}
                            </div>
                            <div className="relative flex flex-col items-center">
                              <div
                                className="w-3 h-3 rounded-full mt-5 flex-shrink-0 ring-4 ring-white"
                                style={{ backgroundColor: accentColor }}
                              />
                              {idx < (groupedByDate[dateKeys[activeScheduleDay]] || []).length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className="bg-white rounded-xl p-4 lg:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5">
                                <h4 className="font-semibold text-lg">{session.title}</h4>
                                {session.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{session.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {session.venue && (
                                    <Badge variant="secondary" className="text-xs rounded-full">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {session.venue}
                                    </Badge>
                                  )}
                                  {(session.speakerName || session.speaker?.name) && (
                                    <Badge variant="outline" className="text-xs rounded-full">
                                      <Users className="h-3 w-3 mr-1" />
                                      {session.speakerName || session.speaker?.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* Pricing / Registration Section */}
      {sections.events && pricingCategories.length > 0 && (
        <section
          id="pricing"
          className="py-6 lg:py-8 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}05, ${theme.secondaryColor}05)` }}
        >
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Ticket className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Registration
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Register Now</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose your registration category
              </p>
            </div>

            <div className={cn("grid gap-6", adaptiveGrid(pricingCategories.length))}>
              {pricingCategories.map((category: any, index: number) => {
                const isMiddle = pricingCategories.length >= 3 ? index === Math.floor(pricingCategories.length / 2) : index === 0;
                const hasEarlyBird = category.earlyBirdPrice && category.earlyBirdDeadline && new Date(category.earlyBirdDeadline) > new Date();
                const displayPrice = hasEarlyBird ? category.earlyBirdPrice : category.price;
                const slotsUsed = category.totalSlots ? (category.totalSlots - (category.availableSlots ?? category.totalSlots)) : 0;
                const slotsPercent = category.totalSlots ? Math.min((slotsUsed / category.totalSlots) * 100, 100) : 0;

                return (
                  <div
                    key={category.id || index}
                    className={cn(
                      "relative rounded-2xl border bg-white p-6 lg:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                      isMiddle ? "border-2 shadow-lg scale-[1.03]" : "border-gray-100 shadow-sm"
                    )}
                    style={isMiddle ? { borderColor: theme.primaryColor } : undefined}
                  >
                    {isMiddle && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                      >
                        Popular
                      </div>
                    )}

                    <h3 className="font-bold text-lg mb-4">{category.name}</h3>

                    <div className="mb-6">
                      {hasEarlyBird && (
                        <p className="text-sm text-muted-foreground line-through mb-1">
                          ₹{Number(category.price).toLocaleString('en-IN')}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>
                          ₹{Number(displayPrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {hasEarlyBird && (
                        <p className="text-xs mt-1" style={{ color: theme.primaryColor }}>
                          Early bird until {new Date(category.earlyBirdDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>

                    {category.totalSlots && (
                      <div className="mb-6">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{category.availableSlots ?? category.totalSlots} slots available</span>
                          <span>{category.totalSlots} total</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${slotsPercent}%`,
                              background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <Link href={events[0] ? `/events/${events[0].id}/register` : "#events"}>
                      <Button
                        className="w-full rounded-full text-white shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                      >
                        Register
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Ongoing Research Section */}
      {(sections.ongoingResearch !== false) && researchItems.length > 0 && (
        <section
          id="research"
          className="py-12 lg:py-20 relative overflow-hidden bg-white"
        >
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <FlaskConical className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Ongoing Research
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Our Research</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Pioneering studies advancing the frontiers of neuromodulation and neuroscience
              </p>
            </div>

            <div className={cn("grid gap-8", adaptiveGrid(researchItems.length))}>
              {researchItems.map((research, index) => {
                const IconComponent = iconMap[research.icon] || FlaskConical;
                return (
                  <Card
                    key={research.id || index}
                    className="group p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative"
                  >
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                    />
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md"
                        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                      >
                        <IconComponent className="h-6 w-6" style={{ color: theme.primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{research.title}</h3>
                        </div>
                        <Badge
                          variant="outline"
                          className="mb-3 text-xs"
                          style={{ borderColor: `${theme.primaryColor}40`, color: theme.primaryColor, backgroundColor: `${theme.primaryColor}08` }}
                        >
                          {research.status}
                        </Badge>
                        <p className="text-muted-foreground text-sm leading-relaxed">{research.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {sections.gallery && hasGallery && (
        <section id="gallery" className="py-12 lg:py-20 relative overflow-hidden" style={{ background: `linear-gradient(180deg, #ffffff, ${theme.primaryColor}08, ${theme.secondaryColor}06)` }}>
          <DecorativeBackground />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Camera className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Gallery
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Event Highlights</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Moments captured from our past events and conferences
              </p>
            </div>

            {/* Photos and Videos side by side when both exist, centered when only one */}
            <div className={cn(
              "grid gap-8",
              galleryImages.length > 0 && galleryVideos.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"
            )}>
              {/* Photos */}
              {galleryImages.length > 0 && (
                <div>
                  {galleryVideos.length > 0 && (
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Camera className="h-5 w-5" style={{ color: theme.primaryColor }} />
                      Photos
                    </h3>
                  )}
                  <div className={cn(
                    "grid gap-3 sm:gap-4",
                    adaptiveGrid(
                      galleryImages.slice(0, galleryVideos.length > 0 ? 6 : 8).length,
                      galleryVideos.length > 0 ? 2 : 4
                    )
                  )}>
                    {galleryImages.slice(0, galleryVideos.length > 0 ? 6 : 8).map((image, index) => {
                      const isFeatured = galleryVideos.length === 0 && (index === 0 || index === 5);
                      return (
                      <div
                        key={image.id}
                        role="button"
                        data-scroll-reveal="scale"
                        data-scroll-delay={String(index + 1)}
                        tabIndex={0}
                        aria-label={`View gallery image: ${image.alt}`}
                        className={cn(
                          "relative group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-500",
                          isFeatured ? "sm:col-span-2 sm:row-span-2" : "",
                          isFeatured ? "h-[220px] sm:h-[280px] md:h-[400px]" : "h-[180px] md:h-[200px]"
                        )}
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxOpen(true);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxIndex(index); setLightboxOpen(true); } }}
                      >
                        <img
                          src={image.src}
                          alt={image.alt}
                          width={600}
                          height={400}
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
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100" aria-hidden="true">
                          <Eye className="h-6 w-6 text-white" />
                          <span className="sr-only">View image</span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Videos */}
              {galleryVideos.length > 0 && (
                <div>
                  {galleryImages.length > 0 && (
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Play className="h-5 w-5" style={{ color: theme.primaryColor }} />
                      Videos
                    </h3>
                  )}
                  <div className={cn(
                    "grid gap-3 sm:gap-4",
                    adaptiveGrid(
                      galleryVideos.slice(0, galleryImages.length > 0 ? 4 : 6).length,
                      galleryImages.length > 0 ? 2 : 3
                    )
                  )}>
                    {galleryVideos.slice(0, galleryImages.length > 0 ? 4 : 6).map((video) => (
                      <div
                        key={video.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play video: ${video.title}`}
                        className="relative group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 h-[180px] md:h-[200px]"
                        onClick={() => setPlayingVideoId(video.youtubeId)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPlayingVideoId(video.youtubeId); } }}
                      >
                        <img
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          alt={video.title}
                          width={480}
                          height={360}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <Play className="h-6 w-6 ml-1" style={{ color: theme.primaryColor }} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white font-medium text-sm truncate">{video.title}</p>
                          {video.duration && (
                            <span className="text-white/70 text-xs">{video.duration}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(galleryImages.length > 0 || galleryVideos.length > 0) && (
              <div className="text-center mt-12">
                <Link href={`/t/${tenantSlug}/gallery`}>
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
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section - only shown when tenant has real testimonials */}
      {sections.testimonials && hasRealTestimonials && (
        <section
          id="testimonials"
          className="py-12 lg:py-20 relative overflow-hidden bg-white"
        >

          {/* 3D floating bubbles & shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large glassmorphic sphere — top left */}
            <div
              className="absolute -top-12 -left-12 w-32 h-32 md:w-64 md:h-64 rounded-full animate-[float_8s_ease-in-out_infinite]"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${theme.primaryColor}18, ${theme.primaryColor}06 60%, transparent 70%)`,
                boxShadow: `inset -8px -8px 20px ${theme.primaryColor}08, inset 6px 6px 16px rgba(255,255,255,0.4), 0 8px 32px ${theme.primaryColor}0a`,
              }}
            />
            {/* Medium sphere — right */}
            <div
              className="absolute top-[18%] -right-8 w-24 h-24 md:w-48 md:h-48 rounded-full animate-[float_6s_ease-in-out_1s_infinite]"
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

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            {/* Section header */}
            <div className="text-center mb-10 lg:mb-14" data-scroll-reveal>
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full backdrop-blur-sm"
                style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}08` }}
              >
                <Star className="h-3.5 w-3.5 mr-2 fill-yellow-400 text-yellow-400" />
                Testimonials
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">
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
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden border border-primary/10 hover:border-primary/20"
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
                      <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary/30 transition-all duration-300" style={{ color: theme.primaryColor }} />
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

              const visibleCount = testimonialVisibleCount;
              const maxSlide = Math.max(0, testimonials.length - visibleCount);
              const clampedSlide = Math.min(testimonialSlide, maxSlide);
              const widthClass = visibleCount === 1 ? "w-full" : visibleCount === 2 ? "w-1/2" : "w-1/3";

              return testimonials.length <= visibleCount ? (
                <div className={cn("grid gap-6 lg:gap-8", adaptiveGrid(testimonials.length))}>
                  {testimonials.map((t, i) => renderTestimonialCard(t, i))}
                </div>
              ) : (
                <div className="relative max-w-5xl mx-auto">
                  {/* Carousel viewport */}
                  <div className="overflow-hidden rounded-xl">
                    <div
                      className="flex transition-transform duration-500 ease-in-out -mx-3"
                      style={{ transform: `translateX(-${clampedSlide * (100 / visibleCount)}%)` }}
                    >
                      {testimonials.map((t, i) => (
                        <div key={t.id} className={cn(widthClass, "flex-shrink-0 px-3")}>
                          {renderTestimonialCard(t, i)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation arrows */}
                  {clampedSlide > 0 && (
                    <button
                      aria-label="Previous testimonial"
                      onClick={() => setTestimonialSlide((s) => Math.max(0, s - 1))}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 transition-all duration-300 z-10 hover:shadow-xl"
                      style={{ color: theme.primaryColor }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {clampedSlide < maxSlide && (
                    <button
                      aria-label="Next testimonial"
                      onClick={() => setTestimonialSlide((s) => Math.min(maxSlide, s + 1))}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 transition-all duration-300 z-10 hover:shadow-xl"
                      style={{ color: theme.primaryColor }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}

                  {/* Dots */}
                  <div className="flex justify-center gap-2 mt-10">
                    {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to testimonial slide ${i + 1}`}
                        onClick={() => setTestimonialSlide(i)}
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-300",
                          clampedSlide === i ? "w-8" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                        )}
                        style={{ backgroundColor: clampedSlide === i ? theme.primaryColor : undefined }}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* About Section */}
      {sections.about && (
        <section id="about" className="py-12 lg:py-20 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${theme.primaryColor}06, #f8fafc, ${theme.secondaryColor}04)` }} data-scroll-reveal>
          <DecorativeBackground />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            {/* Two-column: Slideshow + Text */}
            <div className="grid lg:grid-cols-2 gap-10 items-center mb-8">
              {/* Image Slideshow */}
              {about.images && about.images.length > 0 && (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500 aspect-[4/3] min-h-[300px]">
                {about.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`About ${branding.name} - photo ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: aboutSlide === idx ? 1 : 0 }}
                  />
                ))}
                {about.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {about.images.map((_: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setAboutSlide(idx)}
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: aboutSlide === idx ? "2rem" : "0.625rem",
                        backgroundColor: aboutSlide === idx ? theme.primaryColor : "rgba(255,255,255,0.6)",
                      }}
                    />
                  ))}
                </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              )}

              {/* Text Content */}
              {about.description && (
                <div className="space-y-6 text-center">
                  {about.description.split("\n\n").map((paragraph: string, idx: number) => {
                    const colonIdx = paragraph.indexOf(":");
                    const heading = idx === 0 ? "About Us" : (colonIdx > 0 && colonIdx < 60) ? paragraph.slice(0, colonIdx) : null;
                    const text = idx === 0 ? paragraph : (colonIdx > 0 && colonIdx < 60) ? paragraph.slice(colonIdx + 1).trim() : paragraph;
                    return (
                      <div key={idx}>
                        {heading && <h3 className="text-xl font-bold mb-2" style={{ color: theme.primaryColor }}>{heading}</h3>}
                        <p className="text-slate-600 text-base leading-relaxed">{text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {about.features && about.features.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {about.features.map((feature, index) => {
                  const IconComponent = iconMap[feature.icon] || Award;
                  return (
                    <Card
                      key={index}
                      data-scroll-reveal
                      data-scroll-delay={String(index + 1)}
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

        // Grid column count adapts — center 1, expand for more
        const gridCols = adaptiveGrid(contactCards.length, 4);

        return (
        <section
          id="contact"
          className="py-12 lg:py-20 relative overflow-hidden bg-white"
          data-scroll-reveal
        >
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center mb-10 lg:mb-14">
              <Badge
                variant="outline"
                className="mb-4 px-5 py-1.5 rounded-full bg-white"
                style={{ borderColor: `${theme.primaryColor}30` }}
              >
                <Mail className="h-3.5 w-3.5 mr-2" style={{ color: theme.primaryColor }} />
                Contact
              </Badge>
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">Get In Touch</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Have questions? We&apos;d love to hear from you.
              </p>
            </div>

            <div className={cn("max-w-5xl mx-auto grid gap-6", gridCols)}>
              {contactCards.map((card) => {
                const content = (
                  <Card key={card.label} className="text-center p-5 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white h-full flex flex-col items-center justify-center">
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                    >
                      <card.icon className="h-7 w-7" style={{ color: theme.primaryColor }} />
                    </div>
                    <h3 className="font-bold mb-2">{card.label}</h3>
                    <p className="text-muted-foreground text-sm break-words">{card.value}</p>
                  </Card>
                );
                return card.href ? (
                  <a key={card.label} href={card.href} target={card.external ? "_blank" : undefined} rel={card.external ? "noopener noreferrer" : undefined} className="hover:no-underline h-full">
                    {content}
                  </a>
                ) : (
                  <div key={card.label} className="h-full">{content}</div>
                );
              })}
            </div>

            {/* Business Hours */}
            {contact.businessHours && (contact.businessHours.monFri || contact.businessHours.sat || contact.businessHours.sunHoliday) && (
              <div className="max-w-2xl mx-auto mt-12">
                <Card className="p-6 bg-white shadow-lg border-0">
                  <div className="text-center mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                    >
                      <Clock className="h-6 w-6" style={{ color: theme.primaryColor }} />
                    </div>
                    <h3 className="font-bold text-lg">Business Hours</h3>
                    <p className="text-sm font-medium mt-1" style={{ color: theme.primaryColor }}>
                      {branding.name}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {contact.businessHours.monFri && (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/50">
                        <span className="font-medium text-sm">Monday - Friday</span>
                        <span className="text-sm text-muted-foreground">{contact.businessHours.monFri}</span>
                      </div>
                    )}
                    {contact.businessHours.sat && (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/50">
                        <span className="font-medium text-sm">Saturday</span>
                        <span className="text-sm text-muted-foreground">{contact.businessHours.sat}</span>
                      </div>
                    )}
                    {contact.businessHours.sunHoliday && (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/50">
                        <span className="font-medium text-sm">Sunday & Gazetted Holidays</span>
                        <span className="text-sm text-destructive font-medium">{contact.businessHours.sunHoliday}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Google Map */}
            {contact.mapUrl && (
              <div className="max-w-4xl mx-auto mt-10 rounded-2xl overflow-hidden shadow-lg border">
                <iframe
                  src={contact.mapUrl}
                  width="100%"
                  className="w-full h-[200px] sm:h-[250px] md:h-[300px]"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
              </div>
            )}

            {/* Social Links — same card style as contact cards */}
            {hasSocial && (() => {
              const socialCards = [
                social.facebook && { icon: Facebook, label: "Facebook", href: social.facebook },
                social.twitter && { icon: Twitter, label: "Twitter", href: social.twitter },
                social.linkedin && { icon: Linkedin, label: "LinkedIn", href: social.linkedin },
                social.instagram && { icon: Instagram, label: "Instagram", href: social.instagram },
                social.youtube && { icon: Youtube, label: "YouTube", href: social.youtube },
              ].filter(Boolean) as { icon: typeof Facebook; label: string; href: string }[];

              return (
                <div className={cn("max-w-5xl mx-auto grid gap-6 mt-8", adaptiveGrid(socialCards.length, socialCards.length >= 4 ? 4 : 3))}>
                  {socialCards.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:no-underline h-full">
                      <Card className="text-center p-5 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white h-full flex flex-col items-center justify-center">
                        <div
                          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center flex-shrink-0 hover:scale-110 transition-all duration-300"
                          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                        >
                          <s.icon className="h-7 w-7 hover:text-primary transition-all duration-300" style={{ color: theme.primaryColor }} />
                        </div>
                        <h3 className="font-bold mb-1">{s.label}</h3>
                        <p className="text-muted-foreground text-xs">Follow us</p>
                      </Card>
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
        );
      })()}

      {/* FAQ Section */}
      {(sections.faq !== false) && <FAQSection theme={theme} faqs={faqs} />}

      {/* Footer */}
      <footer className="text-white relative overflow-hidden mb-16 md:mb-0 border-t border-slate-200/50">
        {/* Smooth wavy transition into footer */}
        <div className="relative h-12 md:h-16" style={{ background: faqs.length > 0 ? `linear-gradient(135deg, ${theme.primaryColor}05, ${theme.secondaryColor}05)` : "#ffffff" }}>
          <svg className="absolute bottom-0 left-0 right-0 w-full h-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,50 C360,80 720,20 1080,50 C1260,65 1380,40 1440,50 L1440,80 L0,80 Z" fill={theme.primaryColor} />
          </svg>
        </div>

        {/* Main footer with theme gradient + bubbles */}
        <div
          className="py-8 pb-0 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        >
          {/* Floating bubbles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-16 h-16 rounded-full bg-white/[0.07] -top-4 left-[10%] animate-[float_6s_ease-in-out_infinite]" />
            <div className="absolute w-24 h-24 rounded-full bg-white/[0.05] top-12 right-[15%] animate-[float_8s_ease-in-out_infinite_1s]" />
            <div className="absolute w-10 h-10 rounded-full bg-white/[0.08] top-1/3 left-[5%] animate-[float_7s_ease-in-out_infinite_2s]" />
            <div className="absolute w-32 h-32 rounded-full bg-white/[0.04] -bottom-8 left-[20%] animate-[float_9s_ease-in-out_infinite_0.5s]" />
            <div className="absolute w-20 h-20 rounded-full bg-white/[0.06] top-1/4 right-[8%] animate-[float_7s_ease-in-out_infinite_3s]" />
            <div className="absolute w-14 h-14 rounded-full bg-white/[0.07] bottom-1/3 right-[25%] animate-[float_6s_ease-in-out_infinite_1.5s]" />
            <div className="absolute w-8 h-8 rounded-full bg-white/[0.09] top-[60%] left-[40%] animate-[float_5s_ease-in-out_infinite_2.5s]" />
            <div className="absolute w-28 h-28 rounded-full bg-white/[0.03] -top-10 right-[35%] animate-[float_10s_ease-in-out_infinite_4s]" />
            <div className="absolute w-12 h-12 rounded-full bg-white/[0.08] bottom-[20%] left-[60%] animate-[float_6s_ease-in-out_infinite_3.5s]" />
            <div className="absolute w-6 h-6 rounded-full bg-white/[0.10] top-[45%] right-[45%] animate-[float_5s_ease-in-out_infinite_1s]" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            {/* Top section — Brand + Quick Links + Contact */}
            <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-xl tracking-tight">{branding.name}</p>
                    {branding.tagline && <p className="text-sm text-white/60">{branding.tagline}</p>}
                  </div>
                </div>
                {footer.text && <p className="text-white/60 text-sm leading-relaxed">{footer.text}</p>}

                {/* Social links */}
                {(social.facebook || social.twitter || social.linkedin || social.instagram || social.youtube) && (
                  <div className="flex items-center gap-3 mt-5">
                    {[
                      social.facebook && { href: social.facebook, label: "Facebook" },
                      social.twitter && { href: social.twitter, label: "Twitter" },
                      social.linkedin && { href: social.linkedin, label: "LinkedIn" },
                      social.instagram && { href: social.instagram, label: "Instagram" },
                      social.youtube && { href: social.youtube, label: "YouTube" },
                    ].filter(Boolean).map((link) => link && (
                      <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 text-white/70 hover:text-white"
                        title={link.label}>
                        <Globe className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-5 text-sm uppercase tracking-wider text-white/90">Quick Links</h4>
                <ul className="space-y-3 text-white/60">
                  {[
                    sections.events && { href: "#events", label: "Events" },
                    sections.gallery && { href: "#gallery", label: "Gallery" },
                    sections.about && { href: "#about", label: "About" },
                    sections.contact && { href: "#contact", label: "Contact" },
                    { href: "#faq", label: "FAQ" },
                  ].filter(Boolean).map((link) => link && (
                    <li key={link.label}>
                      <a href={link.href} className="hover:text-white transition-colors duration-200 flex items-center gap-2 text-sm">
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-5 text-sm uppercase tracking-wider text-white/90">Contact</h4>
                <ul className="space-y-3 text-white/60 text-sm">
                  {contact.email && (
                    <li className="flex items-start gap-2.5">
                      <Mail className="h-4 w-4 mt-0.5 text-white/50 flex-shrink-0" />
                      <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors break-all">{contact.email}</a>
                    </li>
                  )}
                  {contact.phone && (
                    <li className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 mt-0.5 text-white/50 flex-shrink-0" />
                      <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">{contact.phone}</a>
                    </li>
                  )}
                  {(contact.city || contact.country) && (
                    <li className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 mt-0.5 text-white/50 flex-shrink-0" />
                      <span>{[contact.address, contact.city, contact.country].filter(Boolean).join(", ")}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Organizing Committee Section */}
            <div className="border-t border-white/15 mt-10 pt-10">
              <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
                {/* Chief Organizing Secretary */}
                <div className="text-center md:text-left">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">Organizing Secretary</h4>
                  <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <p className="font-bold text-lg">Prof. Nand Kumar</p>
                    <p className="text-white/60 text-sm mt-1">Chief Organizing Secretary</p>
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">
                      Professor, Dept. of Psychiatry<br />
                      All India Institute of Medical Sciences, New Delhi<br />
                      & In-charge (Centre For Advanced Research & Excellence in Neuromodulation)
                    </p>
                    <div className="mt-4 space-y-1.5 text-sm">
                      <p className="flex items-center justify-center md:justify-start gap-2 text-white/70">
                        <Mail className="h-3.5 w-3.5 text-white/50" />
                        <a href="mailto:nandkm2001@gmail.com" className="hover:text-white transition-colors">nandkm2001@gmail.com</a>
                      </p>
                      <p className="flex items-center justify-center md:justify-start gap-2 text-white/70">
                        <Phone className="h-3.5 w-3.5 text-white/50" />
                        <a href="tel:011-26546433" className="hover:text-white transition-colors">011-26546433</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coordinators */}
                <div className="text-center md:text-left">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">Coordinators</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: "Dr Hemant Choudhary", email: "hemantchoudhary108@gmail.com" },
                      { name: "Dr Priyanka Bhat", email: "bhatpriyanka84@gmail.com" },
                      { name: "Dr Shubha Bagri", email: "subhabagre9@gmail.com" },
                      { name: "Dr Adit Verma", email: "adit.2803.verma@gmail.com" },
                    ].map((coord) => (
                      <div key={coord.name} className="bg-white/[0.07] backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/[0.12] transition-colors">
                        <p className="font-semibold text-sm">{coord.name}</p>
                        <a href={`mailto:${coord.email}`} className="text-white/50 text-xs hover:text-white/80 transition-colors break-all">
                          {coord.email}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer sponsor logos */}
            {hasSponsors && (
              <div className="border-t border-white/15 mt-10 py-8">
                <p className="text-xs text-white/40 text-center mb-4 uppercase tracking-wider">Our Partners</p>
                <div className="flex flex-wrap items-center justify-center gap-8">
                  {sponsors.slice(0, 6).map((s) => (
                    <div key={s.id} className="h-10 opacity-70 hover:opacity-100 transition-opacity">
                      {s.logo ? <img src={s.logo} alt={s.name} className="h-full object-contain brightness-0 invert" /> : <span className="text-sm text-white/60">{s.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div className="border-t border-white/10 mt-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-white/50">
                &copy; {new Date().getFullYear()} {footer.copyrightText || `${branding.name}. All rights reserved.`}
              </p>
              <a href="https://summitsolutions.in" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 hover:scale-105 transition-all duration-300">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Powered by</span>
                <div className="bg-white/95 rounded-lg px-4 py-2 shadow-lg group-hover:shadow-xl group-hover:bg-white transition-all">
                  <img src="/summit-logo.png" alt="Summit Solutions" className="h-7 inline-block" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {/* Photo Lightbox */}
      {lightboxOpen && galleryImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            aria-label="Close lightbox"
            className="absolute top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
          <button
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); }}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
          <button
            aria-label="Next image"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % galleryImages.length); }}
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
          <div className="max-w-5xl max-h-[85vh] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
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

      {/* Video Modal */}
      {playingVideoId && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setPlayingVideoId(null)}
        >
          <button
            aria-label="Close video"
            className="absolute top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            onClick={() => setPlayingVideoId(null)}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
          <div className="w-full max-w-4xl mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-2xl"
                src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1&mute=1`}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky register button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-xl border-t shadow-lg md:hidden">
        <Link href={events[0] ? `/events/${events[0].id}/register` : "/auth/login"} className="block">
          <Button
            className="w-full text-white rounded-full font-semibold py-3"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            Register Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
