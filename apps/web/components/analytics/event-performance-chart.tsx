"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EventPerformance } from "@/lib/analytics";

interface EventPerformanceChartProps {
  data: EventPerformance[];
  isLoading?: boolean;
  className?: string;
}

type MetricType = "all" | "sent" | "opened" | "clicked" | "rsvp" | "acceptance";

interface ChartDataPoint {
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  rsvp: number;
  acceptanceRate: number;
}

const METRIC_COLORS = {
  sent: "#8B6B5D",
  opened: "#9CA3AF",
  clicked: "#D4A574",
  rsvp: "#A8D8B9",
  acceptance: "#2A9D8F",
};

const METRIC_LABELS: Record<MetricType, string> = {
  all: "All Metrics",
  sent: "Sent",
  opened: "Opened",
  clicked: "Clicked",
  rsvp: "RSVP",
  acceptance: "Acceptance Rate",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ChartDataPoint;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md min-w-[200px]">
      <p className="font-medium text-sm mb-2 truncate max-w-[200px]">{label}</p>
      
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Invitations Sent:</span>
          <span className="font-medium">{data.sent}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Opened:</span>
          <span className="font-medium">{data.opened}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Clicked:</span>
          <span className="font-medium">{data.clicked}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">RSVP:</span>
          <span className="font-medium">{data.rsvp}</span>
        </div>
        <div className="pt-1.5 mt-1.5 border-t flex justify-between gap-4">
          <span className="text-muted-foreground">Acceptance Rate:</span>
          <span className="font-medium text-green-600">{data.acceptanceRate}%</span>
        </div>
      </div>
    </div>
  );
}

export function EventPerformanceChart({
  data,
  isLoading,
  className,
}: EventPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("all");

  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((event) => ({
      name: event.name,
      sent: event.sent,
      opened: event.opened,
      clicked: event.clicked,
      rsvp: event.rsvp,
      acceptanceRate: event.acceptanceRate,
    }));
  }, [data]);

  const averages = useMemo(() => {
    if (data.length === 0) return null;
    
    return {
      sent: Math.round(data.reduce((sum, e) => sum + e.sent, 0) / data.length),
      opened: Math.round(data.reduce((sum, e) => sum + e.opened, 0) / data.length),
      clicked: Math.round(data.reduce((sum, e) => sum + e.clicked, 0) / data.length),
      rsvp: Math.round(data.reduce((sum, e) => sum + e.rsvp, 0) / data.length),
      acceptanceRate: Math.round(
        (data.reduce((sum, e) => sum + e.acceptanceRate, 0) / data.length) * 10
      ) / 10,
    };
  }, [data]);

  const visibleMetrics = useMemo(() => {
    if (selectedMetric === "all") {
      return ["sent", "opened", "clicked", "rsvp"] as const;
    }
    if (selectedMetric === "acceptance") {
      return ["acceptanceRate"] as const;
    }
    return [selectedMetric] as const;
  }, [selectedMetric]);

  if (isLoading) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Event Performance</CardTitle>
          <CardDescription>Compare metrics across events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No events to compare</p>
              <p className="text-xs mt-1">Create events to see performance metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border border-border/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Event Performance</CardTitle>
            <CardDescription>Compare metrics across events</CardDescription>
          </div>
          
          {/* Metric Filter */}
          <div className="flex flex-wrap gap-1">
            {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                  selectedMetric === metric
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {METRIC_LABELS[metric]}
              </button>
            ))}
          </div>
        </div>

        {/* Averages */}
        {averages && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg. Sent</p>
              <p className="text-lg font-semibold">{averages.sent}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg. Opened</p>
              <p className="text-lg font-semibold">{averages.opened}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg. Clicked</p>
              <p className="text-lg font-semibold">{averages.clicked}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg. RSVPs</p>
              <p className="text-lg font-semibold">{averages.rsvp}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg. Acceptance</p>
              <p className="text-lg font-semibold text-green-600">{averages.acceptanceRate}%</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
              />

              {selectedMetric === "acceptance" ? (
                <Bar
                  dataKey="acceptanceRate"
                  name="Acceptance Rate (%)"
                  fill={METRIC_COLORS.acceptance}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={METRIC_COLORS.acceptance}
                    />
                  ))}
                </Bar>
              ) : (
                <>
                  {visibleMetrics.includes("sent") && (
                    <Bar
                      dataKey="sent"
                      name="Sent"
                      fill={METRIC_COLORS.sent}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={40}
                    />
                  )}
                  {visibleMetrics.includes("opened") && (
                    <Bar
                      dataKey="opened"
                      name="Opened"
                      fill={METRIC_COLORS.opened}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={40}
                    />
                  )}
                  {visibleMetrics.includes("clicked") && (
                    <Bar
                      dataKey="clicked"
                      name="Clicked"
                      fill={METRIC_COLORS.clicked}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={40}
                    />
                  )}
                  {visibleMetrics.includes("rsvp") && (
                    <Bar
                      dataKey="rsvp"
                      name="RSVP"
                      fill={METRIC_COLORS.rsvp}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={40}
                    />
                  )}
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
