"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Loader2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// TYPES
// ============================================

type StepStatus = "pending" | "current" | "completed" | "error" | "skipped";

interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  optional?: boolean;
  status?: StepStatus;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "simple" | "numbered" | "bullets";
  size?: "sm" | "default" | "lg";
  showDescription?: boolean;
  allowClick?: boolean;
  onStepClick?: (stepIndex: number) => void;
  renderStepContent?: (step: Step, index: number) => React.ReactNode;
}

interface StepIndicatorProps {
  step: Step;
  index: number;
  currentStep: number;
  status: StepStatus;
  size: "sm" | "default" | "lg";
  variant: "default" | "simple" | "numbered" | "bullets";
}

// ============================================
// STEP UTILITIES
// ============================================

function getStepStatus(
  step: Step,
  index: number,
  currentStep: number
): StepStatus {
  if (step.status) return step.status;
  if (index < currentStep) return "completed";
  if (index === currentStep) return "current";
  return "pending";
}

function getStepStyles(status: StepStatus, isCurrent: boolean) {
  const baseStyles =
    "flex items-center justify-center rounded-full transition-all duration-300";

  const styles = {
    pending: {
      container: "border-2 border-muted-foreground/30 bg-background",
      icon: "text-muted-foreground/50",
    },
    current: {
      container:
        "border-2 border-rose-500 bg-rose-50 shadow-lg shadow-rose-500/20",
      icon: "text-rose-600",
    },
    completed: {
      container: "bg-rose-500 border-2 border-rose-500",
      icon: "text-white",
    },
    error: {
      container: "bg-red-500 border-2 border-red-500",
      icon: "text-white",
    },
    skipped: {
      container: "border-2 border-dashed border-muted-foreground/30 bg-background",
      icon: "text-muted-foreground/50",
    },
  };

  return { baseStyles, ...styles[status] };
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({
  step,
  index,
  currentStep,
  status,
  size,
  variant,
}: StepIndicatorProps) {
  const styles = getStepStyles(status, index === currentStep);

  const sizes = {
    sm: "h-6 w-6 text-xs",
    default: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const content = () => {
    // Custom icon
    if (step.icon && (status === "current" || variant === "simple")) {
      const Icon = step.icon;
      return <Icon className={cn("h-4 w-4", styles.icon)} />;
    }

    // Status icons
    if (status === "completed") {
      return <Check className={cn("h-4 w-4", styles.icon)} strokeWidth={3} />;
    }

    if (status === "error") {
      return <X className={cn("h-4 w-4", styles.icon)} strokeWidth={3} />;
    }

    if (status === "current") {
      return (
        <Loader2 className={cn("h-4 w-4 animate-spin", styles.icon)} />
      );
    }

    // Numbered variant
    if (variant === "numbered") {
      return <span className={styles.icon}>{index + 1}</span>;
    }

    // Default (bullet)
    return <Circle className={cn("h-2 w-2", styles.icon)} />;
  };

  return (
    <motion.div
      initial={false}
      animate={{
        scale: status === "current" ? 1.1 : 1,
      }}
      className={cn(
        styles.baseStyles,
        styles.container,
        sizes[size],
        variant === "bullets" && "h-3 w-3",
        step.optional && status === "pending" && "border-dashed"
      )}
    >
      {variant !== "bullets" && content()}
    </motion.div>
  );
}

// ============================================
// PROGRESS STEPS COMPONENT
// ============================================

const ProgressSteps = React.forwardRef<HTMLDivElement, ProgressStepsProps>(
  (
    {
      steps,
      currentStep,
      className,
      orientation = "horizontal",
      variant = "default",
      size = "default",
      showDescription = true,
      allowClick = false,
      onStepClick,
      renderStepContent,
    },
    ref
  ) => {
    const isVertical = orientation === "vertical";

    return (
      <div
        ref={ref}
        className={cn(
          isVertical ? "flex flex-col" : "flex items-start",
          className
        )}
      >
        {steps.map((step, index) => {
          const status = getStepStatus(step, index, currentStep);
          const isLast = index === steps.length - 1;
          const isClickable = allowClick && index <= currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex",
                isVertical
                  ? "flex-row items-start gap-4 pb-8 last:pb-0"
                  : "flex-col items-center flex-1"
              )}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "bg-border transition-colors duration-300",
                    isVertical
                      ? "absolute left-4 top-8 w-px h-[calc(100%-2rem)]"
                      : "absolute top-4 left-1/2 w-full h-px",
                    status === "completed" &&
                      (isVertical ? "bg-rose-500" : "bg-rose-500")
                  )}
                />
              )}

              {/* Step indicator */}
              <button
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  "relative z-10",
                  isClickable && "cursor-pointer hover:opacity-80"
                )}
              >
                <StepIndicator
                  step={step}
                  index={index}
                  currentStep={currentStep}
                  status={status}
                  size={size}
                  variant={variant}
                />
              </button>

              {/* Step content */}
              <div
                className={cn(
                  isVertical ? "flex-1 pt-0.5" : "mt-3 text-center",
                  !isVertical && "px-2"
                )}
              >
                {renderStepContent ? (
                  renderStepContent(step, index)
                ) : (
                  <>
                    <p
                      className={cn(
                        "font-medium transition-colors",
                        size === "sm" && "text-sm",
                        size === "lg" && "text-base",
                        status === "current"
                          ? "text-foreground"
                          : "text-muted-foreground",
                        status === "completed" && "text-foreground"
                      )}
                    >
                      {step.label}
                      {step.optional && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">
                          (optional)
                        </span>
                      )}
                    </p>

                    {showDescription && step.description && (
                      <p
                        className={cn(
                          "mt-0.5 text-muted-foreground",
                          size === "sm" && "text-xs",
                          size === "default" && "text-xs",
                          size === "lg" && "text-sm"
                        )}
                      >
                        {step.description}
                      </p>
                    )}

                    {/* Step status badge */}
                    {status === "error" && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-2 text-xs font-medium text-red-700 bg-red-50 rounded-full">
                        Error
                      </span>
                    )}
                    {status === "skipped" && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-2 text-xs font-medium text-muted-foreground bg-muted rounded-full">
                        Skipped
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
ProgressSteps.displayName = "ProgressSteps";

// ============================================
// PROGRESS BAR (simplified linear version)
// ============================================

interface ProgressBarProps {
  steps: number;
  currentStep: number;
  className?: string;
  size?: "sm" | "default" | "lg";
  showLabels?: boolean;
  labels?: string[];
}

function ProgressBar({
  steps,
  currentStep,
  className,
  size = "default",
  showLabels = false,
  labels,
}: ProgressBarProps) {
  const progress = Math.min(100, Math.max(0, (currentStep / (steps - 1)) * 100));

  const heights = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("bg-muted rounded-full overflow-hidden", heights[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="h-full bg-rose-500 rounded-full"
        />
      </div>

      {showLabels && labels && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <span
              key={index}
              className={cn(
                "text-xs",
                index <= currentStep
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Step indicators */}
      <div className="relative mt-1">
        <div className="absolute top-0 left-0 right-0 flex justify-between -translate-y-1/2">
          {Array.from({ length: steps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "rounded-full border-2 border-background transition-colors",
                size === "sm" && "h-2.5 w-2.5",
                size === "default" && "h-3.5 w-3.5",
                size === "lg" && "h-4.5 w-4.5",
                index <= currentStep ? "bg-rose-500" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP CONTENT PANEL
// ============================================

interface StepPanelProps {
  children: React.ReactNode;
  className?: string;
  step: number;
  currentStep: number;
  direction?: "forward" | "backward";
}

function StepPanel({
  children,
  className,
  step,
  currentStep,
  direction = "forward",
}: StepPanelProps) {
  const isActive = step === currentStep;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={step}
          initial={{
            opacity: 0,
            x: direction === "forward" ? 20 : -20,
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: direction === "forward" ? -20 : 20,
          }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// WIZARD CONTROLS
// ============================================

interface WizardControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete?: () => void;
  canProceed?: boolean;
  loading?: boolean;
  className?: string;
  nextLabel?: string;
  previousLabel?: string;
  completeLabel?: string;
}

function WizardControls({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  canProceed = true,
  loading = false,
  className,
  nextLabel = "Continue",
  previousLabel = "Back",
  completeLabel = "Complete",
}: WizardControlsProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirst}
      >
        {previousLabel}
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {isLast ? (
        <Button
          onClick={onComplete}
          disabled={!canProceed || loading}
          className="bg-rose-600 hover:bg-rose-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            completeLabel
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canProceed || loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            nextLabel
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  ProgressSteps,
  ProgressBar,
  StepPanel,
  WizardControls,
  StepIndicator,
  getStepStatus,
  getStepStyles,
  type Step,
  type StepStatus,
  type ProgressStepsProps,
  type ProgressBarProps,
  type StepPanelProps,
  type WizardControlsProps,
};
