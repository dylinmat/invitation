"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

// ============================================
// TYPES
// ============================================

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  defaultSplit?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  direction?: "horizontal" | "vertical";
  storageKey?: string;
  collapsible?: "left" | "right" | "both" | "none";
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

interface SplitPaneContextValue {
  isDragging: boolean;
  collapsed: boolean;
  toggleCollapse: () => void;
}

// ============================================
// CONTEXT
// ============================================

const SplitPaneContext = React.createContext<SplitPaneContextValue | undefined>(
  undefined
);

export function useSplitPane() {
  const context = React.useContext(SplitPaneContext);
  if (!context) {
    throw new Error("useSplitPane must be used within a SplitPane");
  }
  return context;
}

// ============================================
// SPLIT PANE COMPONENT
// ============================================

const SplitPane = React.forwardRef<HTMLDivElement, SplitPaneProps>(
  (
    {
      left,
      right,
      className,
      defaultSplit = 30,
      minLeftWidth = 200,
      minRightWidth = 300,
      direction = "horizontal",
      storageKey,
      collapsible = "left",
      collapsed: controlledCollapsed,
      onCollapse,
    },
    ref
  ) => {
    const [split, setSplit] = React.useState(defaultSplit);
    const [isDragging, setIsDragging] = React.useState(false);
    const [internalCollapsed, setInternalCollapsed] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Use controlled or uncontrolled collapsed state
    const collapsed = controlledCollapsed ?? internalCollapsed;
    const setCollapsed = React.useCallback(
      (value: boolean) => {
        setInternalCollapsed(value);
        onCollapse?.(value);
      },
      [onCollapse]
    );

    // Load saved split from localStorage
    React.useEffect(() => {
      if (storageKey && typeof window !== "undefined") {
        const saved = localStorage.getItem(`split-pane-${storageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSplit(parsed.split ?? defaultSplit);
          if (collapsible !== "none") {
            setInternalCollapsed(parsed.collapsed ?? false);
          }
        }
      }
    }, [storageKey, defaultSplit, collapsible]);

    // Save split to localStorage
    React.useEffect(() => {
      if (storageKey && typeof window !== "undefined") {
        localStorage.setItem(
          `split-pane-${storageKey}`,
          JSON.stringify({ split, collapsed })
        );
      }
    }, [split, collapsed, storageKey]);

    // Handle drag
    const handleMouseDown = React.useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newSplit: number;

        if (direction === "horizontal") {
          const x = e.clientX - rect.left;
          newSplit = (x / rect.width) * 100;
        } else {
          const y = e.clientY - rect.top;
          newSplit = (y / rect.height) * 100;
        }

        // Calculate pixel widths
        const totalSize = direction === "horizontal" ? rect.width : rect.height;
        const leftPixels = (newSplit / 100) * totalSize;
        const rightPixels = totalSize - leftPixels;

        // Apply constraints
        if (leftPixels >= minLeftWidth && rightPixels >= minRightWidth) {
          setSplit(newSplit);
        }
      },
      [isDragging, direction, minLeftWidth, minRightWidth]
    );

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";
      }

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }, [isDragging, handleMouseMove, handleMouseUp, direction]);

    const toggleCollapse = React.useCallback(() => {
      setCollapsed(!collapsed);
    }, [collapsed, setCollapsed]);

    const contextValue = React.useMemo(
      () => ({
        isDragging,
        collapsed,
        toggleCollapse,
      }),
      [isDragging, collapsed, toggleCollapse]
    );

    const isHorizontal = direction === "horizontal";

    return (
      <SplitPaneContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            // Handle both refs
            containerRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={cn(
            "flex overflow-hidden",
            isHorizontal ? "flex-row" : "flex-col",
            className
          )}
        >
          {/* Left/Top Pane */}
          <motion.div
            initial={false}
            animate={{
              [isHorizontal ? "width" : "height"]: collapsed ? 0 : `${split}%`,
              opacity: collapsed ? 0 : 1,
            }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "relative overflow-hidden",
              isHorizontal ? "h-full" : "w-full"
            )}
          >
            {left}
          </motion.div>

          {/* Resize Handle */}
          {(collapsible === "left" || collapsible === "both") && (
            <button
              onClick={toggleCollapse}
              className={cn(
                "flex items-center justify-center bg-border/50 hover:bg-border transition-colors z-10",
                isHorizontal
                  ? "w-4 -mx-2 cursor-col-resize hover:w-5"
                  : "h-4 -my-2 cursor-row-resize hover:h-5",
                isDragging && "bg-rose-500/50"
              )}
              onMouseDown={handleMouseDown}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <GripVertical
                className={cn(
                  "h-4 w-4 text-muted-foreground",
                  !isHorizontal && "rotate-90"
                )}
              />
            </button>
          )}

          {/* Right/Bottom Pane */}
          <motion.div
            initial={false}
            animate={{
              [isHorizontal ? "width" : "height"]: collapsed
                ? "100%"
                : `${100 - split}%`,
            }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "flex-1 overflow-hidden",
              isHorizontal ? "h-full" : "w-full"
            )}
          >
            {right}
          </motion.div>
        </div>
      </SplitPaneContext.Provider>
    );
  }
);
SplitPane.displayName = "SplitPane";

// ============================================
// COLLAPSE BUTTON
// ============================================

interface CollapseButtonProps {
  className?: string;
  position?: "left" | "right";
}

function CollapseButton({ className, position = "left" }: CollapseButtonProps) {
  const { collapsed, toggleCollapse } = useSplitPane();

  return (
    <button
      onClick={toggleCollapse}
      className={cn(
        "p-1.5 rounded-md hover:bg-accent transition-colors",
        className
      )}
      title={collapsed ? "Expand" : "Collapse"}
    >
      <svg
        className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          position === "left" && collapsed && "rotate-180",
          position === "right" && !collapsed && "rotate-180"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={
            position === "left"
              ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
              : "M13 5l7 7-7 7M5 5l7 7-7 7"
          }
        />
      </svg>
    </button>
  );
}

// ============================================
// EXPORTS
// ============================================

export { SplitPane, CollapseButton };
