"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, User } from "@/lib/api";
import {
  setAuth,
  clearAuth,
  getStoredUser,
  isAuthenticated,
  getToken,
  isTokenExpired,
  getTokenExpiry,
} from "@/lib/auth";
import { secureStorage } from "@/lib/storage";
import {
  startSessionMonitoring,
  stopSessionMonitoring,
  onSessionEvent,
  getSessionInfo,
  forceLogout,
  updateActivity,
  SessionInfo,
} from "@/lib/session";

// Auth state type
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionInfo: SessionInfo | null;
}

// Hook return type
interface UseAuthReturn extends AuthState {
  login: (email: string) => Promise<void>;
  verify: (email: string, token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  extendSession: () => Promise<boolean>;
  checkSession: () => boolean;
}

// Auth hook
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionCleanupRef = useRef<(() => void) | null>(null);
  
  // Use ref to track refresh in progress for deduplication
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionInfo: null,
  });

  // Update auth state from storage
  const updateAuthState = useCallback(() => {
    const authenticated = isAuthenticated();
    const user = getStoredUser();
    const token = getToken();
    
    // Check if token is expired
    if (token && isTokenExpired(token)) {
      console.warn("[useAuth] Token expired during state check");
      clearAuth();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionInfo: null,
      });
      return;
    }
    
    setState({
      user,
      isLoading: false,
      isAuthenticated: authenticated && !!user,
      sessionInfo: token ? getSessionInfo() : null,
    });
  }, []);

  // Check auth status on mount
  useEffect(() => {
    updateAuthState();

    // Listen for storage changes (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes("token")) {
        updateAuthState();
        
        // If token was cleared in another tab, clear queries
        if (e.newValue === null) {
          queryClient.clear();
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    
    // Setup session event handlers
    const unsubWarning = onSessionEvent("expiryWarning", (data) => {
      console.warn("[useAuth] Session expiry warning:", data);
      // Could trigger a toast notification here
    });
    
    const unsubExpired = onSessionEvent("expired", () => {
      console.warn("[useAuth] Session expired event received");
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        sessionInfo: null,
      }));
      queryClient.clear();
      router.push("/auth/login?error=session_expired");
    });

    return () => {
      window.removeEventListener("storage", handleStorage);
      unsubWarning();
      unsubExpired();
    };
  }, [updateAuthState, queryClient, router]);

  // Start session monitoring when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      // Start monitoring
      sessionCleanupRef.current = startSessionMonitoring();
      
      // Update session info periodically
      const interval = setInterval(() => {
        const token = getToken();
        if (token) {
          setState((prev) => ({
            ...prev,
            sessionInfo: getSessionInfo(),
          }));
        }
      }, 30000); // Every 30 seconds
      
      return () => {
        sessionCleanupRef.current?.();
        clearInterval(interval);
      };
    }
  }, [state.isAuthenticated]);

  // Request magic link mutation
  const loginMutation = useMutation({
    mutationFn: authApi.requestMagicLink,
  });

  // Verify OTP mutation
  const verifyMutation = useMutation({
    mutationFn: ({ email, token }: { email: string; token: string }) =>
      authApi.verifyOtp(email, token),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        sessionInfo: getSessionInfo(),
      });
      // Invalidate queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // Update activity
      updateActivity();
    },
  });

  // Get current user query (for refreshing)
  const { refetch: refetchUser } = useQuery({
    queryKey: ["user"],
    queryFn: authApi.getCurrentUser,
    enabled: !!getToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login function (request magic link)
  const login = useCallback(
    async (email: string) => {
      await loginMutation.mutateAsync(email);
    },
    [loginMutation]
  );

  // Verify function (verify OTP)
  const verify = useCallback(
    async (email: string, token: string) => {
      await verifyMutation.mutateAsync({ email, token });
    },
    [verifyMutation]
  );

  // Logout function with complete cleanup
  const logout = useCallback(() => {
    // Stop session monitoring
    sessionCleanupRef.current?.();
    stopSessionMonitoring();
    
    // Clear all auth data
    clearAuth();
    
    // Clear all secure storage auth-related items
    secureStorage.removeItem("session_data");
    
    // Clear React Query cache
    queryClient.clear();
    
    // Reset state
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      sessionInfo: null,
    });
    
    // Navigate to login
    router.push("/auth/login");
  }, [queryClient, router]);

  // Refresh user function with token validation and deduplication
  const refreshUser = useCallback(async () => {
    // Deduplicate concurrent calls
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, isAuthenticated: false, user: null }));
      return;
    }
    
    // Check if token is expired before fetching
    if (isTokenExpired(token)) {
      console.warn("[useAuth] Token expired, logging out");
      await logout();
      return;
    }
    
    const promise = (async () => {
      try {
        const { data } = await refetchUser();
        if (data) {
          setState((prev) => ({
            ...prev,
            user: data,
          }));
          // Update stored user
          const currentToken = getToken();
          if (currentToken) {
            setAuth(currentToken, data);
          }
          // Update activity
          updateActivity();
        }
      } catch (error) {
        console.error("[useAuth] Failed to refresh user:", error);
        // If 401, token might be invalid
        if (error instanceof Error && error.message.includes("401")) {
          await logout();
        }
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    
    refreshPromiseRef.current = promise;
    await promise;
  }, [refetchUser, logout]);

  // Track last successful refresh timestamp
  const lastRefreshRef = useRef<number>(0);
  
  // Extend session (token refresh)
  const extendSession = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;
    
    // Prevent concurrent refresh attempts
    if (refreshPromiseRef.current) {
      await refreshPromiseRef.current;
      return true;
    }
    
    // Check if we recently refreshed (within 60 seconds)
    const now = Date.now();
    if (now - lastRefreshRef.current < 60000) {
      return true; // Assume still valid
    }
    
    const promise = (async () => {
      try {
        // Attempt to get current user - this validates the token
        const { data } = await refetchUser();
        
        if (data) {
          // Token is still valid
          lastRefreshRef.current = now;
          
          // Update stored user data
          const currentToken = getToken();
          if (currentToken) {
            setAuth(currentToken, data);
          }
          
          // Update activity and reset warning
          updateActivity();
          
          // Update state
          setState((prev) => ({
            ...prev,
            sessionInfo: getSessionInfo(),
          }));
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error("[useAuth] Session extension failed:", error);
        return false;
      }
    })();
    
    refreshPromiseRef.current = promise;
    const result = await promise;
    refreshPromiseRef.current = null;
    return result;
  }, [refetchUser]);

  // Check if current session is valid
  const checkSession = useCallback((): boolean => {
    const token = getToken();
    if (!token) return false;
    
    if (isTokenExpired(token)) {
      logout();
      return false;
    }
    
    // Update activity on check
    updateActivity();
    return true;
  }, [logout]);

  return {
    ...state,
    login,
    verify,
    logout,
    refreshUser,
    extendSession,
    checkSession,
  };
}

