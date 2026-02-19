"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth, useRedirectIfAuthenticated } from "@/hooks/useAuth";
import { showToast } from "@/components/ui/toaster";
import {
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";

// Separate component that uses useSearchParams to wrap in Suspense
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verify, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  // Use the safe redirect hook
  useRedirectIfAuthenticated("/dashboard");

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Validate parameters
    if (!email || !token) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Please request a new one.");
      clearInterval(progressInterval);
      return;
    }

    // If already authenticated, don't verify again
    if (isAuthenticated) {
      clearInterval(progressInterval);
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        await verify(email, token);
        setProgress(100);
        setStatus("success");
        showToast({
          title: "Welcome to EIOS!",
          description: "Your email has been verified successfully.",
          variant: "success",
        });
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to verify. Please try again."
        );
      } finally {
        clearInterval(progressInterval);
      }
    };

    verifyToken();

    return () => clearInterval(progressInterval);
  }, [email, token, verify, router, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A574]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8B6B5D]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-[#E8D5D0]/50 p-8">
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <div className="relative inline-flex items-center justify-center mb-6">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="#E8D5D0"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="276.46"
                      strokeDashoffset={276.46 - (276.46 * progress) / 100}
                      initial={{ strokeDashoffset: 276.46 }}
                      animate={{ strokeDashoffset: 276.46 - (276.46 * progress) / 100 }}
                      transition={{ duration: 0.3 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B6B5D" />
                        <stop offset="100%" stopColor="#D4A574" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-[#8B6B5D]" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-[#2C1810] mb-2">
                  Verifying your email
                </h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we verify your magic link...
                </p>

                <div className="bg-[#FDF8F5] rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Security check</span>
                    <span className="font-medium text-[#8B6B5D]">{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-[#E8D5D0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#8B6B5D] to-[#D4A574]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>

                <h1 className="text-2xl font-bold text-[#2C1810] mb-2">
                  Welcome to EIOS!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Your email has been verified successfully.
                </p>

                <div className="bg-[#FDF8F5] rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#2C1810]">Redirecting...</p>
                      <p className="text-sm text-muted-foreground">
                        Taking you to your dashboard
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/dashboard">
                  <Button className="w-full h-12 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] hover:from-[#7B5B4D] hover:to-[#C49464] text-white font-medium shadow-lg shadow-[#8B6B5D]/25">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6"
                >
                  <XCircle className="w-12 h-12 text-red-600" />
                </motion.div>

                <h1 className="text-2xl font-bold text-[#2C1810] mb-2">
                  Verification Failed
                </h1>
                <p className="text-muted-foreground mb-6">
                  {errorMessage}
                </p>

                <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-red-700">
                    <strong>Common issues:</strong>
                    <br />
                    • The link has expired (valid for 15 minutes)
                    <br />
                    • The link was already used
                    <br />
                    • The link was copied incorrectly
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/auth/login">
                    <Button className="w-full h-12 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] hover:from-[#7B5B4D] hover:to-[#C49464] text-white font-medium shadow-lg shadow-[#8B6B5D]/25">
                      Request New Link
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    className="w-full text-[#8B6B5D]"
                    onClick={() => {
                      showToast({
                        title: "Support",
                        description: "Please contact support@eios.app for help.",
                      });
                    }}
                  >
                    Contact Support
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" />
          Secure 256-bit encrypted connection
        </p>
      </motion.div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex items-center justify-center p-4">
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

// Main page component with Suspense wrapper
export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
