"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import {
  Heart,
  Briefcase,
  Building2,
  ArrowRight,
  Sparkles,
  Users,
  Calendar,
  Check,
  Loader2,
  Crown,
  Gift,
  PartyPopper,
} from "lucide-react";

type UserType = "COUPLE" | "PLANNER" | "VENUE" | null;
type Step = "type" | "details" | "plan";

const plans = [
  {
    id: "FREE",
    name: "Free",
    description: "Perfect for small gatherings",
    price: "$0",
    features: [
      "Up to 50 guests",
      "1 event",
      "Basic RSVP tracking",
      "Email invitations",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    id: "STARTER",
    name: "Starter",
    description: "For memorable celebrations",
    price: "$29",
    period: "/event",
    features: [
      "Up to 200 guests",
      "Unlimited events",
      "Advanced RSVP analytics",
      "Custom invitation designs",
      "Guest messaging",
      "Photo gallery",
    ],
    cta: "Select Plan",
    popular: true,
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    description: "For event professionals",
    price: "$79",
    period: "/month",
    features: [
      "Unlimited guests",
      "Unlimited events",
      "Client management",
      "Team collaboration",
      "White-label options",
      "Priority support",
      "API access",
    ],
    cta: "Select Plan",
    popular: false,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("type");
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("STARTER");
  
  // Form data
  const [coupleNames, setCoupleNames] = useState({ partner1: "", partner2: "" });
  const [eventDate, setEventDate] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");

  const handleTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep("details");
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: any = { type: userType };

      if (userType === "COUPLE") {
        payload.coupleNames = coupleNames;
        payload.eventDate = eventDate || undefined;
      } else {
        payload.businessName = businessName;
        payload.website = website || undefined;
        payload.businessType = userType;
      }

      await userApi.completeOnboarding(payload);
      
      if (userType === "COUPLE") {
        showToast({
          title: "Welcome! 🎉",
          description: "Your event space is ready!",
          variant: "success",
        });
        router.push("/dashboard/couple");
      } else {
        setStep("plan");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      showToast({
        title: "Failed to save",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = async () => {
    setIsLoading(true);
    
    try {
      await userApi.updatePlan(selectedPlan as "FREE" | "STARTER" | "PROFESSIONAL");
      
      showToast({
        title: "Welcome to EIOS Pro!",
        description: "Your account is ready.",
        variant: "success",
      });
      
      router.push("/dashboard/business");
    } catch (error) {
      console.error("Plan selection error:", error);
      showToast({
        title: "Failed to set plan",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5]">
      {/* Progress Header */}
      <div className="border-b border-[#E8D5D0]/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] bg-clip-text text-transparent">
                EIOS
              </span>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {["type", "details", "plan"].map((s, i) => {
                const isActive = step === s;
                const isPast = ["type", "details", "plan"].indexOf(step) > i;
                const isVisible = userType === "COUPLE" ? s !== "plan" : true;
                
                if (!isVisible) return null;
                
                return (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive
                          ? "bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
                          : isPast
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < (userType === "COUPLE" ? 1 : 2) && (
                      <div className="w-8 h-px bg-gray-200 mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step 1: Choose Type */}
        {step === "type" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-[#2C1810] mb-4">
              What brings you to EIOS?
            </h1>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              We&apos;ll customize your experience based on what you&apos;re planning.
              You can always change this later.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Personal Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelect("COUPLE")}
                className="group relative bg-white rounded-2xl p-8 border-2 border-[#E8D5D0] hover:border-[#8B6B5D] transition-all text-left"
              >
                <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 text-rose-500" />
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-2xl flex items-center justify-center mb-6">
                  <PartyPopper className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2C1810] mb-2">
                  Personal Event
                </h3>
                <p className="text-muted-foreground mb-4">
                  I&apos;m planning my own celebration
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Wedding or engagement
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Birthday party
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Anniversary or special occasion
                  </li>
                </ul>
                <div className="mt-6 flex items-center text-[#8B6B5D] font-medium group-hover:gap-2 transition-all">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>

              {/* Professional Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelect("PLANNER")}
                className="group relative bg-white rounded-2xl p-8 border-2 border-[#E8D5D0] hover:border-[#8B6B5D] transition-all text-left"
              >
                <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-2xl flex items-center justify-center mb-6">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2C1810] mb-2">
                  Professional
                </h3>
                <p className="text-muted-foreground mb-4">
                  I plan events for clients
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Wedding or event planner
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Event company
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Venue or vendor
                  </li>
                </ul>
                <div className="mt-6 flex items-center text-[#8B6B5D] font-medium group-hover:gap-2 transition-all">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-xl mx-auto"
          >
            <button
              onClick={() => setStep("type")}
              className="text-sm text-muted-foreground hover:text-[#8B6B5D] mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <h1 className="text-3xl font-bold text-[#2C1810] mb-2">
              {userType === "COUPLE" ? "Tell us about your celebration" : "Tell us about your business"}
            </h1>
            <p className="text-muted-foreground mb-8">
              This helps us set up your dashboard perfectly.
            </p>

            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              {userType === "COUPLE" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Partner 1</Label>
                      <Input
                        placeholder="Alex"
                        value={coupleNames.partner1}
                        onChange={(e) => setCoupleNames({ ...coupleNames, partner1: e.target.value })}
                        className="h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Partner 2</Label>
                      <Input
                        placeholder="Jordan"
                        value={coupleNames.partner2}
                        onChange={(e) => setCoupleNames({ ...coupleNames, partner2: e.target.value })}
                        className="h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Event Date (optional)</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Don&apos;t worry, you can change this anytime.
                    </p>
                  </div>

                  <div className="bg-[#FDF8F5] rounded-lg p-4 flex items-start gap-3">
                    <Gift className="w-5 h-5 text-[#8B6B5D] mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-[#2C1810]">Free forever plan</p>
                      <p className="text-muted-foreground">
                        Start with up to 50 guests at no cost. Upgrade anytime as your guest list grows.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      placeholder="Bloom Events"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Website (optional)</Label>
                    <Input
                      placeholder="https://yourevents.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "PLANNER", label: "Planner", icon: Calendar },
                        { id: "VENUE", label: "Venue", icon: Building2 },
                        { id: "VENDOR", label: "Vendor", icon: Users },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setUserType(option.id as UserType)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            userType === option.id
                              ? "border-[#8B6B5D] bg-[#FDF8F5]"
                              : "border-[#E8D5D0] hover:border-[#8B6B5D]/50"
                          }`}
                        >
                          <option.icon className="w-6 h-6 mx-auto mb-2 text-[#8B6B5D]" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] hover:from-[#7B5B4D] hover:to-[#C49464] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up...
                  </>
                ) : userType === "COUPLE" ? (
                  <>
                    Create My Event Space
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {/* Step 3: Plan Selection (Professional only) */}
        {step === "plan" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => setStep("details")}
              className="text-sm text-muted-foreground hover:text-[#8B6B5D] mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-[#2C1810] mb-2">
                Select your plan
              </h1>
              <p className="text-muted-foreground">
                Choose the plan that fits your needs. Upgrade or downgrade anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -4 }}
                  className={`relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${
                    selectedPlan === plan.id
                      ? "border-[#8B6B5D] shadow-lg"
                      : "border-[#E8D5D0] hover:border-[#8B6B5D]/50"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-[#2C1810]">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-[#2C1810]">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      selectedPlan === plan.id
                        ? "bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
