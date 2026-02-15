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

export default api;
