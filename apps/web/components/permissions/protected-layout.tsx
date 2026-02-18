"use client";

/**
 * Protected Layout Component
 * Wraps dashboard pages with authentication and permission checks
 * Integrates with the RBAC system
 */

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PermissionProvider } from "./permission-provider";
import { PermissionGate } from "./permission-gate";
import { Role } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface ProtectedLayoutProps {
  children: ReactNode;
  /**
   * Required permission to access this layout
   */
  permission?: string;
  /**
   * Required minimum role
   */
  minimumRole?: Role;
  /**
   * Fallback content when permission is denied
   */
  fallback?: ReactNode;
  /**
   * Whether to show loading state while checking permissions
   */
  showLoading?: boolean;
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
  /**
   * Where to redirect if not authenticated
   */
  redirectTo?: string;
}

interface PermissionDeniedProps {
  title?: string;
  message?: string;
  requiredPermission?: string;
  currentRole?: string | null;
  onRequestAccess?: () => void;
}

interface AuthLoadingProps {
  message?: string;
}

// ============================================
// Loading Component
// ============================================

function AuthLoading({ message = "Checking authentication..." }: AuthLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-rose-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// Permission Denied Component
// ============================================

function PermissionDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
  requiredPermission,
  currentRole,
  onRequestAccess,
}: PermissionDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        {(requiredPermission || currentRole) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {requiredPermission && (
              <p className="text-sm">
                <span className="text-gray-500">Required:</span>{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                  {requiredPermission}
                </code>
              </p>
            )}
            {currentRole && (
              <p className="text-sm mt-2">
                <span className="text-gray-500">Your role:</span>{" "}
                <span className="font-medium text-gray-700 capitalize">
                  {currentRole}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>

        {onRequestAccess && (
          <button
            onClick={onRequestAccess}
            className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium"
          >
            Request Access →
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Session Expired Component
// ============================================

function SessionExpired() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    // Redirect to login after a brief delay
    const timer = setTimeout(() => {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Session Expired
        </h1>
        <p className="text-gray-600 mb-6">
          Your session has expired. Please sign in again to continue.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
          Redirecting to login...
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Protected Layout
// ============================================

export function ProtectedLayout({
  children,
  permission,
  minimumRole,
  fallback,
  showLoading = true,
  loadingComponent,
  redirectTo = "/auth/login",
}: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isClient) {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?redirect=${redirectUrl}`);
    }
  }, [isLoading, isAuthenticated, isClient, pathname, router, redirectTo]);

  // Show loading state
  if (!isClient || isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    if (showLoading) {
      return <AuthLoading />;
    }
    return null;
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return <SessionExpired />;
  }

  // Get user's role from their data
  // In a real implementation, this would come from the user object
  const userRole = (user?.role as Role) || Role.VIEWER;

  // Render with permission provider
  return (
    <PermissionProvider
      role={userRole}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
    >
      {permission || minimumRole ? (
        <PermissionGate
          permission={permission as any}
          minimumRole={minimumRole}
          fallback={
            fallback || (
              <PermissionDenied
                requiredPermission={permission}
                currentRole={userRole}
              />
            )
          }
        >
          {children}
        </PermissionGate>
      ) : (
        children
      )}
    </PermissionProvider>
  );
}

// ============================================
// HOC for protecting pages
// ============================================

export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedLayoutProps, "children"> = {}
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedLayout {...options}>
        <Component {...props} />
      </ProtectedLayout>
    );
  };
}

// ============================================
// Convenience wrappers for common use cases
// ============================================

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout minimumRole="admin">
      {children}
    </ProtectedLayout>
  );
}

export function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout minimumRole="owner">
      {children}
    </ProtectedLayout>
  );
}

// ============================================
// Default Export
// ============================================

export default ProtectedLayout;
