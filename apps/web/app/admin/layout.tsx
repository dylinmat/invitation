"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { Shield, AlertTriangle, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";

// Admin-specific error fallback
function AdminErrorFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#FDF8F5" }}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Admin Panel Error</h2>
        <p className="text-muted-foreground mb-4">
          Something went wrong in the admin panel. This has been logged and our team has been notified.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Admin Panel
        </Button>
      </div>
    </div>
  );
}

// Access denied component
function AccessDenied() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#FDF8F5" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <UserX className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to access the admin panel. This area is restricted to platform administrators only.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </motion.div>
    </div>
  );
}

// Check if user has admin access
// This is a simplified check - in production, this should verify against your auth system
function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // In a real implementation, this would check the user's session/role
    // For now, we'll simulate an admin check
    const checkAdmin = async () => {
      try {
        // TODO: Replace with actual admin check from your auth system
        // const user = await getCurrentUser();
        // setIsAdmin(user?.role === 'platform_admin' || user?.isSuperAdmin);
        
        // Simulating admin access for development
        // In production, this should be: setIsAdmin(false) by default
        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to verify admin access. Please try again.",
          variant: "destructive",
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [toast]);

  return { isAdmin, isLoading };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdminCheck();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR or before client mount
  if (!mounted || isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "#FDF8F5" }}
      >
        <div className="border-b bg-card">
          <div className="flex h-16 items-center px-4">
            <Skeleton className="h-8 w-32" />
            <div className="ml-auto flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
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

  // Access denied
  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF8F5" }}>
      {/* Header */}
      <header className="bg-card border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">EIOS Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard">Exit Admin</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        <aside className="hidden md:block h-[calc(100vh-4rem)] sticky top-0">
          <AdminNav />
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
            <ErrorBoundary
              fallback={<AdminErrorFallback />}
              onError={(error, errorInfo, errorId) => {
                console.error("[Admin Error Boundary]", {
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
  );
}
