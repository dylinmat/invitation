"use client";

import Link from "next/link";
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

const features = [
  {
    icon: Send,
    title: "Send Anywhere",
    description: "Email or text invitations instantly. Guests receive beautifully formatted invites on any device."
  },
  {
    icon: CheckCircle2,
    title: "Track RSVPs",
    description: "See who's coming in real-time. Automatic reminders for guests who haven't responded."
  },
  {
    icon: Users,
    title: "Guest Management",
    description: "Import contacts, manage plus-ones, dietary restrictions, and seating arrangements."
  },
  {
    icon: MessageSquare,
    title: "Stay Connected",
    description: "Send updates, reminders, and thank you messages to all guests or specific groups."
  },
  {
    icon: BarChart3,
    title: "Insights & Reports",
    description: "Export guest lists, meal preferences, and attendance reports anytime."
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Automatic RSVP reminders and event countdowns for you and your guests."
  }
];

const howItWorks = [
  {
    step: "1",
    title: "Import Your Guests",
    description: "Upload from spreadsheet or add contacts manually. We organize everything for you."
  },
  {
    step: "2",
    title: "Send Invitations",
    description: "Choose email or SMS. Deliver instantly or schedule for later."
  },
  {
    step: "3",
    title: "Track Everything",
    description: "Watch RSVPs roll in, manage responses, and communicate with guests—all in one place."
  }
];

const testimonials = [
  {
    quote: "RSVP tracking saved me hours of phone calls. I could see exactly who was coming and message those who hadn't replied.",
    author: "Sarah Mitchell",
    event: "Wedding",
    stat: "150 guests",
    image: "bg-rose-100"
  },
  {
    quote: "The automatic reminders were a lifesaver. No more awkward follow-ups with friends who forgot to RSVP.",
    author: "Michael Torres",
    event: "40th Birthday",
    stat: "89% response",
    image: "bg-amber-100"
  },
  {
    quote: "Managing plus-ones and dietary restrictions was so easy. The guest list practically organized itself.",
    author: "Emma & David",
    event: "Baby Shower",
    stat: "45 guests",
    image: "bg-green-100"
  }
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
              <Link href="/auth/login">
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
                <Link href="/auth/login">
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
                <Link href="/auth/login">
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
                {/* Placeholder for real wedding/event photo */}
                <div className="aspect-[4/3] bg-gradient-to-br from-rose-100 to-amber-50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Heart className="w-16 h-16 text-rose-300 mx-auto mb-4" />
                    <p className="font-serif text-2xl text-rose-800 mb-2">Your Event Photo</p>
                    <p className="text-rose-600 text-sm">Beautiful celebration moments</p>
                  </div>
                </div>
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
            {[
              { label: "Weddings", color: "bg-rose-100", icon: Heart },
              { label: "Birthdays", color: "bg-amber-100", icon: Calendar },
              { label: "Baby Showers", color: "bg-green-100", icon: Heart },
              { label: "Dinner Parties", color: "bg-blue-100", icon: Heart },
            ].map((event, i) => (
              <div key={i} className={`${event.color} rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-4`}>
                <event.icon className="w-8 h-8 text-stone-400 mb-2" />
                <span className="font-medium text-stone-700">{event.label}</span>
                {/* Placeholder for actual event photos */}
                <span className="text-xs text-stone-500 mt-1">Photo placeholder</span>
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
              <div key={i} className="bg-white rounded-2xl p-8 border border-stone-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{feature.description}</p>
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
            {[
              { step: "1", title: "Import Your Guests", desc: "Upload from spreadsheet or add contacts manually.", image: "bg-blue-50" },
              { step: "2", title: "Send Beautiful Invites", desc: "Choose email or SMS. Schedule or send instantly.", image: "bg-rose-50" },
              { step: "3", title: "Track & Celebrate", desc: "Watch RSVPs arrive and enjoy your event.", image: "bg-amber-50" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`${item.image} rounded-2xl aspect-video mb-6 flex items-center justify-center`}>
                  <span className="text-stone-400 text-sm">Step {item.step} Image</span>
                </div>
                <div className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center text-lg font-serif mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">{item.title}</h3>
                <p className="text-stone-600 text-sm">{item.desc}</p>
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
              <div key={i} className="bg-stone-800/50 rounded-2xl overflow-hidden border border-stone-700">
                {/* Photo Placeholder */}
                <div className={`${t.image} h-48 flex items-center justify-center`}>
                  <span className="text-stone-500 text-sm font-medium">{t.author}&apos;s {t.event}</span>
                </div>
                <div className="p-6">
                  <p className="text-stone-300 mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{t.author}</p>
                      <p className="text-sm text-stone-400">{t.event}</p>
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
            {[
              { color: "bg-rose-100", label: "Wedding Reception" },
              { color: "bg-amber-100", label: "Birthday Party" },
              { color: "bg-green-100", label: "Garden Ceremony" },
              { color: "bg-blue-100", label: "Beach Celebration" },
              { color: "bg-purple-100", label: "Baby Shower" },
              { color: "bg-orange-100", label: "Anniversary Dinner" },
              { color: "bg-teal-100", label: "Graduation Party" },
              { color: "bg-pink-100", label: "Engagement Party" },
            ].map((photo, i) => (
              <div key={i} className={`${photo.color} rounded-xl aspect-square flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform cursor-pointer`}>
                <Heart className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-xs text-stone-600 text-center font-medium">{photo.label}</span>
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
            <Link href="/auth/login">
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
