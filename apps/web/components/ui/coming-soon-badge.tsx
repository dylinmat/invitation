"use client";

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Clock, 
  Bell, 
  Lightbulb,
  ArrowRight,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FeatureRequestDialog } from "@/components/feature-request-dialog";

interface ComingSoonBadgeProps {
  feature: string;
  description?: string;
  eta?: string;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "prominent";
}

export function ComingSoonBadge({
  feature,
  description,
  eta,
  showTooltip = true,
  size = "sm",
  variant = "default",
}: ComingSoonBadgeProps) {
  const [showDialog, setShowDialog] = useState(false);

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  const variantClasses = {
    default: "bg-amber-100 text-amber-700 border-amber-200",
    subtle: "bg-gray-100 text-gray-600 border-gray-200",
    prominent: "bg-gradient-to-r from-amber-100 to-rose-100 text-amber-800 border-amber-200",
  };

  const badge = (
    <Badge 
      variant="secondary" 
      className={`${sizeClasses[size]} ${variantClasses[variant]} cursor-help transition-all hover:shadow-md`}
    >
      <Sparkles className={`mr-1 ${size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-4 h-4"}`} />
      Coming Soon
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{badge}</span>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs p-0 overflow-hidden"
            sideOffset={8}
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-3 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{feature}</p>
                      {eta && (
                        <div className="flex items-center gap-1 text-xs text-amber-700">
                          <Clock className="w-3 h-3" />
                          <span>{eta}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {description || `We're working hard to bring you ${feature}. Stay tuned!`}
                  </p>

                  <button 
                    className="flex items-center gap-1 text-xs text-[#8B6B5D] hover:text-[#6B4B3D] transition-colors"
                    onClick={() => setShowDialog(true)}
                  >
                    <Bell className="w-3 h-3" />
                    Notify me when available
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FeatureRequestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        feature={feature}
      />
    </>
  );
}

// Enhanced disabled button with hover context
interface EnhancedDisabledButtonProps {
  children: ReactNode;
  feature: string;
  description?: string;
  eta?: string;
  showBadge?: boolean;
}

export function EnhancedDisabledButton({
  children,
  feature,
  description,
  eta,
  showBadge = true,
}: EnhancedDisabledButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-flex cursor-help">
              <div className="opacity-50 pointer-events-none">
                {children}
              </div>
              {showBadge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200"
                >
                  Soon
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs p-0 overflow-hidden"
            sideOffset={8}
          >
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{feature}</p>
                    {eta && (
                      <div className="flex items-center gap-1 text-xs text-amber-700">
                        <Clock className="w-3 h-3" />
                        <span>{eta}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description || `This feature is currently in development and will be available soon.`}
                </p>

                <button 
                  className="flex items-center gap-1.5 text-xs text-[#8B6B5D] hover:text-[#6B4B3D] transition-colors font-medium"
                  onClick={() => setShowDialog(true)}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Request this feature
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FeatureRequestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        feature={feature}
      />
    </>
  );
}

// Inline coming soon indicator for text
export function ComingSoonInline({
  children,
  feature,
  description,
}: {
  children: ReactNode;
  feature: string;
  description?: string;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="border-b border-dashed border-amber-400 cursor-help text-muted-foreground hover:text-foreground transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{feature}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {description || "This feature is coming soon. Stay tuned!"}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
