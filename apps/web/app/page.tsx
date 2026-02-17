"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowRight, Heart, Mail, Calendar, Users, Sparkles, Check, Menu, X } from "lucide-react";

const templates = [
  { id: 1, name: "Garden Romance", category: "Wedding", color: "bg-rose-50", accent: "text-rose-600" },
  { id: 2, name: "Modern Minimal", category: "Wedding", color: "bg-stone-100", accent: "text-stone-600" },
  { id: 3, name: "Golden Hour", category: "Wedding", color: "bg-amber-50", accent: "text-amber-600" },
  { id: 4, name: "Sage & Cream", category: "Wedding", color: "bg-green-50", accent: "text-green-600" },
  { id: 5, name: "Baby Bloom", category: "Baby", color: "bg-pink-50", accent: "text-pink-500" },
  { id: 6, name: "Forty & Fabulous", category: "Birthday", color: "bg-purple-50", accent: "text-purple-600" },
  { id: 7, name: "Corporate Gala", category: "Corporate", color: "bg-slate-100", accent: "text-slate-600" },
  { id: 8, name: "Summer Soirée", category: "Party", color: "bg-orange-50", accent: "text-orange-500" },
];

const features = [
  { icon: Heart, title: "Thoughtfully Designed", desc: "Beautiful templates crafted by professional designers" },
  { icon: Mail, title: "Easy to Send", desc: "Email or text your invitations instantly" },
  { icon: Calendar, title: "RSVP Tracking", desc: "See who's coming in real-time" },
  { icon: Users, title: "Guest Management", desc: "Organize your list with tags and notes" },
];

const testimonials = [
  { names: "Sarah & Michael", event: "Wedding", quote: "Our guests loved the elegant design. Made planning so much easier.", location: "New York" },
  { names: "The Johnsons", event: "Baby Shower", quote: "Simple, beautiful, and free. Exactly what we needed.", location: "California" },
  { names: "Emma & James", event: "Anniversary", quote: "Professional quality without the hassle. Highly recommend.", location: "Texas" },
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

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#templates" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Templates</a>
              <a href="#features" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Features</a>
              <a href="#stories" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Stories</a>
              <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium">Sign In</Link>
              <Link href="/auth/login">
                <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-6 text-sm font-medium">
                  Create Free
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-stone-200">
              <div className="flex flex-col gap-4">
                <a href="#templates" className="text-stone-600 hover:text-stone-900 py-2" onClick={() => setMobileMenuOpen(false)}>Templates</a>
                <a href="#features" className="text-stone-600 hover:text-stone-900 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#stories" className="text-stone-600 hover:text-stone-900 py-2" onClick={() => setMobileMenuOpen(false)}>Stories</a>
                <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 py-2">Sign In</Link>
                <Link href="/auth/login">
                  <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full w-full">
                    Create Free
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
              <p className="text-rose-600 font-medium mb-4 tracking-wide uppercase text-sm">Beautiful Online Invitations</p>
              <h1 className="font-serif text-5xl lg:text-6xl xl:text-7xl text-stone-900 leading-[1.1] mb-6">
                Create invitations that tell your story
              </h1>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-lg">
                Elegant designs for weddings, birthdays, baby showers, and every special moment. 
                Customize and send in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-8 py-6 text-base font-medium inline-flex items-center gap-2">
                    Browse Templates
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-100 rounded-full px-8 py-6 text-base font-medium">
                    Start Designing
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-stone-500">
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Free forever</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> No credit card</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Cancel anytime</span>
              </div>
            </div>
            
            {/* Hero Image Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-rose-50 rounded-2xl p-6 aspect-[3/4] flex items-center justify-center border border-rose-100">
                    <div className="text-center">
                      <Heart className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                      <p className="font-serif text-rose-800 text-lg">Garden<br/>Romance</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-6 aspect-square flex items-center justify-center border border-green-100">
                    <div className="text-center">
                      <Sparkles className="w-10 h-10 text-green-600 mx-auto mb-2" />
                      <p className="font-serif text-green-800">Sage</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-amber-50 rounded-2xl p-6 aspect-square flex items-center justify-center border border-amber-100">
                    <div className="text-center">
                      <Calendar className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                      <p className="font-serif text-amber-800">Golden</p>
                    </div>
                  </div>
                  <div className="bg-stone-100 rounded-2xl p-6 aspect-[3/4] flex items-center justify-center border border-stone-200">
                    <div className="text-center">
                      <Mail className="w-12 h-12 text-stone-500 mx-auto mb-3" />
                      <p className="font-serif text-stone-700 text-lg">Modern<br/>Minimal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Gallery */}
      <section id="templates" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">Browse our collection</h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">
              Professional designs for every occasion. Find the perfect template and make it yours.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Link href="/auth/login" key={template.id} className="group">
                <div className={`${template.color} rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-6 border border-stone-100 transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]`}>
                  <div className="text-center">
                    <p className={`font-serif text-2xl mb-2 ${template.accent}`}>{template.name}</p>
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">{template.category}</span>
                  </div>
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium text-stone-700 underline underline-offset-4">Customize</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/login">
              <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-8 py-6 text-base font-medium">
                View All Templates
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32 bg-[#FDF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">Everything you need</h2>
            <p className="text-stone-600 text-lg">Simple tools to create, send, and track your invitations</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <feature.icon className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">How it works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Choose a design", desc: "Browse our collection and find a template that matches your style and occasion." },
              { step: "02", title: "Make it yours", desc: "Customize the text, colors, and details to tell your unique story." },
              { step: "03", title: "Send with love", desc: "Share via email or text, track RSVPs, and manage your guest list." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <span className="font-serif text-6xl text-stone-200">{item.step}</span>
                <h3 className="font-serif text-2xl text-stone-900 mt-4 mb-3">{item.title}</h3>
                <p className="text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="stories" className="py-20 lg:py-32 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl mb-4">Loved by hosts everywhere</h2>
            <p className="text-stone-400 text-lg">See what couples and hosts are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-stone-800/50 rounded-2xl p-8 border border-stone-700">
                <p className="text-stone-300 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-lg text-white">{t.names}</p>
                    <p className="text-sm text-stone-400">{t.event}</p>
                  </div>
                  <span className="text-xs text-stone-500 uppercase tracking-wider">{t.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-[#FDF8F5]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-6">
            Ready to create something beautiful?
          </h2>
          <p className="text-stone-600 text-lg mb-8">
            Join thousands of happy hosts. Start creating your invitations today.
          </p>
          <Link href="/auth/login">
            <Button className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-10 py-6 text-lg font-medium inline-flex items-center gap-2">
              Start Creating Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-stone-500 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-stone-200">
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
