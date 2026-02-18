"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Home, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageTransitions } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact" | "centered";
}

interface PageHeaderTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

interface PageHeaderDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================
// BREADCRUMB COMPONENT
// ============================================

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
      <a
        href="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </a>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {item.href ? (
            <a
              href={item.href}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {item.icon && <item.icon className="h-3.5 w-3.5" />}
              <span>{item.label}</span>
            </a>
          ) : (
            <span className="flex items-center gap-1 text-foreground font-medium">
              {item.icon && <item.icon className="h-3.5 w-3.5" />}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ============================================
// PAGE HEADER COMPONENT
// ============================================

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    { 
      title, 
      description, 
      breadcrumbs, 
      actions, 
      meta,
      className, 
      variant = "default" 
    },
    ref
  ) => {
    const variants = {
      default: "py-6",
      compact: "py-4",
      centered: "py-12 text-center",
    };

    return (
      <motion.header
        ref={ref}
        initial="initial"
        animate="animate"
        variants={pageTransitions.fadeUp}
        className={cn(
          "border-b border-border/50 bg-background/50 backdrop-blur-sm",
          variants[variant],
          className
        )}
      >
        <div className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          variant === "centered" && "max-w-3xl"
        )}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb items={breadcrumbs} />
          )}

          {/* Main content */}
          <div className={cn(
            "flex items-start gap-4",
            variant === "centered" && "flex-col items-center",
            variant !== "centered" && actions && "justify-between"
          )}>
            <div className={cn(
              "flex-1 min-w-0",
              variant === "centered" && "text-center"
            )}>
              <h1 className={cn(
                "font-semibold tracking-tight text-foreground",
                variant === "compact" ? "text-xl" : "text-2xl lg:text-3xl"
              )}>
                {title}
              </h1>
              
              {description && (
                <p className={cn(
                  "mt-1.5 text-muted-foreground",
                  variant === "compact" ? "text-sm" : "text-base max-w-2xl",
                  variant === "centered" && "mx-auto"
                )}>
                  {description}
                </p>
              )}

              {meta && (
                <div className={cn(
                  "mt-3 flex items-center gap-4",
                  variant === "centered" && "justify-center"
                )}>
                  {meta}
                </div>
              )}
            </div>

            {actions && (
              <div className={cn(
                "flex items-center gap-2 shrink-0",
                variant === "centered" && "mt-4"
              )}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </motion.header>
    );
  }
);
PageHeader.displayName = "PageHeader";

// ============================================
// SUBCOMPONENTS
// ============================================

function PageHeaderTitle({ 
  children, 
  className, 
  as: Component = "h1" 
}: PageHeaderTitleProps) {
  return (
    <Component
      className={cn(
        "font-semibold tracking-tight text-foreground text-2xl lg:text-3xl",
        className
      )}
    >
      {children}
    </Component>
  );
}

function PageHeaderDescription({ children, className }: PageHeaderDescriptionProps) {
  return (
    <p className={cn(
      "mt-1.5 text-muted-foreground text-base max-w-2xl",
      className
    )}>
      {children}
    </p>
  );
}

function PageHeaderActions({ children, className }: PageHeaderActionsProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 shrink-0",
      className
    )}>
      {children}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  PageHeader,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  Breadcrumb,
  type BreadcrumbItem,
};
