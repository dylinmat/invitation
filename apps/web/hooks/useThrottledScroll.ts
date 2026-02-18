"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Simple throttle implementation
function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let rafId: number | null = null;
  let pendingArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    pendingArgs = args;

    if (now - lastCall >= delay) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastCall = now;
      func(...args);
      pendingArgs = null;
    } else if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (pendingArgs !== null) {
          lastCall = Date.now();
          func(...pendingArgs);
          pendingArgs = null;
        }
        rafId = null;
      });
    }
  };
}

// Hook for throttled scroll events (default 16ms = ~60fps)
export function useThrottledScroll(
  callback: () => void,
  delay = 16
) {
  const callbackRef = useRef(callback);
  
  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useMemo(
    () =>
      throttle(() => {
        callbackRef.current();
      }, delay),
    [delay]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("scroll", throttledCallback, { passive: true });
    return () => {
      window.removeEventListener("scroll", throttledCallback);
    };
  }, [throttledCallback]);
}

// Hook for scroll direction detection with throttling
export function useScrollDirection(delay = 16) {
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastScrollY.current = window.scrollY;
  }, []);

  useThrottledScroll(() => {
    if (typeof window === "undefined") return;
    
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY.current) {
      scrollDirection.current = "down";
    } else if (currentScrollY < lastScrollY.current) {
      scrollDirection.current = "up";
    }
    
    lastScrollY.current = currentScrollY;
  }, delay);

  return scrollDirection;
}

// Hook for hiding/showing header on scroll
export function useScrollHeader(delay = 16) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = useRef(50);

  useThrottledScroll(() => {
    if (typeof window === "undefined") return;
    
    const currentScrollY = window.scrollY;
    
    // Always show header at the top
    if (currentScrollY < scrollThreshold.current) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY.current) {
      // Scrolling down - hide header
      setIsVisible(false);
    } else {
      // Scrolling up - show header
      setIsVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  }, delay);

  return isVisible;
}
