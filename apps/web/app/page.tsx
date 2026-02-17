"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Calendar,
  Mail,
  Palette,
  Users,
  BarChart3,
  Zap,
  Check,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Clock,
  Heart,
  ArrowUpRight,
  Play,
  X,
} from "lucide-react";

const testimonials = [
  {
    quote: "EIOS saved me hours of work. I created my wedding invitations in 30 minutes and tracked all RSVPs effortlessly.",
    author: "Sarah Chen",
    role: "Bride & Event Planner",
    rating: 5,
  },
  {
    quote: "The best invitation platform I've used for corporate events. The analytics help us understand engagement.",
    author: "Michael Torres",
    role: "Marketing Director",
    rating: 5,
  },
  {
    quote: "Finally, a tool that understands event planning. Beautiful designs and intuitive guest management.",
    author: "Emma Wilson",
    role: "Professional Event Planner",
    rating: 5,
  },
];

const features = [
  {
    icon: Palette,
    title: "Visual Editor",
    description: "Drag-and-drop editor with real-time collaboration. No design skills needed.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Users,
    title: "Guest Management",
    description: "Import guests, manage plus-ones, track dietary restrictions effortlessly.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Mail,
    title: "Smart Invitations",
    description: "Send via email or SMS. Track opens, clicks, and RSVPs in real-time.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Get insights into invitation performance and guest engagement.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "Event Timeline",
    description: "Schedule sends, set RSVP deadlines, get reminder notifications.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed. Your invitations load instantly worldwide.",
    color: "from-indigo-500 to-blue-600",
  },
];

const pricingPlans = [
  {
    name: "Free",
    description: "For personal events",
    price: "0",
    period: "forever",
    features: ["Up to 50 guests", "3 events", "Basic templates", "Email invites", "RSVP tracking"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious hosts",
    price: "19",
    period: "/month",
    features: ["Unlimited guests", "Unlimited events", "Premium templates", "Custom domain", "Analytics", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    description: "For professionals",
    price: "49",
    period: "/month",
    features: ["Everything in Pro", "White-label", "API access", "Dedicated manager", "SSO", "SLA"],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "Is there really a free forever plan?",
    answer: "Yes! Our Free plan is truly free forever. No credit card required, use it as long as you want.",
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Absolutely. You can change plans anytime. Downgrade keeps Pro features until billing period ends.",
  },
  {
    question: "Do guests need an account to RSVP?",
    answer: "No, guests can RSVP directly from their invitation without creating an account.",
  },
  {
    question: "Can I import my guest list?",
    answer: "Yes! Import from CSV, Google Contacts, or copy-paste from Excel.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full py-5 flex items-center justify-between text-left hover:opacity-80 transition-opacity">
        <span className="font-medium text-base pr-8">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />}
      </button>
      {isOpen && <div className="pb-5 text-zinc-400 leading-relaxed animate-fade-in">{answer}</div>}
    </div>
  );
}

export default function LandingPage() {
  const [showPricing, setShowPricing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">EIOS</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Testimonials</a>
            <a href="#faq" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/auth/login">
              <Button className="bg-white text-black hover:bg-zinc-200 font-medium px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-900/20 to-purple-900/20 rounded-full blur-[100px]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-zinc-300">Now with AI-powered designs</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent">
              Beautiful
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Invitations
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Create stunning digital invitations in minutes. 
            Manage guests, track RSVPs, and make every event unforgettable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/auth/login">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-semibold text-lg px-8 h-14">
                Start Creating Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <button onClick={() => setShowPricing(true)} className="group flex items-center gap-2 text-lg font-medium text-zinc-400 hover:text-white transition-colors">
              <Play className="w-5 h-5" />
              See Pricing
              <ArrowUpRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-zinc-500">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Free forever</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-zinc-600" />
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-zinc-500 uppercase tracking-wider mb-8">
            Trusted by event planners worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-40">
            {["Bloom Events", "WeddingWire", "PartyPerfect", "EventPro", "Gatherly"].map((name) => (
              <span key={name} className="text-lg font-semibold text-zinc-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Everything you need
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Powerful tools to create, send, and manage your invitations effortlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-white/[0.04]">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Three simple steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Design", desc: "Choose from 100+ templates or create your own with our drag-and-drop editor.", icon: Palette },
              { step: "02", title: "Import", desc: "Upload your guest list via CSV or add contacts manually. We handle the rest.", icon: Users },
              { step: "03", title: "Send", desc: "Send via email or SMS and track RSVPs in real-time with detailed analytics.", icon: Mail },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-10 h-10 text-violet-400" />
                </div>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-8xl font-bold text-white/[0.02] -z-10">{item.step}</span>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4">Loved by hosts</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg text-zinc-300 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                    {t.author.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{t.author}</p>
                    <p className="text-sm text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-12 text-zinc-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-sm font-medium">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4">Questions?</h2>
          </div>
          <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/30 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready to create something
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"> beautiful?</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-10">
            Join thousands of event planners. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-semibold text-lg px-8 h-14">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <button onClick={() => setShowPricing(true)} className="text-zinc-400 hover:text-white font-medium transition-colors">
              See Pricing →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">EIOS</span>
            </div>
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Event Invitation OS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPricing(false)}>
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-white/10 rounded-3xl p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPricing(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-zinc-400">Start free, scale as you grow</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className={`relative p-6 rounded-2xl border ${plan.popular ? "border-violet-500/50 bg-violet-950/10" : "border-white/5 bg-white/[0.02]"}`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-full">
                      Popular
                    </span>
                  )}
                  <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-zinc-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                        <Check className="w-4 h-4 text-emerald-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/login" className="block">
                    <Button className={`w-full ${plan.popular ? "bg-white text-black hover:bg-zinc-200" : "bg-white/5 hover:bg-white/10"}`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
