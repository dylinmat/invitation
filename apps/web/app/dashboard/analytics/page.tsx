"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Icons
import {
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
  Eye,
  EyeOff,
  ArrowLeftRight,
} from "lucide-react";

// Analytics Components
import {
  RSVPTrendsChart,
  GuestDemographicsChart,
  EventPerformanceChart,
  InvitationFunnelChart,
  EngagementHeatmap,
  RealTimeStats,
} from "@/components/analytics";

// Analytics Utilities
import {
  type DateRange,
  type DateRangeValue,
  getDateRangeFromPreset,
  getPreviousPeriod,
  formatDateRangeLabel,
  transformRSVPTrends,
  transformGuestDemographics,
  transformEventPerformance,
  transformInvitationFunnel,
  transformEngagementHeatmap,
  generateRealTimeStats,
  exportToCSV,
  exportToJSON,
  generateMockRSVPData,
  generateMockGuestDemographics,
  generateMockEventPerformance,
  generateMockFunnelData,
  generateMockHeatmapData,
  calculateChange,
} from "@/lib/analytics";
import { analyticsApi, projectsApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

// ============================================================================
// Date Range Selector Component
// ============================================================================

interface DateRangeSelectorProps {
  value: DateRangeValue;
  preset: DateRange;
  onChange: (range: DateRangeValue, preset: DateRange) => void;
}

const DATE_RANGE_PRESETS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
];

