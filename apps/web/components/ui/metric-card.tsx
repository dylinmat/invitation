"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

type TrendDirection = "up" | "down" | "neutral";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  animate?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeLabel?: string;
  trend?: TrendDirection;
  trendValue?: string;
  icon?: LucideIcon;
  iconColor?: string;
  sparklineData?: number[];
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "default" | "lg";
  loading?: boolean;
  compareToPrevious?: boolean;
}

// ============================================
// SPARKLINE COMPONENT
// ============================================

function Sparkline({
  data,
  width = 120,
  height = 40,
  color = "currentColor",
  fillOpacity = 0.1,
  animate = true,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Generate path
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return [x, y];
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill="url(#sparkline-gradient)"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={3}
        fill={color}
        initial={animate ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.2 }}
      />
    </svg>
  );
}

// ============================================
// METRIC CARD COMPONENT
// ============================================

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      previousValue,
      change,
      changeLabel = "vs last period",
      trend,
      trendValue,
      icon: Icon,
      iconColor,
      sparklineData,
      footer,
      onClick,
      className,
      size = "default",
      loading = false,
      compareToPrevious = true,
    },
    ref
  ) => {
    // Calculate trend if not provided
    const calculatedTrend: TrendDirection = React.useMemo(() => {
      if (trend) return trend;
      if (change === undefined) return "neutral";
      if (change > 0) return "up";
      if (change < 0) return "down";
      return "neutral";
    }, [trend, change]);

    // Determine colors based on trend
    const trendColors = {
      up: "text-emerald-600 bg-emerald-50",
      down: "text-red-600 bg-red-50",
      neutral: "text-gray-600 bg-gray-50",
    };

    const sparklineColor =
      calculatedTrend === "up"
        ? "#16a34a"
        : calculatedTrend === "down"
        ? "#dc2626"
        : "#6b7280";

    const TrendIcon =
      calculatedTrend === "up"
        ? TrendingUp
        : calculatedTrend === "down"
        ? TrendingDown
        : Minus;

    const displayChange = change !== undefined ? Math.abs(change) : null;

    const sizes = {
      sm: "p-4",
      default: "p-5",
      lg: "p-6",
    };

    const valueSizes = {
      sm: "text-xl",
      default: "text-2xl",
      lg: "text-3xl",
    };

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-xl border bg-card animate-pulse",
            sizes[size],
            className
          )}
        >
          <div className="h-4 w-20 bg-muted rounded mb-2" />
          <div className="h-8 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={onClick ? "hover" : undefined}
        onClick={onClick}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-sm",
          onClick && "cursor-pointer",
          sizes[size],
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>

            {/* Value */}
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-semibold tracking-tight text-foreground",
                  valueSizes[size]
                )}
              >
                {value}
              </span>

              {/* Trend badge */}
              {(displayChange !== null || trendValue) && compareToPrevious && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium",
                    trendColors[calculatedTrend]
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {trendValue || `${displayChange}%`}
                </span>
              )}
            </div>

            {/* Change description */}
            {compareToPrevious && (change !== undefined || previousValue) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {change !== undefined && (
                  <>
                    {calculatedTrend === "up" && "+"}
                    {change}% {changeLabel}
                  </>
                )}
                {previousValue && (
                  <>
                    {" "}· was {previousValue}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div
              className={cn(
                "shrink-0 p-2 rounded-lg",
                iconColor ? "" : "bg-muted"
              )}
              style={iconColor ? { backgroundColor: `${iconColor}20` } : {}}
            >
              <Icon
                className="h-5 w-5"
                style={iconColor ? { color: iconColor } : {}}
              />
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && !Icon && (
            <div className="shrink-0">
              <Sparkline
                data={sparklineData}
                width={size === "sm" ? 80 : 120}
                height={size === "sm" ? 30 : 40}
                color={sparklineColor}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-4 border-t">{footer}</div>
        )}
      </motion.div>
    );
  }
);
MetricCard.displayName = "MetricCard";

// ============================================
// METRIC GRID
// ============================================

interface MetricGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  gap?: "sm" | "default" | "lg";
}

function MetricGrid({
  children,
  columns = 4,
  className,
  gap = "default",
}: MetricGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses = {
    sm: "gap-3",
    default: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={cn(
        "grid",
        gridCols[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { MetricCard, MetricGrid, Sparkline };
export type { MetricCardProps, TrendDirection, SparklineProps };
