"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Briefcase, Loader2 } from "lucide-react";

// This is a smart router that redirects users to the appropriate dashboard
// based on their organization type (COUPLE vs PROFESSIONAL)
export default function DashboardRouter() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = user?.organization?.type !== undefined;
    
    if (!hasCompletedOnboarding) {
      // New user - send to onboarding
      router.push("/onboarding");
      return;
    }

    // Route based on organization type
    const orgType = user?.organization?.type;
    
    if (orgType === "COUPLE") {
      // Personal users go to couple dashboard
      router.push("/dashboard/couple");
    } else {
      // Professional users (PLANNER, VENUE, etc.) go to business dashboard
      router.push("/dashboard/business");
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-[#E8D5D0] border-t-[#8B6B5D] rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {user?.organization?.type === "COUPLE" ? (
              <Heart className="w-8 h-8 text-rose-400" />
            ) : (
              <Briefcase className="w-8 h-8 text-[#8B6B5D]" />
            )}
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[#2C1810] mb-2">
          Preparing your dashboard...
        </h2>
        <p className="text-muted-foreground">
          Just a moment while we set things up
        </p>
      </motion.div>
    </div>
  );
}
