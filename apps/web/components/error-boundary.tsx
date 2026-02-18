"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for debugging
    console.error("[ErrorBoundary] Caught error:", {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
    });
    
    // Call optional error handler
    this.props.onError?.(error, info);
    
    // Future: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example Sentry integration:
    // if (typeof window !== "undefined" && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     extra: { componentStack: info.componentStack },
    //   });
    // }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="rounded-xl border border-destructive/50 p-8 text-center"
          style={{ backgroundColor: "#FDF8F5" }}
        >
          <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold text-lg mb-1">Something went wrong</h3>
          <p className="text-muted-foreground text-sm mb-4">
            We encountered an error loading this component. Please try again.
          </p>
          <Button onClick={this.handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
