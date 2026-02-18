"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  X,
  FolderPlus,
  Users,
  Palette,
  Send,
  CalendarCheck,
  ChevronRight,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  href: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "create-project",
    title: "Create your first project",
    description: "Start by creating a new invitation project",
    icon: <FolderPlus className="w-5 h-5" />,
    action: "Create Project",
    href: "/dashboard/projects/new",
  },
  {
    id: "add-guests",
    title: "Add guests",
    description: "Import or manually add your guest list",
    icon: <Users className="w-5 h-5" />,
    action: "Add Guests",
    href: "/dashboard/guests",
  },
  {
    id: "customize-site",
    title: "Customize your invite site",
    description: "Design a beautiful invitation page",
    icon: <Palette className="w-5 h-5" />,
    action: "Customize",
    href: "/dashboard/design",
  },
  {
    id: "send-invites",
    title: "Send invites",
    description: "Share invitations with your guests",
    icon: <Send className="w-5 h-5" />,
    action: "Send Invites",
    href: "/dashboard/invites",
  },
  {
    id: "view-rsvps",
    title: "View RSVPs",
    description: "Track guest responses and manage attendance",
    icon: <CalendarCheck className="w-5 h-5" />,
    action: "View RSVPs",
    href: "/dashboard/rsvps",
  },
];

interface OnboardingChecklistProps {
  className?: string;
  onDismiss?: () => void;
}

export function OnboardingChecklist({
  className,
  onDismiss,
}: OnboardingChecklistProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("eios_onboarding");
    if (stored) {
      const data = JSON.parse(stored);
      setCompletedItems(data.completed || []);
      setIsDismissed(data.dismissed || false);
      setIsCollapsed(data.collapsed || false);
    } else {
      // New user - show the checklist
      setIsVisible(true);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (!isVisible && completedItems.length === 0) return;
    
    localStorage.setItem(
      "eios_onboarding",
      JSON.stringify({
        completed: completedItems,
        dismissed: isDismissed,
        collapsed: isCollapsed,
      })
    );
  }, [completedItems, isDismissed, isCollapsed, isVisible]);

  // Mark item as complete
  const toggleItem = (id: string) => {
    setCompletedItems((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // Dismiss permanently
  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    onDismiss?.();
    localStorage.setItem(
      "eios_onboarding",
      JSON.stringify({
        completed: completedItems,
        dismissed: true,
        collapsed: false,
      })
    );
  };

  // Skip for now (collapse)
  const handleSkip = () => {
    setIsCollapsed(true);
    setIsVisible(false);
  };

  // Show checklist
  const handleShow = () => {
    setIsVisible(true);
    setIsCollapsed(false);
  };

  const progress = Math.round((completedItems.length / checklistItems.length) * 100);
  const isComplete = completedItems.length === checklistItems.length;

  // Don't render if dismissed
  if (isDismissed) return null;

  // Show collapsed button
  if (isCollapsed && !isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleShow}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3",
          "bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full shadow-lg",
          "hover:shadow-xl hover:scale-105 transition-all duration-200",
          className
        )}
      >
        <Rocket className="w-5 h-5" />
        <span className="font-medium">Getting Started</span>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
          {progress}%
        </div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed bottom-6 right-6 z-40 w-80 sm:w-96",
            "bg-background rounded-2xl shadow-2xl border",
            className
          )}
        >
          {/* Header */}
          <div className="relative p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-t-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-rose-100 text-sm font-medium">
                      Getting Started
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">
                    {isComplete ? "Congratulations! 🎉" : "Welcome to EIOS"}
                  </h3>
                  <p className="text-rose-100 text-sm mt-1">
                    {isComplete
                      ? "You've completed all the steps!"
                      : "Complete these steps to get started"}
                  </p>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-rose-100">
                    {completedItems.length} of {checklistItems.length} completed
                  </span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-3 max-h-[320px] overflow-y-auto">
            <div className="space-y-1">
              {checklistItems.map((item, index) => {
                const isCompleted = completedItems.includes(item.id);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                      isCompleted
                        ? "bg-muted/50"
                        : "hover:bg-muted cursor-pointer"
                    )}
                    onClick={() => !isCompleted && toggleItem(item.id)}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(item.id);
                      }}
                      className={cn(
                        "mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isCompleted
                          ? "bg-rose-500 border-rose-500 text-white"
                          : "border-muted-foreground/30 hover:border-rose-400"
                      )}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "p-1.5 rounded-lg",
                            isCompleted
                              ? "bg-muted text-muted-foreground"
                              : "bg-rose-100 text-rose-600"
                          )}
                        >
                          {item.icon}
                        </span>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-medium text-sm",
                              isCompleted && "line-through text-muted-foreground"
                            )}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Action button */}
                      {!isCompleted && (
                        <a
                          href={item.href}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-rose-600 hover:text-rose-700"
                        >
                          {item.action}
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Don&apos;t show again
              </button>
              {isComplete && (
                <Button
                  size="sm"
                  onClick={handleDismiss}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  Finish
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Standalone hook for managing onboarding state
export function useOnboarding() {
  const [state, setState] = useState<{
    completed: string[];
    dismissed: boolean;
    collapsed: boolean;
  }>({ completed: [], dismissed: false, collapsed: false });

  useEffect(() => {
    const stored = localStorage.getItem("eios_onboarding");
    if (stored) {
      setState(JSON.parse(stored));
    }
  }, []);

  const completeItem = (id: string) => {
    setState((prev) => {
      const updated = {
        ...prev,
        completed: prev.completed.includes(id)
          ? prev.completed
          : [...prev.completed, id],
      };
      localStorage.setItem("eios_onboarding", JSON.stringify(updated));
      return updated;
    });
  };

  const dismiss = () => {
    setState((prev) => {
      const updated = { ...prev, dismissed: true };
      localStorage.setItem("eios_onboarding", JSON.stringify(updated));
      return updated;
    });
  };

  const reset = () => {
    const updated = { completed: [], dismissed: false, collapsed: false };
    localStorage.setItem("eios_onboarding", JSON.stringify(updated));
    setState(updated);
  };

  return {
    ...state,
    completeItem,
    dismiss,
    reset,
    progress: Math.round((state.completed.length / 5) * 100),
    isComplete: state.completed.length === 5,
  };
}
