"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
    Calendar,
    MapPin,
    Users,
    Award,
    ArrowRight,
    ArrowLeft,
    Ticket,
    GraduationCap,
    Star,
    Crown,
    Medal,
    Building2,
    Phone,
    Mail,
    Smartphone,
    Lock,
    CheckCircle2,
    Loader2,
    Mic2,
    Play,
    Menu,
    X,
    Sparkles,
    Globe,
    Heart,
    Zap,
    Eye,
    Camera,
    ChevronLeft,
    ChevronRight,
    Images,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getEventImage } from "@/lib/event-utils";
import { EVENT_CATEGORIES } from "@/lib/event-constants";
import { eventsService, Event } from "@/services/events";
import { sponsorsService, Sponsor } from "@/services/sponsors";

// Gallery images data
const galleryImages = [
    {
        id: 1,
        src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80",
        alt: "Medical Conference Keynote",
        category: "Conference",
    },
    {
        id: 2,
        src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
        alt: "Workshop Session",
        category: "Workshop",
    },
    {
        id: 3,
        src: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
        alt: "Networking Event",
        category: "Networking",
    },
    {
        id: 4,
        src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
        alt: "Medical Equipment Exhibition",
        category: "Exhibition",
    },
    {
        id: 5,
        src: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
        alt: "CME Training Session",
        category: "Training",
    },
    {
        id: 6,
        src: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80",
        alt: "Panel Discussion",
        category: "Conference",
    },
    {
        id: 7,
        src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
        alt: "Award Ceremony",
        category: "Awards",
    },
    {
        id: 8,
        src: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80",
        alt: "Hands-on Workshop",
        category: "Workshop",
    },
];

// Event type for display
interface DisplayEvent {
    id: string;
    title: string;
    shortDescription: string | null;
    date: string;
    time: string;
    location: string;
    type: string;
    category: string | null;
    registrations: number;
    capacity: number;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    cmeCredits: number | null;
    image: string | null;
    featured: boolean;
    status: string;
}

// Sponsor type for display
interface DisplaySponsor {
    name: string;
    tier: string;
    logo: string | null;
}

// Build categories from shared constants
const categories = ["All", ...EVENT_CATEGORIES.map(c => c.value)];

// Custom hook for scroll reveal animations - re-runs when dependencies change
function useScrollReveal(deps: unknown[] = []) {
    useEffect(() => {
        let observer: IntersectionObserver | null = null;

        // Small delay to ensure DOM has updated after state changes
        const timeoutId = setTimeout(() => {
            const elements = document.querySelectorAll("[data-scroll-reveal]");

            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("revealed");
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: "0px 0px -50px 0px",
                }
            );

            // Observe all elements and immediately reveal those in viewport
            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.9) {
                    el.classList.add("revealed");
                }
                observer?.observe(el);
            });
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            observer?.disconnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

// Floating Bubbles Component
function FloatingBubbles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large gradient blobs */}
            <div className="absolute w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-3xl -top-40 -left-40 animate-float-slow" />
            <div className="absolute w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-3xl top-1/3 -right-40 animate-float-gentle" style={{ animationDelay: "2s" }} />
            <div className="absolute w-[400px] h-[400px] bg-cyan-400/15 rounded-full blur-3xl bottom-20 left-1/4 animate-float" style={{ animationDelay: "1s" }} />

            {/* Floating circles */}
            <div className="absolute w-4 h-4 bg-white/20 rounded-full top-[20%] left-[10%] animate-float" style={{ animationDelay: "0s" }} />
            <div className="absolute w-6 h-6 bg-white/15 rounded-full top-[40%] left-[20%] animate-float-gentle" style={{ animationDelay: "1s" }} />
            <div className="absolute w-3 h-3 bg-cyan-300/30 rounded-full top-[60%] left-[15%] animate-float-slow" style={{ animationDelay: "2s" }} />
            <div className="absolute w-5 h-5 bg-white/10 rounded-full top-[30%] right-[15%] animate-float" style={{ animationDelay: "0.5s" }} />
            <div className="absolute w-4 h-4 bg-teal-300/20 rounded-full top-[70%] right-[20%] animate-float-gentle" style={{ animationDelay: "1.5s" }} />
            <div className="absolute w-8 h-8 bg-white/10 rounded-full top-[50%] right-[25%] animate-float-slow" style={{ animationDelay: "3s" }} />

            {/* Decorative rings */}
            <div className="absolute w-32 h-32 border border-white/10 rounded-full top-[25%] left-[5%] animate-pulse-smooth" />
            <div className="absolute w-48 h-48 border border-white/5 rounded-full top-[60%] right-[8%] animate-pulse-smooth" style={{ animationDelay: "1.5s" }} />
        </div>
    );
}

