"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/lib/analytics";
import { ArrowRight, ChevronDown, TrendingDown } from "lucide-react";

interface InvitationFunnelChartProps {
  data: FunnelStage[];
  isLoading?: boolean;
  className?: string;
}

type ViewMode = "horizontal" | "vertical" | "list";

interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  dropOff: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-medium text-sm">{data.name}</span>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Count:</span>
          <span className="font-medium">{data.value.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Conversion:</span>
          <span className="font-medium">{data.percentage}%</span>
        </div>
        {data.dropOff > 0 && (
          <div className="flex justify-between gap-4 text-red-500">
            <span>Drop-off:</span>
            <span className="font-medium">-{data.dropOff}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FunnelList({ data }: { data: FunnelStage[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((stage, index) => {
        const isLast = index === data.length - 1;
        const widthPercent = (stage.value / maxValue) * 100;

        return (
          <div key={stage.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-medium">{stage.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {stage.value.toLocaleString()}
                </span>
                <span className="font-medium w-14 text-right">
                  {stage.percentage}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-8 bg-muted rounded-md overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: stage.color,
                  opacity: 0.8,
                }}
              />
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-xs text-white font-medium drop-shadow-md">
                  {Math.round(widthPercent)}%
                </span>
              </div>
            </div>

            {/* Drop-off indicator */}
            {!isLast && stage.dropOff > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-500 ml-5">
                <TrendingDown className="w-3 h-3" />
                <span>{stage.dropOff}% drop-off to {data[index + 1]?.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelMetrics({ data }: { data: FunnelStage[] }) {
  const sent = data[0]?.value || 0;
  const completed = data[data.length - 1]?.value || 0;
  const overallConversion = sent > 0 ? ((completed / sent) * 100).toFixed(1) : "0";
  
  const totalDropOff = data.reduce((sum, stage) => sum + stage.dropOff, 0);
  const avgDropOff = data.length > 1 ? (totalDropOff / (data.length - 1)).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Overall Conversion</p>
        <p className="text-2xl font-semibold text-green-600">{overallConversion}%</p>
        <p className="text-xs text-muted-foreground">
          {completed.toLocaleString()} of {sent.toLocaleString()}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Avg. Drop-off</p>
        <p className="text-2xl font-semibold text-red-500">{avgDropOff}%</p>
        <p className="text-xs text-muted-foreground">per stage</p>
      </div>
    </div>
  );
}

export function InvitationFunnelChart({
  data,
  isLoading,
  className,
}: InvitationFunnelChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((stage) => ({
      name: stage.name,
      value: stage.value,
      percentage: stage.percentage,
      dropOff: stage.dropOff,
      color: stage.color,
    }));
  }, [data]);

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

  if (data.length === 0 || data[0]?.value === 0) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Invitation Funnel</CardTitle>
          <CardDescription>Track invitation journey from sent to RSVP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No funnel data available</p>
              <p className="text-xs mt-1">Send invitations to see the funnel</p>
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
            <CardTitle className="text-lg font-semibold">Invitation Funnel</CardTitle>
            <CardDescription>Track invitation journey from sent to RSVP</CardDescription>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1">
            {(["list", "horizontal", "vertical"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "list" ? (
          <FunnelList data={data} />
        ) : viewMode === "horizontal" ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="percentage"
                    position="right"
                    formatter={(value: number) => `${value}%`}
                    className="text-xs fill-muted-foreground"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="percentage"
                    position="top"
                    formatter={(value: number) => `${value}%`}
                    className="text-xs fill-muted-foreground"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <FunnelMetrics data={data} />
      </CardContent>
    </Card>
  );
}
