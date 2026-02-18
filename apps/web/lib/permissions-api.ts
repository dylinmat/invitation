/**
 * Permissions API Client
 * Backend integration for RBAC permission checks
 */

import { api, ApiError } from "./api";
import {
  Permission,
  Role,
  TeamMember,
  TeamInvite,
  Organization,
  PermissionCheckResult,
} from "./permissions";

// ============================================
// Types
// ============================================

export interface CheckPermissionRequest {
  permission: Permission;
  resource?: {
    type: string;
    id: string;
  };
}

export interface CheckPermissionResponse {
  allowed: boolean;
  reason?: string;
  metadata?: {
    checkedAt: string;
    cached: boolean;
  };
}

export interface BatchCheckPermissionRequest {
  permissions: Permission[];
  resource?: {
    type: string;
    id: string;
  };
}

export interface BatchCheckPermissionResponse {
  results: Record<Permission, boolean>;
  metadata?: {
    checkedAt: string;
    cached: boolean;
  };
}

export interface UpdateRoleRequest {
  userId: string;
  role: Role;
}

export interface InviteMemberRequest {
  emails: string[];
  role: Role;
  message?: string;
}

export interface InviteMemberResponse {
  sent: number;
  failed: number;
  invites: Array<{
    email: string;
    status: "sent" | "failed";
    error?: string;
  }>;
}

export interface RevokeInviteRequest {
  inviteId: string;
}

export interface RemoveMemberRequest {
  userId: string;
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
}

