"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRsvpTrends,
  getEventTypes,
  getRevenue,
  getAnalyticsOverview,
  getTopClients,
  getAnalyticsData,
  exportAnalytics,
  type RsvpTrendData,
  type EventTypeData,
  type RevenueData,
  type AnalyticsOverview,
  type TopClient,
  type AnalyticsData,
  type AnalyticsDateRange,
} from "@/lib/api/analytics";
import { ApiError } from "@/lib/api";

// ====================
// Query Keys
// ====================

const analyticsKeys = {
  all: ["analytics"] as const,
  overview: () => [...analyticsKeys.all, "overview"] as const,
  rsvpTrends: (from?: string, to?: string) =>
    [...analyticsKeys.all, "rsvp-trends", { from, to }] as const,
  eventTypes: () => [...analyticsKeys.all, "event-types"] as const,
  revenue: (from?: string, to?: string) =>
    [...analyticsKeys.all, "revenue", { from, to }] as const,
  topClients: (limit?: number) =>
    [...analyticsKeys.all, "top-clients", { limit }] as const,
  dashboard: (params?: AnalyticsDateRange) =>
    [...analyticsKeys.all, "dashboard", params] as const,
};

// ====================
// Hooks
// ====================

/**
 * Hook for fetching RSVP trends with optional date range
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Query result with RSVP trend data
 */
export function useRsvpTrends(from?: string, to?: string) {
  return useQuery<RsvpTrendData[], ApiError>({
    queryKey: analyticsKeys.rsvpTrends(from, to),
    queryFn: () => getRsvpTrends(from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching event type distribution
 * @returns Query result with event type data
 */
export function useEventTypes() {
  return useQuery<EventTypeData[], ApiError>({
    queryKey: analyticsKeys.eventTypes(),
    queryFn: getEventTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching revenue data with optional date range
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Query result with revenue data
 */
export function useRevenue(from?: string, to?: string) {
  return useQuery<RevenueData[], ApiError>({
    queryKey: analyticsKeys.revenue(from, to),
    queryFn: () => getRevenue(from, to),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching analytics overview stats
 * @returns Query result with overview statistics
 */
export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview, ApiError>({
    queryKey: analyticsKeys.overview(),
    queryFn: getAnalyticsOverview,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching top clients by revenue
 * @param limit - Number of clients to return
 * @returns Query result with top clients
 */
export function useTopClients(limit = 5) {
  return useQuery<TopClient[], ApiError>({
    queryKey: analyticsKeys.topClients(limit),
    queryFn: () => getTopClients(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching complete analytics data in one request
 * @param params - Date range parameters
 * @returns Query result with complete analytics data
 */
export function useAnalyticsData(params?: AnalyticsDateRange) {
  return useQuery<AnalyticsData, ApiError>({
    queryKey: analyticsKeys.dashboard(params),
    queryFn: () => getAnalyticsData(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for exporting analytics data
 * @returns Mutation for exporting analytics
 */
export function useExportAnalytics() {
  const queryClient = useQueryClient();

  return useMutation<
    { downloadUrl: string; filename: string },
    ApiError,
    { format?: "csv" | "xlsx"; from?: string; to?: string }
  >({
    mutationFn: ({ format = "csv", from, to }) =>
      exportAnalytics(format, from, to),
    onSuccess: () => {
      // Could invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

/**
 * Hook for refreshing all analytics data
 * @returns Function to invalidate and refetch all analytics queries
 */
export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
  };
}

// ====================
// Types Re-export
// ====================

export type {
  RsvpTrendData,
  EventTypeData,
  RevenueData,
  AnalyticsOverview,
  TopClient,
  AnalyticsData,
  AnalyticsDateRange,
};
