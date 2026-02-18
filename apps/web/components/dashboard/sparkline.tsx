"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  showFill?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  className,
  color = "#8B6B5D",
  strokeWidth = 2,
  showFill = true,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  
  // Create fill path (closed)
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const fillColor = isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showFill && (
        <path
          d={fillD}
          fill={fillColor}
          stroke="none"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* End point dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={2}
        fill={strokeColor}
      />
    </svg>
  );
}
