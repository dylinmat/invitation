/**
 * Next.js Middleware
 * Handles authentication, authorization, and route protection
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  Permission,
  Role,
  RoleHierarchy,
  hasPermission,
  isValidRole,
} from "./lib/permissions";

// ============================================
// Route Configuration
// ============================================

interface RouteConfig {
  /** Required permission for access */
  permission?: Permission;
  /** Required minimum role for access */
  minimumRole?: Role;
  /** Alternative: any of these permissions grants access */
  anyPermission?: Permission[];
  /** Alternative: all of these permissions required for access */
  allPermissions?: Permission[];
  /** Redirect path if unauthorized */
  redirectTo?: string;
  /** Allow public access (bypass auth) */
  public?: boolean;
  /** Require authentication but no specific permission */
  requireAuth?: boolean;
}

// Route permission mappings
const routePermissions: Record<string, RouteConfig> = {
  // Dashboard - requires authentication
  "/dashboard": { requireAuth: true },
  
  // Team management - requires team read permission
  "/dashboard/team": { permission: Permission.TEAM_READ },
  "/dashboard/team/settings": {
    minimumRole: Role.ADMIN,
    redirectTo: "/dashboard/team",
  },
  
  // Project management
  "/dashboard/projects": { permission: Permission.PROJECTS_READ },
  "/dashboard/projects/new": { permission: Permission.PROJECTS_CREATE },
  
  // Project detail pages - check permission with project ID
  "/dashboard/projects/(.*)/edit": { permission: Permission.PROJECTS_UPDATE },
  "/dashboard/projects/(.*)/delete": { permission: Permission.PROJECTS_DELETE },
  "/dashboard/projects/(.*)/guests": { permission: Permission.GUESTS_READ },
  "/dashboard/projects/(.*)/invites": { permission: Permission.INVITES_READ },
  "/dashboard/projects/(.*)/sites": { permission: Permission.SITES_READ },
  "/dashboard/projects/(.*)/analytics": {
    permission: Permission.ANALYTICS_READ,
  },
  
  // Organization settings - requires admin
  "/dashboard/settings": { minimumRole: Role.ADMIN },
  "/dashboard/settings/billing": {
    permission: Permission.ORG_BILLING_MANAGE,
    redirectTo: "/dashboard/settings",
  },
  "/dashboard/settings/integrations": {
    permission: Permission.ORG_INTEGRATIONS_MANAGE,
    redirectTo: "/dashboard/settings",
  },
  "/dashboard/settings/security": {
    permission: Permission.SECURITY_SETTINGS_READ,
    redirectTo: "/dashboard/settings",
  },
  
  // Audit log - requires audit log permission
  "/dashboard/audit-log": { permission: Permission.AUDIT_LOG_READ },
  
  // API keys - requires API key management
  "/dashboard/api-keys": { permission: Permission.API_KEYS_READ },
  
  // Editor - requires site update permission
  "/dashboard/editor": { permission: Permission.SITES_UPDATE },
  
  // Templates
  "/dashboard/templates": { permission: Permission.TEMPLATES_READ },
  "/dashboard/templates/new": { permission: Permission.TEMPLATES_CREATE },
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/verify",
  "/auth/callback",
  "/invite/(.*)",
  "/public/(.*)",
  "/api/public/(.*)",
];

