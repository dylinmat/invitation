"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  initials?: string;
  status?: "online" | "offline" | "away" | "busy";
}

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  spacing?: "tight" | "default" | "loose";
  className?: string;
  showTooltip?: boolean;
  animate?: boolean;
  onOverflowClick?: () => void;
  ringColor?: string;
}

interface StackedAvatarsProps extends AvatarGroupProps {
  stacked?: boolean;
}

// ============================================
// STATUS COLORS
// ============================================

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  away: "bg-amber-500",
  busy: "bg-red-500",
};

// ============================================
// SIZE CONFIGURATION
// ============================================

const sizes = {
  xs: { avatar: "h-5 w-5", text: "text-[8px]", ring: "ring-1", offset: "-ml-1" },
  sm: { avatar: "h-7 w-7", text: "text-[10px]", ring: "ring-1.5", offset: "-ml-2" },
  default: { avatar: "h-9 w-9", text: "text-xs", ring: "ring-2", offset: "-ml-3" },
  lg: { avatar: "h-11 w-11", text: "text-sm", ring: "ring-2", offset: "-ml-3" },
  xl: { avatar: "h-14 w-14", text: "text-base", ring: "ring-2", offset: "-ml-4" },
};

// ============================================
// SINGLE AVATAR WITH STATUS
// ============================================

interface AvatarWithStatusProps {
  user: User;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  showStatus?: boolean;
  ringColor?: string;
  className?: string;
}

function AvatarWithStatus({
  user,
  size = "default",
  showStatus = true,
  ringColor = "ring-background",
  className,
}: AvatarWithStatusProps) {
  const config = sizes[size];

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar
        className={cn(
          config.avatar,
          config.ring,
          "ring",
          ringColor,
          "transition-transform hover:scale-105"
        )}
      >
        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
        <AvatarFallback className={config.text}>
          {user.initials ||
            user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      {showStatus && user.status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
            statusColors[user.status],
            size === "xs" && "h-1.5 w-1.5",
            size === "sm" && "h-2 w-2",
            size === "default" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            size === "xl" && "h-3.5 w-3.5"
          )}
        />
      )}
    </div>
  );
}

// ============================================
// AVATAR GROUP COMPONENT
// ============================================

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      users,
      max = 4,
      size = "default",
      spacing = "default",
      className,
      showTooltip = true,
      animate = true,
      onOverflowClick,
      ringColor,
    },
    ref
  ) => {
    const visibleUsers = users.slice(0, max);
    const remainingCount = Math.max(0, users.length - max);
    const config = sizes[size];

    const spacingClasses = {
      tight: "space-x-1",
      default: config.offset,
      loose: "space-x-2",
    };

    const Wrapper = animate ? motion.div : "div";
    const itemProps = animate
      ? {
          initial: { opacity: 0, scale: 0.8, x: -10 },
          animate: { opacity: 1, scale: 1, x: 0 },
          transition: { duration: 0.2 },
        }
      : {};

    return (
      <TooltipProvider>
        <Wrapper
          ref={ref}
          className={cn(
            "flex items-center",
            spacing !== "tight" && "-space-x-2",
            spacing === "tight" && spacingClasses[spacing],
            className
          )}
        >
          {visibleUsers.map((user, index) => (
            <Wrapper
              key={user.id}
              {...itemProps}
              transition={{ ...itemProps.transition, delay: index * 0.05 }}
              style={{ zIndex: visibleUsers.length - index }}
            >
              {showTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-rose-500/50 rounded-full">
                      <AvatarWithStatus
                        user={user}
                        size={size}
                        ringColor={ringColor}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-center">
                    <p className="font-medium">{user.name}</p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <AvatarWithStatus
                  user={user}
                  size={size}
                  ringColor={ringColor}
                />
              )}
            </Wrapper>
          ))}

          {/* Overflow indicator */}
          {remainingCount > 0 && (
            <Wrapper
              {...itemProps}
              transition={{
                ...itemProps.transition,
                delay: visibleUsers.length * 0.05,
              }}
              style={{ zIndex: 0 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onOverflowClick}
                    className={cn(
                      "flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors",
                      config.avatar,
                      config.ring,
                      "ring",
                      ringColor || "ring-background",
                      config.text
                    )}
                  >
                    +{remainingCount}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{remainingCount} more people</p>
                </TooltipContent>
              </Tooltip>
            </Wrapper>
          )}
        </Wrapper>
      </TooltipProvider>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

// ============================================
// AVATAR LIST (horizontal list with names)
// ============================================

interface AvatarListProps {
  users: User[];
  max?: number;
  size?: "sm" | "default" | "lg";
  showEmail?: boolean;
  className?: string;
  onUserClick?: (user: User) => void;
}

function AvatarList({
  users,
  max = 5,
  size = "default",
  showEmail = false,
  className,
  onUserClick,
}: AvatarListProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);

  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    default: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div className={cn("space-y-3", className)}>
      {visibleUsers.map((user) => (
        <div
          key={user.id}
          className={cn(
            "flex items-center gap-3",
            onUserClick && "cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
          )}
          onClick={() => onUserClick?.(user)}
        >
          <AvatarWithStatus user={user} size={size} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            {showEmail && user.email && (
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            )}
          </div>
          {user.status && (
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                statusColors[user.status]
              )}
            />
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          + {remainingCount} more
        </button>
      )}
    </div>
  );
}

// ============================================
// AVATAR STACK (overlapping with hover reveal)
// ============================================

function AvatarStack({
  users,
  max = 5,
  size = "default",
  className,
}: {
  users: User[];
  max?: number;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const visibleUsers = isExpanded ? users : users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);

  return (
    <div
      className={cn("flex items-center", className)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <AvatarGroup
        users={visibleUsers}
        max={visibleUsers.length}
        size={size}
        animate={false}
      />
      {!isExpanded && remainingCount > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  AvatarGroup,
  AvatarWithStatus,
  AvatarList,
  AvatarStack,
  statusColors,
  sizes,
  type User,
  type AvatarGroupProps,
  type AvatarWithStatusProps,
  type AvatarListProps,
};
