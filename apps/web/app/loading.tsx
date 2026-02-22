import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo Image */}
        <div className="relative w-20 h-20 mb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="w-10 h-10 text-white"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        
        {/* Loading Spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        
        {/* Loading Text */}
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
