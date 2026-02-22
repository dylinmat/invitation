"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  Send, 
  Users, 
  CheckCircle2, 
  MessageSquare, 
  Calendar,
  BarChart3,
  Bell,
  Heart,
  ArrowRight,
  Check,
  Menu,
  X,
  Star
} from "lucide-react";

// Professional wedding/event photos from Unsplash
const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
  invitation: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
  rsvp: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  gallery: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
  couple1: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=200&q=80",
  couple2: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=200&q=80",
  couple3: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=200&q=80",
  weddingReception: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80",
  birthdayParty: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80",
  gardenCeremony: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=400&q=80",
  beachCelebration: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
  babyShower: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80",
  anniversary: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  graduation: "https://images.unsplash.com/photo-1541872703-74c5963631df?w=400&q=80",
  engagement: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=80",
  step1: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  step2: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=600&q=80",
  step3: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80",
  testimonial1: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
  testimonial2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  testimonial3: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
};

const features = [
  {
    icon: Send,
    title: "Send Anywhere",
    description: "Email or text invitations instantly. Guests receive beautifully formatted invites on any device.",
    image: PHOTOS.invitation
  },
  {
    icon: CheckCircle2,
    title: "Track RSVPs",
    description: "See who's coming in real-time. Automatic reminders for guests who haven't responded.",
    image: PHOTOS.rsvp
  },
  {
    icon: Users,
    title: "Guest Management",
    description: "Import contacts, manage plus-ones, dietary restrictions, and seating arrangements.",
    image: PHOTOS.gallery
  },
  {
    icon: MessageSquare,
    title: "Stay Connected",
    description: "Send updates, reminders, and thank you messages to all guests or specific groups.",
    image: PHOTOS.beachCelebration
  },
  {
    icon: BarChart3,
    title: "Insights & Reports",
    description: "Export guest lists, meal preferences, and attendance reports anytime.",
    image: PHOTOS.step1
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Automatic RSVP reminders and event countdowns for you and your guests.",
    image: PHOTOS.engagement
  }
];

const howItWorks = [
  {
    step: "1",
    title: "Import Your Guests",
    description: "Upload from spreadsheet or add contacts manually. We organize everything for you.",
    image: PHOTOS.step1
  },
  {
    step: "2",
    title: "Send Invitations",
    description: "Choose email or SMS. Deliver instantly or schedule for later.",
    image: PHOTOS.step2
  },
  {
    step: "3",
    title: "Track Everything",
    description: "Watch RSVPs roll in, manage responses, and communicate with guests—all in one place.",
    image: PHOTOS.step3
  }
];

const testimonials = [
  {
    quote: "RSVP tracking saved me hours of phone calls. I could see exactly who was coming and message those who hadn't replied.",
    author: "Sarah Mitchell",
    event: "Wedding",
    stat: "150 guests",
    image: PHOTOS.testimonial1,
    avatar: PHOTOS.couple1
  },
  {
    quote: "The automatic reminders were a lifesaver. No more awkward follow-ups with friends who forgot to RSVP.",
    author: "Michael Torres",
    event: "40th Birthday",
    stat: "89% response",
    image: PHOTOS.testimonial2,
    avatar: PHOTOS.couple2
  },
  {
    quote: "Managing plus-ones and dietary restrictions was so easy. The guest list practically organized itself.",
    author: "Emma & David",
    event: "Baby Shower",
    stat: "45 guests",
    image: PHOTOS.testimonial3,
    avatar: PHOTOS.couple3
  }
];

const eventTypes = [
  { label: "Weddings", image: PHOTOS.weddingReception },
  { label: "Birthdays", image: PHOTOS.birthdayParty },
  { label: "Baby Showers", image: PHOTOS.babyShower },
  { label: "Dinner Parties", image: PHOTOS.anniversary }
];