function DateRangeSelector({ value, preset, onChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2 min-w-[200px] justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {preset === "custom"
              ? formatDateRangeLabel(value)
              : DATE_RANGE_PRESETS.find((p) => p.value === preset)?.label}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border shadow-lg z-50 p-2">
            {DATE_RANGE_PRESETS.map((presetOption) => (
              <button
                key={presetOption.value}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  preset === presetOption.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  onChange(getDateRangeFromPreset(presetOption.value), presetOption.value);
                  setIsOpen(false);
                }}
              >
                {presetOption.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Export Menu Component
// ============================================================================

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportJSON: () => void;
}

function ExportMenu({ onExportCSV, onExportJSON }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border shadow-lg z-50 p-1">
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted flex items-center gap-2 transition-colors"
              onClick={() => {
                onExportCSV();
                setIsOpen(false);
              }}
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Export as CSV
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted flex items-center gap-2 transition-colors"
              onClick={() => {
                onExportJSON();
                setIsOpen(false);
              }}
            >
              <FileJson className="w-4 h-4 text-blue-600" />
              Export as JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Compare Toggle Component
// ============================================================================

interface CompareToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

function CompareToggle({ isEnabled, onToggle }: CompareToggleProps) {
  return (
    <Button
      variant={isEnabled ? "secondary" : "outline"}
      className="gap-2"
      onClick={onToggle}
    >
      <ArrowLeftRight className="w-4 h-4" />
      {isEnabled ? (
        <>
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Comparing</span>
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4" />
          <span className="hidden sm:inline">Compare</span>
        </>
      )}
    </Button>
  );
}

// ============================================================================
// Summary Cards Component
// ============================================================================

interface SummaryData {
  totalInvitations: number;
  totalRSVPs: number;
  acceptanceRate: number;
  openRate: number;
}

interface SummaryCardsProps {
  current: SummaryData;
  previous: SummaryData;
  isCompareEnabled: boolean;
  isLoading?: boolean;
}

function SummaryCards({
  current,
  previous,
  isCompareEnabled,
  isLoading,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Invitations",
      value: current.totalInvitations,
      previous: previous.totalInvitations,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total RSVPs",
      value: current.totalRSVPs,
      previous: previous.totalRSVPs,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Acceptance Rate",
      value: `${current.acceptanceRate}%`,
      previous: `${previous.acceptanceRate}%`,
      rawValue: current.acceptanceRate,
      rawPrevious: previous.acceptanceRate,
      icon: <PieChart className="w-5 h-5" />,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      isPercentage: true,
    },
    {
      title: "Open Rate",
      value: `${current.openRate}%`,
      previous: `${previous.openRate}%`,
      rawValue: current.openRate,
      rawPrevious: previous.openRate,
      icon: <Eye className="w-5 h-5" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      isPercentage: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 w-full">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const currentVal = card.isPercentage ? card.rawValue! : card.value;
        const previousVal = card.isPercentage ? card.rawPrevious! : card.previous;
        const trend = calculateChange(currentVal as number, previousVal as number);

        return (
          <Card
            key={index}
            className="border border-border/50 transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className={cn("text-2xl font-semibold", card.color)}>
                    {typeof card.value === "number"
                      ? card.value.toLocaleString()
                      : card.value}
                  </p>
                  {isCompareEnabled && (
                    <p className="text-xs text-muted-foreground">
                      vs{" "}
                      {typeof card.previous === "number"
                        ? card.previous.toLocaleString()
                        : card.previous}{" "}
                      <span
                        className={cn(
                          trend.direction === "up" && "text-green-600",
                          trend.direction === "down" && "text-red-500"
                        )}
                      >
                        ({trend.label})
                      </span>
                    </p>
                  )}
                </div>
                <div className={cn("p-2.5 rounded-lg", card.bgColor, card.color)}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Analytics Page
// ============================================================================

export default function AnalyticsPage() {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    getDateRangeFromPreset("30d")
  );
  const [datePreset, setDatePreset] = useState<DateRange>("30d");

  // Compare mode state
  const [isCompareEnabled, setIsCompareEnabled] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { toast } = useToast();

  // Data state
  const [rsvpData, setRsvpData] = useState<Parameters<typeof transformRSVPTrends>[0]>([]);
  const [compareRsvpData, setCompareRsvpData] = useState<Parameters<typeof transformRSVPTrends>[0]>([]);
  const [guestDemographics, setGuestDemographics] = useState<ReturnType<typeof transformGuestDemographics>>([]);
  const [eventPerformance, setEventPerformance] = useState<ReturnType<typeof transformEventPerformance>>([]);
  const [funnelData, setFunnelData] = useState<ReturnType<typeof transformInvitationFunnel>>([]);
  const [heatmapData, setHeatmapData] = useState<ReturnType<typeof transformEngagementHeatmap>>([]);
  const [realTimeStats, setRealTimeStats] = useState<ReturnType<typeof generateRealTimeStats>>([]);

  // Summary data
  const [currentSummary, setCurrentSummary] = useState<SummaryData>({
    totalInvitations: 0,
    totalRSVPs: 0,
    acceptanceRate: 0,
    openRate: 0,
  });
  const [previousSummary, setPreviousSummary] = useState<SummaryData>({
    totalInvitations: 0,
    totalRSVPs: 0,
    acceptanceRate: 0,
    openRate: 0,
  });

  // Load data from API with mock fallback
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch real data from API
        // Note: These endpoints may not be fully implemented yet, so we use try/catch
        let realDataAvailable = false;

        try {
          // Get user's projects for analytics
          const projectsResponse = await projectsApi.list({ limit: 100 });
          const projectIds = projectsResponse.projects.map(p => p.id);

          if (projectIds.length > 0) {
            // Fetch analytics for the first project (in real app, aggregate across all projects)
            const summary = await analyticsApi.getSummary(projectIds[0]);
            const timeSeries = await analyticsApi.getTimeSeries(projectIds[0], {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            });

            // Transform real data
            setRsvpData(timeSeries.map((item: { date: string; views: number; rsvps: number }) => ({
              date: new Date(item.date),
              status: "accepted", // Simplified - real implementation would have full status breakdown
              guestType: "all",
            })));

            setCurrentSummary({
              totalInvitations: summary.totalViews,
              totalRSVPs: summary.totalRsvps,
              acceptanceRate: Math.round(summary.rsvpRate * 100),
              openRate: Math.round((summary.uniqueVisitors / Math.max(summary.totalViews, 1)) * 100),
            });

            realDataAvailable = true;
          }
        } catch (apiError) {
          // API not available, fall back to mock data
          console.log("Analytics API not available, using mock data");
        }

        // If real data not available, use mock data
        if (!realDataAvailable) {
          // Generate mock data
          const mockRsvpData = generateMockRSVPData(dateRange);
          setRsvpData(mockRsvpData);

          // Summary data
          setCurrentSummary({
            totalInvitations: 1567,
            totalRSVPs: 423,
            acceptanceRate: 78.5,
            openRate: 64.2,
          });

          setPreviousSummary({
            totalInvitations: 1423,
            totalRSVPs: 389,
            acceptanceRate: 75.2,
            openRate: 61.8,
          });
        }

        // Generate compare data if enabled
        if (isCompareEnabled) {
          const previousRange = getPreviousPeriod(dateRange);
          const mockCompareData = generateMockRSVPData(previousRange);
          setCompareRsvpData(mockCompareData);
        }

        // Guest demographics (mock for now)
        setGuestDemographics(transformGuestDemographics(generateMockGuestDemographics()));

        // Event performance (mock for now)
        setEventPerformance(transformEventPerformance(generateMockEventPerformance()));

        // Funnel data (mock for now)
        setFunnelData(transformInvitationFunnel(generateMockFunnelData()));

        // Heatmap data (mock for now)
        setHeatmapData(transformEngagementHeatmap(generateMockHeatmapData(dateRange), dateRange));

        // Real-time stats (mock for now)
        setRealTimeStats(
          generateRealTimeStats(
            {
              activeUsers: 142,
              pageViews: 1234,
              invitationsSent: 567,
              rsvps: 89,
              conversionRate: 15.7,
            },
            {
              activeUsers: 128,
              pageViews: 1156,
              invitationsSent: 498,
              rsvps: 76,
              conversionRate: 15.3,
            }
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load analytics data";
        setError(message);
        toast({
          title: "Error loading analytics",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange, datePreset, isCompareEnabled, refreshKey, toast]);

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRangeValue, preset: DateRange) => {
    setDateRange(range);
    setDatePreset(preset);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const exportData = rsvpData.map((item) => ({
      date: format(item.date, "yyyy-MM-dd"),
      status: item.status,
      guestType: item.guestType || "Unknown",
    }));
    exportToCSV(exportData, `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`);
  }, [rsvpData]);

  const handleExportJSON = useCallback(() => {
    const exportData = {
      dateRange: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
      rsvpData,
      guestDemographics,
      eventPerformance,
      funnelData,
      generatedAt: new Date().toISOString(),
    };
    exportToJSON(exportData, `analytics-${format(new Date(), "yyyy-MM-dd")}.json`);
  }, [dateRange, rsvpData, guestDemographics, eventPerformance, funnelData]);

  // Transform RSVP data for chart
  const chartRsvpData = useMemo(() => {
    return transformRSVPTrends(rsvpData, dateRange, "day");
  }, [rsvpData, dateRange]);

  const chartCompareRsvpData = useMemo(() => {
    if (!isCompareEnabled) return undefined;
    const previousRange = getPreviousPeriod(dateRange);
    return transformRSVPTrends(compareRsvpData, previousRange, "day");
  }, [compareRsvpData, dateRange, isCompareEnabled]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track event performance and guest engagement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangeSelector
            value={dateRange}
            preset={datePreset}
            onChange={handleDateRangeChange}
          />
          <CompareToggle
            isEnabled={isCompareEnabled}
            onToggle={() => setIsCompareEnabled(!isCompareEnabled)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <ExportMenu onExportCSV={handleExportCSV} onExportJSON={handleExportJSON} />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        current={currentSummary}
        previous={previousSummary}
        isCompareEnabled={isCompareEnabled}
        isLoading={isLoading}
      />

      {/* Real-time Stats */}
      <RealTimeStats
        stats={realTimeStats}
        isLoading={isLoading}
        autoRefresh={true}
        refreshInterval={30000}
        onRefresh={handleRefresh}
      />

      {/* Charts Grid */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="demographics" className="gap-2">
            <PieChart className="w-4 h-4" />
            Demographics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* RSVP Trends - Full width on mobile, half on xl */}
            <div className="xl:col-span-2">
              <RSVPTrendsChart
                data={chartRsvpData}
                dateRange={dateRange}
                compareData={chartCompareRsvpData}
                isCompareEnabled={isCompareEnabled}
                isLoading={isLoading}
              />
            </div>

            {/* Event Performance */}
            <EventPerformanceChart
              data={eventPerformance}
              isLoading={isLoading}
            />

            {/* Invitation Funnel */}
            <InvitationFunnelChart
              data={funnelData}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Engagement Heatmap */}
            <div className="xl:col-span-2">
              <EngagementHeatmap
                data={heatmapData}
                dateRange={dateRange}
                isLoading={isLoading}
              />
            </div>

            {/* Event Performance */}
            <EventPerformanceChart
              data={eventPerformance}
              isLoading={isLoading}
            />

            {/* Invitation Funnel */}
            <InvitationFunnelChart
              data={funnelData}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Guest Demographics */}
            <GuestDemographicsChart
              data={guestDemographics}
              isLoading={isLoading}
            />

            {/* RSVP Trends */}
            <RSVPTrendsChart
              data={chartRsvpData}
              dateRange={dateRange}
              compareData={chartCompareRsvpData}
              isCompareEnabled={isCompareEnabled}
              isLoading={isLoading}
            />

            {/* Event Performance */}
            <div className="xl:col-span-2">
              <EventPerformanceChart
                data={eventPerformance}
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="pt-8 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Data updates every 30 seconds automatically</p>
          <p>
            Showing data for{" "}
            <span className="font-medium">{formatDateRangeLabel(dateRange)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
