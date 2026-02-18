"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageTransitions } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "none" | "sm" | "default" | "lg" | "xl";
  container?: boolean;
  containerSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  animate?: boolean;
  id?: string;
}

interface SectionHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  actions?: React.ReactNode;
}

interface SectionContentProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: "none" | "sm" | "default" | "lg";
}

interface SectionDividerProps {
  className?: string;
  spacing?: "sm" | "default" | "lg";
}

// ============================================
// SECTION COMPONENT
// ============================================

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      children,
      className,
      spacing = "default",
      container = true,
      containerSize = "xl",
      animate = true,
      id,
    },
    ref
  ) => {
    const spacingClasses = {
      none: "",
      sm: "py-4",
      default: "py-8",
      lg: "py-12",
      xl: "py-16",
    };

    const containerClasses = {
      sm: "max-w-3xl",
      md: "max-w-4xl",
      lg: "max-w-5xl",
      xl: "max-w-7xl",
      "2xl": "max-w-[96rem]",
      full: "max-w-full",
    };

    const Wrapper = animate ? motion.section : "section";
    const animationProps = animate
      ? {
          initial: "initial",
          whileInView: "animate",
          viewport: { once: true, margin: "-100px" },
          variants: pageTransitions.fadeUp,
        }
      : {};

    return (
      <Wrapper
        ref={ref}
        id={id}
        className={cn(
          spacingClasses[spacing],
          className
        )}
        {...animationProps}
      >
        {container ? (
          <div
            className={cn(
              "mx-auto px-4 sm:px-6 lg:px-8",
              containerClasses[containerSize]
            )}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </Wrapper>
    );
  }
);
Section.displayName = "Section";

// ============================================
// SECTION HEADER
// ============================================

function SectionHeader({
  title,
  description,
  children,
  className,
  align = "left",
  actions,
}: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div
      className={cn(
        "mb-8",
        alignClasses[align],
        className
      )}
    >
      {title && (
        <div className={cn(
          "flex items-start gap-4",
          align === "center" && "flex-col items-center",
          align === "right" && "flex-row-reverse",
          actions && "justify-between"
        )}>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            
            {description && (
              <p className="mt-1.5 text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

// ============================================
// SECTION CONTENT
// ============================================

function SectionContent({
  children,
  className,
  columns = 1,
  gap = "default",
}: SectionContentProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses = {
    none: "gap-0",
    sm: "gap-4",
    default: "gap-6",
    lg: "gap-8",
  };

  return (
    <div
      className={cn(
        "grid",
        gridCols[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// SECTION DIVIDER
// ============================================

function SectionDivider({ className, spacing = "default" }: SectionDividerProps) {
  const spacingClasses = {
    sm: "my-6",
    default: "my-12",
    lg: "my-16",
  };

  return (
    <hr
      className={cn(
        "border-t border-border",
        spacingClasses[spacing],
        className
      )}
    />
  );
}

// ============================================
// SECTION CARD
// ============================================

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "default" | "lg";
  hover?: boolean;
}

function SectionCard({
  children,
  className,
  padding = "default",
  hover = false,
}: SectionCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  Section,
  SectionHeader,
  SectionContent,
  SectionDivider,
  SectionCard,
};
