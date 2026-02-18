"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer, cardVariants } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type ResponsiveCols = {
  sm?: GridCols;
  md?: GridCols;
  lg?: GridCols;
  xl?: GridCols;
  "2xl"?: GridCols;
};

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: GridCols | ResponsiveCols;
  gap?: "none" | "xs" | "sm" | "default" | "md" | "lg" | "xl";
  rowGap?: "none" | "xs" | "sm" | "default" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  flow?: "row" | "col" | "row-dense" | "col-dense";
  animate?: boolean;
}

interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: GridCols | ResponsiveCols;
  rowSpan?: GridCols;
  colStart?: GridCols;
  colEnd?: GridCols;
  animate?: boolean;
  index?: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getColClasses(
  cols: GridCols | ResponsiveCols | undefined,
  prefix: string = ""
): string {
  if (!cols) return "";

  if (typeof cols === "number") {
    const className = prefix ? `${prefix}:grid-cols-${cols}` : `grid-cols-${cols}`;
    return className;
  }

  const classes: string[] = [];
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  if (cols["2xl"]) classes.push(`2xl:grid-cols-${cols["2xl"]}`);
  
  return classes.join(" ");
}

function getSpanClasses(
  span: GridCols | ResponsiveCols | undefined,
  type: "col" | "row"
): string {
  if (!span) return "";

  if (typeof span === "number") {
    return `${type}-span-${span}`;
  }

  const classes: string[] = [];
  if (span.sm) classes.push(`sm:${type}-span-${span.sm}`);
  if (span.md) classes.push(`md:${type}-span-${span.md}`);
  if (span.lg) classes.push(`lg:${type}-span-${span.lg}`);
  if (span.xl) classes.push(`xl:${type}-span-${span.xl}`);
  if (span["2xl"]) classes.push(`2xl:${type}-span-${span["2xl"]}`);
  
  return classes.join(" ");
}

// ============================================
// GRID COMPONENT
// ============================================

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      className,
      cols = 1,
      gap = "default",
      rowGap,
      align,
      justify,
      flow,
      animate = false,
    },
    ref
  ) => {
    const gapClasses = {
      none: "gap-0",
      xs: "gap-2",
      sm: "gap-3",
      default: "gap-4",
      md: "gap-6",
      lg: "gap-8",
      xl: "gap-12",
    };

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };

    const flowClasses = {
      row: "grid-flow-row",
      col: "grid-flow-col",
      "row-dense": "grid-flow-row-dense",
      "col-dense": "grid-flow-col-dense",
    };

    const defaultCols = typeof cols === "number" ? `grid-cols-${cols}` : "";
    const responsiveCols = typeof cols === "object" ? getColClasses(cols) : "";

    const Wrapper = animate ? motion.div : "div";
    const animationProps = animate
      ? {
          initial: "hidden",
          animate: "visible",
          variants: staggerContainer(0.05),
        }
      : {};

    return (
      <Wrapper
        ref={ref}
        className={cn(
          "grid",
          defaultCols,
          responsiveCols,
          gapClasses[gap],
          rowGap && gapClasses[rowGap].replace("gap", "gap-y"),
          align && alignClasses[align],
          justify && justifyClasses[justify],
          flow && flowClasses[flow],
          className
        )}
        {...animationProps}
      >
        {children}
      </Wrapper>
    );
  }
);
Grid.displayName = "Grid";

// ============================================
// GRID ITEM COMPONENT
// ============================================

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  (
    {
      children,
      className,
      colSpan,
      rowSpan,
      colStart,
      colEnd,
      animate = false,
      index = 0,
    },
    ref
  ) => {
    const spanClasses = getSpanClasses(colSpan, "col");
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : "";
    const colStartClass = colStart ? `col-start-${colStart}` : "";
    const colEndClass = colEnd ? `col-end-${colEnd}` : "";

    const Wrapper = animate ? motion.div : "div";
    const animationProps = animate
      ? {
          variants: cardVariants,
          custom: index,
        }
      : {};

    return (
      <Wrapper
        ref={ref}
        className={cn(
          spanClasses,
          rowSpanClass,
          colStartClass,
          colEndClass,
          className
        )}
        {...animationProps}
      >
        {children}
      </Wrapper>
    );
  }
);
GridItem.displayName = "GridItem";

// ============================================
// AUTO GRID (responsive auto-fill)
// ============================================

interface AutoGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: string;
  gap?: "none" | "xs" | "sm" | "default" | "md" | "lg" | "xl";
}

function AutoGrid({
  children,
  className,
  minItemWidth = "250px",
  gap = "default",
}: AutoGridProps) {
  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-3",
    default: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-12",
  };

  return (
    <div
      className={cn("grid", gapClasses[gap], className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// STACK (flex column/row)
// ============================================

interface StackProps {
  children: React.ReactNode;
  className?: string;
  direction?: "row" | "col";
  gap?: "none" | "xs" | "sm" | "default" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

function Stack({
  children,
  className,
  direction = "col",
  gap = "default",
  align,
  justify,
  wrap = false,
}: StackProps) {
  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-3",
    default: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-12",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  return (
    <div
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        gapClasses[gap],
        align && alignClasses[align],
        justify && justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  Grid,
  GridItem,
  AutoGrid,
  Stack,
  type GridCols,
  type ResponsiveCols,
};
