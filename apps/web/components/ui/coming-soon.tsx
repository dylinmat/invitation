"use client";

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, Bell, Lightbulb, ArrowRight } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureRequestDialog } from "@/components/feature-request-dialog";

export interface ComingSoonProps {
  children: ReactNode;
  feature: string;
  description?: string;
  eta?: string;
  notifyAvailable?: boolean;
  showHoverCard?: boolean;
}

export function ComingSoon({
  children,
  feature,
  description,
  eta = "Coming soon",
  notifyAvailable = true,
  showHoverCard = true,
}: ComingSoonProps) {
  const [showDialog, setShowDialog] = useState(false);

  if (!showHoverCard) {
    return (
      <div className="relative inline-flex">
        <div className="opacity-50 cursor-not-allowed pointer-events-none">
          {children}
        </div>
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200"
        >
          Soon
        </Badge>
      </div>
    );
  }

  return (
    <>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div className="relative inline-flex cursor-help">
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200"
            >
              Soon
            </Badge>
          </div>
        </HoverCardTrigger>
        <HoverCardContent 
          className="w-80 p-0 overflow-hidden" 
          side="top" 
          align="center"
          sideOffset={8}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-4 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{feature}</h4>
                    <div className="flex items-center gap-1 text-xs text-amber-700">
                      <Clock className="w-3 h-3" />
                      <span>{eta}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description || `We're working hard to bring you ${feature}. Stay tuned for updates!`}
                </p>

                {notifyAvailable && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => setShowDialog(true)}
                  >
                    <Bell className="w-3.5 h-3.5 mr-2" />
                    Notify Me When Available
                  </Button>
                )}

                {/* Feature vote/feedback link */}
                <button 
                  className="flex items-center gap-1 text-xs text-[#8B6B5D] hover:text-[#6B4B3D] transition-colors w-full justify-center"
                  onClick={() => setShowDialog(true)}
                >
                  <Lightbulb className="w-3 h-3" />
                  Have ideas for this feature?
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </HoverCardContent>
      </HoverCard>

      <FeatureRequestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        feature={feature}
      />
    </>
  );
}

// Compact version for inline use
export function ComingSoonBadge({
  feature,
  description,
  eta,
}: {
  feature: string;
  description?: string;
  eta?: string;
}) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Badge 
            variant="secondary" 
            className="bg-amber-100 text-amber-700 border-amber-200 cursor-help hover:bg-amber-200 transition-colors"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-72" side="top">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{feature}</h4>
            {eta && (
              <div className="flex items-center gap-1 text-xs text-amber-700">
                <Clock className="w-3 h-3" />
                <span>{eta}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {description || `This feature is currently in development.`}
            </p>
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full text-xs h-8"
              onClick={() => setShowDialog(true)}
            >
              <Bell className="w-3 h-3 mr-1" />
              Get notified
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>

      <FeatureRequestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        feature={feature}
      />
    </>
  );
}

// Inline text with tooltip
export function ComingSoonText({
  children,
  feature,
}: {
  children: ReactNode;
  feature: string;
}) {
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="border-b border-dashed border-amber-400 cursor-help text-muted-foreground">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-64" side="top">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{feature}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This feature is coming soon. Stay tuned!
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
