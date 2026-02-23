"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useRedirectIfAuthenticated } from "@/hooks/useAuth";
import { showToast } from "@/components/ui/toaster";
import {
  Calendar,
  Mail,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Users,
  Star,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
} from "lucide-react";

// Background image for login page
const LOGIN_BG_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

// Testimonial data
const testimonials = [
  {
    quote: "EIOS transformed how we manage our wedding events. The RSVP tracking alone saved us 20 hours per event.",
    author: "Sarah Chen",
    role: "Event Planner",
    company: "Bloom Events",
    rating: 5,
  },
  {
    quote: "The analytics dashboard gives us insights we never had before. Our client satisfaction increased by 40%.",
    author: "Michael Torres",
    role: "Director of Operations",
    company: "EventPro Solutions",
    rating: 5,
  },
  {
    quote: "From corporate galas to intimate dinners, EIOS handles everything flawlessly. Truly enterprise-grade.",
    author: "Emma Wilson",
    role: "Senior Event Coordinator",
    company: "Gatherly",
    rating: 5,
  },
];

// Stats data
const stats = [
  { value: "50K+", label: "Events Managed" },
  { value: "2M+", label: "Invitations Sent" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const redirect = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if already authenticated
  const { isLoading: isAuthLoading } = useRedirectIfAuthenticated(redirect || "/dashboard");

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email);
      setEmail(data.email);
      setIsSent(true);
      showToast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
        variant: "success",
      });
    } catch (error) {
      console.error("Login error:", error);
      showToast({
        title: "Failed to send magic link",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex">
      {/* Left Side - Visual/Testimonial */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={LOGIN_BG_IMAGE}
            alt="Beautiful wedding celebration"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2C1810]/80 via-[#2C1810]/60 to-[#8B6B5D]/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              EIOS
            </span>
          </Link>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            {/* Animated Testimonial */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#D4A574] text-[#D4A574]" />
                  ))}
                </div>
                <blockquote className="text-2xl xl:text-3xl font-medium text-white leading-relaxed mb-6">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonials[currentTestimonial].author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-sm text-white/70">
                      {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-[#D4A574]">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>SOC 2 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-12">
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
                    Welcome back
                  </h1>
                  <p className="text-muted-foreground">
                    Sign in to manage your events
                  </p>
                </div>

                {/* Social Login Options - Disabled Coming Soon */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="h-11 w-full border-[#E8D5D0] opacity-50 cursor-not-allowed"
                      disabled
                      title="Google login coming soon"
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
                    <span className="absolute -top-2 -right-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                      Soon
                    </span>
                  </div>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="h-11 w-full border-[#E8D5D0] opacity-50 cursor-not-allowed"
                      disabled
                      title="Microsoft login coming soon"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 11H0V0h11v11zm13 0H13V0h11v11zM11 24H0V13h11v11zm13 0H13V13h11v11z" />
                      </svg>
                    </Button>
                    <span className="absolute -top-2 -right-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                      Soon
                    </span>
                  </div>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="h-11 w-full border-[#E8D5D0] opacity-50 cursor-not-allowed"
                      disabled
                      title="Apple login coming soon"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    </Button>
                    <span className="absolute -top-2 -right-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                      Soon
                    </span>
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E8D5D0]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        {...register("rememberMe")}
                        className="border-[#E8D5D0] data-[state=checked]:bg-[#8B6B5D] data-[state=checked]:border-[#8B6B5D]"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Remember me for 30 days
                      </Label>
                    </div>
                    <Link
                      href="#"
                      className="text-sm text-[#8B6B5D] hover:text-[#6B4B3D] transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        showToast({
                          title: "Contact support",
                          description: "Please contact support to recover your account.",
                        });
                      }}
                    >
                      Need help?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] hover:from-[#7B5B4D] hover:to-[#C49464] text-white font-medium shadow-lg shadow-[#8B6B5D]/25 transition-all hover:shadow-xl hover:shadow-[#8B6B5D]/30"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending magic link...
                      </>
                    ) : (
                      <>
                        Send Magic Link
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-[#FDF8F5] rounded-lg border border-[#E8D5D0]/50">
                  <div className="flex items-start gap-3">
                    <Fingerprint className="w-5 h-5 text-[#8B6B5D] mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-[#2C1810]">Passwordless Login</p>
                      <p className="text-muted-foreground mt-1">
                        We use secure magic links instead of passwords. No password to forget or compromise.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-[#8B6B5D] hover:underline"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[#8B6B5D] hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </p>
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
                  Check your email
                </h2>
                <p className="text-muted-foreground mb-6">
                  We sent a magic link to{" "}
                  <strong className="text-[#2C1810]">{email}</strong>
                </p>

                <div className="bg-[#FDF8F5] rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-[#2C1810]">Didn&apos;t receive it?</span>
                    <br />
                    Check your spam folder or try again. The link expires in 15 minutes.
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
                          description: "Check your email for the new magic link.",
                          variant: "success",
                        });
                      }, 1000);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Resend magic link
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sign Up Link */}
          {!isSent && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-[#8B6B5D] hover:text-[#6B4B3D] transition-colors"
              >
                Create one for free
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
