"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Shimmer animation component
function Shimmer({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded ${className}`}
      style={{
        backgroundSize: "200% 100%",
      }}
    />
  );
}

// Stat card skeleton
function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Shimmer className="h-4 w-24" delay={delay} />
            <Shimmer className="h-8 w-16" delay={delay + 0.1} />
            <Shimmer className="h-3 w-20" delay={delay + 0.2} />
          </div>
          <Shimmer className="w-10 h-10 rounded-lg" delay={delay + 0.1} />
        </div>
      </CardContent>
    </Card>
  );
}

// Chart card skeleton
function ChartCardSkeleton({ 
  delay = 0,
  height = 300 
}: { 
  delay?: number;
  height?: number;
}) {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <Shimmer className="h-6 w-32" delay={delay} />
      </CardHeader>
      <CardContent>
        <Shimmer className="w-full" style={{ height }} delay={delay + 0.1} />
      </CardContent>
    </Card>
  );
}

// Top clients list skeleton
function TopClientsSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card className="h-[350px]">
      <CardHeader>
        <Shimmer className="h-6 w-40" delay={delay} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[0.1, 0.2, 0.3, 0.4, 0.5].map((itemDelay, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Shimmer className="w-8 h-8 rounded-full" delay={delay + itemDelay} />
                <div className="space-y-2">
                  <Shimmer className="h-4 w-32" delay={delay + itemDelay + 0.05} />
                  <Shimmer className="h-3 w-20" delay={delay + itemDelay + 0.1} />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Shimmer className="h-4 w-16 ml-auto" delay={delay + itemDelay + 0.05} />
                <Shimmer className="h-3 w-12 ml-auto" delay={delay + itemDelay + 0.1} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main analytics skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shimmer className="w-10 h-10 rounded-lg" delay={0} />
              <div className="space-y-2">
                <Shimmer className="h-7 w-32" delay={0.1} />
                <Shimmer className="h-4 w-48" delay={0.2} />
              </div>
            </div>
            <Shimmer className="h-10 w-32" delay={0.3} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[0, 0.1, 0.2, 0.3].map((delay, i) => (
            <StatCardSkeleton key={i} delay={delay} />
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCardSkeleton delay={0.4} height={300} />
          <ChartCardSkeleton delay={0.5} height={300} />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCardSkeleton delay={0.6} height={250} />
          <div className="lg:col-span-2">
            <TopClientsSkeleton delay={0.7} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AnalyticsEmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#8B6B5D] text-white rounded-lg hover:bg-[#7a5d50] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function AnalyticsErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load analytics</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#8B6B5D] text-white rounded-lg hover:bg-[#7a5d50] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default AnalyticsSkeleton;