// Decorative Background Component
function DecorativeBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-100/40 to-transparent -top-60 -right-60 blur-3xl animate-float-slow" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-100/30 to-transparent bottom-0 -left-40 blur-3xl animate-float-gentle" style={{ animationDelay: "2s" }} />

            {/* Floating shapes */}
            <div className="absolute w-20 h-20 border-2 border-primary/10 rounded-2xl top-[30%] right-[15%] rotate-12 animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute w-16 h-16 border-2 border-teal-200/20 rounded-full top-[60%] left-[10%] animate-float-gentle" style={{ animationDelay: "0.5s" }} />
            <div className="absolute w-12 h-12 bg-gradient-to-br from-primary/5 to-transparent rounded-lg top-[20%] left-[20%] rotate-45 animate-float-slow" style={{ animationDelay: "1.5s" }} />
        </div>
    );
}

export default function PublicHomePage() {
    const router = useRouter();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authTab, setAuthTab] = useState("login");
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

    // Gallery lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Data from API
    const [upcomingEvents, setUpcomingEvents] = useState<DisplayEvent[]>([]);
    const [sponsors, setSponsors] = useState<DisplaySponsor[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Carousel state
    const [currentSlide, setCurrentSlide] = useState(0);
    const featuredEvents = upcomingEvents.filter(e => e.status === "UPCOMING" || e.status === "ACTIVE").slice(0, 3);

    // Form states
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [activeSection, setActiveSection] = useState("Home");

    // Fetch events and sponsors from API
    useEffect(() => {
        async function fetchData() {
            try {
                setDataLoading(true);

                const [eventsRes, sponsorsRes] = await Promise.all([
                    eventsService.getPublic({ limit: 20 }),
                    sponsorsService.getAll({ isActive: true, limit: 20 }),
                ]);

                if (eventsRes.success && eventsRes.data) {
                    const events = Array.isArray(eventsRes.data) ? eventsRes.data : [];
                    const mappedEvents = events.map((event: Event) => ({
                        id: event.id,
                        title: event.title,
                        shortDescription: event.shortDescription,
                        date: new Date(event.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        time: event.startTime || "09:00 AM",
                        location: [event.location, event.city].filter(Boolean).join(", ") || "Virtual",
                        type: event.type,
                        category: event.category,
                        registrations: event._count?.registrations || 0,
                        capacity: event.capacity,
                        price: event.price,
                        earlyBirdPrice: event.earlyBirdPrice,
                        earlyBirdDeadline: event.earlyBirdDeadline,
                        cmeCredits: event.cmeCredits,
                        image: getEventImage(event.bannerImage, event.thumbnailImage, event.type),
                        featured: event.isFeatured,
                        status: event.status,
                    }));
                    setUpcomingEvents(mappedEvents);
                }

                if (sponsorsRes.success && sponsorsRes.data) {
                    const sponsorList = Array.isArray(sponsorsRes.data) ? sponsorsRes.data : [];
                    const displaySponsors: DisplaySponsor[] = sponsorList.map((sponsor: Sponsor) => ({
                        name: sponsor.name,
                        tier: sponsor.eventSponsors?.[0]?.tier?.toLowerCase() || "silver",
                        logo: sponsor.logo,
                    }));
                    setSponsors(displaySponsors);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setDataLoading(false);
            }
        }
        fetchData();
    }, []);

    // Initialize scroll reveal - re-run when events load or filter changes
    useScrollReveal([dataLoading, activeCategory]);

    // Auto-advance carousel (only when there are featured events)
    useEffect(() => {
        if (featuredEvents.length === 0) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [featuredEvents.length]);

    // Scroll spy for active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = ["hero", "events", "gallery", "about", "contact"];
            const scrollPosition = window.scrollY + 150; // Offset for header

            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        const sectionName = sectionId === "hero" ? "Home" : sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
                        setActiveSection(sectionName);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Check initial position
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const nextSlide = useCallback(() => {
        if (featuredEvents.length === 0) return;
        setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }, [featuredEvents.length]);

    const prevSlide = useCallback(() => {
        if (featuredEvents.length === 0) return;
        setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
    }, [featuredEvents.length]);

    // Filter events - include both UPCOMING and ACTIVE status
    const filteredEvents = useMemo(() => {
        return upcomingEvents.filter((event) => {
            const isValidStatus = event.status === "UPCOMING" || event.status === "ACTIVE";
            if (activeCategory === "All") return isValidStatus;
            return event.category === activeCategory && isValidStatus;
        });
    }, [upcomingEvents, activeCategory]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) return;
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setOtpSent(true);
        setIsLoading(false);
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) return;
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setOtpVerified(true);
        setIsLoading(false);
        setTimeout(() => {
            setIsAuthModalOpen(false);
            router.push("/events");
        }, 1000);
    };

    const [loginError, setLoginError] = useState<string | null>(null);

    const handleEmailLogin = async () => {
        if (!email || !password) return;
        setIsLoading(true);
        setLoginError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setLoginError("Invalid email or password");
            } else {
                setIsAuthModalOpen(false);
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setLoginError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !phone) return;
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setOtpSent(true);
        setIsLoading(false);
    };

    const resetAuthState = () => {
        setOtpSent(false);
        setOtpVerified(false);
        setPhone("");
        setOtp("");
        setEmail("");
        setPassword("");
        setName("");
        setLoginError(null);
    };

    // Gallery lightbox handlers
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    const getSlotsInfo = (event: DisplayEvent) => {
        const remaining = event.capacity - event.registrations;
        if (remaining <= 0) return { text: "Sold Out", color: "text-red-500", urgent: true };
        if (remaining <= 10) return { text: `Only ${remaining} left!`, color: "text-orange-500", urgent: true };
        return { text: `${remaining} spots available`, color: "text-green-600", urgent: false };
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 lg:h-20 items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl gradient-medical flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-lg lg:text-xl leading-none tracking-tight">MedConf</h1>
                                <p className="text-xs text-muted-foreground">Medical Conference Portal</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {["Home", "Events", "Gallery", "About", "Contact"].map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        setActiveSection(item);
                                        const sectionId = item === "Home" ? "hero" : item.toLowerCase();
                                        const element = document.getElementById(sectionId);
                                        if (element) {
                                            element.scrollIntoView({ behavior: "smooth" });
                                        }
                                    }}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                        activeSection === item
                                            ? "text-primary bg-primary/5"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    {item}
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2 lg:gap-3">
                            <Link href="/auth/login">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hidden sm:flex text-sm rounded-full"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/events">
                                <Button
                                    size="sm"
                                    className="gradient-medical text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300 text-sm px-5 lg:px-6 rounded-full"
                                >
                                    Browse Events
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden rounded-full"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t animate-fadeIn">
                            <nav className="flex flex-col gap-1">
                                {["Home", "Events", "Gallery", "About", "Contact"].map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setActiveSection(item);
                                            const sectionId = item === "Home" ? "hero" : item.toLowerCase();
                                            const element = document.getElementById(sectionId);
                                            if (element) {
                                                element.scrollIntoView({ behavior: "smooth" });
                                            }
                                        }}
                                        className={cn(
                                            "px-4 py-3 text-sm font-medium rounded-xl transition-colors text-left",
                                            activeSection === item
                                                ? "text-primary bg-primary/5"
                                                : "text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {item}
                                    </button>
                                ))}
                                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start mt-2 rounded-xl"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Section - Modern Redesign */}
            <section id="hero" className="relative min-h-[90vh] lg:min-h-screen flex items-center bg-gradient-to-br from-[#061c2e] via-[#0a3d5c] to-[#0d5c7a] overflow-hidden">
                {/* Floating Bubbles Background */}
                <FloatingBubbles />

                <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left Side - Text Content */}
                        <div className="text-white space-y-8 text-center lg:text-left">
                            <div
                                data-scroll-reveal
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
                            >
                                <Sparkles className="h-4 w-4 text-cyan-300" />
                                <span className="text-sm font-medium">CME Accredited Programs</span>
                            </div>

                            <h1
                                data-scroll-reveal
                                data-scroll-delay="1"
                                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
                            >
                                Advance Your
                                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300">
                                    Medical Career
                                </span>
                            </h1>

                            <p
                                data-scroll-reveal
                                data-scroll-delay="2"
                                className="text-lg lg:text-xl text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                            >
                                Register for upcoming medical conferences, workshops, and symposiums.
                                Earn CME credits and connect with healthcare leaders worldwide.
                            </p>

                            <div
                                data-scroll-reveal
                                data-scroll-delay="3"
                                className="flex flex-wrap gap-4 justify-center lg:justify-start"
                            >
                                <Link href="#events">
                                    <Button
                                        size="lg"
                                        className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 gap-2 text-base px-8 rounded-full"
                                    >
                                        <Calendar className="h-5 w-5" />
                                        Browse Events
                                    </Button>
                                </Link>
                            </div>

                            {/* Stats with Animation */}
                            <div
                                data-scroll-reveal
                                data-scroll-delay="4"
                                className="grid grid-cols-3 gap-6 lg:gap-10 pt-10 border-t border-white/10"
                            >
                                {[
                                    { value: "50+", label: "Events/Year", icon: Calendar },
                                    { value: "5000+", label: "Attendees", icon: Users },
                                    { value: "200+", label: "Speakers", icon: Mic2 },
                                ].map((stat, idx) => (
                                    <div
                                        key={idx}
                                        className="text-center lg:text-left group"
                                    >
                                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                                            <stat.icon className="h-5 w-5 text-cyan-300/70 group-hover:text-cyan-300 transition-colors" />
                                            <p className="text-3xl lg:text-4xl font-bold counter-number">{stat.value}</p>
                                        </div>
                                        <p className="text-sm text-white/50">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Featured Event Card (Rounded) */}
                        <div
                            data-scroll-reveal="right"
                            data-scroll-delay="2"
                            className="relative"
                        >
                            <div className="relative rounded-[2.5rem] overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                                {featuredEvents.map((event, index) => (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "transition-all duration-700 ease-out",
                                            index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 absolute inset-0 translate-x-8"
                                        )}
                                    >
                                        {/* Event Image */}
                                        <div className="relative h-56 lg:h-72 overflow-hidden rounded-t-[2.5rem]">
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                                style={{ backgroundImage: `url(${event.image})` }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                            {/* Badges */}
                                            <div className="absolute top-5 left-5 flex gap-2 z-10">
                                                <Badge className="bg-white/95 backdrop-blur-sm text-primary border-0 px-3 py-1 rounded-full shadow-lg">
                                                    {event.type}
                                                </Badge>
                                                {event.featured && (
                                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-3 py-1 rounded-full shadow-lg">
                                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                                        Featured
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="absolute top-5 right-5 z-10">
                                                <Badge className="bg-white/95 backdrop-blur-sm text-primary border-0 px-3 py-1 rounded-full shadow-lg">
                                                    <Award className="h-3 w-3 mr-1" />
                                                    {event.cmeCredits} CME
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Event Details */}
                                        <div className="p-6 lg:p-8 space-y-4">
                                            <div>
                                                <h3 className="text-xl lg:text-2xl font-bold text-white line-clamp-2 mb-2">
                                                    {event.title}
                                                </h3>
                                                <p className="text-sm text-white/70 line-clamp-2">
                                                    {event.shortDescription}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-white/80">
                                                <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                                    <Calendar className="h-4 w-4 text-cyan-300" />
                                                    {event.date}
                                                </span>
                                                <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                                    <MapPin className="h-4 w-4 text-cyan-300" />
                                                    {event.location.split(",")[0]}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-5 border-t border-white/20">
                                                <div>
                                                    {event.earlyBirdPrice && (
                                                        <span className="text-sm text-white/50 line-through mr-2">
                                                            ₹{event.price.toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span className="text-2xl lg:text-3xl font-bold text-cyan-300">
                                                        ₹{(event.earlyBirdPrice || event.price).toLocaleString()}
                                                    </span>
                                                    {event.earlyBirdPrice && (
                                                        <p className="text-xs text-emerald-400 font-medium mt-1">Early bird pricing</p>
                                                    )}
                                                </div>
                                                <Link href={`/events/${event.id}/register`}>
                                                    <Button className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6">
                                                        <Ticket className="h-4 w-4" />
                                                        Register Now
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Carousel Controls */}
                            <button
                                onClick={prevSlide}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white shadow-2xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all duration-300 z-10"
                                aria-label="Previous slide"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white shadow-2xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all duration-300 z-10"
                                aria-label="Next slide"
                            >
                                <ArrowRight className="h-5 w-5 text-gray-600" />
                            </button>

                            {/* Indicators */}
                            <div className="flex justify-center gap-3 mt-8">
                                {featuredEvents.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={cn(
                                            "h-2.5 rounded-full transition-all duration-500",
                                            index === currentSlide
                                                ? "w-10 bg-white"
                                                : "w-2.5 bg-white/40 hover:bg-white/60"
                                        )}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Curved Bottom Wave */}
                <svg className="hero-wave" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.08" />
                    <path d="M0 120L60 115C120 110 240 100 360 95C480 90 600 90 720 92C840 95 960 100 1080 100C1200 100 1320 95 1380 92L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc" />
                </svg>
            </section>

            {/* Events Section - Premium Redesign */}
            <section id="events" className="py-20 lg:py-32 bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden">
                <DecorativeBackground />

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    {/* Section Header */}
                    <div className="text-center mb-16" data-scroll-reveal>
                        <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 px-5 py-1.5 rounded-full">
                            <Calendar className="h-3.5 w-3.5 mr-2" />
                            Upcoming Events
                        </Badge>
                        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
                            Explore Medical Events
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Find and register for conferences, workshops, and CME sessions tailored for healthcare professionals
                        </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div
                        data-scroll-reveal
                        data-scroll-delay="1"
                        className="flex flex-wrap justify-center gap-3 mb-14 relative z-20"
                    >
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setActiveCategory(category)}
                                className={cn(
                                    "px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 cursor-pointer border relative z-20",
                                    activeCategory === category
                                        ? "bg-primary text-white border-primary shadow-lg"
                                        : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary hover:-translate-y-0.5"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Events Grid - Premium Cards */}
                    {dataLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredEvents?.length === 0 ? (
                        <div className="text-center py-16">
                            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                            <p className="text-muted-foreground">
                                {activeCategory === "All"
                                    ? "There are no upcoming events at the moment. Check back soon!"
                                    : `No events found in ${activeCategory} category.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredEvents?.map((event, index) => {
                                const slots = getSlotsInfo(event);
                                const isHovered = hoveredEvent === event.id;

                                return (
                                    <div
                                        key={event.id}
                                        data-scroll-reveal="scale"
                                        data-scroll-delay={String((index % 3) + 1)}
                                        className="relative bg-white rounded-[2rem] overflow-hidden border border-border/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer h-[420px] flex flex-col"
                                        onMouseEnter={() => setHoveredEvent(event.id)}
                                        onMouseLeave={() => setHoveredEvent(null)}
                                    >
                                        {/* Image Container */}
                                        <div className="relative overflow-hidden h-48 flex-shrink-0">
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                                style={{ backgroundImage: `url(${event.image})` }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                            {/* Floating Badges */}
                                            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                                                <Badge className="bg-white/95 backdrop-blur-sm text-primary border-0 shadow-md rounded-full px-3">
                                                    {event.type}
                                                </Badge>
                                                {(event.cmeCredits ?? 0) > 0 && (
                                                    <Badge className="bg-primary/95 text-white border-0 shadow-md backdrop-blur-sm rounded-full px-3">
                                                        <Award className="h-3 w-3 mr-1" />
                                                        {event.cmeCredits} CME
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Urgency Badge */}
                                            {slots.urgent && (
                                                <div className="absolute top-4 right-4 z-10">
                                                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md backdrop-blur-sm animate-pulse rounded-full px-3">
                                                        {slots.text}
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Bottom Info Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                                <div className="flex items-center gap-3 text-white/90 text-sm mb-2">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {event.date}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-white/50" />
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {event.location.split(",")[0]}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-white leading-tight text-lg line-clamp-2">
                                                    {event.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5 lg:p-6 flex-1 flex flex-col">
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {event.shortDescription}
                                            </p>

                                            {/* Price Section */}
                                            <div className="pt-3 border-t border-border/50 mt-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        {event.earlyBirdPrice && (
                                                            <span className="text-sm text-muted-foreground line-through mr-2">
                                                                ₹{event.price.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span className="text-xl font-bold text-primary">
                                                            ₹{(event.earlyBirdPrice || event.price).toLocaleString()}
                                                        </span>
                                                        {event.earlyBirdDeadline && (
                                                            <p className="text-xs text-green-600 font-medium mt-0.5">
                                                                Early bird available
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <Users className="h-4 w-4" />
                                                        <span>{event.registrations}/{event.capacity}</span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Link href={`/events/${event.id}`} className="flex-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full gap-2 rounded-full border-primary/30 hover:bg-primary/5 hover:border-primary"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Details
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/events/${event.id}/register`} className="flex-1">
                                                        <Button
                                                            size="sm"
                                                            className={cn(
                                                                "w-full gap-2 transition-all duration-300 rounded-full",
                                                                isHovered
                                                                    ? "gradient-medical text-white shadow-lg"
                                                                    : "bg-primary text-white hover:bg-primary/90"
                                                            )}
                                                        >
                                                            Register
                                                            <ArrowRight className={cn(
                                                                "h-4 w-4 transition-transform duration-300",
                                                                isHovered && "translate-x-1"
                                                            )} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* View All CTA */}
                    <div
                        data-scroll-reveal
                        className="text-center mt-16"
                    >
                        <Link href="/events">
                            <Button variant="outline" size="lg" className="gap-2 px-8 rounded-full border-2 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                                View All Events
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Bottom Curve */}
                <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="white" />
                </svg>
            </section>

            {/* Sponsors Section - Tier-based Showcase */}
            <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    {/* Section Header */}
                    <div data-scroll-reveal className="text-center mb-16">
                        <p className="text-primary font-semibold tracking-wider uppercase text-sm mb-3">
                            Our Partners
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                            Supported by Leading Organizations
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-400 mx-auto rounded-full" />
                    </div>

                    {sponsors.length > 0 ? (
                        <div className="space-y-12">
                            {/* Platinum Sponsors */}
                            {sponsors.filter(s => s.tier === "platinum").length > 0 && (
                                <div data-scroll-reveal>
                                    <div className="flex items-center justify-center gap-3 mb-8">
                                        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-slate-300" />
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white rounded-full text-sm font-medium">
                                            <Crown className="h-4 w-4" />
                                            Platinum Partners
                                        </div>
                                        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-slate-300" />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-8">
                                        {sponsors.filter(s => s.tier === "platinum").map((sponsor, idx) => (
                                            <div
                                                key={idx}
                                                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200 hover:border-slate-300 min-w-[200px]"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative flex flex-col items-center">
                                                    {sponsor.logo ? (
                                                        <Image
                                                            src={sponsor.logo}
                                                            alt={sponsor.name}
                                                            width={120}
                                                            height={60}
                                                            className="h-16 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                                                            {sponsor.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <p className="mt-4 font-semibold text-foreground text-center">
                                                        {sponsor.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gold Sponsors */}
                            {sponsors.filter(s => s.tier === "gold").length > 0 && (
                                <div data-scroll-reveal>
                                    <div className="flex items-center justify-center gap-3 mb-8">
                                        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-amber-300" />
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full text-sm font-medium">
                                            <Star className="h-4 w-4" />
                                            Gold Partners
                                        </div>
                                        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-amber-300" />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {sponsors.filter(s => s.tier === "gold").map((sponsor, idx) => (
                                            <div
                                                key={idx}
                                                className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-amber-100 hover:border-amber-200 min-w-[160px]"
                                            >
                                                <div className="flex flex-col items-center">
                                                    {sponsor.logo ? (
                                                        <Image
                                                            src={sponsor.logo}
                                                            alt={sponsor.name}
                                                            width={100}
                                                            height={50}
                                                            className="h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-lg font-bold shadow group-hover:scale-105 transition-transform">
                                                            {sponsor.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <p className="mt-3 text-sm font-medium text-foreground text-center">
                                                        {sponsor.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Silver Sponsors */}
                            {sponsors.filter(s => s.tier === "silver").length > 0 && (
                                <div data-scroll-reveal>
                                    <div className="flex items-center justify-center gap-3 mb-8">
                                        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-gray-300" />
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-500 text-white rounded-full text-sm font-medium">
                                            <Medal className="h-4 w-4" />
                                            Silver Partners
                                        </div>
                                        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-gray-300" />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {sponsors.filter(s => s.tier === "silver").map((sponsor, idx) => (
                                            <div
                                                key={idx}
                                                className="group bg-white/80 backdrop-blur rounded-lg px-5 py-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {sponsor.logo ? (
                                                        <Image
                                                            src={sponsor.logo}
                                                            alt={sponsor.name}
                                                            width={80}
                                                            height={40}
                                                            className="h-8 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-bold">
                                                            {sponsor.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {sponsor.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">Partner information coming soon</p>
                        </div>
                    )}

                    {/* Become a Sponsor CTA */}
                    <div data-scroll-reveal className="mt-16 text-center">
                        <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-primary/5 via-teal-50 to-primary/5 rounded-2xl border border-primary/10">
                            <div className="text-center sm:text-left">
                                <p className="font-semibold text-foreground">Become a Partner</p>
                                <p className="text-sm text-muted-foreground">Join leading organizations in supporting medical education</p>
                            </div>
                            <Button className="gradient-medical text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all">
                                <Heart className="h-4 w-4 mr-2" />
                                Partner With Us
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="py-20 lg:py-28 bg-slate-50 relative overflow-hidden">
                <DecorativeBackground />

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    {/* Section Header */}
                    <div data-scroll-reveal className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 px-5 py-1.5 rounded-full">
                            <Camera className="h-3.5 w-3.5 mr-2" />
                            Event Gallery
                        </Badge>
                        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
                            Moments from Our Events
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Explore highlights from our past conferences, workshops, and networking sessions
                        </p>
                    </div>

                    {/* Gallery Grid - Masonry Style */}
                    <div data-scroll-reveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {galleryImages.map((image, index) => (
                            <div
                                key={image.id}
                                className={cn(
                                    "relative group cursor-pointer overflow-hidden rounded-2xl",
                                    // Make some items span 2 rows for masonry effect
                                    index === 0 || index === 5 ? "row-span-2" : "",
                                    index === 0 || index === 5 ? "h-[300px] md:h-[400px]" : "h-[180px] md:h-[200px]"
                                )}
                                onClick={() => openLightbox(index)}
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                                {/* Content on Hover */}
                                <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <Badge className="w-fit mb-2 bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                                        {image.category}
                                    </Badge>
                                    <p className="text-white font-medium text-sm line-clamp-2">
                                        {image.alt}
                                    </p>
                                </div>

                                {/* View Icon */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                                    <Eye className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View More CTA */}
                    <div data-scroll-reveal className="text-center mt-12">
                        <Link href="/gallery">
                            <Button variant="outline" size="lg" className="gap-2 px-8 rounded-full border-2 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                                <Images className="h-4 w-4" />
                                View Full Gallery
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Bottom Curve */}
                <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="white" />
                </svg>
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6 text-white" />
                    </button>

                    {/* Navigation - Next */}
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6 text-white" />
                    </button>

                    {/* Image Container */}
                    <div className="relative max-w-5xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={galleryImages[lightboxIndex].src}
                            alt={galleryImages[lightboxIndex].alt}
                            width={1200}
                            height={800}
                            className="object-contain max-h-[85vh] rounded-lg"
                        />

                        {/* Image Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                            <Badge className="mb-2 bg-white/20 backdrop-blur-sm text-white border-0">
                                {galleryImages[lightboxIndex].category}
                            </Badge>
                            <p className="text-white font-medium text-lg">
                                {galleryImages[lightboxIndex].alt}
                            </p>
                            <p className="text-white/60 text-sm mt-1">
                                {lightboxIndex + 1} of {galleryImages.length}
                            </p>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
                        {galleryImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
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

            {/* About Us Section - Timeline Design */}
            <section id="about" className="py-20 lg:py-28 bg-white relative overflow-hidden">
                <DecorativeBackground />

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    {/* Section Header */}
                    <div data-scroll-reveal className="text-center mb-16 lg:mb-20">
                        <p className="text-primary font-semibold tracking-wider uppercase text-sm mb-3">
                            About Us
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                            Why Choose MedConf?
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-400 mx-auto rounded-full" />
                    </div>

                    {/* Timeline */}
                    <div className="relative max-w-5xl mx-auto">
                        {/* Central Line */}
                        <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-teal-400 to-primary/20 lg:-translate-x-1/2" />

                        {/* Timeline Items */}
                        {[
                            {
                                icon: Award,
                                title: "CME Accredited Events",
                                description: "All our conferences and workshops are accredited by recognized medical councils including MCI, State Medical Councils, and International Bodies. Earn verified CME credits that count towards your professional development.",
                                color: "from-teal-500 to-cyan-500",
                                year: "Quality"
                            },
                            {
                                icon: Zap,
                                title: "Seamless Registration",
                                description: "Experience hassle-free registration with our OTP-based verification system. Secure payment gateway integration ensures your transactions are safe. Register in under 2 minutes!",
                                color: "from-amber-500 to-orange-500",
                                year: "Speed"
                            },
                            {
                                icon: GraduationCap,
                                title: "Instant Digital Certificates",
                                description: "No more waiting for certificates! Download your CME certificates instantly after event completion. QR-verified certificates that are accepted nationwide for professional records.",
                                color: "from-emerald-500 to-green-500",
                                year: "Convenience"
                            },
                            {
                                icon: Globe,
                                title: "Hybrid Event Access",
                                description: "Can't attend in person? Join virtually with our high-quality live streaming. Access recorded sessions, presentation materials, and interactive Q&A from anywhere in the world.",
                                color: "from-violet-500 to-purple-500",
                                year: "Flexibility"
                            }
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "relative flex items-center mb-12 lg:mb-16 last:mb-0",
                                    idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                                )}
                            >
                                {/* Content Card */}
                                <div className={cn(
                                    "ml-12 lg:ml-0 lg:w-[calc(50%-40px)]",
                                    idx % 2 === 0 ? "lg:pr-8 lg:text-right" : "lg:pl-8 lg:text-left"
                                )}>
                                    <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 group hover:-translate-y-1">
                                        {/* Year/Label Badge */}
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white mb-4",
                                            `bg-gradient-to-r ${item.color}`
                                        )}>
                                            {item.year}
                                        </div>

                                        {/* Mobile Icon (shown only on mobile) */}
                                        <div className={cn(
                                            "lg:hidden w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br text-white",
                                            item.color
                                        )}>
                                            <item.icon className="h-6 w-6" />
                                        </div>

                                        <h3 className="text-xl font-bold mb-3 text-foreground">
                                            {item.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Center Icon Node */}
                                <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 flex items-center justify-center">
                                    <div className="relative">
                                        {/* Icon Container */}
                                        <div className={cn(
                                            "relative w-8 h-8 lg:w-14 lg:h-14 rounded-full flex items-center justify-center bg-gradient-to-br text-white shadow-lg ring-4 ring-white",
                                            item.color
                                        )}>
                                            <item.icon className="h-4 w-4 lg:h-7 lg:w-7" />
                                        </div>
                                    </div>
                                </div>

                                {/* Empty Space for other side */}
                                <div className="hidden lg:block lg:w-[calc(50%-40px)]" />
                            </div>
                        ))}

                        {/* End Node */}
                        <div className="absolute left-4 lg:left-1/2 bottom-0 lg:-translate-x-1/2 -mb-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-teal-400 ring-4 ring-white shadow-lg" />
                        </div>
                    </div>

                    {/* CTA */}
                    <div data-scroll-reveal className="text-center mt-16">
                        <Button
                            size="lg"
                            className="gradient-medical text-white rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Calendar className="h-5 w-5 mr-2" />
                            Explore Our Events
                        </Button>
                    </div>
                </div>

                {/* Bottom Curve */}
                <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 80L80 74.7C160 69 320 59 480 58.7C640 59 800 69 960 69.3C1120 69 1280 59 1360 53.3L1440 48V80H1360C1280 80 1120 80 960 80C800 80 640 80 480 80C320 80 160 80 80 80H0Z" fill="white" />
                </svg>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 lg:py-28 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8">
                    <div
                        data-scroll-reveal
                        className="max-w-5xl mx-auto relative"
                    >
                        {/* Base Card - Get in Touch */}
                        <div className="bg-gradient-to-br from-[#061c2e] via-[#0a3d5c] to-[#0d5c7a] text-white rounded-[2.5rem] p-8 lg:p-12 lg:pr-[45%] relative overflow-hidden shadow-2xl">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                            <div className="absolute top-1/2 left-1/3 w-32 h-32 border border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />

                            <div className="relative z-10">
                                <h2 className="text-2xl lg:text-3xl font-bold mb-4">Get in Touch</h2>
                                <p className="text-white/70 mb-8 text-lg">
                                    Have questions about our events or need assistance with registration?
                                </p>
                                <div className="space-y-6">
                                    {[
                                        { icon: Mail, label: "Email", value: "conference@medconf.edu" },
                                        { icon: Phone, label: "Phone", value: "+91 11 2659 3000" },
                                        { icon: Building2, label: "Address", value: "Medical College Campus, New Delhi" }
                                    ].map((contact, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                <contact.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/50">{contact.label}</p>
                                                <p className="font-medium">{contact.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating Card - Overlapping */}
                        <div className="lg:absolute lg:right-8 lg:top-1/2 lg:-translate-y-1/2 mt-6 lg:mt-0 bg-white rounded-[2rem] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.3)] p-8 lg:p-10 text-center w-full lg:w-[340px] hover:shadow-[0_35px_100px_-15px_rgba(0,0,0,0.35)] hover:-translate-y-[52%] transition-all duration-500 border border-border/10">
                            <div className="w-20 h-20 rounded-2xl gradient-medical flex items-center justify-center mx-auto mb-5 shadow-xl">
                                <GraduationCap className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="font-bold text-2xl mb-2">MedConf</h3>
                            <p className="text-muted-foreground mb-6 text-sm">
                                Medical Conference Management System
                            </p>
                            <Link href="/events">
                                <Button
                                    size="lg"
                                    className="gradient-medical text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8"
                                >
                                    Browse Events
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Curve */}
                <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 80L48 69.3C96 59 192 37 288 32C384 27 480 37 576 48C672 59 768 69 864 69.3C960 69 1056 59 1152 48C1248 37 1344 27 1392 21.3L1440 16V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="#0f172a" />
                </svg>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-slate-900 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 to-transparent -top-60 -right-60" />
                    <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-teal-500/10 to-transparent -bottom-40 -left-40" />
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-2xl gradient-medical flex items-center justify-center shadow-lg">
                                    <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <span className="font-bold text-xl">MedConf</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                The leading platform for medical conferences and CME events in India.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <div className="flex flex-col gap-3 text-sm text-slate-400">
                                <Link href="#events" className="hover:text-white transition-colors animated-underline inline-block">Events</Link>
                                <Link href="#about" className="hover:text-white transition-colors animated-underline inline-block">About Us</Link>
                                <Link href="#contact" className="hover:text-white transition-colors animated-underline inline-block">Contact</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <div className="flex flex-col gap-3 text-sm text-slate-400">
                                <Link href="#" className="hover:text-white transition-colors animated-underline inline-block">Privacy Policy</Link>
                                <Link href="#" className="hover:text-white transition-colors animated-underline inline-block">Terms of Service</Link>
                                <Link href="#" className="hover:text-white transition-colors animated-underline inline-block">Refund Policy</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Connect</h4>
                            <div className="flex gap-3">
                                {[
                                    { name: "Twitter", initial: "T" },
                                    { name: "LinkedIn", initial: "L" },
                                    { name: "Facebook", initial: "F" }
                                ].map((social) => (
                                    <button
                                        key={social.name}
                                        className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                                        aria-label={social.name}
                                    >
                                        <span className="text-sm font-medium">{social.initial}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-400">
                            © 2025 MedConf. All rights reserved.
                        </p>
                        <Link
                            href="/auth/login"
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Admin Login
                        </Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}
