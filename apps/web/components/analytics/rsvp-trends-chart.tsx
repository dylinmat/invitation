"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { format, isSameMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RSVPData, DateRangeValue } from "@/lib/analytics";

interface RSVPTrendsChartProps {
  data: RSVPData[];
  dateRange: DateRangeValue;
  compareData?: RSVPData[];
  isLoading?: boolean;
  isCompareEnabled?: boolean;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  fullDate: Date;
  accepted: number;
  declined: number;
  pending: number;
  total: number;
  prevAccepted?: number;
  prevDeclined?: number;
  prevPending?: number;
  prevTotal?: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  isCompareEnabled,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  isCompareEnabled?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;

  const currentData = payload.filter((p) => !p.dataKey.startsWith("prev"));
  const previousData = payload.filter((p) => p.dataKey.startsWith("prev"));

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <p className="font-medium text-sm mb-2">{label}</p>
      
      {/* Current Period */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Current Period
        </p>
        {currentData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 capitalize">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>

      {/* Previous Period */}
      {isCompareEnabled && previousData.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Previous Period
          </p>
          {previousData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full opacity-50"
                style={{ backgroundColor: entry.color }}
              />
              <span className="flex-1 capitalize">
                {entry.name.replace("prev", "")}:
              </span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RSVPTrendsChart({
  data,
  dateRange,
  compareData,
  isLoading,
  isCompareEnabled,
  className,
}: RSVPTrendsChartProps) {
  const chartData: ChartDataPoint[] = useMemo(() => {
    const sameMonth = isSameMonth(dateRange.from, dateRange.to);
    
    return data.map((item, index) => {
      const dateLabel = sameMonth
        ? format(item.date, "MMM d")
        : format(item.date, "MMM d, yyyy");
      
      const point: ChartDataPoint = {
        date: dateLabel,
        fullDate: item.date,
        accepted: item.accepted,
        declined: item.declined,
        pending: item.pending,
        total: item.accepted + item.declined + item.pending,
      };

      if (isCompareEnabled && compareData && compareData[index]) {
        const prev = compareData[index];
        point.prevAccepted = prev.accepted;
        point.prevDeclined = prev.declined;
        point.prevPending = prev.pending;
        point.prevTotal = prev.accepted + prev.declined + prev.pending;
      }

      return point;
    });
  }, [data, compareData, isCompareEnabled, dateRange]);

  const totals = useMemo(() => {
    const current = data.reduce(
      (acc, item) => ({
        accepted: acc.accepted + item.accepted,
        declined: acc.declined + item.declined,
        pending: acc.pending + item.pending,
      }),
      { accepted: 0, declined: 0, pending: 0 }
    );

    const previous = compareData
      ? compareData.reduce(
          (acc, item) => ({
            accepted: acc.accepted + item.accepted,
            declined: acc.declined + item.declined,
            pending: acc.pending + item.pending,
          }),
          { accepted: 0, declined: 0, pending: 0 }
        )
      : null;

    return { current, previous };
  }, [data, compareData]);

  if (isLoading) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0 && totals.current.accepted + totals.current.declined + totals.current.pending > 0;

  if (!hasData) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">RSVP Trends</CardTitle>
          <CardDescription>Track RSVP responses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No RSVP data available for this period</p>
              <p className="text-xs mt-1">RSVPs will appear here once guests start responding</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border border-border/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">RSVP Trends</CardTitle>
            <CardDescription>Track RSVP responses over time</CardDescription>
          </div>
          
          {/* Summary Stats */}
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Accepted</p>
              <p className="text-lg font-semibold text-green-600">
                {totals.current.accepted}
                {isCompareEnabled && totals.previous && (
                  <span className="text-xs ml-1 text-muted-foreground">
                    vs {totals.previous.accepted}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Declined</p>
              <p className="text-lg font-semibold text-red-500">
                {totals.current.declined}
                {isCompareEnabled && totals.previous && (
                  <span className="text-xs ml-1 text-muted-foreground">
                    vs {totals.previous.declined}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold text-amber-500">
                {totals.current.pending}
                {isCompareEnabled && totals.previous && (
                  <span className="text-xs ml-1 text-muted-foreground">
                    vs {totals.previous.pending}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip isCompareEnabled={isCompareEnabled} />}
              />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
              />
              
              {/* Current Period - Area for total */}
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="none"
                fill="#8B6B5D"
                fillOpacity={0.1}
              />
              
              {/* Current Period - Lines */}
              <Line
                type="monotone"
                dataKey="accepted"
                name="Accepted"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="declined"
                name="Declined"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                name="Pending"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: "#F59E0B", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />

              {/* Previous Period - Dashed Lines */}
              {isCompareEnabled && (
                <>
                  <Line
                    type="monotone"
                    dataKey="prevAccepted"
                    name="Accepted (prev)"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="prevDeclined"
                    name="Declined (prev)"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="prevPending"
                    name="Pending (prev)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
