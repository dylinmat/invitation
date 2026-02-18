"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RealTimeStat } from "@/lib/analytics";
import {
  Users,
  Eye,
  Send,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  Zap,
} from "lucide-react";

interface RealTimeStatsProps {
  stats: RealTimeStat[];
  isLoading?: boolean;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
}

interface LiveIndicatorProps {
  isActive: boolean;
}

function LiveIndicator({ isActive }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            isActive ? "bg-green-400" : "bg-gray-300"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isActive ? "bg-green-500" : "bg-gray-400"
          )}
        />
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {isActive ? "LIVE" : "PAUSED"}
      </span>
    </div>
  );
}

interface StatCardProps {
  stat: RealTimeStat;
  index: number;
}

const ICONS: Record<string, React.ElementType> = {
  activeUsers: Users,
  pageViews: Eye,
  invitationsSent: Send,
  rsvps: CheckCircle,
  conversionRate: Activity,
};

const COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  activeUsers: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    icon: "text-blue-500",
  },
  pageViews: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    icon: "text-purple-500",
  },
  invitationsSent: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    icon: "text-amber-500",
  },
  rsvps: {
    bg: "bg-green-50",
    text: "text-green-600",
    icon: "text-green-500",
  },
  conversionRate: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    icon: "text-rose-500",
  },
};

function TrendIndicator({
  trend,
  change,
}: {
  trend: "up" | "down" | "neutral";
  change: number;
}) {
  if (trend === "neutral" || change === 0) {
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Minus className="w-3 h-3 mr-0.5" />
        No change
      </span>
    );
  }

  const isPositive = trend === "up";

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium",
        isPositive ? "text-green-600" : "text-red-500"
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3 mr-0.5" />
      ) : (
        <TrendingDown className="w-3 h-3 mr-0.5" />
      )}
      {change > 0 ? "+" : ""}
      {change}%
    </span>
  );
}

function AnimatedNumber({
  value,
  unit,
}: {
  value: number;
  unit?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const duration = 500;
      const steps = 20;
      const increment = (value - displayValue) / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        if (step >= steps) {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayValue((prev) => Math.round(prev + increment));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, displayValue]);

  return (
    <span
      className={cn(
        "tabular-nums transition-all duration-150",
        isAnimating && "scale-105"
      )}
    >
      {displayValue.toLocaleString()}
      {unit && <span className="text-lg ml-0.5">{unit}</span>}
    </span>
  );
}

function StatCard({ stat, index }: StatCardProps) {
  const Icon = ICONS[stat.id] || Activity;
  const colors = COLORS[stat.id] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    icon: "text-gray-500",
  };

  return (
    <Card
      className={cn(
        "border border-border/50 overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-primary/20"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className={cn("text-2xl font-semibold tracking-tight", colors.text)}>
              <AnimatedNumber value={stat.value} unit={stat.unit} />
            </p>
            <TrendIndicator trend={stat.trend} change={stat.change} />
          </div>
          <div
            className={cn(
              "p-2.5 rounded-lg transition-colors",
              colors.bg
            )}
          >
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
        </div>

        {/* Mini sparkline visualization */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              vs previous period
            </span>
          </div>
          <div className="mt-2 flex items-end gap-0.5 h-8">
            {Array.from({ length: 12 }).map((_, i) => {
              const height = Math.random() * 100;
              const isActive = i === 11;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm transition-all duration-300",
                    isActive ? colors.bg.replace("bg-", "bg-opacity-100 ") : "bg-muted",
                    isActive && colors.bg
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RealTimeStats({
  stats,
  isLoading,
  className,
  autoRefresh = true,
  refreshInterval = 30000,
  onRefresh,
}: RealTimeStatsProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(autoRefresh);

  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date());
    onRefresh?.();
  }, [onRefresh]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval, handleRefresh]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Real-time Statistics</h3>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-full mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Real-time Statistics</h3>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              isLive
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <LiveIndicator isActive={isLive} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Refresh now"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <StatCard key={stat.id} stat={stat} index={index} />
        ))}
      </div>
    </div>
  );
}

// Mini version for dashboard embed
interface MiniRealTimeStatsProps {
  stats: RealTimeStat[];
  isLoading?: boolean;
  className?: string;
}

export function MiniRealTimeStats({
  stats,
  isLoading,
  className,
}: MiniRealTimeStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-3 grid-cols-2 md:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 grid-cols-2 md:grid-cols-4", className)}>
      {stats.slice(0, 4).map((stat) => {
        const Icon = ICONS[stat.id] || Activity;
        const colors = COLORS[stat.id] || {
          bg: "bg-gray-50",
          text: "text-gray-600",
          icon: "text-gray-500",
        };

        return (
          <div
            key={stat.id}
            className="p-3 rounded-lg border border-border/50 bg-white"
          >
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", colors.bg)}>
                <Icon className={cn("w-4 h-4", colors.icon)} />
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {stat.label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={cn("text-lg font-semibold", colors.text)}>
                {stat.value.toLocaleString()}
                {stat.unit}
              </span>
              <TrendIndicator trend={stat.trend} change={stat.change} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
