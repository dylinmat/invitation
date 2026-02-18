"use client";

/**
 * Dashboard Layout with RBAC Integration
 * Enhanced version with full permission provider support
 */

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useAuth";
import { PermissionProvider } from "@/components/permissions";
import { useMyPermissions } from "@/lib/permissions-api";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";

// Dashboard-specific error fallback
function DashboardErrorFallback() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#FDF8F5" }}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
        <p className="text-muted-foreground mb-4">
          Something went wrong in the dashboard. Try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  );
}

// Permission-aware loading state
function DashboardLoading() {
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: "#FDF8F5" }}
    >
      <div className="border-b bg-white">
        <div className="flex h-16 items-center px-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="ml-auto h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="flex">
        <Skeleton className="h-[calc(100vh-4rem)] w-64" />
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayoutWithRBAC({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: isAuthLoading, isAuthenticated } = useRequireAuth();
  const [mounted, setMounted] = useState(false);
  
  // Fetch user's permissions from the server
  const { data: permissionsData, isLoading: isPermissionsLoading } = useMyPermissions();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR or before client mount
  if (!mounted || isAuthLoading || isPermissionsLoading) {
    return <DashboardLoading />;
  }

  // Extract role from permissions data
  const userRole = permissionsData?.role || null;

  return (
    <PermissionProvider
      role={userRole}
      isAuthenticated={isAuthenticated}
      isLoading={isPermissionsLoading}
      onRefresh={async () => {
        // Refresh permissions from server
        window.location.reload();
      }}
    >
      <div className="min-h-screen" style={{ backgroundColor: "#FDF8F5" }}>
        <div className="bg-white border-b">
          <DashboardHeader />
        </div>
        <div className="flex">
          <aside 
            className="hidden md:flex h-[calc(100vh-4rem)] w-64 flex-col border-r"
            style={{ backgroundColor: "rgba(253, 248, 245, 0.8)" }}
          >
            <DashboardNav />
          </aside>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
              {/* Dashboard-specific error boundary */}
              <ErrorBoundary
                fallback={<DashboardErrorFallback />}
                onError={(error, errorInfo, errorId) => {
                  console.error("[Dashboard Error Boundary]", {
                    errorId,
                    error: error.message,
                    componentStack: errorInfo.componentStack,
                  });
                }}
              >
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
