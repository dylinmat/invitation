"use client";

import Link from "next/link";
import {
  CheckCircle,
  Mail,
  FolderPlus,
  UserPlus,
  UserCog,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed } from "@/hooks/useDashboard";
import { formatRelativeTime, cn } from "@/lib/utils";
import { ActivityItem } from "@/hooks/useDashboard";

const activityIcons: Record<ActivityItem["type"], typeof CheckCircle> = {
  rsvp: CheckCircle,
  invite_sent: Mail,
  project_created: FolderPlus,
  guest_added: UserPlus,
  guest_updated: UserCog,
};

const activityColors: Record<ActivityItem["type"], string> = {
  rsvp: "text-green-600 bg-green-100",
  invite_sent: "text-blue-600 bg-blue-100",
  project_created: "text-purple-600 bg-purple-100",
  guest_added: "text-orange-600 bg-orange-100",
  guest_updated: "text-gray-600 bg-gray-100",
};

interface ActivityFeedProps {
  className?: string;
  limit?: number;
}

export function ActivityFeed({ className, limit = 5 }: ActivityFeedProps) {
  const { data: activities, isLoading } = useActivityFeed(limit);

  if (isLoading) {
    return (
      <Card className={cn("border border-border/50", className)} style={{ borderRadius: "12px" }}>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={cn("border border-border/50", className)} style={{ borderRadius: "12px" }}>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent activity to show
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("border border-border/50 overflow-hidden", className)}
      style={{ borderRadius: "12px" }}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="text-base"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors hover:bg-muted/30",
                  index === 0 && "pt-0"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.projectName}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-border/50">
          <Link
            href="/dashboard/activity"
            className="flex items-center justify-center text-sm text-[#8B6B5D] hover:text-[#6B4D42] transition-colors"
          >
            View All Activity
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
