"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DAY_LABELS, getHeatmapColor } from "@/lib/analytics";
import type { HeatmapData, DateRangeValue } from "@/lib/analytics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EngagementHeatmapProps {
  data: HeatmapData[];
  dateRange: DateRangeValue;
  isLoading?: boolean;
  className?: string;
}

type ViewMode = "24h" | "12h" | "day";

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i === 12) return "12pm";
  return i < 12 ? `${i}am` : `${i - 12}pm`;
});

function HeatmapCell({
  value,
  max,
  day,
  hour,
}: {
  value: number;
  max: number;
  day: number;
  hour: number;
}) {
  const color = getHeatmapColor(value, max);
  const isHighEngagement = value > max * 0.7;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "w-full h-6 rounded-sm cursor-pointer transition-all duration-150",
            "hover:ring-2 hover:ring-primary hover:ring-offset-1",
            isHighEngagement && "ring-1 ring-primary/30"
          )}
          style={{ backgroundColor: color }}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="space-y-1">
          <p className="font-medium">
            {DAY_LABELS[day]}, {HOUR_LABELS[hour]}
          </p>
          <p className="text-muted-foreground">
            {value} {value === 1 ? "engagement" : "engagements"}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function CompactHeatmap({
  data,
  max,
}: {
  data: HeatmapData[];
  max: number;
}) {
  // Group by day, show only 4-hour blocks
  const blocks = ["12am-4am", "4am-8am", "8am-12pm", "12pm-4pm", "4pm-8pm", "8pm-12am"];
  
  const dayData = useMemo(() => {
    return DAY_LABELS.map((day, dayIndex) => {
      const dayValues = data.filter((d) => d.day === dayIndex);
      const blockValues = blocks.map((_, blockIndex) => {
        const startHour = blockIndex * 4;
        const endHour = startHour + 4;
        return dayValues
          .filter((d) => d.hour >= startHour && d.hour < endHour)
          .reduce((sum, d) => sum + d.value, 0);
      });
      return { day, values: blockValues };
    });
  }, [data]);

  return (
    <div className="space-y-2">
      {dayData.map(({ day, values }) => (
        <div key={day} className="flex items-center gap-2">
          <span className="w-10 text-xs text-muted-foreground text-right">{day}</span>
          <div className="flex-1 grid grid-cols-6 gap-1">
            {values.map((value, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="h-8 rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-primary"
                    style={{ backgroundColor: getHeatmapColor(value, max) }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs font-medium">{day}, {blocks[i]}</p>
                  <p className="text-xs text-muted-foreground">{value} engagements</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-12 mt-2">
        {blocks.map((block, i) => (
          <span key={i} className="flex-1 text-[10px] text-muted-foreground text-center">
            {block}
          </span>
        ))}
      </div>
    </div>
  );
}

function HourlyHeatmap({
  data,
  max,
  showHours,
}: {
  data: HeatmapData[];
  max: number;
  showHours: number[];
}) {
  const displayHours = useMemo(() => {
    return showHours.filter((h) => h >= 0 && h < 24);
  }, [showHours]);

  return (
    <div className="space-y-1">
      {/* Header - Hours */}
      <div className="flex gap-1 ml-12">
        {displayHours.map((hour) => (
          <div key={hour} className="flex-1 text-center">
            <span className="text-[10px] text-muted-foreground">{HOUR_LABELS[hour]}</span>
          </div>
        ))}
      </div>

      {/* Days */}
      {DAY_LABELS.map((day, dayIndex) => (
        <div key={day} className="flex items-center gap-2">
          <span className="w-10 text-xs text-muted-foreground text-right">{day}</span>
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${displayHours.length}, 1fr)` }}>
            {displayHours.map((hour) => {
              const cell = data.find((d) => d.day === dayIndex && d.hour === hour);
              const value = cell?.value || 0;
              return (
                <HeatmapCell
                  key={hour}
                  value={value}
                  max={max}
                  day={dayIndex}
                  hour={hour}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Legend({ max }: { max: number }) {
  const steps = 5;
  const values = Array.from({ length: steps }, (_, i) => Math.round((max / (steps - 1)) * i));

  return (
    <div className="flex items-center gap-2 mt-4 justify-end">
      <span className="text-xs text-muted-foreground">Less</span>
      <div className="flex gap-1">
        {values.map((value, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: getHeatmapColor(value, max) }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="text-xs">{value}+ engagements</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">More</span>
    </div>
  );
}

function PeakTimes({ data, max }: { data: HeatmapData[]; max: number }) {
  const peaks = useMemo(() => {
    const threshold = max * 0.8;
    return data
      .filter((d) => d.value >= threshold)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [data, max]);

  if (peaks.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Peak Engagement Times
      </p>
      <div className="flex flex-wrap gap-2">
        {peaks.map((peak, i) => (
          <div
            key={i}
            className="px-2 py-1 bg-primary/10 rounded-md text-xs"
          >
            <span className="font-medium">{DAY_LABELS[peak.day]}</span>
            <span className="text-muted-foreground"> at </span>
            <span className="font-medium">{HOUR_LABELS[peak.hour]}</span>
            <span className="text-muted-foreground ml-1">({peak.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EngagementHeatmap({
  data,
  dateRange,
  isLoading,
  className,
}: EngagementHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("12h");

  const max = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  const totalEngagements = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const showHours = useMemo(() => {
    switch (viewMode) {
      case "12h":
        return [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
      case "day":
        return [9, 10, 11, 12, 13, 14, 15, 16, 17];
      default:
        return Array.from({ length: 24 }, (_, i) => i);
    }
  }, [viewMode]);

  if (isLoading) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || totalEngagements === 0) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Engagement Heatmap</CardTitle>
          <CardDescription>When guests are most active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No engagement data available</p>
              <p className="text-xs mt-1">Track when guests interact with invitations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("border border-border/50", className)}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Engagement Heatmap</CardTitle>
              <CardDescription>
                When guests are most active • {totalEngagements} total engagements
              </CardDescription>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1">
              {([
                { key: "day", label: "Work Hours" },
                { key: "12h", label: "12 Hours" },
                { key: "24h", label: "24 Hours" },
              ] as const).map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    viewMode === mode.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "24h" ? (
            <CompactHeatmap data={data} max={max} />
          ) : (
            <HourlyHeatmap data={data} max={max} showHours={showHours} />
          )}

          <Legend max={max} />
          <PeakTimes data={data} max={max} />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
