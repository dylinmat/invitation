// Performance monitoring utilities

// Web Vitals types
export interface WebVitalMetric {
  id: string;
  name: "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
  value: number;
  delta?: number;
  entries: PerformanceEntry[];
}

// Report Web Vitals to analytics
export function reportWebVitals(metric: WebVitalMetric): void {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }

  // Send to analytics endpoint
  if (typeof window !== "undefined" && "navigator" in window) {
    // Use sendBeacon for reliable delivery
    const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL;
    if (analyticsUrl) {
      const body = JSON.stringify({
        ...metric,
        page: window.location.pathname,
        timestamp: Date.now(),
      });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(analyticsUrl, body);
      }
    }
  }
}

// Measure page load timing
export function measurePageLoad(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    // Use PerformanceObserver if available, fall back to performance.timing
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;
            
            const metrics = {
              dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcp: navEntry.connectEnd - navEntry.connectStart,
              ttfb: navEntry.responseStart - navEntry.startTime,
              response: navEntry.responseEnd - navEntry.responseStart,
              domInteractive: navEntry.domInteractive - navEntry.startTime,
              domComplete: navEntry.domComplete - navEntry.startTime,
              load: navEntry.loadEventEnd - navEntry.startTime,
            };

            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.log("[Page Load Metrics]", metrics);
            }

            // Store for potential analytics
            (window as Window & { __pageLoadMetrics?: typeof metrics }).__pageLoadMetrics = metrics;
          }
        }
      });

      observer.observe({ entryTypes: ["navigation"] });
    }
  });
}

// Measure component render time (for debugging)
export function measureRenderTime(componentName: string) {
  if (process.env.NODE_ENV !== "development") {
    return () => {};
  }

  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) { // Log if render takes longer than one frame
      // eslint-disable-next-line no-console
      console.warn(`[Render Time] ${componentName}: ${duration.toFixed(2)}ms`);
    }
  };
}

// Debounce function for performance
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for performance
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Request idle callback polyfill
export function requestIdleCallback(
  callback: IdleRequestCallback
): number {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return window.requestIdleCallback(callback);
  }
  
  // Fallback to setTimeout with 1ms delay
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return 50;
      },
    });
  }, 1) as unknown as number;
}

// Cancel idle callback
export function cancelIdleCallback(id: number): void {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

// Intersection Observer hook for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.01,
    ...options,
  });
}