// Static asset routes
const staticRoutes = [
  "/_next/(.*)",
  "/static/(.*)",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a path matches a pattern
 */
function matchRoute(path: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, ".*")
    .replace(/\(\.\*\)/g, ".*");
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Find route configuration for a path
 */
function getRouteConfig(path: string): RouteConfig | null {
  // Check exact match first
  if (routePermissions[path]) {
    return routePermissions[path];
  }

  // Check pattern matches
  for (const [pattern, config] of Object.entries(routePermissions)) {
    if (matchRoute(path, pattern)) {
      return config;
    }
  }

  return null;
}

/**
 * Check if path is public
 */
function isPublicRoute(path: string): boolean {
  return publicRoutes.some((pattern) => matchRoute(path, pattern));
}

/**
 * Check if path is a static asset
 */
function isStaticRoute(path: string): boolean {
  return staticRoutes.some((pattern) => matchRoute(path, pattern));
}

/**
 * Extract token from request
 */
function getToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check cookie
  const tokenCookie = request.cookies.get("eios_token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Extract user role from token (client-side only - for UI purposes)
 * Note: Actual permission validation happens on the server
 */
function getUserRole(request: NextRequest): Role | null {
  const roleCookie = request.cookies.get("eios_role");
  if (roleCookie && isValidRole(roleCookie.value)) {
    return roleCookie.value as Role;
  }
  return null;
}

/**
 * Build login URL with redirect
 */
function getLoginUrl(request: NextRequest): string {
  const redirectUrl = encodeURIComponent(request.url);
  return `/auth/login?redirect=${redirectUrl}`;
}

// ============================================
// Middleware Function
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (isStaticRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get authentication token
  const token = getToken(request);

  // Check if route requires authentication
  const routeConfig = getRouteConfig(pathname);

  // If no specific config but in dashboard, require auth
  const requiresAuth =
    routeConfig?.requireAuth ||
    routeConfig?.permission !== undefined ||
    routeConfig?.minimumRole !== undefined ||
    pathname.startsWith("/dashboard");

  // Redirect to login if not authenticated
  if (requiresAuth && !token) {
    const loginUrl = getLoginUrl(request);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // If no specific permission requirements, allow access
  if (!routeConfig) {
    return NextResponse.next();
  }

  // Get user's role from cookie (for UI decisions only)
  // Actual permission validation happens server-side
  const userRole = getUserRole(request);

  // Check minimum role requirement (client-side hint only)
  if (routeConfig.minimumRole && userRole) {
    const userRoleIndex = RoleHierarchy.indexOf(userRole);
    const requiredRoleIndex = RoleHierarchy.indexOf(routeConfig.minimumRole);

    if (userRoleIndex < requiredRoleIndex) {
      // User's role is insufficient - redirect
      const redirectTo =
        routeConfig.redirectTo || "/dashboard?error=insufficient_permissions";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // Check permission requirements (client-side hint only)
  if (routeConfig.permission && userRole) {
    if (!hasPermission(userRole, routeConfig.permission)) {
      const redirectTo =
        routeConfig.redirectTo || "/dashboard?error=permission_denied";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // Add permission headers for server-side validation
  const requestHeaders = new Headers(request.headers);
  
  if (token) {
    requestHeaders.set("x-auth-token", token);
  }
  
  if (userRole) {
    requestHeaders.set("x-user-role", userRole);
  }

  // Add cache control headers for authenticated routes
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Prevent caching of authenticated pages
  if (requiresAuth) {
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

// ============================================
// Middleware Config
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

// ============================================
// Additional Utilities
// ============================================

/**
 * Create a protected route handler
 * Usage in API routes or server components
 */
export function withPermission(
  handler: (request: NextRequest) => Promise<NextResponse>,
  permission: Permission
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = getToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // In a real implementation, you would validate the token
    // and check permissions against the database here
    // For now, we'll just pass through

    return handler(request);
  };
}

/**
 * Check if user can access a resource
 * For use in server components
 */
export async function checkServerPermission(
  request: NextRequest,
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  const token = getToken(request);
  
  if (!token) {
    return false;
  }

  // In production, this would make an API call to verify permissions
  // const response = await fetch(`${process.env.API_URL}/permissions/check`, {
  //   headers: { Authorization: `Bearer ${token}` },
  //   body: JSON.stringify({ permission, resourceId }),
  // });
  // return response.ok;

  // For now, return true to allow development
  return true;
}

// ============================================
// Default Export
// ============================================

export default middleware;
