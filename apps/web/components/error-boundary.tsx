"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Generate a unique error ID for support
function generateErrorId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ERR-${timestamp}-${random}`;
}

// Log error to monitoring service
function logError(error: Error, errorInfo: ErrorInfo, errorId: string): void {
  // Console logging (always available)
  console.error("[ErrorBoundary] Caught error:", {
    errorId,
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
  });

  // Send to external monitoring service if configured
  if (process.env.NEXT_PUBLIC_ERROR_REPORTING_URL) {
    fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : null,
      }),
    }).catch((err) => {
      console.error("Failed to send error report:", err);
    });
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.state.errorId || generateErrorId();
    this.setState({ errorInfo });
    logError(error, errorInfo, errorId);

    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-lg w-full">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>

            {/* Description */}
            <p className="text-muted-foreground mb-4">
              We apologize for the inconvenience. An unexpected error has
              occurred in the application.
            </p>

            {/* Error ID for support */}
            {errorId && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Error Reference ID (for support)
                </p>
                <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {errorId}
                </code>
              </div>
            )}

            {/* Error Message (always shown) */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  {error.message}
                </p>
              </div>
            )}

            {/* Stack Trace (dev only) */}
            {process.env.NODE_ENV === "development" && errorInfo && (
              <div className="mb-6 text-left">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <Bug className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Development Stack Trace
                  </span>
                </div>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64 text-muted-foreground">
                  {error?.stack}
                  {"\n\n"}
                  {"Component Stack:\n"}
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} variant="default">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
              {process.env.NODE_ENV === "development" && (
                <Button
                  onClick={this.handleReset}
                  variant="ghost"
                  className="w-full sm:w-auto"
                >
                  Try Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    console.error("[ErrorHandler] Error caught:", error);
    // In a real implementation, this would trigger the nearest error boundary
    throw error;
  };
}

export default ErrorBoundary;
