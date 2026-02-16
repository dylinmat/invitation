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
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Visual Editor",
    description:
      "Drag-and-drop editor with real-time collaboration. Create stunning invitations without any design skills.",
  },
  {
    icon: Users,
    title: "Guest Management",
    description:
      "Import guests from CSV, manage plus-ones, and track dietary restrictions all in one place.",
  },
  {
    icon: Mail,
    title: "Smart Invitations",
    description:
      "Send personalized invitations via email or SMS. Track opens, clicks, and RSVPs in real-time.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Get insights into invitation performance. See who's viewed, who's responded, and more.",
  },
  {
    icon: Calendar,
    title: "Event Timeline",
    description:
      "Schedule invitation sends, set RSVP deadlines, and get reminders for follow-ups.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized for speed. Your invitations load instantly on any device, anywhere in the world.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    description: "Perfect for small gatherings",
    price: "$0",
    period: "forever",
    features: [
      "Up to 50 guests",
      "3 active projects",
      "Basic templates",
      "Email invitations",
      "RSVP tracking",
    ],
    cta: "Get Started Free",
    href: "/auth/login",
    popular: false,
  },
  {
    name: "Pro",
    description: "For event professionals",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited guests",
      "Unlimited projects",
      "Premium templates",
      "Custom domains",
      "Advanced analytics",
      "Priority support",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    href: "/auth/login",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "SLA guarantee",
      "Dedicated support",
      "Custom integrations",
      "On-premise option",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@eios.io",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">EIOS</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Button asChild>
              <Link href="/auth/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Create Beautiful
            <br />
            <span className="text-primary">Digital Invitations</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Design stunning invitations, manage guest lists, and track RSVPs —
            all in one place. From weddings to corporate events, we&apos;ve got you
            covered.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg">
                Start Creating Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need for Perfect Invitations
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From design to delivery, our platform handles every aspect of your
              event invitations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Your First Invitation?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of event planners who trust EIOS for their invitation
            needs. Start free today.
          </p>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">EIOS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Event Invitation OS. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
