"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, formatRelative, isToday, isYesterday } from "date-fns";
import { listItemVariants, staggerContainer } from "@/lib/animations";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

// ============================================
// TYPES
// ============================================

type TimelineItemStatus = "completed" | "current" | "pending" | "error";

interface TimelineActor {
  name: string;
  avatar?: string;
  initials?: string;
}

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  status?: TimelineItemStatus;
  actor?: TimelineActor;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  metadata?: Record<string, string>;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  variant?: "default" | "compact" | "minimal";
  showAvatars?: boolean;
  showTimestamp?: boolean;
  groupByDate?: boolean;
  animate?: boolean;
}

interface TimelineGroup {
  label: string;
  items: TimelineItem[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatTimestamp(date: Date): string {
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

function groupItemsByDate(items: TimelineItem[]): TimelineGroup[] {
  const groups: Record<string, TimelineItem[]> = {};

  items.forEach((item) => {
    const date = new Date(item.timestamp);
    let key: string;

    if (isToday(date)) {
      key = "Today";
    } else if (isYesterday(date)) {
      key = "Yesterday";
    } else {
      key = format(date, "MMMM d, yyyy");
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  return Object.entries(groups).map(([label, items]) => ({
    label,
    items: items.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    ),
  }));
}

const statusColors: Record<TimelineItemStatus, { icon: string; bg: string; border: string }> = {
  completed: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  current: {
    icon: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  pending: {
    icon: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  error: {
    icon: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

// ============================================
// TIMELINE ITEM COMPONENT
// ============================================

function TimelineItemComponent({
  item,
  variant,
  showAvatars,
  showTimestamp,
  isLast,
  index,
  animate,
}: {
  item: TimelineItem;
  variant: "default" | "compact" | "minimal";
  showAvatars: boolean;
  showTimestamp: boolean;
  isLast: boolean;
  index: number;
  animate: boolean;
}) {
  const status = item.status || "completed";
  const colors = statusColors[status];

  const Wrapper = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        variants: listItemVariants,
        custom: index,
      }
    : {};

  return (
    <Wrapper
      className={cn(
        "relative flex gap-4",
        variant === "compact" && "gap-3",
        variant === "minimal" && "gap-2"
      )}
      {...animationProps}
    >
      {/* Timeline line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-4 top-8 w-px h-[calc(100%-2rem)] bg-border",
            variant === "compact" && "left-3.5 top-7",
            variant === "minimal" && "left-2 top-5"
          )}
        />
      )}

      {/* Icon/Avatar */}
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center rounded-full",
          variant === "default" && "h-8 w-8",
          variant === "compact" && "h-7 w-7",
          variant === "minimal" && "h-4 w-4"
        )}
        style={{
          backgroundColor: item.iconBgColor || undefined,
        }}
      >
        {item.icon ? (
          <div
            className={cn(
              "flex items-center justify-center",
              variant === "default" && "h-8 w-8 rounded-full",
              variant === "compact" && "h-7 w-7 rounded-full",
              variant === "minimal" && "h-4 w-4 rounded-full",
              colors.bg,
              colors.icon
            )}
          >
            {item.icon}
          </div>
        ) : showAvatars && item.actor ? (
          <Avatar
            className={cn(
              variant === "default" && "h-8 w-8",
              variant === "compact" && "h-7 w-7",
              variant === "minimal" && "h-4 w-4"
            )}
          >
            {item.actor.avatar && (
              <AvatarImage src={item.actor.avatar} alt={item.actor.name} />
            )}
            <AvatarFallback>
              {item.actor.initials || item.actor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              "rounded-full",
              variant === "default" && "h-3 w-3",
              variant === "compact" && "h-2.5 w-2.5",
              variant === "minimal" && "h-2 w-2",
              colors.bg.replace("bg-", "bg-"),
              "border-2",
              colors.border.replace("border-", "border-"),
              status === "current" && "animate-pulse"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium text-foreground",
                variant === "default" && "text-sm",
                variant === "compact" && "text-sm",
                variant === "minimal" && "text-xs"
              )}
            >
              {item.title}
            </p>

            {item.description && variant !== "minimal" && (
              <p
                className={cn(
                  "mt-0.5 text-muted-foreground",
                  variant === "default" && "text-sm",
                  variant === "compact" && "text-xs"
                )}
              >
                {item.description}
              </p>
            )}

            {/* Metadata */}
            {item.metadata && variant !== "minimal" && (
              <dl className="mt-2 space-y-1">
                {Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <dt className="text-muted-foreground">{key}:</dt>
                    <dd className="text-foreground font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Actions */}
            {item.actions && item.actions.length > 0 && variant === "default" && (
              <div className="mt-3 flex items-center gap-2">
                {item.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          {showTimestamp && (
            <time
              className={cn(
                "shrink-0 text-muted-foreground",
                variant === "default" && "text-xs",
                variant === "compact" && "text-xs",
                variant === "minimal" && "text-[10px]"
              )}
            >
              {formatTimestamp(item.timestamp)}
            </time>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

// ============================================
// TIMELINE COMPONENT
// ============================================

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  (
    {
      items,
      className,
      variant = "default",
      showAvatars = true,
      showTimestamp = true,
      groupByDate = true,
      animate = true,
    },
    ref
  ) => {
    const groups = groupByDate
      ? groupItemsByDate(items)
      : [{ label: "", items }];

    const Container = animate ? motion.div : "div";
    const containerProps = animate
      ? {
          variants: staggerContainer(0.05),
          initial: "hidden",
          animate: "visible",
        }
      : {};

    return (
      <Container
        ref={ref}
        className={cn("space-y-6", className)}
        {...containerProps}
      >
        {groups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupByDate && group.label && (
              <div className="sticky top-0 z-10 mb-4">
                <span className="inline-block px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">
                  {group.label}
                </span>
              </div>
            )}

            <div className="space-y-0">
              {group.items.map((item, itemIndex) => (
                <TimelineItemComponent
                  key={item.id}
                  item={item}
                  variant={variant}
                  showAvatars={showAvatars}
                  showTimestamp={showTimestamp}
                  isLast={
                    groupIndex === groups.length - 1 &&
                    itemIndex === group.items.length - 1
                  }
                  index={groupIndex * 100 + itemIndex}
                  animate={animate}
                />
              ))}
            </div>
          </div>
        ))}
      </Container>
    );
  }
);
Timeline.displayName = "Timeline";

// ============================================
// TIMELINE STEPS (for progress indication)
// ============================================

interface TimelineStepsProps {
  steps: {
    label: string;
    description?: string;
    status: TimelineItemStatus;
  }[];
  className?: string;
  orientation?: "horizontal" | "vertical";
}

function TimelineSteps({
  steps,
  className,
  orientation = "horizontal",
}: TimelineStepsProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "vertical" && "flex-col",
        orientation === "horizontal" && "flex-row",
        className
      )}
    >
      {steps.map((step, index) => {
        const colors = statusColors[step.status];
        const isLast = index === steps.length - 1;

        return (
          <div
            key={index}
            className={cn(
              "flex",
              orientation === "horizontal" && "flex-1",
              orientation === "vertical" && "flex-row items-start"
            )}
          >
            <div
              className={cn(
                "flex",
                orientation === "horizontal" && "flex-col items-center",
                orientation === "vertical" && "flex-col items-center mr-4"
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  colors.bg,
                  colors.icon
                )}
              >
                {step.status === "completed" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "bg-border",
                    orientation === "horizontal" &&
                      "w-full h-px mt-4 mx-2",
                    orientation === "vertical" &&
                      "w-px h-full my-2"
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div
              className={cn(
                orientation === "horizontal" && "mt-2 text-center flex-1",
                orientation === "vertical" && "flex-1 pb-8"
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  Timeline,
  TimelineSteps,
  formatTimestamp,
  groupItemsByDate,
  statusColors,
  type TimelineProps,
  type TimelineItem,
  type TimelineItemStatus,
  type TimelineActor,
  type TimelineStepsProps,
};
