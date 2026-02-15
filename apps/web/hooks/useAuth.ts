"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, User } from "@/lib/api";
import {
  setAuth,
  clearAuth,
  getStoredUser,
  isAuthenticated,
  getToken,
} from "@/lib/auth";

// Auth state type
type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

// Hook return type
type UseAuthReturn = AuthState & {
  login: (email: string) => Promise<void>;
  verify: (email: string, token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

// Auth hook
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const user = getStoredUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: authenticated && !!user,
      });
    };

    checkAuth();

    // Listen for storage changes (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "eios_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
      });
      // Invalidate queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ["user"] });
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

  // Logout function
  const logout = useCallback(() => {
    clearAuth();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    queryClient.clear();
    router.push("/auth/login");
  }, [queryClient, router]);

  // Refresh user function
  const refreshUser = useCallback(async () => {
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
    }
  }, [refetchUser]);

  return {
    ...state,
    login,
    verify,
    logout,
    refreshUser,
  };
}

// Hook for requiring authentication
export function useRequireAuth(redirectTo = "/auth/login") {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isLoading, isAuthenticated };
}

// Hook for redirecting authenticated users (e.g., from login page)
export function useRedirectIfAuthenticated(redirectTo = "/dashboard") {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isLoading, isAuthenticated };
}
