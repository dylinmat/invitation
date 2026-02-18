"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuditLogs, useExportAuditLogs, auditKeys } from "@/hooks/audit/useAudit";
import { useQueryClient } from "@tanstack/react-query";
import { auditLogger } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import {
  AuditLogFiltersComponent,
  AuditLogTable,
  AuditLogDetail,
  ActivityTimeline,
  LiveActivityFeed,
} from "@/components/audit";
import {
  AuditLogFilters,
  AuditLogQueryOptions,
  AuditEvent,
  AUDIT_SEVERITY_CONFIG,
} from "@/types/audit";
import {
  Download,
  RefreshCw,
  FileText,
  Activity,
  BarChart3,
  Shield,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards() {
  // Using mock data for now - in production, this would come from useAuditStats
  const stats = {
    totalEvents: 1247,
    criticalEvents: 3,
    highEvents: 12,
    last24Hours: 156,
  };

  const cards = [
    {
      title: "Total Events",
      value: stats.totalEvents.toLocaleString(),
      description: "All time audit events",
      icon: FileText,
    },
    {
      title: "Last 24 Hours",
      value: stats.last24Hours.toLocaleString(),
      description: "Recent activity",
      icon: Activity,
    },
    {
      title: "High Severity",
      value: stats.highEvents.toString(),
      description: "Requires attention",
      icon: AlertTriangle,
      warning: true,
    },
    {
      title: "Critical",
      value: stats.criticalEvents.toString(),
      description: "Immediate action needed",
      icon: Shield,
      critical: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={cn(
              "h-4 w-4",
              card.critical && "text-red-500",
              card.warning && "text-orange-500",
              !card.critical && !card.warning && "text-muted-foreground"
            )} />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              card.critical && "text-red-600",
              card.warning && "text-orange-600"
            )}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Export Button Component
// ============================================================================

function ExportButton({ filters }: { filters: AuditLogFilters }) {
  const { toast } = useToast();
  const exportMutation = useExportAuditLogs();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        filters,
        format: "csv",
      });

      toast({
        title: "Export started",
        description: "Your audit log export is being prepared. You'll receive an email when it's ready.",
      });

      // Log the export action
      auditLogger.export("audit_log", "csv", { filterCount: Object.keys(filters).length });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to start export. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={exportMutation.isPending}
    >
      {exportMutation.isPending ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 25;

export default function AuditLogPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filter and pagination state
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "timestamp",
    order: "desc",
  });

  // Build query options
  const queryOptions: AuditLogQueryOptions = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy: sort.field as any,
      sortOrder: sort.order,
      filters,
    }),
    [page, sort, filters]
  );

  // Fetch audit logs
  const { data, isLoading, isFetching, refetch } = useAuditLogs(queryOptions);

  // Handle row click
  const handleRowClick = useCallback((event: AuditEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
    
    // Log view action
    auditLogger.read("audit_log", event.id);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Audit log data has been refreshed.",
    });
  }, [refetch, toast]);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  }, []);

  // Handle filter change
  const handleFiltersChange = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all activity across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <ExportButton filters={filters} />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">
            <FileText className="mr-2 h-4 w-4" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Activity className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="live">
            <BarChart3 className="mr-2 h-4 w-4" />
            Live Feed
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <AuditLogFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Events</CardTitle>
                  <CardDescription>
                    {data ? (
                      <>
                        Showing {(page - 1) * DEFAULT_PAGE_SIZE + 1} to{" "}
                        {Math.min(page * DEFAULT_PAGE_SIZE, data.total)} of{" "}
                        {data.total.toLocaleString()} events
                      </>
                    ) : (
                      "Loading..."
                    )}
                  </CardDescription>
                </div>
                {isFetching && (
                  <Badge variant="secondary">Updating...</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <AuditLogTable
                  events={data?.events || []}
                  loading={isLoading}
                  onRowClick={handleRowClick}
                  onViewDetails={handleRowClick}
                  sort={sort as any}
                  onSort={handleSort}
                  pagination={
                    data
                      ? {
                          page,
                          limit: DEFAULT_PAGE_SIZE,
                          total: data.total,
                          hasMore: data.hasMore,
                        }
                      : undefined
                  }
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Visual timeline of all audit events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ActivityTimeline
                  events={data?.events || []}
                  onEventClick={handleRowClick}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Feed View */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveActivityFeed
                maxEvents={100}
                showNotifications
                notificationSeverities={["high", "critical"]}
              />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Critical</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">High</span>
                    <Badge variant="outline" className="text-orange-600 bg-orange-50">
                      12
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Medium</span>
                    <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                      45
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Low/Info</span>
                    <Badge variant="outline" className="text-blue-600 bg-blue-50">
                      1,187
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["read", "update", "create", "delete"].map((action) => (
                    <div
                      key={action}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm capitalize">{action}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(Math.random() * 500 + 100)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Detail Modal */}
      <AuditLogDetail
        event={selectedEvent}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        variant="sheet"
      />
    </div>
  );
}
