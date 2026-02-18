"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Download,
  Maximize2,
  MoreHorizontal,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cardVariants } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  height?: number | string;
  minHeight?: number;
}

interface ChartLegendProps {
  items: {
    label: string;
    color: string;
    value?: string | number;
    dashed?: boolean;
  }[];
  className?: string;
  orientation?: "horizontal" | "vertical";
}

interface ChartTooltipProps {
  title?: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  className?: string;
}

// ============================================
// CHART CONTAINER
// ============================================

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  (
    {
      children,
      title,
      description,
      icon: Icon,
      loading,
      error,
      onRetry,
      onExport,
      onExpand,
      className,
      headerClassName,
      bodyClassName,
      actions,
      footer,
      height = 300,
      minHeight = 200,
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
          className
        )}
      >
        {/* Header */}
        {(title || description || onExport || onExpand || actions) && (
          <div
            className={cn(
              "flex items-start justify-between px-5 py-4 border-b",
              headerClassName
            )}
          >
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div>
                {title && (
                  <h3 className="font-semibold tracking-tight text-foreground">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {actions}

              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="h-8 w-8 p-0"
                  title="Export data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {onExpand && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpand}
                  className="h-8 w-8 p-0"
                  title="Expand"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onExport && (
                    <DropdownMenuItem onClick={onExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as PNG
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>View data table</DropdownMenuItem>
                  <DropdownMenuItem>Customize chart</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Body */}
        <div
          className={cn("relative", bodyClassName)}
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            minHeight: minHeight,
          }}
        >
          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading chart...
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Failed to load chart
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <div className="absolute inset-0 p-4">{children}</div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t bg-muted/30">{footer}</div>
        )}
      </motion.div>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

// ============================================
// CHART LEGEND
// ============================================

function ChartLegend({
  items,
  className,
  orientation = "horizontal",
}: ChartLegendProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-4",
        orientation === "vertical" && "flex-col",
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              item.dashed && "border-2 border-current bg-transparent"
            )}
            style={{ backgroundColor: item.dashed ? undefined : item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-sm font-medium text-foreground">
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// CHART TOOLTIP
// ============================================

function ChartTooltip({ title, items, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-popover p-3 shadow-lg",
        className
      )}
    >
      {title && (
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {title}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {item.color && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// CHART SKELETON
// ============================================

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-[200px] bg-muted rounded-lg animate-pulse" />
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartSkeleton,
  type ChartContainerProps,
  type ChartLegendProps,
  type ChartTooltipProps,
};
