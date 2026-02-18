"use client";

import { useState, useRef, useEffect } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AuditEvent,
  AuditAction,
  AuditSeverity,
  AUDIT_ACTION_LABELS,
  AUDIT_SEVERITY_CONFIG,
  AUDIT_RESOURCE_LABELS,
} from "@/types/audit";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Shield,
  Download,
  Upload,
  AlertTriangle,
  AlertOctagon,
  Info,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  FileText,
  Users,
  Settings,
  Globe,
  Mail,
} from "lucide-react";

// ============================================================================
// Action Icons Mapping
// ============================================================================

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  create: Plus,
  read: Eye,
  update: Edit3,
  delete: Trash2,
  bulk_create: Plus,
  bulk_update: Edit3,
  bulk_delete: Trash2,
  list: FileText,
  search: FileText,
  login: LogIn,
  logout: LogOut,
  login_failed: XCircle,
  password_change: Shield,
  password_reset: Shield,
  mfa_enabled: Shield,
  mfa_disabled: Shield,
  token_refresh: Clock,
  session_expired: Clock,
  permission_denied: AlertOctagon,
  permission_grant: Shield,
  permission_revoke: Shield,
  role_assign: Users,
  role_remove: Users,
  access_granted: Shield,
  access_revoked: Shield,
  ownership_transfer: Users,
  export: Download,
  import: Upload,
  download: Download,
  upload: Upload,
  backup: Download,
  restore: Upload,
  archive: FileText,
  config_update: Settings,
  setting_change: Settings,
  integration_connect: Globe,
  integration_disconnect: Globe,
  publish: Globe,
  unpublish: Globe,
  deploy: Globe,
  undeploy: Globe,
  invite_sent: Mail,
  invite_resend: Mail,
  invite_revoke: Mail,
  rsvp_received: CheckCircle,
  guest_checkin: CheckCircle,
  system_maintenance: Settings,
  system_error: AlertOctagon,
  api_call: Globe,
  webhook_received: Globe,
  webhook_sent: Globe,
};

// ============================================================================
// Severity Icons
// ============================================================================

const SEVERITY_ICONS: Record<AuditSeverity, React.ComponentType<{ className?: string }>> = {
  info: Info,
  low: Minus,
  medium: AlertTriangle,
  high: AlertOctagon,
  critical: AlertOctagon,
};

// ============================================================================
// Status Icons
// ============================================================================

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  failure: XCircle,
  warning: AlertTriangle,
  pending: Clock,
};

// ============================================================================
// Timeline Item Component
// ============================================================================

interface TimelineItemProps {
  event: AuditEvent;
  isLast?: boolean;
  onClick?: (event: AuditEvent) => void;
  showResource?: boolean;
  compact?: boolean;
}

function TimelineItem({
  event,
  isLast,
  onClick,
  showResource = true,
  compact = false,
}: TimelineItemProps) {
  const ActionIcon = ACTION_ICONS[event.action] || FileText;
  const SeverityIcon = SEVERITY_ICONS[event.severity];
  const StatusIcon = STATUS_ICONS[event.status];
  
  const severityConfig = AUDIT_SEVERITY_CONFIG[event.severity];
  
  // Determine icon color based on status/severity
  const getIconColor = () => {
    if (event.status === "failure") return "text-red-500 bg-red-100";
    if (event.severity === "critical") return "text-red-600 bg-red-100";
    if (event.severity === "high") return "text-orange-600 bg-orange-100";
    if (event.severity === "medium") return "text-yellow-600 bg-yellow-100";
    return "text-blue-600 bg-blue-100";
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MMM d");
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 py-2 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors",
          onClick && "cursor-pointer"
        )}
        onClick={() => onClick?.(event)}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            getIconColor()
          )}
        >
          <ActionIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {AUDIT_ACTION_LABELS[event.action]}
            </span>
            {event.status === "failure" && (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
          </div>
          
          {showResource && event.resourceName && (
            <p className="text-xs text-muted-foreground truncate">
              {AUDIT_RESOURCE_LABELS[event.resourceType]}: {event.resourceName}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(new Date(event.timestamp), "PPpp")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {event.actor.name && (
              <span className="text-xs text-muted-foreground">
                by {event.actor.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110",
                getIconColor(),
                onClick && "cursor-pointer"
              )}
              onClick={() => onClick?.(event)}
            >
              <ActionIcon className="h-5 w-5" />
              
              {/* Status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5">
                {event.status === "success" ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                ) : event.status === "failure" ? (
                  <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                ) : null}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{AUDIT_ACTION_LABELS[event.action]}</p>
              <p className="text-xs text-muted-foreground">
                Severity: <span className={severityConfig.color}>{severityConfig.label}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Status: <span className="capitalize">{event.status}</span>
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Content */}
      <div
        className={cn(
          "flex-1 pb-6",
          onClick && "cursor-pointer"
        )}
        onClick={() => onClick?.(event)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {AUDIT_ACTION_LABELS[event.action]}
              </span>
              
              {showResource && (
                <Badge variant="secondary" className="text-xs">
                  {AUDIT_RESOURCE_LABELS[event.resourceType]}
                  {event.resourceName && `: ${event.resourceName}`}
                </Badge>
              )}
              
              {event.severity !== "info" && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", severityConfig.color, severityConfig.bgColor)}
                >
                  {severityConfig.label}
                </Badge>
              )}
              
              {event.status === "failure" && (
                <Badge variant="destructive" className="text-xs">
                  Failed
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{formatEventTime(event.timestamp)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{format(new Date(event.timestamp), "PPpp")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {event.actor.name && (
                <>
                  <span>•</span>
                  <span>{event.actor.name}</span>
                </>
              )}
              
              {event.actor.ip && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs">{event.actor.ip}</span>
                </>
              )}
            </div>
          </div>
          
          {onClick && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Changes Preview */}
        {event.changes && event.changes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.changes.slice(0, 3).map((change, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {change.field}
              </Badge>
            ))}
            {event.changes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.changes.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Error Message */}
        {event.error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {event.error.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Props
// ============================================================================

interface ActivityTimelineProps {
  events: AuditEvent[];
  onEventClick?: (event: AuditEvent) => void;
  showResource?: boolean;
  compact?: boolean;
  className?: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  groupByDate?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ActivityTimeline({
  events,
  onEventClick,
  showResource = true,
  compact = false,
  className,
  loading,
  hasMore,
  onLoadMore,
  groupByDate = true,
}: ActivityTimelineProps) {
  // Group events by date
  const groupedEvents = groupByDate
    ? events.reduce((groups, event) => {
        const date = new Date(event.timestamp);
        const key = format(date, "yyyy-MM-dd");
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(event);
        return groups;
      }, {} as Record<string, AuditEvent[]>)
    : { all: events };

  const sortedKeys = Object.keys(groupedEvents).sort().reverse();

  const formatGroupLabel = (key: string) => {
    if (key === "all") return null;
    const date = new Date(key);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  if (events.length === 0 && !loading) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">No activity yet</h3>
        <p className="text-muted-foreground">
          Events will appear here as they happen
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {sortedKeys.map((key, groupIndex) => (
        <div key={key}>
          {groupByDate && key !== "all" && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 sticky top-0 bg-background py-2 z-10">
              {formatGroupLabel(key)}
            </h3>
          )}
          
          <div className="space-y-0">
            {groupedEvents[key].map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={!hasMore && groupIndex === sortedKeys.length - 1 && index === groupedEvents[key].length - 1}
                onClick={onEventClick}
                showResource={showResource}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {hasMore && onLoadMore && !loading && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;
