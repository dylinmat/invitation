"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Ban,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-800",
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        danger: "bg-red-100 text-red-800 border-red-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
        neutral: "bg-gray-100 text-gray-800",
        outline: "border border-input bg-background",
      },
      size: {
        default: "rounded-full",
        sm: "rounded text-[10px] px-1.5 py-0",
        lg: "rounded-full px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status:
    | "active"
    | "inactive"
    | "pending"
    | "suspended"
    | "banned"
    | "verified"
    | "unverified"
    | "error"
    | "warning"
    | "loading"
    | "draft"
    | "published"
    | "archived"
    | "completed"
    | "cancelled"
    | "scheduled"
    | "running"
    | "maintenance"
    | string;
  showIcon?: boolean;
  animate?: boolean;
}

const statusConfig: Record<
  string,
  {
    variant: VariantProps<typeof statusBadgeVariants>["variant"];
    icon: LucideIcon;
    label: string;
    animate?: boolean;
  }
> = {
  active: { variant: "success", icon: CheckCircle2, label: "Active" },
  inactive: { variant: "neutral", icon: XCircle, label: "Inactive" },
  pending: { variant: "warning", icon: Clock, label: "Pending", animate: true },
  suspended: { variant: "danger", icon: Ban, label: "Suspended" },
  banned: { variant: "danger", icon: Ban, label: "Banned" },
  verified: { variant: "success", icon: CheckCircle2, label: "Verified" },
  unverified: { variant: "warning", icon: AlertCircle, label: "Unverified" },
  error: { variant: "danger", icon: XCircle, label: "Error" },
  warning: { variant: "warning", icon: AlertCircle, label: "Warning" },
  loading: { variant: "info", icon: Loader2, label: "Loading", animate: true },
  draft: { variant: "neutral", icon: Clock, label: "Draft" },
  published: { variant: "success", icon: CheckCircle2, label: "Published" },
  archived: { variant: "neutral", icon: ArchiveIcon, label: "Archived" },
  completed: { variant: "success", icon: CheckCircle2, label: "Completed" },
  cancelled: { variant: "danger", icon: XCircle, label: "Cancelled" },
  scheduled: { variant: "info", icon: Clock, label: "Scheduled" },
  running: { variant: "success", icon: Loader2, label: "Running", animate: true },
  maintenance: { variant: "warning", icon: AlertCircle, label: "Maintenance" },
};

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function StatusBadge({
  status,
  showIcon = true,
  animate,
  className,
  variant,
  size,
  children,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    variant: "default",
    icon: HelpCircle,
    label: status,
  };

  const Icon = config.icon;
  const shouldAnimate = animate ?? config.animate;

  return (
    <span
      className={cn(
        statusBadgeVariants({ variant: variant || config.variant, size }),
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon
          className={cn(
            "w-3.5 h-3.5",
            shouldAnimate && "animate-spin"
          )}
          style={{ animationDuration: shouldAnimate ? "2s" : undefined }}
        />
      )}
      <span>{children || config.label}</span>
    </span>
  );
}

// User status badge with special styling
interface UserStatusBadgeProps extends Omit<StatusBadgeProps, "status"> {
  isActive: boolean;
  isVerified?: boolean;
  isBanned?: boolean;
}

export function UserStatusBadge({
  isActive,
  isVerified,
  isBanned,
  ...props
}: UserStatusBadgeProps) {
  let status: StatusBadgeProps["status"] = "inactive";
  if (isBanned) status = "banned";
  else if (isActive && isVerified) status = "verified";
  else if (isActive) status = "active";
  else if (!isVerified) status = "unverified";

  return <StatusBadge status={status} {...props} />;
}

// System health status
interface SystemHealthBadgeProps extends Omit<StatusBadgeProps, "status"> {
  health: "healthy" | "degraded" | "down" | "maintenance";
  uptime?: number;
}

export function SystemHealthBadge({
  health,
  uptime,
  ...props
}: SystemHealthBadgeProps) {
  const statusMap: Record<string, StatusBadgeProps["status"]> = {
    healthy: "active",
    degraded: "warning",
    down: "error",
    maintenance: "maintenance",
  };

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={statusMap[health]} {...props} />
      {uptime !== undefined && (
        <span className="text-xs text-muted-foreground">
          {uptime.toFixed(2)}% uptime
        </span>
      )}
    </div>
  );
}

// Payment/Invoice status
interface PaymentStatusBadgeProps extends Omit<StatusBadgeProps, "status"> {
  status:
    | "paid"
    | "unpaid"
    | "overdue"
    | "refunded"
    | "partial"
    | "pending"
    | "failed"
    | "cancelled";
}

export function PaymentStatusBadge({ status, ...props }: PaymentStatusBadgeProps) {
  const statusMap: Record<string, StatusBadgeProps["status"]> = {
    paid: "completed",
    unpaid: "warning",
    overdue: "danger",
    refunded: "neutral",
    partial: "info",
    pending: "pending",
    failed: "error",
    cancelled: "cancelled",
  };

  return <StatusBadge status={statusMap[status]} {...props} />;
}

// Subscription status
interface SubscriptionStatusBadgeProps extends Omit<StatusBadgeProps, "status"> {
  status: "active" | "trialing" | "past_due" | "cancelled" | "paused" | "unpaid";
}

export function SubscriptionStatusBadge({ status, ...props }: SubscriptionStatusBadgeProps) {
  const statusMap: Record<string, StatusBadgeProps["status"]> = {
    active: "active",
    trialing: "info",
    past_due: "warning",
    cancelled: "cancelled",
    paused: "neutral",
    unpaid: "danger",
  };

  return <StatusBadge status={statusMap[status]} {...props} />;
}