export interface PermissionAuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export interface PermissionAuditLogResponse {
  entries: PermissionAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// Permissions API
// ============================================

export const permissionsApi = {
  /**
   * Check a single permission on the server
   */
  checkPermission: async (
    permission: Permission,
    resource?: { type: string; id: string }
  ): Promise<CheckPermissionResponse> => {
    return api.post<CheckPermissionResponse>("/permissions/check", {
      permission,
      resource,
    });
  },

  /**
   * Check multiple permissions in a batch
   */
  checkPermissionsBatch: async (
    permissions: Permission[],
    resource?: { type: string; id: string }
  ): Promise<BatchCheckPermissionResponse> => {
    return api.post<BatchCheckPermissionResponse>("/permissions/check-batch", {
      permissions,
      resource,
    });
  },

  /**
   * Get current user's permissions for an organization
   */
  getMyPermissions: async (orgId?: string): Promise<{
    role: Role;
    permissions: Permission[];
    organization: Organization;
  }> => {
    return api.get("/permissions/me", orgId ? { orgId } : undefined);
  },

  /**
   * Get all permissions for a specific user
   * Requires admin access
   */
  getUserPermissions: async (userId: string): Promise<{
    userId: string;
    role: Role;
    permissions: Permission[];
  }> => {
    return api.get(`/permissions/users/${userId}`);
  },
};

// ============================================
// Team Management API
// ============================================

export const teamApi = {
  /**
   * Get all team members
   */
  getMembers: async (orgId?: string): Promise<{ members: TeamMember[] }> => {
    return api.get("/team/members", orgId ? { orgId } : undefined);
  },

  /**
   * Get pending invites
   */
  getPendingInvites: async (orgId?: string): Promise<{ invites: TeamInvite[] }> => {
    return api.get("/team/invites", orgId ? { orgId } : undefined);
  },

  /**
   * Invite new team members
   */
  inviteMembers: async (
    data: InviteMemberRequest,
    orgId?: string
  ): Promise<InviteMemberResponse> => {
    return api.post("/team/invites", {
      ...data,
      orgId,
    });
  },

  /**
   * Resend an invitation
   */
  resendInvite: async (
    inviteId: string,
    orgId?: string
  ): Promise<{ success: boolean }> => {
    return api.post(`/team/invites/${inviteId}/resend`, { orgId });
  },

  /**
   * Revoke/cancel an invitation
   */
  revokeInvite: async (
    inviteId: string,
    orgId?: string
  ): Promise<{ success: boolean }> => {
    return api.delete(`/team/invites/${inviteId}`, { orgId });
  },

  /**
   * Update a team member's role
   */
  updateMemberRole: async (
    userId: string,
    role: Role,
    orgId?: string
  ): Promise<TeamMember> => {
    return api.patch(`/team/members/${userId}/role`, {
      role,
      orgId,
    });
  },

  /**
   * Remove a team member
   */
  removeMember: async (
    userId: string,
    orgId?: string
  ): Promise<{ success: boolean }> => {
    return api.delete(`/team/members/${userId}`, { orgId });
  },

  /**
   * Transfer organization ownership
   */
  transferOwnership: async (
    newOwnerId: string,
    orgId?: string
  ): Promise<{ success: boolean }> => {
    return api.post("/team/transfer-ownership", {
      newOwnerId,
      orgId,
    });
  },

  /**
   * Leave organization (for current user)
   */
  leaveOrganization: async (orgId?: string): Promise<{ success: boolean }> => {
    return api.post("/team/leave", { orgId });
  },
};

// ============================================
// Audit Log API
// ============================================

export const auditLogApi = {
  /**
   * Get audit log entries
   */
  getEntries: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<PermissionAuditLogResponse> => {
    return api.get("/audit-log", params);
  },

  /**
   * Get audit log for a specific resource
   */
  getResourceLog: async (
    resourceType: string,
    resourceId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PermissionAuditLogResponse> => {
    return api.get(`/audit-log/${resourceType}/${resourceId}`, params);
  },

  /**
   * Export audit log
   */
  exportLog: async (params?: {
    from?: string;
    to?: string;
    format?: "csv" | "json";
  }): Promise<Blob> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/audit-log/export?${new URLSearchParams(
        params as Record<string, string>
      )}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("eios_token")}`,
        },
      }
    );
    return response.blob();
  },
};

// ============================================
// Permission Caching Utility
// ============================================

interface CachedPermission {
  allowed: boolean;
  timestamp: number;
  ttl: number;
}

class PermissionCache {
  private cache: Map<string, CachedPermission> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  private getKey(permission: Permission, resourceId?: string): string {
    return resourceId ? `${permission}:${resourceId}` : permission;
  }

  get(permission: Permission, resourceId?: string): boolean | null {
    const key = this.getKey(permission, resourceId);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.allowed;
  }

  set(
    permission: Permission,
    allowed: boolean,
    resourceId?: string,
    ttl?: number
  ): void {
    const key = this.getKey(permission, resourceId);
    this.cache.set(key, {
      allowed,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  invalidate(permission?: Permission, resourceId?: string): void {
    if (!permission) {
      // Clear all cache
      this.cache.clear();
      return;
    }

    if (!resourceId) {
      // Clear all entries for this permission
      const prefix = permission + ":";
      for (const key of this.cache.keys()) {
        if (key === permission || key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
      return;
    }

    // Clear specific entry
    const key = this.getKey(permission, resourceId);
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global permission cache instance
export const permissionCache = new PermissionCache();

// ============================================
// Server Permission Check with Caching
// ============================================

export async function checkPermissionWithCache(
  permission: Permission,
  options: {
    resourceId?: string;
    skipCache?: boolean;
    ttl?: number;
  } = {}
): Promise<boolean> {
  const { resourceId, skipCache = false, ttl } = options;

  // Check cache first
  if (!skipCache) {
    const cached = permissionCache.get(permission, resourceId);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch from server
  try {
    const response = await permissionsApi.checkPermission(
      permission,
      resourceId ? { type: "project", id: resourceId } : undefined
    );

    // Cache the result
    permissionCache.set(permission, response.allowed, resourceId, ttl);

    return response.allowed;
  } catch (error) {
    console.error("Permission check failed:", error);
    // Fail secure - deny access on error
    return false;
  }
}

// ============================================
// Permission Hooks (React Query wrappers)
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useMyPermissions(orgId?: string) {
  return useQuery({
    queryKey: ["permissions", "me", orgId],
    queryFn: () => permissionsApi.getMyPermissions(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTeamMembers(orgId?: string) {
  return useQuery({
    queryKey: ["team", "members", orgId],
    queryFn: () => teamApi.getMembers(orgId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePendingInvites(orgId?: string) {
  return useQuery({
    queryKey: ["team", "invites", orgId],
    queryFn: () => teamApi.getPendingInvites(orgId),
    staleTime: 30 * 1000,
  });
}

export function useInviteMembers(orgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberRequest) => teamApi.inviteMembers(data, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invites", orgId] });
    },
  });
}

export function useUpdateMemberRole(orgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      teamApi.updateMemberRole(userId, role, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "members", orgId] });
    },
  });
}

export function useRemoveMember(orgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => teamApi.removeMember(userId, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "members", orgId] });
    },
  });
}

export function useRevokeInvite(orgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => teamApi.revokeInvite(inviteId, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invites", orgId] });
    },
  });
}

// ============================================
// Error Handling
// ============================================

export function isPermissionError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.status === 403 ||
      error.code === "PERMISSION_DENIED" ||
      error.code === "INSUFFICIENT_PERMISSIONS"
    );
  }
  return false;
}

export function getPermissionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "You don't have permission to perform this action";
}

// ============================================
// Default Export
// ============================================

export default {
  permissionsApi,
  teamApi,
  auditLogApi,
  permissionCache,
  checkPermissionWithCache,
  isPermissionError,
  getPermissionErrorMessage,
};
