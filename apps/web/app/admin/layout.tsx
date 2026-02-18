"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { Shield, AlertTriangle, UserX, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

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

// Admin Not Configured Component
function AdminNotConfigured() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#FDF8F5" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Admin Access Not Configured</h2>
        <p className="text-muted-foreground mb-6">
          The admin panel is not properly configured. Please contact your system administrator to set up admin access.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}

// Admin Login Component
function AdminLogin({ onLogin, error }: { onLogin: (password: string) => void; error?: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(error);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError("Please enter the admin password");
      return;
    }
    setLocalError(undefined);
    onLogin(password);
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
              <label className="block text-sm font-medium mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError(undefined);
                  }}
                  placeholder="Enter admin password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg border bg-background transition-colors ${
                    localError ? "border-red-500 ring-1 ring-red-500" : "border-input focus:ring-2 focus:ring-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {localError && (
                <p className="text-red-500 text-sm mt-2">{localError}</p>
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
  const [loginError, setLoginError] = useState<string>();
  const [isConfigured, setIsConfigured] = useState(true);
  const { toast } = useToast();

  // Get admin password from env
  const getAdminPassword = () => {
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    return password;
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Check if admin password is configured
        const adminPassword = getAdminPassword();
        if (!adminPassword) {
          setIsConfigured(false);
          setIsLoading(false);
          return;
        }

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
    const adminPassword = getAdminPassword();
    
    if (!adminPassword) {
      setIsConfigured(false);
      return;
    }
    
    if (password === adminPassword) {
      sessionStorage.setItem("admin_session", "true");
      setIsAdmin(true);
      setShowLogin(false);
      setLoginError(undefined);
      toast({
        title: "Welcome Admin",
        description: "You have successfully accessed the admin panel.",
      });
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    setIsAdmin(false);
    setShowLogin(true);
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel.",
    });
  };

  return { isAdmin, isLoading, showLogin, isConfigured, loginError, handleLogin, handleLogout };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading, showLogin, isConfigured, loginError, handleLogin } = useAdminCheck();
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

  // Admin not configured
  if (!isConfigured) {
    return <AdminNotConfigured />;
  }

  // Show login screen
  if (showLogin) {
    return <AdminLogin onLogin={handleLogin} error={loginError} />;
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
          <div className="container mx-auto p-6 lg:p-8 max-w-7xl space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs />
            
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