const galleryPhotos = [
  { image: PHOTOS.weddingReception, label: "Wedding Reception" },
  { image: PHOTOS.birthdayParty, label: "Birthday Party" },
  { image: PHOTOS.gardenCeremony, label: "Garden Ceremony" },
  { image: PHOTOS.beachCelebration, label: "Beach Celebration" },
  { image: PHOTOS.babyShower, label: "Baby Shower" },
  { image: PHOTOS.anniversary, label: "Anniversary Dinner" },
  { image: PHOTOS.graduation, label: "Graduation Party" },
  { image: PHOTOS.engagement, label: "Engagement Party" }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-stone-800">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#FDF8F5]/95 backdrop-blur-sm shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-serif font-semibold text-stone-900">EIOS</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">How It Works</a>
              <a href="#stories" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Stories</a>
              <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Sign In</Link>
              <Link href="/auth/register">
                <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-6 text-sm font-medium">
                  Start Planning
                </Button>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-stone-200">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-stone-600 hover:text-stone-900 py-2">Features</a>
                <a href="#how-it-works" className="text-stone-600 hover:text-stone-900 py-2">How It Works</a>
                <a href="#stories" className="text-stone-600 hover:text-stone-900 py-2">Stories</a>
                <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 py-2">Sign In</Link>
                <Link href="/auth/register">
                  <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full w-full">
                    Start Planning
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Photo */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full mb-6">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-stone-700 text-sm font-medium">Trusted by 50,000+ hosts</span>
              </div>
              
              <h1 className="font-serif text-5xl lg:text-6xl xl:text-7xl text-stone-900 leading-[1.1] mb-6">
                Plan your celebration with confidence
              </h1>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-lg">
                From intimate dinners to grand weddings, manage your guest list, 
                track RSVPs, and communicate with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-8 py-6 text-base font-medium inline-flex items-center gap-2">
                    Start Planning
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-stone-500">
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> No credit card to start</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Cancel anytime</span>
              </div>
            </div>
            
            {/* Hero Image - Wedding/Event Photo */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={PHOTOS.hero}
                  alt="Beautiful wedding celebration with couple at sunset"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Overlay Stats */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-stone-900">127</p>
                      <p className="text-xs text-stone-500">Attending</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-stone-900">23</p>
                      <p className="text-xs text-stone-500">Pending</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-600">89%</p>
                      <p className="text-xs text-stone-500">Response</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Types Gallery */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-stone-500 text-sm uppercase tracking-wider mb-8">Perfect for any occasion</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {eventTypes.map((event, i) => (
              <div key={i} className="relative rounded-xl aspect-[4/3] overflow-hidden group cursor-pointer">
                <Image
                  src={event.image}
                  alt={`${event.label} celebration`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="font-medium text-white">{event.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 lg:py-32 bg-[#FDF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">Everything you need to host</h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">
              Powerful tools to manage invitations, track responses, and communicate with your guests.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300 group">
                <div className="h-48 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={`${feature.title} feature`}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="font-serif text-xl text-stone-900 mb-2">{feature.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Photos */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">How it works</h2>
            <p className="text-stone-600 text-lg">Get started in minutes, not hours</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center group">
                <div className="relative rounded-2xl aspect-video mb-6 overflow-hidden shadow-lg">
                  <Image
                    src={item.image}
                    alt={`Step ${item.step}: ${item.title}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center text-lg font-serif mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">{item.title}</h3>
                <p className="text-stone-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials with Photos */}
      <section id="stories" className="py-20 lg:py-32 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl mb-4">Celebration stories</h2>
            <p className="text-stone-400 text-lg">Real hosts, real events, real joy</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-stone-800/50 rounded-2xl overflow-hidden border border-stone-700 group">
                {/* Photo */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={t.image}
                    alt={`${t.author}'s ${t.event}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
                </div>
                <div className="p-6">
                  <p className="text-stone-300 mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-rose-500">
                        <Image
                          src={t.avatar}
                          alt={t.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-white">{t.author}</p>
                        <p className="text-sm text-stone-400">{t.event}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-rose-600 text-white px-3 py-1 rounded-full">{t.stat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Photo Gallery */}
      <section className="py-20 lg:py-32 bg-[#FDF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">Join thousands of celebrations</h2>
            <p className="text-stone-600 text-lg">Weddings, birthdays, milestones, and memories</p>
          </div>
          
          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryPhotos.map((photo, i) => (
              <div key={i} className="relative rounded-xl aspect-square overflow-hidden group cursor-pointer">
                <Image
                  src={photo.image}
                  alt={photo.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-sm font-medium text-center px-2">{photo.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-6">
            Ready to plan your perfect event?
          </h2>
          <p className="text-stone-600 text-lg mb-8">
            Start organizing your guest list today. Simple, elegant, and stress-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-10 py-6 text-lg font-medium inline-flex items-center gap-2">
                Start Planning Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-stone-400 mt-6">
            Start at no cost • Upgrade anytime for advanced features
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-semibold text-stone-900">EIOS</span>
            </div>
            <p className="text-sm text-stone-500">
              © {new Date().getFullYear()} Event Invitation OS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Privacy</Link>
              <Link href="#" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Terms</Link>
              <Link href="#" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Pricing</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
