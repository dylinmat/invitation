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
    console.error("[ErrorBoundary]", error, info);
    this.props.onError?.(error, info);
    // TODO: Send to error tracking service (Sentry, etc.)
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
