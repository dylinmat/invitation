/**
 * Analytics API Client
 * Analytics and reporting API operations
 */

import { api } from "../api";

// ====================
// Types
// ====================

/**
 * RSVP trend data point for charts
 */
export interface RsvpTrendData {
  month: string;
  attending: number;
  maybe: number;
  declined: number;
}

/**
 * Event type distribution data
 */
export interface EventTypeData {
  type: string;
  count: number;
  percentage: number;
}

/**
 * Revenue data point for charts
 */
export interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

/**
 * Analytics overview stats
 */
export interface AnalyticsOverview {
  totalEvents: number;
  totalGuests: number;
  totalRevenue: number;
  pendingInvitations: number;
  conversionRate: number;
  averageEventBudget: number;
}

/**
 * Top client data
 */
export interface TopClient {
  id: string;
  name: string;
  type: string;
  revenue: number;
  guests: number;
}

/**
 * Complete analytics data response
 */
export interface AnalyticsData {
  overview: AnalyticsOverview;
  rsvpTrends: RsvpTrendData[];
  eventTypes: EventTypeData[];
  revenue: RevenueData[];
  topClients: TopClient[];
}

/**
 * Date range parameters for analytics queries
 */
export interface AnalyticsDateRange {
  from?: string;
  to?: string;
}

// ====================
// Analytics API
// ====================

/**
 * Get RSVP trends over time
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Promise with RSVP trend data array
 */
export async function getRsvpTrends(
  from?: string,
  to?: string
): Promise<RsvpTrendData[]> {
  return api.get<RsvpTrendData[]>("/analytics/rsvp-trends", { from, to });
}

/**
 * Get event type distribution
 * @returns Promise with event type data array
 */
export async function getEventTypes(): Promise<EventTypeData[]> {
  return api.get<EventTypeData[]>("/analytics/event-types");
}

/**
 * Get revenue data over time
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Promise with revenue data array
 */
export async function getRevenue(
  from?: string,
  to?: string
): Promise<RevenueData[]> {
  return api.get<RevenueData[]>("/analytics/revenue", { from, to });
}

/**
 * Get analytics overview stats
 * @returns Promise with overview statistics
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return api.get<AnalyticsOverview>("/analytics/overview");
}

/**
 * Get top clients by revenue
 * @param limit - Number of clients to return (default: 5)
 * @returns Promise with top clients array
 */
export async function getTopClients(limit = 5): Promise<TopClient[]> {
  return api.get<TopClient[]>("/analytics/top-clients", { limit });
}

/**
 * Get complete analytics data in one request
 * @param params - Date range parameters
 * @returns Promise with complete analytics data
 */
export async function getAnalyticsData(
  params?: AnalyticsDateRange
): Promise<AnalyticsData> {
  return api.get<AnalyticsData>("/analytics/dashboard", params);
}

/**
 * Export analytics data as CSV
 * @param format - Export format (csv, xlsx)
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Promise with download URL or blob
 */
export async function exportAnalytics(
  format: "csv" | "xlsx" = "csv",
  from?: string,
  to?: string
): Promise<{ downloadUrl: string; filename: string }> {
  return api.get<{ downloadUrl: string; filename: string }>("/analytics/export", {
    format,
    from,
    to,
  });
}

// ====================
// Analytics API Object
// ====================

/**
 * Analytics API object - alternative way to access analytics operations
 */
export const analyticsApi = {
  getRsvpTrends,
  getEventTypes,
  getRevenue,
  getAnalyticsOverview,
  getTopClients,
  getAnalyticsData,
  exportAnalytics,
};

export default analyticsApi;
