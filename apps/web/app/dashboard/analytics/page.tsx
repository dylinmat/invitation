"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { subMonths } from "date-fns";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  AnalyticsSkeleton,
  AnalyticsEmptyState,
  AnalyticsErrorState,
} from "@/components/ui/skeletons/analytics-skeleton";
import {
  useRsvpTrends,
  useEventTypes,
  useRevenue,
  useAnalyticsOverview,
  useTopClients,
  useExportAnalytics,
} from "@/hooks/useAnalytics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// Chart colors
const CHART_COLORS = {
  attending: "#22c55e",
  declined: "#ef4444",
  pending: "#D4A574",
  revenue: {
    start: "#8B6B5D",
    end: "#D4A574",
  },
  eventTypes: ["#8B6B5D", "#D4A574", "#E8D5D0", "#FDF8F5"],
};

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  icon: React.ElementType;
  index: number;
}

function StatCard({ title, value, trend, trendPositive = true, icon: Icon, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {trend && (
                <p className={`text-sm mt-1 ${trendPositive ? "text-green-600" : "text-red-600"}`}>
                  {trend} from last month
                </p>
              )}
            </div>
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// RSVP Trend Chart Component
function RSVPTrendChart({ data }: { data?: { month: string; attending: number; maybe: number; declined: number }[] }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      month: item.month,
      yes: item.attending,
      no: item.declined,
      pending: item.maybe,
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <AnalyticsEmptyState
        title="No RSVP Data"
        description="RSVP trend data will appear here once guests start responding to invitations."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D0" />
        <XAxis dataKey="month" stroke="#8B6B5D" />
        <YAxis stroke="#8B6B5D" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E8D5D0",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="yes"
          stroke={CHART_COLORS.attending}
          strokeWidth={2}
          name="Accepted"
        />
        <Line
          type="monotone"
          dataKey="no"
          stroke={CHART_COLORS.declined}
          strokeWidth={2}
          name="Declined"
        />
        <Line
          type="monotone"
          dataKey="pending"
          stroke={CHART_COLORS.pending}
          strokeWidth={2}
          name="Pending"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Revenue Chart Component
function RevenueChart({ data }: { data?: { month: string; revenue: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <AnalyticsEmptyState
        title="No Revenue Data"
        description="Revenue data will appear here once you start creating and billing for events."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D0" />
        <XAxis dataKey="month" stroke="#8B6B5D" />
        <YAxis stroke="#8B6B5D" />
        <Tooltip
          formatter={(value: number) => `$${value.toLocaleString()}`}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E8D5D0",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.revenue.start} stopOpacity={1} />
            <stop offset="95%" stopColor={CHART_COLORS.revenue.end} stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Event Type Chart Component
function EventTypeChart({ data }: { data?: { type: string; count: number; percentage: number }[] }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => ({
      name: item.type,
      value: item.count,
      color: CHART_COLORS.eventTypes[index % CHART_COLORS.eventTypes.length],
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <AnalyticsEmptyState
        title="No Event Data"
        description="Event type distribution will appear here once you create events."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} events`, name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Format currency helper
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return "$0";
  return `$${value.toLocaleString()}`;
}

// Format percentage helper
function formatPercentage(value: number | undefined): string {
  if (value === undefined || value === null) return "0%";
  return `${value}%`;
}

// Main Analytics Page Component
export default function AnalyticsPage() {
  // State for date range (default: last 6 months)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useAnalyticsOverview();
  const { data: rsvpData, isLoading: rsvpLoading, error: rsvpError } = useRsvpTrends(
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString()
  );
  const { data: eventTypes, isLoading: typesLoading, error: typesError } = useEventTypes();
  const { data: revenue, isLoading: revenueLoading, error: revenueError } = useRevenue(
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString()
  );
  const { data: topClients, isLoading: clientsLoading, error: clientsError } = useTopClients(5);

  // Export mutation
  const { mutate: exportAnalytics, isPending: isExporting } = useExportAnalytics();

  // Combined loading state
  const isLoading = overviewLoading || rsvpLoading || typesLoading || revenueLoading || clientsLoading;

  // Combined error state
  const errors = [overviewError, rsvpError, typesError, revenueError, clientsError].filter(Boolean);
  const hasError = errors.length > 0;

  // Handle refresh
  const handleRefresh = () => {
    refetchOverview();
  };

  // Handle export
  const handleExport = () => {
    exportAnalytics({
      format: "csv",
      from: dateRange?.from?.toISOString(),
      to: dateRange?.to?.toISOString(),
    });
  };

  // Show skeleton while loading
  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  // Show error state if there's an error
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/business">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                  <p className="text-sm text-muted-foreground">Insights into your events and guests</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <AnalyticsErrorState
            message={errors[0]?.message || "Failed to load analytics data"}
            onRetry={handleRefresh}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/business">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Insights into your events and guests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                presets
                placeholder="Select date range"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Report"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={overview?.totalEvents || 0}
            trend="+12%"
            trendPositive={true}
            icon={Calendar}
            index={0}
          />
          <StatCard
            title="Total Guests"
            value={overview?.totalGuests || 0}
            trend="+8%"
            trendPositive={true}
            icon={Users}
            index={1}
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(overview?.totalRevenue)}
            trend="+23%"
            trendPositive={true}
            icon={DollarSign}
            index={2}
          />
          <StatCard
            title="Conversion Rate"
            value={formatPercentage(overview?.conversionRate)}
            trend="+5%"
            trendPositive={true}
            icon={TrendingUp}
            index={3}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RSVP Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>RSVP Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <RSVPTrendChart data={rsvpData} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={revenue} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-[350px]">
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <EventTypeChart data={eventTypes} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Clients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="h-[350px]">
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topClients && topClients.length > 0 ? (
                    topClients.map((client, index) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {client.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${client.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {client.guests} guests
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <AnalyticsEmptyState
                      title="No Client Data"
                      description="Your top clients will appear here once you start working with clients."
                      action={{
                        label: "Add Client",
                        onClick: () => (window.location.href = "/dashboard/clients"),
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
