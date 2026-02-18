/**
 * Admin API Client
 * Type-safe API wrapper for admin operations
 */

import { api, ApiError } from "./api";

export { ApiError };

// ============== Types ==============

export interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalProjects: number;
  activeProjects: number;
  totalGuests: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  userGrowth: number;
  revenueGrowth: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

export interface SystemHealth {
  api: { status: "healthy" | "degraded" | "down"; uptime: number };
  database: { status: "healthy" | "degraded" | "down"; uptime: number };
  storage: { status: "healthy" | "degraded" | "down"; uptime: number };
  email: { status: "healthy" | "degraded" | "down"; uptime: number };
  realtime: { status: "healthy" | "degraded" | "down"; uptime: number };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  locale: string;
  status: "active" | "suspended" | "banned";
  isVerified: boolean;
  organizationCount: number;
  lastActiveAt: string;
  createdAt: string;
  role: "admin" | "user" | "super_admin";
}

export interface AdminUserDetail extends AdminUser {
  organizations: {
    id: string;
    name: string;
    type: string;
    role: string;
    joinedAt: string;
  }[];
  projects: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }[];
  projectCount: number;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  memberCount: number;
  projectCount: number;
  owner: { email: string };
  createdAt: string;
  updatedAt: string;
  plan: string;
}

export interface AdminOrganizationDetail extends AdminOrganization {
  members: {
    id: string;
    email: string;
    name: string;
    role: string;
    joinedAt: string;
  }[];
  projects: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }[];
  planDetails?: {
    code: string;
    name: string;
    startsAt: string;
    endsAt: string;
  };
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  revenueGrowth: number;
  activeSubscriptions: number;
  churnRate: number;
  arpu: string | number;
  ltv: number;
  planDistribution: {
    code: string;
    name: string;
    count: number;
  }[];
}

export interface ActivityItem {
  id: string;
  type: "user" | "org" | "billing" | "system" | "support";
  description: string;
  timestamp: string;
  actor?: { name: string; email?: string };
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  customer: {
    name: string;
    email: string;
    organization?: string;
  };
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  [key: string]: T[] | number | boolean | undefined;
}

// ============== API Client ==============

export const adminApi = {
  // Platform Statistics
  getStats: () => api.get<{ success: boolean; stats: DashboardStats }>("/admin/stats"),
  
  getHealth: () => api.get<{ success: boolean; health: SystemHealth }>("/admin/health"),

  // User Management
  getUsers: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string 
  }) => api.get<{ 
    success: boolean; 
    users: AdminUser[]; 
    total: number; 
    page: number; 
    limit: number 
  }>("/admin/users", params),

  getUser: (id: string) => api.get<{ success: boolean; user: AdminUserDetail }>(`/admin/users/${id}`),

  updateUserStatus: (id: string, status: "active" | "suspended" | "banned") =>
    api.patch<{ success: boolean; user: AdminUser; message: string }>(`/admin/users/${id}/status`, { status }),

  deleteUser: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/admin/users/${id}`),

  // Organization Management
  getOrganizations: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => api.get<{
    success: boolean;
    organizations: AdminOrganization[];
    total: number;
    page: number;
    limit: number;
  }>("/admin/organizations", params),

  getOrganization: (id: string) =>
    api.get<{ success: boolean; organization: AdminOrganizationDetail }>(`/admin/organizations/${id}`),

  archiveOrganization: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/organizations/${id}/archive`),

  deleteOrganization: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/admin/organizations/${id}`),

  // Revenue
  getRevenue: () => api.get<{ success: boolean; metrics: RevenueMetrics }>("/admin/revenue"),

  // Activity
  getActivity: (limit?: number) =>
    api.get<{ success: boolean; activities: ActivityItem[] }>("/admin/activity", { limit }),

  // Support Tickets
  getSupportTickets: () => api.get<{ success: boolean; tickets: SupportTicket[] }>("/admin/support-tickets"),
};

export default adminApi;
