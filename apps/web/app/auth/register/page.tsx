"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/components/ui/toaster";
import {
  Calendar,
  Mail,
  User,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Building2,
  Users,
  Star,
  Lock,
  ArrowRight,
  Check,
} from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  organization: z.string().min(2, "Organization name must be at least 2 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;

// Features list
const features = [
  { icon: Calendar, text: "Unlimited event planning" },
  { icon: Users, text: "Guest list management" },
  { icon: Shield, text: "Enterprise-grade security" },
  { icon: Zap, text: "Real-time analytics" },
];

// Testimonials
const testimonials = [
  {
    quote: "EIOS reduced our event planning time by 60%. The ROI was evident within the first month.",
    author: "David Park",
    role: "CEO",
    company: "EventHorizon",
    rating: 5,
  },
  {
    quote: "The best event management platform we've used. Intuitive, powerful, and beautiful.",
    author: "Lisa Thompson",
    role: "Event Director",
    company: "Summit Series",
    rating: 5,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const plan = searchParams.get("plan") || "free";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // In a real implementation, you would call a register API here
      // For now, we'll use the login flow which creates the user if not exists
      await login(data.email);
      setEmail(data.email);
      setIsSent(true);
      showToast({
        title: "Welcome to EIOS!",
        description: "Check your email to complete your registration.",
        variant: "success",
      });
    } catch (error) {
      console.error("Registration error:", error);
      showToast({
        title: "Registration failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex">
      {/* Left Side - Visual/Testimonial */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B6B5D]/10 via-transparent to-[#D4A574]/10" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4A574]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#8B6B5D]/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] bg-clip-text text-transparent">
              EIOS
            </span>
          </Link>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <h2 className="text-3xl xl:text-4xl font-bold text-[#2C1810] mb-6 leading-tight">
                Start creating unforgettable events today
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of event professionals who trust EIOS for their most important occasions.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-[#2C1810]">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Testimonial */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#E8D5D0]/50"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4A574] text-[#D4A574]" />
                  ))}
                </div>
                <p className="text-[#2C1810] mb-4">"{testimonials[currentTestimonial].quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonials[currentTestimonial].author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C1810] text-sm">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>SOC 2 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] bg-clip-text text-transparent">
              EIOS
            </span>
          </div>

          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-[#E8D5D0]/50 p-8">
            {!isSent ? (
              <>
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-2xl shadow-lg mb-4"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-[#2C1810] mb-2">
                    Create your account
                  </h1>
                  <p className="text-muted-foreground">
                    Get started for free. Upgrade anytime for more features.
                  </p>
                </div>

                {/* Social Sign Up Options */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Button
                    variant="outline"
                    className="h-11 border-[#E8D5D0] hover:bg-[#FDF8F5]"
                    onClick={() => showToast({
                      title: "Coming soon",
                      description: "Google sign up will be available soon.",
                    })}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-[#E8D5D0] hover:bg-[#FDF8F5]"
                    onClick={() => showToast({
                      title: "Coming soon",
                      description: "Microsoft sign up will be available soon.",
                    })}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 11H0V0h11v11zm13 0H13V0h11v11zM11 24H0V13h11v11zm13 0H13V13h11v11z" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-[#E8D5D0] hover:bg-[#FDF8F5]"
                    onClick={() => showToast({
                      title: "Coming soon",
                      description: "Apple sign up will be available soon.",
                    })}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  </Button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E8D5D0]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or sign up with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#2C1810]">
                      Full name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        className="pl-11 h-12 border-[#E8D5D0] focus:border-[#8B6B5D] focus:ring-[#8B6B5D]"
                        {...register("name")}
                      />
                    </div>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive flex items-center gap-1"
                      >
                        <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                        {errors.name.message}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#2C1810]">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-11 h-12 border-[#E8D5D0] focus:border-[#8B6B5D] focus:ring-[#8B6B5D]"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive flex items-center gap-1"
                      >
                        <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-[#2C1810]">
                      Organization name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="organization"
                        type="text"
                        placeholder="Acme Inc."
                        className="pl-11 h-12 border-[#E8D5D0] focus:border-[#8B6B5D] focus:ring-[#8B6B5D]"
                        {...register("organization")}
                      />
                    </div>
                    {errors.organization && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive flex items-center gap-1"
                      >
                        <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                        {errors.organization.message}
                      </motion.p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      {...register("acceptTerms")}
                      className="mt-1 border-[#E8D5D0] data-[state=checked]:bg-[#8B6B5D] data-[state=checked]:border-[#8B6B5D]"
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I agree to the{" "}
                      <Link href="#" className="text-[#8B6B5D] hover:underline" onClick={(e) => {
                        e.preventDefault();
                        showToast({ title: "Coming soon", description: "Terms of Service page coming soon." });
                      }}>
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-[#8B6B5D] hover:underline" onClick={(e) => {
                        e.preventDefault();
                        showToast({ title: "Coming soon", description: "Privacy Policy page coming soon." });
                      }}>
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] hover:from-[#7B5B4D] hover:to-[#C49464] text-white font-medium shadow-lg shadow-[#8B6B5D]/25 transition-all hover:shadow-xl hover:shadow-[#8B6B5D]/30"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create free account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Plan Info */}
                <div className="mt-6 p-4 bg-[#FDF8F5] rounded-lg border border-[#E8D5D0]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-lg flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2C1810]">Free forever</p>
                      <p className="text-xs text-muted-foreground">
                        All features included. Cancel anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>

                <h2 className="text-2xl font-bold text-[#2C1810] mb-2">
                  Verify your email
                </h2>
                <p className="text-muted-foreground mb-6">
                  We sent a verification link to{" "}
                  <strong className="text-[#2C1810]">{email}</strong>
                </p>

                <div className="bg-[#FDF8F5] rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-[#2C1810]">Next steps:</span>
                    <br />
                    1. Check your email for the verification link
                    <br />
                    2. Click the link to activate your account
                    <br />
                    3. Start creating your first event!
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-[#E8D5D0]"
                    onClick={() => setIsSent(false)}
                  >
                    Use a different email
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-[#8B6B5D]"
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => {
                        setIsLoading(false);
                        showToast({
                          title: "Link resent",
                          description: "Check your email for the new verification link.",
                          variant: "success",
                        });
                      }, 1000);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Resend verification link
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sign In Link */}
          {!isSent && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#8B6B5D] hover:text-[#6B4B3D] transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
