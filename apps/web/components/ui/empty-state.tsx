"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileQuestion,
  Inbox,
  FolderOpen,
  Users,
  Mail,
  Calendar,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { cardVariants } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

type EmptyStateVariant = "default" | "search" | "inbox" | "folder" | "users" | "custom";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: EmptyStateVariant;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
  centered?: boolean;
}

interface EmptyStateIllustrationProps {
  variant: EmptyStateVariant;
  icon?: LucideIcon;
  className?: string;
}

// ============================================
// ILLUSTRATION COMPONENT
// ============================================

const iconMap: Record<EmptyStateVariant, LucideIcon> = {
  default: FileQuestion,
  search: Search,
  inbox: Inbox,
  folder: FolderOpen,
  users: Users,
  custom: FileQuestion,
};

function EmptyStateIllustration({
  variant,
  icon: CustomIcon,
  className,
}: EmptyStateIllustrationProps) {
  const Icon = CustomIcon || iconMap[variant];

  const illustrations = {
    default: (
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-rose-50 flex items-center justify-center">
          <Icon className="h-10 w-10 text-rose-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-lg">?</span>
        </div>
      </div>
    ),
    search: (
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Search className="h-10 w-10 text-blue-400" />
        </div>
        <motion.div
          animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-blue-200"
        />
      </div>
    ),
    inbox: (
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Inbox className="h-10 w-10 text-emerald-400" />
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-4 w-8 bg-emerald-200 rounded-b-full" />
      </div>
    ),
    folder: (
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-amber-50 flex items-center justify-center">
          <FolderOpen className="h-10 w-10 text-amber-400" />
        </div>
        <div className="absolute bottom-2 right-2 h-3 w-5 bg-amber-200 rounded" />
      </div>
    ),
    users: (
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center -mr-4">
          <Users className="h-7 w-7 text-purple-400" />
        </div>
        <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center z-10">
          <Users className="h-7 w-7 text-purple-300" />
        </div>
        <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center -ml-4">
          <Users className="h-7 w-7 text-purple-400" />
        </div>
      </div>
    ),
    custom: (
      <div className="h-20 w-20 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
    ),
  };

  return (
    <div className={cn("mb-6", className)}>
      {illustrations[variant]}
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      variant = "default",
      primaryAction,
      secondaryAction,
      children,
      className,
      compact = false,
      centered = true,
    },
    ref
  ) => {
    const defaultMessages = {
      default: {
        title: "Nothing here yet",
        description: "Get started by creating your first item.",
      },
      search: {
        title: "No results found",
        description: "Try adjusting your search or filters to find what you're looking for.",
      },
      inbox: {
        title: "Your inbox is empty",
        description: "You're all caught up! New messages will appear here.",
      },
      folder: {
        title: "This folder is empty",
        description: "Files and documents you upload will appear here.",
      },
      users: {
        title: "No users yet",
        description: "Invite team members to collaborate on this project.",
      },
      custom: {
        title: "Nothing to display",
        description: "",
      },
    };

    const displayTitle = title || defaultMessages[variant].title;
    const displayDescription = description !== undefined 
      ? description 
      : defaultMessages[variant].description;

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "flex flex-col",
          centered && "items-center text-center",
          !compact && "p-12",
          compact && "p-6",
          className
        )}
      >
        <EmptyStateIllustration variant={variant} icon={icon} />

        <div className={cn("space-y-2", !centered && "max-w-md")}>
          <h3
            className={cn(
              "font-semibold tracking-tight text-foreground",
              compact ? "text-base" : "text-lg"
            )}
          >
            {displayTitle}
          </h3>
          
          {displayDescription && (
            <p
              className={cn(
                "text-muted-foreground",
                compact ? "text-sm" : "text-base max-w-sm"
              )}
            >
              {displayDescription}
            </p>
          )}
        </div>

        {/* Custom content */}
        {children && <div className="mt-4">{children}</div>}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div
            className={cn(
              "flex gap-3",
              centered ? "mt-6" : "mt-4",
              !centered && "flex-row"
            )}
          >
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                className={cn(
                  "bg-rose-600 hover:bg-rose-700",
                  primaryAction.icon && "gap-2"
                )}
              >
                {primaryAction.icon && (
                  <primaryAction.icon className="h-4 w-4" />
                )}
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);
EmptyState.displayName = "EmptyState";

// ============================================
// SPECIALIZED EMPTY STATES
// ============================================

function EmptySearch({
  query,
  onClear,
  className,
}: {
  query: string;
  onClear: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="search"
      title={`No results for "${query}"`}
      description="Try different keywords or check your spelling"
      primaryAction={{ label: "Clear search", onClick: onClear }}
      className={className}
    />
  );
}

function EmptyInbox({
  className,
}: {
  className?: string;
}) {
  return (
    <EmptyState
      variant="inbox"
      title="You're all caught up!"
      description="No new notifications or messages at the moment."
      className={className}
    />
  );
}

function EmptyFolder({
  onUpload,
  className,
}: {
  onUpload: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="folder"
      title="No files yet"
      description="Upload your first file to get started"
      primaryAction={{ label: "Upload file", onClick: onUpload }}
      className={className}
    />
  );
}

function EmptyTeam({
  onInvite,
  className,
}: {
  onInvite: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="users"
      title="No team members yet"
      description="Invite colleagues to collaborate on this project"
      primaryAction={{ label: "Invite team", onClick: onInvite }}
      className={className}
    />
  );
}

// ============================================
// ERROR STATE
// ============================================

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while processing your request.",
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      variant="custom"
      icon={() => (
        <div className="h-20 w-20 rounded-2xl bg-red-50 flex items-center justify-center">
          <span className="text-4xl">😕</span>
        </div>
      )}
      title={title}
      description={
        <>
          {description}
          {error && (
            <code className="block mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
              {typeof error === "string" ? error : error.message}
            </code>
          )}
        </>
      }
      primaryAction={
        onRetry ? { label: "Try again", onClick: onRetry } : undefined
      }
      className={className}
    />
  );
}

// ============================================
// COMING SOON STATE
// ============================================

function ComingSoon({
  feature,
  description,
  className,
}: {
  feature: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyState
      variant="custom"
      icon={() => (
        <div className="h-20 w-20 rounded-2xl bg-amber-50 flex items-center justify-center">
          <span className="text-4xl">🚧</span>
        </div>
      )}
      title={`${feature} coming soon`}
      description={
        description ||
        "We're working on this feature. Stay tuned for updates!"
      }
      className={className}
    />
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  EmptyState,
  EmptySearch,
  EmptyInbox,
  EmptyFolder,
  EmptyTeam,
  ErrorState,
  ComingSoon,
  EmptyStateIllustration,
  type EmptyStateProps,
  type EmptyStateVariant,
  type EmptyStateIllustrationProps,
};
