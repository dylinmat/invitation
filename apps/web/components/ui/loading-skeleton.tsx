"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./card";

// ============================================
// TYPES
// ============================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  rounded?: boolean;
  animate?: boolean;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineHeight?: number;
  lastLineWidth?: string;
}

interface SkeletonCardProps {
  header?: boolean;
  content?: boolean;
  footer?: boolean;
  lines?: number;
  className?: string;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  hasHeader?: boolean;
}

interface SkeletonAvatarProps {
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  className?: string;
}

interface SkeletonPulseProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================
// BASE SKELETON
// ============================================

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      width,
      height,
      circle = false,
      rounded = true,
      animate = true,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted",
          rounded && !circle && "rounded-md",
          circle && "rounded-full",
          animate && "animate-pulse",
          className
        )}
        style={{
          width: width,
          height: height,
        }}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// ============================================
// SKELETON TEXT
// ============================================

function SkeletonText({
  lines = 3,
  className,
  lineHeight = 16,
  lastLineWidth = "60%",
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full"
          height={lineHeight}
          style={{
            width: i === lines - 1 ? lastLineWidth : "100%",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// SKELETON CARD
// ============================================

function SkeletonCard({
  header = true,
  content = true,
  footer = false,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {header && (
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={14} />
            </div>
            <Skeleton width={40} height={40} circle />
          </div>
        </CardHeader>
      )}

      {content && (
        <CardContent>
          <SkeletonText lines={lines} />
        </CardContent>
      )}

      {footer && (
        <div className="p-6 pt-0 flex items-center justify-between">
          <Skeleton width={80} height={32} />
          <Skeleton width={80} height={32} />
        </div>
      )}
    </Card>
  );
}

// ============================================
// SKELETON TABLE
// ============================================

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  hasHeader = true,
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-lg border">
        <table className="w-full">
          {hasHeader && (
            <thead>
              <tr className="border-b bg-muted/50">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton width={`${70 + Math.random() * 30}%`} height={16} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-0">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <Skeleton
                      width={`${40 + Math.random() * 60}%`}
                      height={16}
                      animate
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// SKELETON AVATAR
// ============================================

function SkeletonAvatar({
  size = "default",
  className,
}: SkeletonAvatarProps) {
  const sizes = {
    xs: "h-5 w-5",
    sm: "h-7 w-7",
    default: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  return <Skeleton className={cn("rounded-full", sizes[size], className)} />;
}

// ============================================
// SKELETON METRIC CARD
// ============================================

function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton width={100} height={14} />
          <Skeleton width={80} height={28} />
          <Skeleton width={60} height={14} />
        </div>
        <Skeleton width={40} height={40} circle />
      </div>
    </Card>
  );
}

// ============================================
// SKELETON LIST
// ============================================

function SkeletonList({
  items = 4,
  withAvatar = true,
  className,
}: {
  items?: number;
  withAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card">
          {withAvatar && <SkeletonAvatar />}
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={12} />
          </div>
          <Skeleton width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

// ============================================
// SHIMMER EFFECT
// ============================================

function SkeletonPulse({ children, className }: SkeletonPulseProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// LOADING OVERLAY
// ============================================

interface LoadingOverlayProps {
  children?: React.ReactNode;
  loading: boolean;
  text?: string;
  className?: string;
}

function LoadingOverlay({
  children,
  loading,
  text = "Loading...",
  className,
}: LoadingOverlayProps) {
  if (!loading) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
        <div className="h-8 w-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// ============================================
// SPINNER
// ============================================

interface SpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

function Spinner({ size = "default", className }: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    default: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      className={cn(
        "rounded-full border-rose-500/20 border-t-rose-500 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

// ============================================
// PROGRESSIVE LOADING
// ============================================

interface ProgressiveLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

function ProgressiveLoading({
  isLoading,
  children,
  fallback,
  delay = 200,
}: ProgressiveLoadingProps) {
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  if (!isLoading) return <>{children}</>;
  if (!showLoading) return null;

  return <>{fallback || <SkeletonCard />}</>;
}

// ============================================
// SKELETON GRID
// ============================================

function SkeletonGrid({
  items = 4,
  columns = 2,
  className,
}: {
  items?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonMetricCard,
  SkeletonList,
  SkeletonPulse,
  SkeletonGrid,
  LoadingOverlay,
  Spinner,
  ProgressiveLoading,
  type SkeletonProps,
  type SkeletonTextProps,
  type SkeletonCardProps,
  type SkeletonTableProps,
  type SkeletonAvatarProps,
  type LoadingOverlayProps,
  type SpinnerProps,
};
