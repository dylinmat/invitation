"use client";

/**
 * Role Badge Component
 * Display user roles with appropriate styling
 * Inspired by GitHub and Vercel's role indicators
 */

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Role,
  RoleDisplayNames,
  RoleDescriptions,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

// ============================================
// Style Variants
// ============================================

const roleBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "rounded-full",
        pill: "rounded-full",
        square: "rounded-md",
        dot: "rounded-full p-1",
        outline: "rounded-full border bg-transparent",
        ghost: "bg-transparent",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1",
        xs: "text-[10px] px-1.5 py-0",
      },
      role: {
        owner: "",
        admin: "",
        member: "",
        viewer: "",
      },
    },
    compoundVariants: [
      // Owner styles
      {
        variant: "default",
        role: "owner",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      },
      {
        variant: "outline",
        role: "owner",
        className: "border-purple-300 text-purple-700",
      },
      {
        variant: "dot",
        role: "owner",
        className: "bg-purple-500",
      },
      // Admin styles
      {
        variant: "default",
        role: "admin",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      },
      {
        variant: "outline",
        role: "admin",
        className: "border-blue-300 text-blue-700",
      },
      {
        variant: "dot",
        role: "admin",
        className: "bg-blue-500",
      },
      // Member styles
      {
        variant: "default",
        role: "member",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      },
      {
        variant: "outline",
        role: "member",
        className: "border-emerald-300 text-emerald-700",
      },
      {
        variant: "dot",
        role: "member",
        className: "bg-emerald-500",
      },
      // Viewer styles
      {
        variant: "default",
        role: "viewer",
        className: "bg-gray-100 text-gray-700 border-gray-200",
      },
      {
        variant: "outline",
        role: "viewer",
        className: "border-gray-300 text-gray-600",
      },
      {
        variant: "dot",
        role: "viewer",
        className: "bg-gray-400",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      role: "viewer",
    },
  }
);

// ============================================
// Icon Components
// ============================================

function OwnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MemberIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function ViewerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const roleIcons: Record<Role, React.ComponentType<{ className?: string }>> = {
  owner: OwnerIcon,
  admin: AdminIcon,
  member: MemberIcon,
  viewer: ViewerIcon,
};

// ============================================
// Props Types
// ============================================

interface RoleBadgeProps extends VariantProps<typeof roleBadgeVariants> {
  role: Role;
  showIcon?: boolean;
  customLabel?: string;
  className?: string;
  title?: string;
}

interface RoleBadgeGroupProps {
  roles: Role[];
  variant?: VariantProps<typeof roleBadgeVariants>["variant"];
  size?: VariantProps<typeof roleBadgeVariants>["size"];
  maxVisible?: number;
  className?: string;
}

interface RoleDotProps {
  role: Role;
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

interface RoleLabelProps {
  role: Role;
  showDescription?: boolean;
  className?: string;
}

// ============================================
// Main Role Badge Component
// ============================================

export function RoleBadge({
  role,
  variant = "default",
  size = "md",
  showIcon = true,
  customLabel,
  className,
  title,
}: RoleBadgeProps) {
  const Icon = roleIcons[role];
  const label = customLabel || RoleDisplayNames[role];
  const description = RoleDescriptions[role];

  return (
    <span
      className={cn(roleBadgeVariants({ variant, size, role }), className)}
      title={title || description}
    >
      {showIcon && variant !== "dot" && (
        <Icon className={cn("w-3.5 h-3.5", size === "lg" && "w-4 h-4", size === "sm" && "w-3 h-3")} />
      )}
      {variant !== "dot" && <span>{label}</span>}
      <span className="sr-only">{description}</span>
    </span>
  );
}

// ============================================
// Role Dot Component (minimal indicator)
// ============================================

export function RoleDot({
  role,
  size = "md",
  className,
  pulse = false,
}: RoleDotProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const roleColors = {
    owner: "bg-purple-500",
    admin: "bg-blue-500",
    member: "bg-emerald-500",
    viewer: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full",
        sizeClasses[size],
        roleColors[role],
        pulse && "animate-pulse",
        className
      )}
      title={RoleDisplayNames[role]}
    >
      <span className="sr-only">{RoleDisplayNames[role]}</span>
    </span>
  );
}

// ============================================
// Role Badge Group
// ============================================

export function RoleBadgeGroup({
  roles,
  variant = "default",
  size = "sm",
  maxVisible = 3,
  className,
}: RoleBadgeGroupProps) {
  const visibleRoles = roles.slice(0, maxVisible);
  const remainingCount = roles.length - maxVisible;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {visibleRoles.map((role) => (
        <RoleBadge
          key={role}
          role={role}
          variant={variant}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            "text-xs text-gray-500",
            size === "sm" && "text-[10px]",
            size === "lg" && "text-sm"
          )}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

// ============================================
// Role Label with Description
// ============================================

export function RoleLabel({
  role,
  showDescription = false,
  className,
}: RoleLabelProps) {
  const Icon = roleIcons[role];

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          role === "owner" && "bg-purple-100 text-purple-600",
          role === "admin" && "bg-blue-100 text-blue-600",
          role === "member" && "bg-emerald-100 text-emerald-600",
          role === "viewer" && "bg-gray-100 text-gray-600"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {RoleDisplayNames[role]}
        </p>
        {showDescription && (
          <p className="text-sm text-gray-500 mt-0.5">
            {RoleDescriptions[role]}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Role Hierarchy Indicator
// ============================================

interface RoleHierarchyProps {
  currentRole: Role;
  highlightAbove?: boolean;
  className?: string;
}

export function RoleHierarchy({
  currentRole,
  highlightAbove = false,
  className,
}: RoleHierarchyProps) {
  const roles: Role[] = ["viewer", "member", "admin", "owner"];
  const currentIndex = roles.indexOf(currentRole);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {roles.map((role, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={role}>
            {index > 0 && (
              <div
                className={cn(
                  "w-3 h-0.5",
                  isActive ? "bg-gray-400" : "bg-gray-200"
                )}
              />
            )}
            <RoleDot
              role={role}
              size="sm"
              className={cn(
                !isActive && "opacity-30",
                isCurrent && "ring-2 ring-offset-1 ring-gray-300"
              )}
              pulse={isCurrent}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================
// Role Comparison
// ============================================

interface RoleComparisonProps {
  fromRole: Role;
  toRole: Role;
  className?: string;
}

export function RoleComparison({
  fromRole,
  toRole,
  className,
}: RoleComparisonProps) {
  const fromIndex = ["viewer", "member", "admin", "owner"].indexOf(fromRole);
  const toIndex = ["viewer", "member", "admin", "owner"].indexOf(toRole);
  const isUpgrade = toIndex > fromIndex;
  const isDowngrade = toIndex < fromIndex;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RoleBadge role={fromRole} size="sm" />
      <span
        className={cn(
          "text-xs",
          isUpgrade && "text-emerald-600",
          isDowngrade && "text-amber-600",
          !isUpgrade && !isDowngrade && "text-gray-400"
        )}
      >
        {isUpgrade && "→"}
        {isDowngrade && "→"}
        {!isUpgrade && !isDowngrade && "→"}
      </span>
      <RoleBadge role={toRole} size="sm" />
    </div>
  );
}

// ============================================
// Convenience Exports
// ============================================

export const RoleBadgeIcons = {
  Owner: OwnerIcon,
  Admin: AdminIcon,
  Member: MemberIcon,
  Viewer: ViewerIcon,
};

// ============================================
// Default Export
// ============================================

export default RoleBadge;
