"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  isLoading,
  className,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  const isNeutral = trend === 0 || trend === undefined;

  return (
    <Card
      className={cn(
        "border border-border/50 transition-all duration-150",
        "hover:border-[#E8D5D0]/60",
        className
      )}
      style={{ borderRadius: "12px" }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className="text-3xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-medium",
                    isPositive && "text-green-600",
                    isNegative && "text-red-600",
                    isNeutral && "text-muted-foreground"
                  )}
                >
                  {isPositive && (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  )}
                  {isNegative && (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {isNeutral && <Minus className="mr-1 h-3 w-3" />}
                  {isPositive && "+"}
                  {trend}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: "#FDF8F5" }}
          >
            <div className="text-[#8B6B5D]">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPICardsSkeletonProps {
  count?: number;
}

export function KPICardsSkeleton({ count = 5 }: KPICardsSkeletonProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 w-full">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
