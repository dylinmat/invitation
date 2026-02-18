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

// Admin Login Component
function AdminLogin({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#FDF8F5" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-xl shadow-lg border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
            <p className="text-muted-foreground">
              Enter the admin password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className={`w-full px-4 py-3 rounded-lg border bg-background ${
                  error ? "border-red-500 ring-1 ring-red-500" : "border-input"
                }`}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">Incorrect password</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Access Admin Panel
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard">← Back to Dashboard</a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Check if user has admin access
function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Check if already authenticated in this session
        const adminSession = sessionStorage.getItem("admin_session");
        if (adminSession === "true") {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Otherwise show login
        setShowLogin(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const handleLogin = (password: string) => {
    // Get admin password from env or use default for demo
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "eios-admin-2024";
    
    if (password === adminPassword) {
      sessionStorage.setItem("admin_session", "true");
      setIsAdmin(true);
      setShowLogin(false);
      toast({
        title: "Welcome Admin",
        description: "You have successfully accessed the admin panel.",
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    setIsAdmin(false);
    setShowLogin(true);
  };

  return { isAdmin, isLoading, showLogin, handleLogin, handleLogout };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading, showLogin, handleLogin } = useAdminCheck();
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

  // Show login screen
  if (showLogin) {
    return <AdminLogin onLogin={handleLogin} />;
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
