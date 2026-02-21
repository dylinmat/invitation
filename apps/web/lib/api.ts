/**
 * EIOS API Client
 * Type-safe API wrapper with error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Request options type
type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

// Methods that require CSRF protection
const CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Get CSRF token from meta tag
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || null;
}

// Build query string from params
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// Get auth token from storage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eios_token");
}

// Main API request function
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    params,
    cache,
    next,
  } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    url += buildQueryString(params);
  }

  // Default headers
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for state-changing requests
  if (CSRF_METHODS.includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      defaultHeaders["X-CSRF-Token"] = csrfToken;
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    cache,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  // For Next.js 14+ server components
  if (next) {
    (fetchOptions as { next?: NextFetchRequestConfig }).next = next;
  }

  const response = await fetch(url, fetchOptions);

  // Parse response
  let data: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Handle errors
  if (!response.ok) {
    const errorData = data as { statusCode?: number; error?: string; code?: string; message?: string; details?: Record<string, unknown> };
    throw new ApiError(
      errorData.statusCode || response.status,
      errorData.code || errorData.error || "UNKNOWN_ERROR",
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      errorData.details
    );
  }

  return data as T;
}

// API client object
export const api = {
  // GET request
  get: <T>(path: string, params?: RequestOptions["params"], options?: Omit<RequestOptions, "method" | "body" | "params">) =>
    request<T>(path, { method: "GET", params, ...options }),

  // POST request
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { method: "POST", body, ...options }),

  // PUT request
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { method: "PUT", body, ...options }),

  // PATCH request
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { method: "PATCH", body, ...options }),

  // DELETE request
  delete: <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { method: "DELETE", ...options }),
};

// ====================
// Auth API
// ====================

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export const authApi = {
  // Request magic link
  requestMagicLink: (email: string) =>
    api.post<{ message: string }>("/auth/magic-link", { email }),

  // Verify OTP token
  verifyOtp: (email: string, token: string) =>
    api.post<AuthResponse>("/auth/otp/verify", { email, token }),

  // Get current user
  getCurrentUser: () => api.get<User>("/auth/me"),

  // Logout
  logout: () => api.post<void>("/auth/logout"),

  // Update profile
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.patch<User>("/auth/profile", data),
};

// ====================
// Projects API
// ====================

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "archived";
  eventDate: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  ownerOrgId?: string;
  settings: ProjectSettings;
  stats?: {
    totalGuests: number;
    totalInvites: number;
    rsvpYes: number;
    rsvpNo: number;
    rsvpPending: number;
  };
};

export type ProjectSettings = {
  timezone: string;
  dateFormat: string;
  language: string;
  branding: {
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
};

export const projectsApi = {
  // List projects
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ projects: Project[]; total: number; page: number; limit: number }>("/projects", params),

  // Get project by ID
  get: (id: string) => api.get<Project>(`/projects/${id}`),

  // Create project
  create: (data: {
    name: string;
    description?: string;
    eventDate?: string;
    timezone?: string;
  }) => api.post<Project>("/projects", data),

  // Update project
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data),

  // Delete project
  delete: (id: string) => api.delete<void>(`/projects/${id}`),

  // Duplicate project
  duplicate: (id: string) => api.post<Project>(`/projects/${id}/duplicate`),

  // Bulk delete projects
  bulkDelete: (ids: string[]) =>
    api.post<void>("/projects/bulk-delete", { ids }),

  // Bulk archive projects
  bulkArchive: (ids: string[]) =>
    api.post<void>("/projects/bulk-archive", { ids }),

  // Get dashboard stats
  getDashboardStats: () =>
    api.get<{
      totalProjects: number;
      totalGuests: number;
      totalInvitesSent: number;
      averageRSVPRate: number;
      upcomingEventsCount: number;
    }>("/projects/dashboard-stats"),
};

// ====================
// Guests API
// ====================

export type Guest = {
  id: string;
  projectId: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export const guestsApi = {
  // List guests
  list: (projectId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ guests: Guest[]; total: number }>(`/projects/${projectId}/guests`, params),

  // Get guest
  get: (projectId: string, id: string) =>
    api.get<{ guest: Guest }>(`/projects/${projectId}/guests/${id}`),

  // Create guest
  create: (projectId: string, data: Partial<Guest>) =>
    api.post<{ id: string; message: string }>(`/projects/${projectId}/guests`, data),

  // Create bulk guests
  createBulk: (projectId: string, guests: Partial<Guest>[]) =>
    api.post<{ created: number; failed: number; guestIds: string[] }>(`/projects/${projectId}/guests/bulk`, { guests }),

  // Update guest
  update: (projectId: string, id: string, data: Partial<Guest>) =>
    api.patch<{ success: boolean; message: string }>(`/projects/${projectId}/guests/${id}`, data),

  // Delete guest
  delete: (projectId: string, id: string) =>
    api.delete<{ success: boolean; message: string }>(`/projects/${projectId}/guests/${id}`),

  // Import guests from CSV
  importCsv: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ importedCount: number; guestIds: string[] }>(`/projects/${projectId}/guests/import`, {
      method: "POST",
      body: formData as unknown as Record<string, unknown>,
      headers: {}, // Let browser set content-type for FormData
    });
  },
};

// ====================
// Invites API
// ====================

export type Invite = {
  id: string;
  projectId: string;
  guestId: string | null;
  token: string;
  status: "pending" | "sent" | "opened" | "responded" | "bounced";
  sentAt: string | null;
  openedAt: string | null;
  respondedAt: string | null;
  guest?: Guest;
  rsvp?: RSVP;
};

export type RSVP = {
  id: string;
  inviteId: string;
  status: "yes" | "no" | "maybe";
  attendees: number;
  message: string | null;
  dietaryRestrictions: string | null;
  createdAt: string;
  updatedAt: string;
};

export const invitesApi = {
  // List invites
  list: (projectId: string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ invites: Invite[]; total: number }>(`/projects/${projectId}/invites`, params),

  // Create invite
  create: (projectId: string, data: { guestId: string; siteId?: string }) =>
    api.post<{ id: string; token: string; message: string }>(`/projects/${projectId}/invites`, data),

  // Create bulk invites
  createBulk: (projectId: string, guestIds: string[]) =>
    api.post<{ created: number }>(`/projects/${projectId}/invites/bulk`, { guestIds }),

  // Send invite
  send: (projectId: string, id: string) =>
    api.post<{ success: boolean; invite: Invite; message: string }>(`/projects/${projectId}/invites/${id}/send`),

  // Send bulk invites
  sendBulk: (projectId: string, inviteIds: string[]) =>
    api.post<{ sent: number; failed: number; message: string }>(`/projects/${projectId}/invites/send-bulk`, { inviteIds }),

  // Get invite by token (public)
  getByToken: (token: string) => api.get<{ invite: Invite & { site: Site } }>(`/invites/${token}`),

  // Submit RSVP (public)
  submitRsvp: (token: string, data: {
    status: "yes" | "no" | "maybe";
    attendees?: number;
    message?: string;
    dietaryRestrictions?: string;
  }) => api.post<{ submissionId: string; answerCount: number }>(`/invites/${token}/rsvp`, data),
};

// ====================
// Sites API
// ====================

export type Site = {
  id: string;
  projectId: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  template: string | null;
  sceneGraph: SceneGraph;
  createdAt: string;
  updatedAt: string;
};

export type SceneGraph = {
  version: string;
  nodes: SceneNode[];
  assets: SceneAsset[];
};

export type SceneNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  parent?: string;
  transform: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
};

export type SceneAsset = {
  id: string;
  type: "image" | "font" | "video";
  url: string;
  metadata: Record<string, unknown>;
};

export const sitesApi = {
  // List sites
  list: (projectId: string) =>
    api.get<{ sites: Site[] }>(`/projects/${projectId}/sites`),

  // Get site
  get: (projectId: string, id: string) =>
    api.get<{ site: Site }>(`/projects/${projectId}/sites/${id}`),

  // Get site by subdomain (public)
  getBySubdomain: (subdomain: string) =>
    api.get<{ site: Site }>(`/sites/${subdomain}`),

  // Create site
  create: (projectId: string, data: {
    name: string;
    subdomain: string;
    template?: string;
  }) => api.post<{ site: Site }>(`/projects/${projectId}/sites`, data),

  // Update site
  update: (projectId: string, id: string, data: Partial<Site>) =>
    api.patch<{ site: Site }>(`/projects/${projectId}/sites/${id}`, data),

  // Update scene graph
  updateSceneGraph: (projectId: string, id: string, sceneGraph: SceneGraph) =>
    api.patch<{ site: Site }>(`/projects/${projectId}/sites/${id}/scene-graph`, { sceneGraph }),

  // Publish site
  publish: (projectId: string, id: string) =>
    api.post<{ site: Site }>(`/projects/${projectId}/sites/${id}/publish`, { versionId: id }),

  // Unpublish site
  unpublish: (projectId: string, id: string) =>
    api.post<{ site: Site }>(`/projects/${projectId}/sites/${id}/unpublish`),

  // Delete site
  delete: (projectId: string, id: string) =>
    api.delete<void>(`/projects/${projectId}/sites/${id}`),
};

// ====================
// Analytics API
// ====================

export type AnalyticsSummary = {
  totalViews: number;
  uniqueVisitors: number;
  totalRsvps: number;
  rsvpRate: number;
  avgTimeOnSite: number;
};

export type AnalyticsTimeSeries = {
  date: string;
  views: number;
  rsvps: number;
}[];

export const analyticsApi = {
  // Get summary
  getSummary: (projectId: string) =>
    api.get<AnalyticsSummary>(`/projects/${projectId}/analytics/summary`),

  // Get time series
  getTimeSeries: (projectId: string, params?: { from?: string; to?: string }) =>
    api.get<AnalyticsTimeSeries>(`/projects/${projectId}/analytics/timeseries`, params),

  // Get site analytics
  getSiteAnalytics: (projectId: string, siteId: string) =>
    api.get<AnalyticsSummary & { topReferrers: Record<string, number> }>(
      `/projects/${projectId}/sites/${siteId}/analytics`
    ),
};

// ====================
// Admin API
// ====================

export type AdminStats = {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersToday: number;
  revenueGrowth: number;
  userGrowth: number;
};

export type SystemHealthStatus = "healthy" | "degraded" | "down";

export type SystemHealth = {
  api: { status: SystemHealthStatus; uptime: number };
  database: { status: SystemHealthStatus; uptime: number };
  storage: { status: SystemHealthStatus; uptime: number };
  email: { status: SystemHealthStatus; uptime: number };
  realtime: { status: SystemHealthStatus; uptime: number };
};

export type AdminActivityItem = {
  id: string;
  type: "user" | "org" | "billing" | "system" | "support";
  description: string;
  timestamp: string;
  actor?: { name: string; email?: string };
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "user" | "super_admin";
  status: "active" | "suspended" | "banned" | "unverified";
  isVerified: boolean;
  organizationCount: number;
  lastActiveAt: string;
  createdAt: string;
  loginCount: number;
};

export type UserActivity = {
  id: string;
  action: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
};

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "archived";
  memberCount: number;
  projectCount: number;
  owner: {
    name: string;
    email: string;
  };
  createdAt: string;
  lastActiveAt: string;
  monthlyRevenue: number;
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type UserLookup = {
  id: string;
  name: string;
  email: string;
  organization: string;
  status: string;
};

export type SystemAnnouncement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "maintenance";
  publishedAt: string;
  expiresAt?: string;
};

export const adminApi = {
  // Dashboard
  getStats: () => api.get<AdminStats>("/admin/stats"),
  getHealth: () => api.get<SystemHealth>("/admin/health"),
  getRecentActivity: (limit?: number) =>
    api.get<AdminActivityItem[]>("/admin/activities", { limit }),

  // Users
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) => api.get<{ users: AdminUser[]; total: number }>("/admin/users", params),

  updateUserStatus: (id: string, status: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/status`, { status }),

  deleteUser: (id: string) => api.delete<void>(`/admin/users/${id}`),

  getUserActivity: (id: string) =>
    api.get<UserActivity[]>(`/admin/users/${id}/activity`),

  impersonateUser: (id: string) =>
    api.post<{ token: string; user: AdminUser }>(`/admin/users/${id}/impersonate`),

  bulkUpdateUserStatus: (ids: string[], status: string) =>
    api.post<void>("/admin/users/bulk-status", { ids, status }),

  bulkDeleteUsers: (ids: string[]) =>
    api.post<void>("/admin/users/bulk-delete", { ids }),

  // Organizations
  getOrganizations: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: string;
  }) =>
    api.get<{ organizations: AdminOrganization[]; total: number }>(
      "/admin/organizations",
      params
    ),

  updateOrganizationStatus: (id: string, status: string) =>
    api.patch<AdminOrganization>(`/admin/organizations/${id}/status`, {
      status,
    }),

  archiveOrganization: (id: string) =>
    api.post<void>(`/admin/organizations/${id}/archive`),

  transferOrganizationOwnership: (id: string, newOwnerId: string) =>
    api.post<void>(`/admin/organizations/${id}/transfer`, {
      newOwnerId,
    }),

  bulkArchiveOrganizations: (ids: string[]) =>
    api.post<void>("/admin/organizations/bulk-archive", { ids }),

  bulkDeleteOrganizations: (ids: string[]) =>
    api.post<void>("/admin/organizations/bulk-delete", { ids }),

  // Support
  getTickets: (params?: { status?: string; priority?: string }) =>
    api.get<{ tickets: SupportTicket[]; total: number }>(
      "/admin/support/tickets",
      params
    ),

  updateTicketStatus: (id: string, status: string) =>
    api.patch<SupportTicket>(`/admin/support/tickets/${id}/status`, {
      status,
    }),

  searchUsers: (query: string) =>
    api.get<UserLookup[]>("/admin/users/search", { query }),

  // Announcements
  getAnnouncements: () =>
    api.get<SystemAnnouncement[]>("/admin/announcements"),

  createAnnouncement: (data: {
    title: string;
    message: string;
    type: "info" | "warning" | "maintenance";
    expiresAt?: string;
  }) => api.post<SystemAnnouncement>("/admin/announcements", data),

  deleteAnnouncement: (id: string) =>
    api.delete<void>(`/admin/announcements/${id}`),
};

// ====================
// User Organizations API
// ====================

export type UserOrganization = {
  id: string;
  name: string;
  role: "Owner" | "Admin" | "Member";
  slug: string;
};

export const userApi = {
  getUserOrganizations: () =>
    api.get<UserOrganization[]>("/auth/me/organizations"),
  
  // Complete onboarding
  completeOnboarding: (data: OnboardingData) =>
    api.post<{ success: boolean; organization: Organization }>("/users/onboarding", data),

  // Update selected plan
  updatePlan: (plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE") =>
    api.put<{ success: boolean; plan: string }>("/users/plan", { plan }),

  // Get organization
  getOrganization: () =>
    api.get<{ success: boolean; organization: Organization }>("/users/me/organization"),

  // Get current user with org
  getMe: () =>
    api.get<{ success: boolean; user: User & { organizationId?: string; orgType?: string; onboardingCompleted?: boolean } }>("/users/me"),
};

// ====================
// Activity Feed API
// ====================

export type ActivityFeedItem = {
  id: string;
  type: "project_created" | "guest_added" | "invite_sent" | "rsvp_received" | "site_published";
  actor: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  target: {
    type: string;
    name: string;
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export const activityApi = {
  getActivities: (params?: { limit?: number; offset?: number; types?: string[] }) =>
    api.get<{ activities: ActivityFeedItem[]; hasMore: boolean }>("/activities", params),
};

// ====================
// Team/Organization Members API
// ====================

export type TeamMember = {
  id: string;
  userId: string;
  orgId: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  lastActiveAt: string | null;
  invitedBy: string | null;
  status: "active" | "pending" | "suspended";
};

export type TeamRole = TeamMember["role"];

export const teamApi = {
  // List organization members
  listMembers: (orgId: string) =>
    api.get<{ members: TeamMember[] }>(`/organizations/${orgId}/members`),

  // Invite member
  inviteMember: (orgId: string, data: { email: string; role: TeamRole }) =>
    api.post<{ member: TeamMember; inviteToken: string }>(`/organizations/${orgId}/members`, data),

  // Update member role
  updateMemberRole: (orgId: string, memberId: string, role: TeamRole) =>
    api.patch<TeamMember>(`/organizations/${orgId}/members/${memberId}/role`, { role }),

  // Remove member
  removeMember: (orgId: string, memberId: string) =>
    api.delete<void>(`/organizations/${orgId}/members/${memberId}`),

  // Accept invitation
  acceptInvite: (token: string) =>
    api.post<TeamMember>(`/organizations/invites/${token}/accept`),

  // Decline invitation
  declineInvite: (token: string) =>
    api.post<void>(`/organizations/invites/${token}/decline`),
};

// Types for User & Onboarding (merged into userApi above)
export type Organization = {
  id: string;
  type: "COUPLE" | "PLANNER" | "VENUE";
  name: string;
  coupleNames?: { partner1: string; partner2: string };
  eventDate?: string;
  website?: string;
  businessType?: string;
};

export type OnboardingData = {
  type: "COUPLE" | "PLANNER" | "VENUE";
  coupleNames?: { partner1: string; partner2: string };
  eventDate?: string;
  businessName?: string;
  website?: string;
  businessType?: "PLANNER" | "VENUE" | "VENDOR";
};

// ====================
// Dashboard API
// ====================

export type CoupleDashboardData = {
  event: {
    id: string;
    name: string;
    date: string;
    daysLeft: number;
    venue: string;
    guestCount: number;
  };
  stats: {
    guests: number;
    rsvpRate: number;
    daysLeft: number;
    gifts: number;
  };
  checklist: Array<{
    id: string;
    text: string;
    completed: boolean;
    category: string;
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    time: string;
  }>;
};

export type BusinessDashboardData = {
  clients: Array<{
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
    guests: number;
    revenue: number;
  }>;
  events: Array<{
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
    guests: number;
    revenue: number;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
  }>;
  invoices: Array<{
    id: string;
    client: string;
    amount: number;
    status: string;
    date: string;
  }>;
  analytics: {
    totalRevenue: number;
    activeEvents: number;
    totalGuests: number;
    conversionRate: number;
  };
};

export const dashboardApi = {
  // Get couple dashboard
  getCoupleDashboard: () =>
    api.get<{ success: boolean; data: CoupleDashboardData }>("/dashboard/couple"),

  // Get business dashboard
  getBusinessDashboard: () =>
    api.get<{ success: boolean; data: BusinessDashboardData }>("/dashboard/business"),

  // Send RSVP reminders
  sendReminders: (eventId: string, data?: { type?: string; message?: string }) =>
    api.post<{ success: boolean; sent: number }>(`/events/${eventId}/reminders`, data),
};

// ====================
// Checklist API
// ====================

export const checklistApi = {
  // Get all items
  getItems: () =>
    api.get<{ success: boolean; items: Array<{ id: string; text: string; completed: boolean; category: string }> }>("/checklist"),

  // Create item
  createItem: (text: string, category?: string) =>
    api.post<{ success: boolean; item: { id: string; text: string; completed: boolean } }>("/checklist", { text, category }),

  // Update item (toggle completion)
  updateItem: (id: string, data: { completed?: boolean; text?: string }) =>
    api.put<{ success: boolean; item: { id: string; text: string; completed: boolean } }>(`/checklist/${id}`, data),

  // Delete item
  deleteItem: (id: string) =>
    api.delete<{ success: boolean }>(`/checklist/${id}`),
};

// ====================
// Extended Auth API
// ====================

export const authApiExtended = {
  // Resend magic link
  resendMagicLink: (email: string) =>
    api.post<{ success: boolean; message: string }>("/auth/resend-magic-link", { email }),

  // Resend verification email
  resendVerification: (email: string) =>
    api.post<{ success: boolean; message: string }>("/auth/resend-verification", { email }),
};

// ====================
// Events API (Business Events)
// ====================

export type BusinessEvent = {
  id: string;
  orgId: string;
  name: string;
  type: string;
  date: string;
  location?: string;
  description?: string;
  status: "draft" | "confirmed" | "completed" | "cancelled";
  guestCount: number;
  revenue: number;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
};

export const eventsApi = {
  // List events
  list: (params?: { page?: number; limit?: number; status?: string; clientId?: string }) =>
    api.get<{ events: BusinessEvent[]; total: number }>("/events", params),

  // Get event by ID
  get: (id: string) => api.get<BusinessEvent>(`/events/${id}`),

  // Create event
  create: (data: {
    name: string;
    type: string;
    date: string;
    location?: string;
    description?: string;
    clientId?: string;
  }) => api.post<BusinessEvent>("/events", data),

  // Update event
  update: (id: string, data: Partial<BusinessEvent>) =>
    api.patch<BusinessEvent>(`/events/${id}`, data),

  // Delete event
  delete: (id: string) => api.delete<void>(`/events/${id}`),
};

// ====================
// Clients API
// ====================

export type Client = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone?: string;
  type: "couple" | "corporate" | "individual";
  status: "active" | "inactive" | "archived";
  notes?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
};

export const clientsApi = {
  // List clients
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<{ clients: Client[]; total: number }>("/clients", params),

  // Get client by ID
  get: (id: string) => api.get<Client>(`/clients/${id}`),

  // Create client
  create: (data: {
    name: string;
    email: string;
    phone?: string;
    type: "couple" | "corporate" | "individual";
    notes?: string;
    address?: string;
  }) => api.post<Client>("/clients", data),

  // Update client
  update: (id: string, data: Partial<Client>) =>
    api.patch<Client>(`/clients/${id}`, data),

  // Delete client
  delete: (id: string) => api.delete<void>(`/clients/${id}`),
};

// ====================
// Invoices API
// ====================

export type Invoice = {
  id: string;
  orgId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export const invoicesApi = {
  // List invoices
  list: (params?: { page?: number; limit?: number; status?: string; clientId?: string }) =>
    api.get<{ invoices: Invoice[]; total: number }>("/invoices", params),

  // Get invoice by ID
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),

  // Create invoice
  create: (data: {
    clientId: string;
    amount: number;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    notes?: string;
  }) => api.post<Invoice>("/invoices", data),

  // Update invoice
  update: (id: string, data: Partial<Invoice>) =>
    api.patch<Invoice>(`/invoices/${id}`, data),

  // Delete invoice
  delete: (id: string) => api.delete<void>(`/invoices/${id}`),

  // Send invoice
  send: (id: string) =>
    api.post<{ success: boolean; sentAt: string }>(`/invoices/${id}/send`),

  // Mark as paid
  markPaid: (id: string) =>
    api.post<{ success: boolean; paidAt: string }>(`/invoices/${id}/mark-paid`),

  // Cancel invoice
  cancel: (id: string) =>
    api.post<{ success: boolean }>(`/invoices/${id}/cancel`),
};

// ====================
// Team Invites API (Extended)
// ====================

export type PendingInvite = {
  id: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
};

export const teamInvitesApi = {
  // Get pending invites
  getPendingInvites: (orgId: string) =>
    api.get<{ invites: PendingInvite[] }>(`/organizations/${orgId}/invites/pending`),

  // Resend invite
  resendInvite: (orgId: string, inviteId: string) =>
    api.post<{ success: boolean }>(`/organizations/${orgId}/invites/${inviteId}/resend`),

  // Cancel invite
  cancelInvite: (orgId: string, inviteId: string) =>
    api.post<{ success: boolean }>(`/organizations/${orgId}/invites/${inviteId}/cancel`),
};

// ====================
// Import API
// ====================

export type ImportResult = {
  success: boolean;
  imported: number;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  duplicates?: number;
  errors: string[];
  warnings: string[];
  duplicateDetails?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }>;
  failedRows?: Array<{
    row: Record<string, string>;
    rowNumber: number;
    errors: string[];
  }>;
};

export type ImportPreviewResult = {
  success: boolean;
  preview?: Record<string, string>[];
  totalRows?: number;
  headers?: string[];
  validation?: {
    headers: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    rows: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
};

export const importApi = {
  // Import CSV file
  importCSV: (file: File, type: "guests" | "clients", contextId: string, options?: {
    skipDuplicates?: boolean;
    skipValidation?: boolean;
  }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    if (type === "guests") {
      formData.append("projectId", contextId);
    } else {
      formData.append("organizationId", contextId);
    }
    
    if (options?.skipDuplicates) {
      formData.append("skipDuplicates", "true");
    }
    if (options?.skipValidation) {
      formData.append("skipValidation", "true");
    }

    return request<ImportResult>("/import/csv", {
      method: "POST",
      body: formData as unknown as Record<string, unknown>,
      headers: {}, // Let browser set content-type for FormData
    });
  },

  // Preview CSV without importing
  previewCSV: (file: File, type: "guests" | "clients") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    return request<ImportPreviewResult>("/import/preview", {
      method: "POST",
      body: formData as unknown as Record<string, unknown>,
      headers: {},
    });
  },

  // Download CSV template
  downloadTemplate: async (type: "guests" | "clients") => {
    const response = await fetch(
      `${API_BASE_URL}/import/template/${type}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to download template");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "guests" ? "guests_template.csv" : "clients_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Get template content
  getTemplateContent: (type: "guests" | "clients") =>
    api.get<{
      success: boolean;
      headers?: string[];
      exampleRows?: Record<string, string>[];
    }>(`/import/template-content/${type}`),
};

export default api;
