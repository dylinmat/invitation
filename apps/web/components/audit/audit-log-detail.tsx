"use client";

import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeDiff } from "./change-diff";
import {
  AuditEvent,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  AUDIT_SEVERITY_CONFIG,
} from "@/types/audit";
import {
  X,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Globe,
  Monitor,
  FileJson,
  Eye,
  Shield,
  Calendar,
  MapPin,
  Hash,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: AuditEvent["status"] }) {
  const config = {
    success: { icon: CheckCircle, className: "text-green-600 bg-green-50", label: "Success" },
    failure: { icon: XCircle, className: "text-red-600 bg-red-50", label: "Failed" },
    warning: { icon: AlertTriangle, className: "text-yellow-600 bg-yellow-50", label: "Warning" },
    pending: { icon: Clock, className: "text-blue-600 bg-blue-50", label: "Pending" },
  };

  const { icon: Icon, className, label } = config[status];

  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// Info Row
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
  copyable,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof value === "string") {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className={cn("font-medium", mono && "font-mono text-sm")}>
            {value || "—"}
          </p>
          {copyable && value && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Metadata Display
// ============================================================================

function MetadataDisplay({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No additional metadata</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(metadata).map(([key, value]) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 py-2 border-b last:border-0"
        >
          <code className="text-sm text-muted-foreground">{key}</code>
          <div className="text-right">
            {value === null ? (
              <span className="text-sm text-muted-foreground">null</span>
            ) : typeof value === "boolean" ? (
              <Badge variant={value ? "default" : "secondary"}>
                {value ? "true" : "false"}
              </Badge>
            ) : typeof value === "object" ? (
              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <span className="text-sm font-mono">{String(value)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Props
// ============================================================================

interface AuditLogDetailProps {
  event: AuditEvent | null;
  open: boolean;
  onClose: () => void;
  variant?: "dialog" | "sheet";
}

// ============================================================================
// Component
// ============================================================================

export function AuditLogDetail({
  event,
  open,
  onClose,
  variant = "sheet",
}: AuditLogDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!event) return null;

  const severityConfig = AUDIT_SEVERITY_CONFIG[event.severity];
  const actionLabel = AUDIT_ACTION_LABELS[event.action];
  const resourceLabel = AUDIT_RESOURCE_LABELS[event.resourceType];

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={cn(severityConfig.color, severityConfig.bgColor)}
            >
              {severityConfig.label}
            </Badge>
            <StatusBadge status={event.status} />
          </div>
          <h2 className="text-xl font-semibold">
            {actionLabel} {resourceLabel}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
            {" "}•{" "}
            {format(new Date(event.timestamp), "PPpp")}
          </p>
        </div>
        
        {variant === "sheet" && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="my-6" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Event Details */}
          <div className="rounded-lg border">
            <InfoRow
              icon={Hash}
              label="Event ID"
              value={event.id}
              copyable
              mono
            />
            <Separator />
            <InfoRow
              icon={Shield}
              label="Action"
              value={actionLabel}
            />
            <Separator />
            <InfoRow
              icon={FileJson}
              label="Resource Type"
              value={resourceLabel}
            />
            <Separator />
            {event.resourceId && (
              <>
                <InfoRow
                  icon={Hash}
                  label="Resource ID"
                  value={event.resourceId}
                  copyable
                  mono
                />
                <Separator />
              </>
            )}
            {event.resourceName && (
              <>
                <InfoRow
                  icon={Eye}
                  label="Resource Name"
                  value={event.resourceName}
                />
                <Separator />
              </>
            )}
            {event.projectId && (
              <>
                <InfoRow
                  icon={Globe}
                  label="Project ID"
                  value={event.projectId}
                  copyable
                  mono
                />
                <Separator />
              </>
            )}
            <InfoRow
              icon={Calendar}
              label="Timestamp"
              value={format(new Date(event.timestamp), "PPpp")}
            />
          </div>

          {/* Actor Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Actor</h3>
            <div className="rounded-lg border">
              <InfoRow
                icon={User}
                label="User ID"
                value={event.actor.id}
                copyable
                mono
              />
              <Separator />
              {event.actor.email && (
                <>
                  <InfoRow
                    icon={User}
                    label="Email"
                    value={event.actor.email}
                  />
                  <Separator />
                </>
              )}
              {event.actor.name && (
                <>
                  <InfoRow
                    icon={User}
                    label="Name"
                    value={event.actor.name}
                  />
                  <Separator />
                </>
              )}
              {event.actor.ip && (
                <>
                  <InfoRow
                    icon={MapPin}
                    label="IP Address"
                    value={event.actor.ip}
                    mono
                  />
                  <Separator />
                </>
              )}
              {event.actor.userAgent && (
                <InfoRow
                  icon={Monitor}
                  label="User Agent"
                  value={event.actor.userAgent}
                />
              )}
            </div>
          </div>

          {/* Error Details */}
          {event.error && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-red-600">Error</h3>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-900">{event.error.code}</p>
                <p className="text-red-700 mt-1">{event.error.message}</p>
                {event.error.stack && (
                  <pre className="mt-3 text-xs text-red-600 overflow-x-auto">
                    {event.error.stack}
                  </pre>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Changes Tab */}
        <TabsContent value="changes" className="mt-4">
          <ChangeDiff
            changes={event.changes}
            defaultExpanded
            showSummary={false}
          />
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="mt-4">
          <MetadataDisplay metadata={event.metadata} />
        </TabsContent>
      </Tabs>
    </>
  );

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit event
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Event Details</SheetTitle>
          <SheetDescription>
            Detailed information about this audit event
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">{content}</div>
      </SheetContent>
    </Sheet>
  );
}

export default AuditLogDetail;
