"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  Send, 
  Users, 
  CheckCircle2, 
  Mail, 
  MessageSquare, 
  Calendar,
  BarChart3,
  Bell,
  Smartphone,
  Heart,
  ArrowRight,
  Check,
  Menu,
  X,
  Sparkles
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
    author: "Sarah M.",
    event: "Wedding",
    stat: "150 guests tracked"
  },
  {
    quote: "The automatic reminders were a lifesaver. No more awkward follow-ups with friends who forgot to RSVP.",
    author: "Michael T.",
    event: "Birthday Party",
    stat: "89% response rate"
  },
  {
    quote: "Managing plus-ones and dietary restrictions was so easy. The guest list practically organized itself.",
    author: "Emma L.",
    event: "Baby Shower",
    stat: "45 guests managed"
  }
];

const stats = [
  { number: "50K+", label: "Events Hosted" },
  { number: "2M+", label: "Invitations Sent" },
  { number: "98%", label: "Deliverability" },
  { number: "4.9★", label: "User Rating" }
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
              <a href="#testimonials" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Reviews</a>
              <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Sign In</Link>
              <Link href="/auth/login">
                <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-6 text-sm font-medium">
                  Get Started Free
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
                <a href="#testimonials" className="text-stone-600 hover:text-stone-900 py-2">Reviews</a>
                <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 py-2">Sign In</Link>
                <Link href="/auth/login">
                  <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span className="text-rose-700 text-sm font-medium">Free forever plan available</span>
              </div>
              
              <h1 className="font-serif text-5xl lg:text-6xl xl:text-7xl text-stone-900 leading-[1.1] mb-6">
                The easiest way to manage your guest list
              </h1>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-lg">
                Send invitations, track RSVPs, and communicate with guests—all in one place. 
                No more spreadsheets or missed responses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-8 py-6 text-base font-medium inline-flex items-center gap-2">
                    Start Managing Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-stone-500">
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Free forever</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Unlimited guests</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> No credit card</span>
              </div>
            </div>
            
            {/* Hero Visual - Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-stone-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-stone-900">Guest List Dashboard</h3>
                  <span className="text-sm text-green-600 font-medium">● Live</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">89</p>
                    <p className="text-xs text-green-600">Attending</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">12</p>
                    <p className="text-xs text-amber-600">Pending</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-rose-700">8</p>
                    <p className="text-xs text-rose-600">Declined</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: "Sarah Chen", status: "Attending", plus: "+1" },
                    { name: "Michael Torres", status: "Attending", plus: "" },
                    { name: "Emma Wilson", status: "Pending", plus: "" },
                  ].map((guest, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-xs font-medium text-stone-600">
                          {guest.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-stone-700">{guest.name}</span>
                        {guest.plus && <span className="text-xs text-stone-500">{guest.plus}</span>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${guest.status === 'Attending' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {guest.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl lg:text-4xl font-serif font-semibold text-stone-900">{stat.number}</p>
                <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
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

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">Simple as 1-2-3</h2>
            <p className="text-stone-600 text-lg">Get started in minutes, not hours</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center text-2xl font-serif mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="font-serif text-2xl text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-32 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl mb-4">Loved by hosts</h2>
            <p className="text-stone-400 text-lg">See why thousands choose EIOS for their events</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-stone-800/50 rounded-2xl p-8 border border-stone-700">
                <p className="text-stone-300 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{t.author}</p>
                    <p className="text-sm text-stone-400">{t.event}</p>
                  </div>
                  <span className="text-xs bg-rose-600 text-white px-3 py-1 rounded-full">{t.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview (Secondary) */}
      <section className="py-20 lg:py-32 bg-[#FDF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">Beautiful designs included</h2>
              <p className="text-stone-600 text-lg mb-6">
                Choose from dozens of professionally designed templates. All customizable, all free to use.
              </p>
              <ul className="space-y-3 mb-8">
                {["Weddings", "Birthdays", "Baby Showers", "Corporate Events", "Dinner Parties"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-stone-700">
                    <Check className="w-5 h-5 text-rose-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/login">
                <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-8">
                  Browse Templates
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 rounded-xl aspect-[3/4] flex items-center justify-center border border-rose-100">
                <Heart className="w-12 h-12 text-rose-300" />
              </div>
              <div className="bg-green-50 rounded-xl aspect-[3/4] flex items-center justify-center border border-green-100 mt-8">
                <Calendar className="w-12 h-12 text-green-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-6">
            Ready to simplify your event planning?
          </h2>
          <p className="text-stone-600 text-lg mb-8">
            Join 50,000+ hosts who trust EIOS for their invitations and guest management.
          </p>
          <Link href="/auth/login">
            <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-10 py-6 text-lg font-medium inline-flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-stone-400 mt-4">No credit card required • Free forever plan</p>
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
