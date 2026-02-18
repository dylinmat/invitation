"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineDiff } from "./change-diff";
import {
  AuditEvent,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  AUDIT_SEVERITY_CONFIG,
  AuditSeverity,
} from "@/types/audit";
import {
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// ============================================================================
// Action Icon Component
// ============================================================================

function ActionIcon({ action }: { action: AuditEvent["action"] }) {
  const iconMap: Record<string, string> = {
    create: "+",
    read: "👁",
    update: "✎",
    delete: "🗑",
    login: "→",
    logout: "←",
  };

  return (
    <span className="text-lg">{iconMap[action] || "•"}</span>
  );
}

// ============================================================================
// Status Icon
// ============================================================================

function StatusIcon({ status }: { status: AuditEvent["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failure":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
}

// ============================================================================
// Sort Config
// ============================================================================

type SortField = "timestamp" | "action" | "resourceType" | "severity" | "actor";
type SortOrder = "asc" | "desc";

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// ============================================================================
// Props
// ============================================================================

interface AuditLogTableProps {
  events: AuditEvent[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (event: AuditEvent) => void;
  onViewDetails?: (event: AuditEvent) => void;
  loading?: boolean;
  className?: string;
  sort?: SortConfig;
  onSort?: (field: SortField) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  onPageChange?: (page: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AuditLogTable({
  events,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  onViewDetails,
  loading,
  className,
  sort,
  onSort,
  pagination,
  onPageChange,
}: AuditLogTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Selection handlers
  const toggleAll = () => {
    if (!onSelectionChange) return;
    
    const allSelected = events.every(e => selectedIds.includes(e.id));
    if (allSelected) {
      onSelectionChange(selectedIds.filter(id => !events.some(e => e.id === id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...events.map(e => e.id)])];
      onSelectionChange(newIds);
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (!sort || sort.field !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />;
    }
    return sort.order === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // Sortable header
  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50", className)}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center">
        {children}
        {onSort && <SortIndicator field={field} />}
      </div>
    </TableHead>
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn("rounded-md border", className)}>
        <div className="h-10 bg-muted animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-t animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className={cn("rounded-md border p-8 text-center", className)}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">No events found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      events.length > 0 && events.every(e => selectedIds.includes(e.id))
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-12">Type</TableHead>
              <SortableHeader field="timestamp" className="w-40">
                Time
              </SortableHeader>
              <SortableHeader field="action">Action</SortableHeader>
              <SortableHeader field="resourceType">Resource</SortableHeader>
              <TableHead>Changes</TableHead>
              <SortableHeader field="severity">Severity</SortableHeader>
              <SortableHeader field="actor">Actor</SortableHeader>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const severityConfig = AUDIT_SEVERITY_CONFIG[event.severity];
              const isSelected = selectedIds.includes(event.id);
              const isHovered = hoveredRow === event.id;

              return (
                <TableRow
                  key={event.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-muted/50",
                    isHovered && "bg-muted/30"
                  )}
                  onMouseEnter={() => setHoveredRow(event.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(event)}
                >
                  {onSelectionChange && (
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(event.id)}
                      />
                    </TableCell>
                  )}
                  
                  <TableCell className="w-12">
                    <div className="flex items-center gap-1">
                      <ActionIcon action={event.action} />
                      <StatusIcon status={event.status} />
                    </div>
                  </TableCell>

                  <TableCell className="w-40">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(event.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(new Date(event.timestamp), "PPpp")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {AUDIT_ACTION_LABELS[event.action]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {AUDIT_RESOURCE_LABELS[event.resourceType]}
                      </span>
                      {event.resourceName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {event.resourceName}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <InlineDiff changes={event.changes} maxDisplay={2} />
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        severityConfig.color,
                        severityConfig.bgColor
                      )}
                    >
                      {severityConfig.label}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">
                        {event.actor.name || event.actor.email || event.actor.id.slice(0, 8)}
                      </span>
                      {event.actor.email && event.actor.name && (
                        <span className="text-xs text-muted-foreground">
                          {event.actor.email}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="w-12">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails?.(event);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} events
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {pagination.page} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={!pagination.hasMore}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogTable;
