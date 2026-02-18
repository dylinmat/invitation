"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  LucideIcon,
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  loading?: boolean;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
}

const variantStyles = {
  default: "bg-card",
  success: "bg-green-50/50 border-green-200",
  warning: "bg-yellow-50/50 border-yellow-200",
  danger: "bg-red-50/50 border-red-200",
  info: "bg-blue-50/50 border-blue-200",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
  className,
  variant = "default",
  onClick,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend?.direction === "up" 
    ? TrendingUp 
    : trend?.direction === "down" 
    ? TrendingDown 
    : Minus;

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-shadow",
          variantStyles[variant],
          onClick && "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <div className={cn("p-2 rounded-lg", iconVariantStyles[variant])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {(description || trend) && (
            <div className="flex items-center gap-2 mt-1">
              {trend && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium border-0 px-1.5 py-0 h-5",
                    trend.direction === "up" && "bg-green-100 text-green-700",
                    trend.direction === "down" && "bg-red-100 text-red-700",
                    trend.direction === "neutral" && "bg-gray-100 text-gray-700"
                  )}
                >
                  <TrendIcon className="w-3 h-3 mr-1" />
                  {trend.value > 0 && "+"}
                  {trend.value}%
                </Badge>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend?.label && !description && (
                <p className="text-xs text-muted-foreground">{trend.label}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Sparkline mini chart for stats
interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
  height?: number;
}

export function Sparkline({
  data,
  className,
  color = "currentColor",
  height = 30,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((value - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full", className)}
      style={{ height }}
      preserveAspectRatio="none"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Quick action button for stats cards
interface QuickActionProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "ghost";
}

export function QuickAction({ label, onClick, icon: Icon, variant = "outline" }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs font-medium px-2 py-1 rounded transition-colors",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "outline" && "border border-input hover:bg-accent hover:text-accent-foreground",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <span className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
    </button>
  );
}
