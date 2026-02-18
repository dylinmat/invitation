"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Notification } from "./notification-provider";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  index: number;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-600",
    title: "text-green-900",
    message: "text-green-700",
    progress: "bg-green-500",
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-600",
    title: "text-red-900",
    message: "text-red-700",
    progress: "bg-red-500",
  },
  warning: {
    container: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    title: "text-amber-900",
    message: "text-amber-700",
    progress: "bg-amber-500",
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    title: "text-blue-900",
    message: "text-blue-700",
    progress: "bg-blue-500",
  },
};

export function NotificationToast({
  notification,
  onDismiss,
  index,
}: NotificationToastProps) {
  const { id, type, title, message, duration = 5000, actions } = notification;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const Icon = icons[type];
  const style = styles[type];

  // Handle auto-dismiss
  useEffect(() => {
    if (duration === 0 || isPaused) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;

      if (newProgress <= 0) {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
      } else {
        setProgress(newProgress);
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration, isPaused, id, onDismiss]);

  // Handle swipe to dismiss
  const [dragX, setDragX] = useState(0);
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
      if (info.offset.x > 100) {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
      } else {
        setDragX(0);
      }
    },
    [id, onDismiss]
  );

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        x: isVisible ? dragX : 100,
        scale: isVisible ? 1 : 0.9,
      }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: 0.2 },
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "touch-pan-y",
        style.container
      )}
      style={{
        marginBottom: index < 4 ? "0.5rem" : 0,
      }}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
          <motion.div
            className={cn("h-full", style.progress)}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0 }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("mt-0.5 flex-shrink-0", style.icon)}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-medium text-sm", style.title)}>
              {title}
            </h4>
            {message && (
              <p className={cn("text-sm mt-1", style.message)}>
                {message}
              </p>
            )}

            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      action.onClick();
                      handleDismiss();
                    }}
                    className={cn(
                      "h-7 text-xs",
                      type === "success" && "border-green-300 hover:bg-green-100",
                      type === "error" && "border-red-300 hover:bg-red-100",
                      type === "warning" && "border-amber-300 hover:bg-amber-100",
                      type === "info" && "border-blue-300 hover:bg-blue-100"
                    )}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-md transition-colors",
              "hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1",
              type === "success" && "focus:ring-green-400",
              type === "error" && "focus:ring-red-400",
              type === "warning" && "focus:ring-amber-400",
              type === "info" && "focus:ring-blue-400"
            )}
          >
            <X className="w-4 h-4 text-current opacity-60" />
          </button>
        </div>
      </div>

      {/* Swipe hint on mobile */}
      <div className="sm:hidden absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/5 to-transparent pointer-events-none opacity-0 data-[dragging=true]:opacity-100 transition-opacity" />
    </motion.div>
  );
}
