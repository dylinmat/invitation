"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityTimeline } from "./activity-timeline";
import { useRealtimeAudit, useAuditActivity } from "@/hooks/audit/useAudit";
import { AuditEvent, AuditSeverity } from "@/types/audit";
import { Bell, Wifi, WifiOff, Trash2, Settings, Filter, Activity } from "lucide-react";
import { useToast } from "@/hooks/useToast";

// ============================================================================
// Props
// ============================================================================

interface LiveActivityFeedProps {
  className?: string;
  maxEvents?: number;
  filter?: {
    severities?: AuditSeverity[];
    resourceTypes?: string[];
    actions?: string[];
  };
  showNotifications?: boolean;
  notificationSeverities?: AuditSeverity[];
  compact?: boolean;
  title?: string;
}

// ============================================================================
// Component
// ============================================================================

export function LiveActivityFeed({
  className,
  maxEvents = 50,
  filter,
  showNotifications = true,
  notificationSeverities = ["high", "critical"],
  compact = false,
  title = "Live Activity",
}: LiveActivityFeedProps) {
  const { toast } = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get recent activity from local audit log
  const { events, clear, count } = useAuditActivity({
    maxEvents,
    filter: filter
      ? (event) => {
          if (filter.severities && !filter.severities.includes(event.severity)) {
            return false;
          }
          if (filter.resourceTypes && !filter.resourceTypes.includes(event.resourceType)) {
            return false;
          }
          if (filter.actions && !filter.actions.includes(event.action)) {
            return false;
          }
          return true;
        }
      : undefined,
  });

  // Subscribe to real-time events
  const { isConnected, lastEvent } = useRealtimeAudit({
    filter: {
      severities: filter?.severities,
      resourceTypes: filter?.resourceTypes as any,
      actions: filter?.actions as any,
    },
  });

  // Show toast notifications for high severity events
  useEffect(() => {
    if (!showNotifications || !lastEvent) return;
    if (!notificationSeverities.includes(lastEvent.severity)) return;

    toast({
      title: `${lastEvent.action} - ${lastEvent.resourceType}`,
      description: lastEvent.resourceName || "Resource updated",
      variant: lastEvent.severity === "critical" ? "destructive" : "default",
    });
  }, [lastEvent, showNotifications, notificationSeverities, toast]);

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-5 w-5" />
            {isConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {isConnected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-3 w-3" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Badge variant="secondary">{count}</Badge>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clear}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Activity List */}
      <ScrollArea className={cn(compact ? "h-[300px]" : "h-[500px]")}>
        <div className="p-4">
          <ActivityTimeline
            events={events}
            compact={compact}
            groupByDate={false}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Activity Badge - Shows unread count
// ============================================================================

interface ActivityBadgeProps {
  className?: string;
}

export function ActivityBadge({ className }: ActivityBadgeProps) {
  const { events } = useAuditActivity({ maxEvents: 10 });
  const criticalCount = events.filter(
    (e) => e.severity === "critical" || e.severity === "high"
  ).length;

  if (criticalCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className={cn("absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs", className)}
    >
      {criticalCount > 9 ? "9+" : criticalCount}
    </Badge>
  );
}

export default LiveActivityFeed;
