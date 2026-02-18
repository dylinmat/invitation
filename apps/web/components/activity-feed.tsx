"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderPlus,
  UserPlus,
  Mail,
  CheckCircle2,
  Globe,
  Filter,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn, formatRelativeTime, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
export type ActivityType =
  | "project_created"
  | "guest_added"
  | "invite_sent"
  | "rsvp_received"
  | "site_published";

export interface Activity {
  id: string;
  type: ActivityType;
  actor: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  target: {
    type: string;
    name: string;
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Activity type configurations
const activityConfig: Record<
  ActivityType,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    description: (activity: Activity) => string;
  }
> = {
  project_created: {
    icon: <FolderPlus className="w-4 h-4" />,
    label: "Project Created",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: (a) => `created project "${a.target.name}"`,
  },
  guest_added: {
    icon: <UserPlus className="w-4 h-4" />,
    label: "Guest Added",
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: (a) =>
      `added ${a.metadata?.guestCount || 1} guest${
        (a.metadata?.guestCount || 1) > 1 ? "s" : ""
      } to "${a.target.name}"`,
  },
  invite_sent: {
    icon: <Mail className="w-4 h-4" />,
    label: "Invite Sent",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: (a) =>
      `sent ${a.metadata?.inviteCount || 1} invitation${
        (a.metadata?.inviteCount || 1) > 1 ? "s" : ""
      } for "${a.target.name}"`,
  },
  rsvp_received: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: "RSVP Received",
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    description: (a) =>
      `${a.metadata?.response === "accepted" ? "accepted" : "declined"} invitation to "${a.target.name}"`,
  },
  site_published: {
    icon: <Globe className="w-4 h-4" />,
    label: "Site Published",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: (a) => `published invitation site for "${a.target.name}"`,
  },
};

// Mock data generator
const generateMockActivities = (count: number, offset = 0): Activity[] => {
  const types: ActivityType[] = [
    "project_created",
    "guest_added",
    "invite_sent",
    "rsvp_received",
    "site_published",
  ];
  const actors = [
    { name: "Sarah Johnson", initials: "SJ" },
    { name: "Michael Chen", initials: "MC" },
    { name: "Emily Davis", initials: "ED" },
    { name: "James Wilson", initials: "JW" },
    { name: "You", initials: "YO" },
  ];
  const projects = [
    "Sarah's Wedding",
    "Birthday Party 2024",
    "Corporate Event",
    "Baby Shower",
    "Anniversary Dinner",
    "Graduation Party",
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const actor = actors[Math.floor(Math.random() * actors.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];
    const daysAgo = Math.floor((i + offset) / 3) + Math.floor(Math.random() * 2);

    return {
      id: `activity-${offset + i}`,
      type,
      actor: {
        name: actor.name,
        initials: actor.initials,
      },
      target: {
        type: "project",
        name: project,
        id: `project-${Math.floor(Math.random() * 100)}`,
      },
      metadata:
        type === "guest_added"
          ? { guestCount: Math.floor(Math.random() * 5) + 1 }
          : type === "invite_sent"
          ? { inviteCount: Math.floor(Math.random() * 10) + 1 }
          : type === "rsvp_received"
          ? { response: Math.random() > 0.3 ? "accepted" : "declined" }
          : undefined,
      createdAt: new Date(Date.now() - daysAgo * 86400000 - Math.random() * 86400000),
    };
  });
};

// Group activities by date
function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = formatDate(date);
    }

    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(activity);
  });

  return groups;
}

interface ActivityFeedProps {
  className?: string;
  showFilters?: boolean;
  maxItems?: number;
}

export function ActivityFeed({
  className,
  showFilters = true,
  maxItems,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(() =>
    generateMockActivities(10)
  );
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter activities
  const filteredActivities = selectedTypes.length
    ? activities.filter((a) => selectedTypes.includes(a.type))
    : activities;

  const displayedActivities = maxItems
    ? filteredActivities.slice(0, maxItems)
    : filteredActivities;

  const groupedActivities = groupActivitiesByDate(displayedActivities);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newActivities = generateMockActivities(10, activities.length);
      setActivities((prev) => [...prev, ...newActivities]);
      setIsLoading(false);
      if (activities.length >= 50) setHasMore(false);
    }, 800);
  }, [activities.length, isLoading, hasMore]);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    if (maxItems) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore, maxItems]);

  // Toggle filter
  const toggleFilter = (type: ActivityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          {(Object.keys(activityConfig) as ActivityType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors",
                selectedTypes.includes(type)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {activityConfig[type].icon}
              {activityConfig[type].label}
            </button>
          ))}
          {selectedTypes.length > 0 && (
            <button
              onClick={() => setSelectedTypes([])}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {Object.entries(groupedActivities).map(([date, items]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  {date}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Activities */}
              <div className="space-y-3 pl-7">
                {items.map((activity, index) => {
                  const config = activityConfig[activity.type];

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 group"
                    >
                      {/* Timeline dot */}
                      <div className="relative mt-1.5">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full ring-4 ring-background",
                            config.bgColor.replace("bg-", "bg-").replace("100", "500")
                          )}
                        />
                      </div>

                      {/* Activity Card */}
                      <div className="flex-1 flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        {/* Actor Avatar */}
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={activity.actor.avatar} />
                          <AvatarFallback className="text-xs bg-rose-100 text-rose-700">
                            {activity.actor.initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">
                                  {activity.actor.name}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {config.description(activity)}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatRelativeTime(activity.createdAt)}
                              </p>
                            </div>

                            {/* Type Badge */}
                            <Badge
                              variant="secondary"
                              className={cn(
                                "flex-shrink-0 hidden sm:inline-flex",
                                config.bgColor,
                                config.color
                              )}
                            >
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {displayedActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No activities found</p>
            {selectedTypes.length > 0 && (
              <Button
                variant="link"
                onClick={() => setSelectedTypes([])}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Load More Trigger */}
        {!maxItems && hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
          </div>
        )}

        {/* End of List */}
        {!hasMore && !maxItems && displayedActivities.length > 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            You&apos;ve reached the end
          </div>
        )}
      </div>
    </div>
  );
}
