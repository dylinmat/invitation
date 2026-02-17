"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Clock,
  Heart,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Palette,
    title: "Visual Editor",
    description:
      "Drag-and-drop editor with real-time collaboration. Create stunning invitations without any design skills.",
    image: "/images/feature-editor.svg",
  },
  {
    icon: Users,
    title: "Guest Management",
    description:
      "Import guests from CSV, manage plus-ones, and track dietary restrictions all in one place.",
    image: "/images/feature-guests.svg",
  },
  {
    icon: Mail,
    title: "Smart Invitations",
    description:
      "Send personalized invitations via email or SMS. Track opens, clicks, and RSVPs in real-time.",
    image: "/images/feature-share.svg",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Get insights into invitation performance. See who's viewed, who's responded, and more.",
    image: "/images/feature-analytics.svg",
  },
  {
    icon: Calendar,
    title: "Event Timeline",
    description:
      "Schedule invitation sends, set RSVP deadlines, and get reminders for follow-ups.",
    image: "/images/feature-templates.svg",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized for speed. Your invitations load instantly on any device, anywhere in the world.",
    image: "/images/feature-speed.svg",
  },
];

const testimonials = [
  {
    quote:
      "EIOS saved me hours of work. I created my wedding invitations in 30 minutes and tracked all RSVPs effortlessly.",
    author: "Sarah Chen",
    role: "Bride & Event Planner",
    avatar: "SC",
    rating: 5,
  },
  {
    quote:
      "The best invitation platform I've used for corporate events. The analytics help us understand engagement.",
    author: "Michael Torres",
    role: "Marketing Director",
    avatar: "MT",
    rating: 5,
  },
  {
    quote:
      "Finally, a tool that understands event planning. Beautiful designs and intuitive guest management.",
    author: "Emma Wilson",
    role: "Professional Event Planner",
    avatar: "EW",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: "Free",
    description: "Perfect for personal events",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Up to 50 guests per event",
      "3 active events",
      "20+ basic templates",
      "Email invitations",
      "RSVP tracking",
      "Basic analytics",
    ],
    cta: "Start Free",
    href: "/auth/login",
    popular: false,
  },
  {
    name: "Pro",
    description: "For hosts who want more",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      "Unlimited guests",
      "Unlimited events",
      "100+ premium templates",
      "Custom domain",
      "Advanced analytics & reports",
      "Priority email support",
      "Team collaboration (5 members)",
      "Remove EIOS branding",
    ],
    cta: "Start Free Trial",
    href: "/auth/login",
    popular: true,
  },
  {
    name: "Business",
    description: "For professional planners",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "Everything in Pro",
      "White-label option",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "Team collaboration (unlimited)",
      "SSO & advanced security",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@eios.io",
    popular: false,
  },
];

const faqs = [
  {
    question: "Is there really a free forever plan?",
    answer:
      "Yes! Our Free plan is truly free forever. You can create up to 3 events with 50 guests each. No credit card required to sign up, and you can use it for as long as you want.",
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer:
      "Absolutely. You can upgrade to Pro or Business at any time. If you downgrade, you'll keep your Pro features until the end of your billing period. We also offer a 30-day money-back guarantee.",
  },
  {
    question: "Do my guests need to create an account to RSVP?",
    answer:
      "No, your guests can RSVP directly from their invitation without creating an account. We believe in making the experience as seamless as possible for both hosts and guests.",
  },
  {
    question: "Can I import my guest list from a spreadsheet?",
    answer:
      "Yes! You can import guests from CSV files, Google Contacts, or copy-paste from Excel. We also support exporting your guest list and RSVPs back to CSV at any time.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for Business plans. All payments are securely processed and encrypted.",
  },
  {
    question: "Is my event data secure?",
    answer:
      "Security is our top priority. We use bank-level encryption, comply with GDPR and CCPA, and never share your guest data with third parties. Enterprise customers can also request SOC 2 compliance documentation.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
      >
        <span className="font-medium text-base pr-8">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 text-muted-foreground leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EIOS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Free forever plan available</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                Create Beautiful
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Digital Invitations
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Design stunning invitations, manage guest lists, and track RSVPs
                — all in one place. From weddings to corporate events, create
                memorable experiences in minutes, not hours.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8"
                  >
                    Start Creating Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    See How It Works
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Free forever plan</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative">
              <img
                src="/images/hero-illustration.svg"
                alt="EIOS Invitation Platform"
                className="w-full max-w-lg mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Logos Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            Trusted by event planners and hosts worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale">
            {/* Company logos as text placeholders */}
            <span className="text-xl font-bold">Bloom Events</span>
            <span className="text-xl font-bold">WeddingWire</span>
            <span className="text-xl font-bold">PartyPerfect</span>
            <span className="text-xl font-bold">EventPro</span>
            <span className="text-xl font-bold">Gatherly</span>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Loved by Event Hosts</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of happy users who have transformed their event
              planning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-md bg-muted/30">
                <CardContent className="pt-6">
                  {/* Stars */}
                  <div className="flex space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  <p className="text-foreground mb-6 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Perfect Invitations
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From design to delivery, our platform handles every aspect of your
              event invitations so you can focus on what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-0 shadow-sm hover:shadow-md transition-shadow group"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 overflow-hidden rounded-xl">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create and send beautiful invitations in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Design",
                description:
                  "Choose from 100+ templates or create your own with our drag-and-drop editor.",
                icon: Palette,
              },
              {
                step: "02",
                title: "Import Guests",
                description:
                  "Upload your guest list via CSV or add contacts manually. We handle the rest.",
                icon: Users,
              },
              {
                step: "03",
                title: "Send & Track",
                description:
                  "Send via email or SMS and track RSVPs in real-time with detailed analytics.",
                icon: BarChart3,
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <span className="text-5xl font-bold text-muted/30 absolute -top-2 left-1/2 -translate-x-1/2 -z-10">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Bank-level Security</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="text-sm font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-4">
              Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>

            {/* Annual/Monthly Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span
                className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isAnnual ? "bg-indigo-600" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    isAnnual ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
              >
                Annual
              </span>
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                Save 20%
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? "border-2 border-indigo-500 shadow-xl scale-105 z-10"
                    : "border shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardContent className="pt-8">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl font-semibold">$</span>
                      <span className="text-5xl font-bold mx-1">
                        {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{isAnnual ? "month" : "month"}
                      </span>
                    </div>
                    {isAnnual && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually (${plan.yearlyPrice * 12}/year)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Money back guarantee */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-1" />
              30-day money-back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-4">
                FAQ
              </span>
              <h2 className="text-3xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about EIOS
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 shadow-sm">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                Still have questions?
              </p>
              <Link href="mailto:support@eios.io">
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Create Your First Invitation?
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg">
                Join thousands of event planners who trust EIOS for their
                invitation needs. Start free today — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-white/60 text-sm mt-4">
                Free forever plan available. Upgrade anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">EIOS</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Beautiful digital invitations for every occasion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Templates
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#faq" className="hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Event Invitation OS. All rights
              reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
