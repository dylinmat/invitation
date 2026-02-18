"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GuestDemographics } from "@/lib/analytics";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface GuestDemographicsChartProps {
  data: GuestDemographics[];
  isLoading?: boolean;
  className?: string;
}

type ChartType = "donut" | "pie";

interface TooltipPayload {
  name: string;
  value: number;
  payload: GuestDemographics;
  color: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-medium text-sm">{data.type}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Count:</span>
          <span className="font-medium">{data.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Percentage:</span>
          <span className="font-medium">{data.percentage}%</span>
        </div>
      </div>
    </div>
  );
}

function CustomLegend({
  payload,
  total,
}: {
  payload?: Array<{ value: string; color: string; payload: GuestDemographics }>;
  total: number;
}) {
  if (!payload) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider pb-2 border-b">
        <span>Type</span>
        <span className="flex gap-4">
          <span>Count</span>
          <span className="w-12 text-right">%</span>
        </span>
      </div>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center justify-between text-sm py-1 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate max-w-[120px]">{entry.value}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium tabular-nums w-8 text-right">
              {entry.payload.count}
            </span>
            <span className="text-muted-foreground tabular-nums w-12 text-right">
              {entry.payload.percentage}%
            </span>
          </div>
        </div>
      ))}
      <div className="flex justify-between text-sm font-medium pt-2 border-t">
        <span>Total Guests</span>
        <span className="tabular-nums">{total}</span>
      </div>
    </div>
  );
}

export function GuestDemographicsChart({
  data,
  isLoading,
  className,
}: GuestDemographicsChartProps) {
  const [chartType, setChartType] = useState<ChartType>("donut");

  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.count - a.count);
  }, [data]);

  if (isLoading) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Guest Demographics</CardTitle>
          <CardDescription>Distribution of guest types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No guest data available</p>
              <p className="text-xs mt-1">Add guests to see demographics</p>
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
            <CardTitle className="text-lg font-semibold">Guest Demographics</CardTitle>
            <CardDescription>Distribution of guest types</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={chartType === "donut" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setChartType("donut")}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "pie" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setChartType("pie")}
            >
              <BarChart3 className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedData}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={chartType === "donut" ? 80 : 90}
                  innerRadius={chartType === "donut" ? 50 : 0}
                  paddingAngle={2}
                >
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                
                {/* Center text for donut */}
                {chartType === "donut" && (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground"
                  >
                    <tspan x="50%" dy="-0.5em" className="text-2xl font-semibold">
                      {total}
                    </tspan>
                    <tspan x="50%" dy="1.2em" className="text-xs fill-muted-foreground">
                      Total
                    </tspan>
                  </text>
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col justify-center">
            <CustomLegend
              payload={sortedData.map((item) => ({
                value: item.type,
                color: item.color,
                payload: item,
              }))}
              total={total}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
