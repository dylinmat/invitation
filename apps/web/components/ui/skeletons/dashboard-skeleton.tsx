"use client";

import { motion } from "framer-motion";

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
      className={`bg-gradient-to-r from-[#E8D5D0]/30 via-[#E8D5D0]/50 to-[#E8D5D0]/30 ${className}`}
      style={{
        backgroundSize: "200% 100%",
      }}
    />
  );
}

// Stats card skeleton
function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#E8D5D0]/30">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-lg" delay={delay} />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-6 w-16 rounded" delay={delay + 0.1} />
          <Shimmer className="h-3 w-20 rounded" delay={delay + 0.2} />
        </div>
      </div>
    </div>
  );
}

// Event card skeleton
function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5D0]/30 overflow-hidden">
      <Shimmer className="h-32 w-full" delay={0.2} />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Shimmer className="h-6 w-48 rounded" delay={0.3} />
            <Shimmer className="h-4 w-32 rounded" delay={0.4} />
          </div>
          <Shimmer className="h-10 w-16 rounded" delay={0.3} />
        </div>
        <Shimmer className="h-2 w-full rounded-full" delay={0.5} />
        <div className="flex gap-3 pt-2">
          <Shimmer className="h-10 flex-1 rounded-lg" delay={0.6} />
          <Shimmer className="h-10 flex-1 rounded-lg" delay={0.7} />
        </div>
      </div>
    </div>
  );
}

// Checklist item skeleton
function ChecklistItemSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <Shimmer className="w-6 h-6 rounded-full" delay={delay} />
      <Shimmer className="h-4 flex-1 rounded" delay={delay + 0.1} />
    </div>
  );
}

// Activity item skeleton
function ActivityItemSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <Shimmer className="w-8 h-8 rounded-full" delay={delay} />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-full rounded" delay={delay + 0.1} />
        <Shimmer className="h-3 w-20 rounded" delay={delay + 0.2} />
      </div>
    </div>
  );
}

// Main couple dashboard skeleton
export function CoupleDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5]">
      {/* Header skeleton */}
      <div className="border-b border-[#E8D5D0]/30 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shimmer className="w-10 h-10 rounded-xl" delay={0} />
              <div className="space-y-1">
                <Shimmer className="h-5 w-32 rounded" delay={0.1} />
                <Shimmer className="h-3 w-24 rounded" delay={0.2} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Shimmer className="w-10 h-10 rounded-full" delay={0.3} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome banner skeleton */}
        <Shimmer className="h-32 rounded-2xl" delay={0.2} />

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 0.1, 0.2, 0.3].map((delay, i) => (
            <StatCardSkeleton key={i} delay={delay} />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <EventCardSkeleton />
            <div className="bg-white rounded-2xl border border-[#E8D5D0]/30 p-6">
              <Shimmer className="h-6 w-48 rounded mb-4" delay={0.4} />
              <div className="space-y-1">
                {[0.5, 0.6, 0.7, 0.8, 0.9].map((delay, i) => (
                  <ChecklistItemSkeleton key={i} delay={delay} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8D5D0]/30 p-6">
              <Shimmer className="h-6 w-32 rounded mb-4" delay={0.5} />
              <div className="space-y-2">
                {[0.6, 0.7, 0.8].map((delay, i) => (
                  <ActivityItemSkeleton key={i} delay={delay} />
                ))}
              </div>
            </div>
            <Shimmer className="h-32 rounded-xl" delay={0.7} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Business dashboard skeleton
export function BusinessDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shimmer className="w-10 h-10 rounded-xl" delay={0} />
              <div className="space-y-1">
                <Shimmer className="h-5 w-32 rounded" delay={0.1} />
                <Shimmer className="h-3 w-24 rounded" delay={0.2} />
              </div>
            </div>
            <Shimmer className="w-10 h-10 rounded-full" delay={0.3} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome banner */}
        <Shimmer className="h-32 rounded-2xl bg-gray-200" delay={0.2} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 0.1, 0.2, 0.3].map((delay, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Shimmer className="h-3 w-20 rounded" delay={delay} />
                  <Shimmer className="h-8 w-16 rounded" delay={delay + 0.1} />
                  <Shimmer className="h-3 w-12 rounded" delay={delay + 0.2} />
                </div>
                <Shimmer className="w-10 h-10 rounded-lg" delay={delay + 0.1} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Shimmer className="h-10 w-64 rounded bg-white" delay={0.4} />

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <Shimmer className="h-6 w-32 rounded" delay={0.5} />
          </div>
          <div className="divide-y divide-gray-200">
            {[0.6, 0.7, 0.8, 0.9].map((delay, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Shimmer className="w-10 h-10 rounded-full" delay={delay} />
                  <div className="space-y-2 flex-1">
                    <Shimmer className="h-4 w-32 rounded" delay={delay + 0.1} />
                    <Shimmer className="h-3 w-24 rounded" delay={delay + 0.2} />
                  </div>
                </div>
                <Shimmer className="h-8 w-24 rounded" delay={delay + 0.3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic section skeleton
export function SectionSkeleton({ 
  lines = 3,
  className 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer 
          key={i} 
          className="h-4 w-full rounded" 
          delay={i * 0.1} 
        />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ 
  header = true,
  lines = 3,
  actions = false 
}: { 
  header?: boolean;
  lines?: number;
  actions?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E8D5D0]/30 p-6 space-y-4">
      {header && <Shimmer className="h-6 w-32 rounded" delay={0} />}
      <SectionSkeleton lines={lines} />
      {actions && (
        <div className="flex gap-3 pt-2">
          <Shimmer className="h-10 flex-1 rounded-lg" delay={0.5} />
          <Shimmer className="h-10 flex-1 rounded-lg" delay={0.6} />
        </div>
      )}
    </div>
  );
}
