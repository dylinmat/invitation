"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type TrendDirection = "up" | "down" | "neutral";

interface StatTrendProps {
  value: number;
  direction?: TrendDirection;
  label?: string;
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  inverse?: boolean;
  className?: string;
  animated?: boolean;
}

interface StatComparisonProps {
  current: number;
  previous: number;
  format?: "percentage" | "absolute" | "currency";
  currency?: string;
  decimals?: number;
  label?: string;
  size?: "sm" | "default" | "lg";
  showValues?: boolean;
  inverse?: boolean;
  className?: string;
}

// ============================================
// STAT TREND COMPONENT
// ============================================

const StatTrend = React.forwardRef<HTMLSpanElement, StatTrendProps>(
  (
    {
      value,
      direction = "neutral",
      label,
      size = "default",
      showIcon = true,
      inverse = false,
      className,
      animated = true,
    },
    ref
  ) => {
    // Determine effective direction (for inverse metrics like costs where down is good)
    const effectiveDirection = inverse
      ? direction === "up"
        ? "down"
        : direction === "down"
        ? "up"
        : "neutral"
      : direction;

    // Colors based on effective direction
    const colors = {
      up: "text-emerald-600 bg-emerald-50 border-emerald-200",
      down: "text-red-600 bg-red-50 border-red-200",
      neutral: "text-gray-600 bg-gray-50 border-gray-200",
    };

    const Icon = {
      up: TrendingUp,
      down: TrendingDown,
      neutral: Minus,
    }[direction];

    const ArrowIcon = {
      up: ArrowUpRight,
      down: ArrowDownRight,
      neutral: ArrowRight,
    }[direction];

    const sizes = {
      sm: {
        container: "text-xs px-1.5 py-0.5 gap-1",
        icon: "h-3 w-3",
      },
      default: {
        container: "text-sm px-2 py-1 gap-1.5",
        icon: "h-4 w-4",
      },
      lg: {
        container: "text-base px-3 py-1.5 gap-2",
        icon: "h-5 w-5",
      },
    };

    const displayValue = `${direction === "up" ? "+" : ""}${value}%`;

    return (
      <motion.span
        ref={ref}
        initial={animated ? { opacity: 0, scale: 0.9 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          sizes[size].container,
          colors[effectiveDirection],
          className
        )}
      >
        {showIcon && <Icon className={sizes[size].icon} />}
        <span>{displayValue}</span>
        {label && (
          <span className="text-muted-foreground font-normal">{label}</span>
        )}
      </motion.span>
    );
  }
);
StatTrend.displayName = "StatTrend";

// ============================================
// STAT COMPARISON COMPONENT
// ============================================

function StatComparison({
  current,
  previous,
  format = "percentage",
  currency = "USD",
  decimals = 0,
  label = "vs last period",
  size = "default",
  showValues = false,
  inverse = false,
  className,
}: StatComparisonProps) {
  const diff = current - previous;
  const percentChange = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 0;
  const direction: TrendDirection =
    diff > 0 ? "up" : diff < 0 ? "down" : "neutral";

  const formatValue = (value: number): string => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
      case "percentage":
        return `${value.toFixed(decimals)}%`;
      case "absolute":
      default:
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showValues && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{formatValue(current)}</span>
          <span className="text-sm text-muted-foreground">
            from {formatValue(previous)}
          </span>
        </div>
      )}
      <StatTrend
        value={Math.abs(percentChange)}
        direction={direction}
        label={label}
        size={size}
        inverse={inverse}
      />
    </div>
  );
}

// ============================================
// MINI SPARKLINE
// ============================================

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

function MiniSparkline({
  data,
  width = 60,
  height = 24,
  className,
  color,
}: MiniSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1] >= data[0];
  const defaultColor = isPositive ? "#16a34a" : "#dc2626";

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
    >
      <polyline
        fill="none"
        stroke={color || defaultColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r={2}
        fill={color || defaultColor}
      />
    </svg>
  );
}

// ============================================
// TREND INDICATOR WITH SPARKLINE
// ============================================

interface TrendIndicatorProps {
  data: number[];
  label?: string;
  showSparkline?: boolean;
  className?: string;
}

function TrendIndicator({
  data,
  label = "vs last period",
  showSparkline = true,
  className,
}: TrendIndicatorProps) {
  if (data.length < 2) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const percentChange = first !== 0 ? (diff / Math.abs(first)) * 100 : 0;
  const direction: TrendDirection =
    diff > 0 ? "up" : diff < 0 ? "down" : "neutral";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StatTrend
        value={Math.abs(percentChange)}
        direction={direction}
        label={label}
        size="sm"
      />
      {showSparkline && (
        <MiniSparkline data={data} width={50} height={20} />
      )}
    </div>
  );
}

// ============================================
// LIVE INDICATOR
// ============================================

interface LiveIndicatorProps {
  label?: string;
  className?: string;
  pulseColor?: string;
}

function LiveIndicator({
  label = "Live",
  className,
  pulseColor = "bg-emerald-500",
}: LiveIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            pulseColor
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            pulseColor
          )}
        />
      </span>
      {label}
    </span>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  StatTrend,
  StatComparison,
  MiniSparkline,
  TrendIndicator,
  LiveIndicator,
  type StatTrendProps,
  type StatComparisonProps,
  type TrendDirection,
  type MiniSparklineProps,
  type TrendIndicatorProps,
  type LiveIndicatorProps,
};
