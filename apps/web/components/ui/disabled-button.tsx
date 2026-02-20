"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface DisabledButtonProps {
  children: ReactNode;
  reason: string;
  comingSoon?: boolean;
  className?: string;
}

export function DisabledButton({ 
  children, 
  reason, 
  comingSoon = true,
  className 
}: DisabledButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative inline-flex ${className}`}>
            <div className="opacity-50 cursor-not-allowed pointer-events-none">
              {children}
            </div>
            {comingSoon && (
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
          className="max-w-xs text-center"
        >
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Alternative: Hidden with label
export function ComingSoonOverlay({ 
  children,
  label = "Coming Soon"
}: { 
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none grayscale">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Badge 
          variant="secondary" 
          className="bg-white/90 text-[#8B6B5D] border-[#E8D5D0] px-3 py-1 shadow-lg"
        >
          {label}
        </Badge>
      </div>
    </div>
  );
}