// Hook for requiring authentication
export function useRequireAuth(redirectTo = "/auth/login") {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkSession } = useAuth();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    
    if (!isLoading) {
      hasCheckedRef.current = true;
      
      if (!isAuthenticated) {
        router.push(`${redirectTo}?error=auth_required`);
      } else {
        // Validate session on mount
        const isValid = checkSession();
        if (!isValid) {
          router.push(`${redirectTo}?error=session_expired`);
        }
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, router, checkSession]);

  return { isLoading, isAuthenticated };
}

// Hook for redirecting authenticated users (e.g., from login page)
export function useRedirectIfAuthenticated(redirectTo = "/dashboard") {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkSession } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Validate session before redirecting
      if (checkSession()) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, router, checkSession]);

  return { isLoading, isAuthenticated };
}

// Hook for session monitoring in components
export function useSessionMonitor() {
  useEffect(() => {
    const cleanup = startSessionMonitoring();
    return cleanup;
  }, []);
}

// Hook to get time until session expiry
export function useSessionExpiry() {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const token = getToken();
      if (!token) {
        setTimeRemaining(null);
        setIsExpiringSoon(false);
        return;
      }
      
      const expiry = getTokenExpiry(token);
      if (expiry) {
        const remaining = expiry.getTime() - Date.now();
        setTimeRemaining(remaining);
        setIsExpiringSoon(remaining < 5 * 60 * 1000); // 5 minutes
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return { timeRemaining, isExpiringSoon };
}

export default useAuth;
