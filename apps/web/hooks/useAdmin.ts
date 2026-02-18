/**
 * Admin React Query Hooks
 * Hooks for admin panel data fetching and mutations
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { adminApi, ApiError } from "@/lib/admin-api";
import type {
  DashboardStats,
  SystemHealth,
  AdminUser,
  AdminUserDetail,
  AdminOrganization,
  AdminOrganizationDetail,
  RevenueMetrics,
  ActivityItem,
  SupportTicket,
} from "@/lib/admin-api";

// ============== Statistics ==============

export function useAdminStats(options?: Omit<UseQueryOptions<DashboardStats, ApiError>, "queryKey" | "queryFn">) {
  return useQuery<DashboardStats, ApiError>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await adminApi.getStats();
      return response.stats;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useSystemHealth(options?: Omit<UseQueryOptions<SystemHealth, ApiError>, "queryKey" | "queryFn">) {
  return useQuery<SystemHealth, ApiError>({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await adminApi.getHealth();
      return response.health;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
}

// ============== Users ==============

interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function useAdminUsers(
  params: UsersParams = {},
  options?: Omit<UseQueryOptions<{ users: AdminUser[]; total: number }, ApiError>, "queryKey" | "queryFn">
) {
  const { page = 1, limit = 20, search = "", status } = params;

  return useQuery<{ users: AdminUser[]; total: number }, ApiError>({
    queryKey: ["admin", "users", page, limit, search, status],
    queryFn: async () => {
      const response = await adminApi.getUsers({ page, limit, search, status });
      return { users: response.users, total: response.total };
    },
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
}

export function useAdminUser(
  id: string | null,
  options?: Omit<UseQueryOptions<AdminUserDetail, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<AdminUserDetail, ApiError>({
    queryKey: ["admin", "users", id],
    queryFn: async () => {
      const response = await adminApi.getUser(id!);
      return response.user;
    },
    enabled: !!id,
    ...options,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" | "banned" }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate user list and specific user
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// ============== Organizations ==============

interface OrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function useAdminOrganizations(
  params: OrganizationsParams = {},
  options?: Omit<UseQueryOptions<{ organizations: AdminOrganization[]; total: number }, ApiError>, "queryKey" | "queryFn">
) {
  const { page = 1, limit = 20, search = "", status } = params;

  return useQuery<{ organizations: AdminOrganization[]; total: number }, ApiError>({
    queryKey: ["admin", "organizations", page, limit, search, status],
    queryFn: async () => {
      const response = await adminApi.getOrganizations({ page, limit, search, status });
      return { organizations: response.organizations, total: response.total };
    },
    staleTime: 10 * 1000,
    ...options,
  });
}

export function useAdminOrganization(
  id: string | null,
  options?: Omit<UseQueryOptions<AdminOrganizationDetail, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<AdminOrganizationDetail, ApiError>({
    queryKey: ["admin", "organizations", id],
    queryFn: async () => {
      const response = await adminApi.getOrganization(id!);
      return response.organization;
    },
    enabled: !!id,
    ...options,
  });
}

export function useArchiveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.archiveOrganization(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations", id] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}

// ============== Revenue ==============

export function useAdminRevenue(options?: Omit<UseQueryOptions<RevenueMetrics, ApiError>, "queryKey" | "queryFn">) {
  return useQuery<RevenueMetrics, ApiError>({
    queryKey: ["admin", "revenue"],
    queryFn: async () => {
      const response = await adminApi.getRevenue();
      return response.metrics;
    },
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

// ============== Activity ==============

export function useAdminActivity(
  limit = 20,
  options?: Omit<UseQueryOptions<ActivityItem[], ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<ActivityItem[], ApiError>({
    queryKey: ["admin", "activity", limit],
    queryFn: async () => {
      const response = await adminApi.getActivity(limit);
      return response.activities;
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
    ...options,
  });
}

// ============== Support Tickets ==============

export function useAdminSupportTickets(
  options?: Omit<UseQueryOptions<SupportTicket[], ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<SupportTicket[], ApiError>({
    queryKey: ["admin", "support-tickets"],
    queryFn: async () => {
      const response = await adminApi.getSupportTickets();
      return response.tickets;
    },
    staleTime: 60 * 1000,
    ...options,
  });
}

// ============== Combined Dashboard Hook ==============

export function useAdminDashboard() {
  const stats = useAdminStats();
  const health = useSystemHealth();
  const activities = useAdminActivity(10);

  return {
    stats,
    health,
    activities,
    isLoading: stats.isLoading || health.isLoading || activities.isLoading,
    isError: stats.isError || health.isError || activities.isError,
    error: stats.error || health.error || activities.error,
  };
}

export default {
  useAdminStats,
  useSystemHealth,
  useAdminUsers,
  useAdminUser,
  useUpdateUserStatus,
  useDeleteUser,
  useAdminOrganizations,
  useAdminOrganization,
  useArchiveOrganization,
  useDeleteOrganization,
  useAdminRevenue,
  useAdminActivity,
  useAdminSupportTickets,
  useAdminDashboard,
};
