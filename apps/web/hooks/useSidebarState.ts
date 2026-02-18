"use client";

import { useState, useEffect, useCallback } from "react";

const SIDEBAR_STATE_KEY = "eios-sidebar-state";
const MOBILE_BREAKPOINT = 768;

// Helper to check if we're on mobile
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

// Hook for managing sidebar state with localStorage persistence
export function useSidebarState() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    
    // Always default to closed on mobile
    if (isMobile()) return false;
    
    // Try to get saved state from localStorage
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
    } catch {
      // Ignore localStorage errors (e.g., private mode)
    }
  }, [isOpen]);

  // Sync state across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STATE_KEY && e.newValue !== null) {
        try {
          setIsOpen(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Handle window resize (close on mobile, restore on desktop)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastWidth = window.innerWidth;
    
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasMobile = lastWidth < MOBILE_BREAKPOINT;
      const isNowMobile = currentWidth < MOBILE_BREAKPOINT;
      
      // Transitioning to mobile - close sidebar
      if (!wasMobile && isNowMobile) {
        setIsOpen(false);
      }
      
      lastWidth = currentWidth;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    toggle,
    open,
    close,
    isMobile: typeof window !== "undefined" ? isMobile() : false,
  };
}
