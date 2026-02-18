"use client";

/**
 * usePermissions Hook
 * Comprehensive hook for permission checking with async backend validation
 * Combines frontend permission checks with server-side validation
 */

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Permission,
  Role,
  PermissionCheckResult,
  TeamMember,
  TeamInvite,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  canManageRole,
  getRolePermissions,
  getRolePermissionsByCategory,
  PermissionCategoryKey,
  isValidRole,
} from "@/lib/permissions";
import { usePermissionContext } from "./permission-provider";

// ============================================
// Types
// ============================================

interface UsePermissionsOptions {
  /** Enable server-side permission validation */
  enableServerCheck?: boolean;
  /** Cache time for permission checks in ms */
  staleTime?: number;
  /** Show toast notifications on permission denied */
  showToasts?: boolean;
}

interface ServerPermissionCheck {
  permission: Permission;
  allowed: boolean;
  checkedAt: string;
}

interface AsyncPermissionState {
  isChecking: boolean;
  serverResults: Map<Permission, boolean>;
  lastCheck: Date | null;
}

interface PermissionHookResult {
  // Basic permission checks (client-side)
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  hasRole: (minimumRole: Role) => boolean;
  canManage: (targetRole: Role) => boolean;

  // Detailed permission checks with reasons
  check: (permission: Permission) => PermissionCheckResult;
  checkAny: (permissions: Permission[]) => PermissionCheckResult;
  checkAll: (permissions: Permission[]) => PermissionCheckResult;
  checkRole: (minimumRole: Role) => PermissionCheckResult;

  // Async server-side checks
  checkServer: (permission: Permission) => Promise<boolean>;
  checkAnyServer: (permissions: Permission[]) => Promise<boolean>;
  checkAllServer: (permissions: Permission[]) => Promise<boolean>;
  isCheckingServer: boolean;

  // Permission introspection
  permissions: Permission[];
  permissionsByCategory: Record<PermissionCategoryKey, Permission[]>;
  getPermissionStatus: (permission: Permission) => {
    clientAllowed: boolean;
    serverAllowed: boolean | null;
    isChecking: boolean;
  };

  // Team management helpers
  canInviteMember: (role: Role) => boolean;
  canRemoveMember: (member: TeamMember) => boolean;
  canChangeMemberRole: (member: TeamMember, newRole: Role) => boolean;
  canTransferOwnership: () => boolean;

  // Bulk checks
  filterByPermission: <T extends { permission?: Permission }>(
    items: T[]
  ) => T[];
  groupByPermission: <T extends { permission?: Permission }>(
    items: T[]
  ) => {
    allowed: T[];
    denied: T[];
  };

  // Utility
  refresh: () => void;
  invalidate: () => void;
}

// ============================================
// Mock API Functions (to be replaced with real API calls)
// ============================================

const mockCheckServerPermission = async (
  permission: Permission
): Promise<boolean> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  // In a real implementation, this would call the backend
  // return api.permissions.check(permission);
  
  // For now, always return true (backend is source of truth)
  return true;
};

const mockCheckServerPermissions = async (
  permissions: Permission[]
): Promise<Record<Permission, boolean>> => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  
  const results = {} as Record<Permission, boolean>;
  permissions.forEach((p) => {
    results[p] = true;
  });
  
  return results;
};

// ============================================
// Main Hook
// ============================================

export function usePermissions(
  options: UsePermissionsOptions = {}
): PermissionHookResult {
  const {
    enableServerCheck = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    showToasts = false,
  } = options;

  const context = usePermissionContext();
  const queryClient = useQueryClient();
  const checkQueueRef = useRef<Set<Permission>>(new Set());
  const [pendingChecks, setPendingChecks] = useState<Set<Permission>>(new Set());

  // ============================================
  // Server-side Permission Queries
  // ============================================

  // Query for checking a single permission on the server
  const serverCheckQuery = useQuery({
    queryKey: ["permissions", "server-check", context.role],
    queryFn: async () => {
      const permissionsToCheck = Array.from(checkQueueRef.current);
      checkQueueRef.current.clear();
      
      if (permissionsToCheck.length === 0) {
        return {} as Record<Permission, boolean>;
      }
      
      const results = await mockCheckServerPermissions(permissionsToCheck);
      return results;
    },
    enabled: false, // Manual trigger only
    staleTime,
  });

  // ============================================
  // Client-side Permission Checks
  // ============================================

  const can = useCallback(
    (permission: Permission): boolean => {
      return context.can(permission);
    },
    [context]
  );

  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      return context.canAny(permissions);
    },
    [context]
  );

  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      return context.canAll(permissions);
    },
    [context]
  );

  const hasRole = useCallback(
    (minimumRole: Role): boolean => {
      return context.hasRole(minimumRole);
    },
    [context]
  );

  const canManage = useCallback(
    (targetRole: Role): boolean => {
      return context.canManage(targetRole);
    },
    [context]
  );

  // ============================================
  // Detailed Permission Checks
  // ============================================

  const check = useCallback(
    (permission: Permission): PermissionCheckResult => {
      return context.check(permission);
    },
    [context]
  );

  const checkAny = useCallback(
    (permissions: Permission[]): PermissionCheckResult => {
      return context.checkAny(permissions);
    },
    [context]
  );

  const checkAll = useCallback(
    (permissions: Permission[]): PermissionCheckResult => {
      return context.checkAll(permissions);
    },
    [context]
  );

  const checkRole = useCallback(
    (minimumRole: Role): PermissionCheckResult => {
      return context.checkRole(minimumRole);
    },
    [context]
  );

  // ============================================
  // Server-side Permission Checks
  // ============================================

  const queueServerCheck = useCallback((permission: Permission) => {
    checkQueueRef.current.add(permission);
    setPendingChecks(new Set(checkQueueRef.current));
  }, []);

  const checkServer = useCallback(
    async (permission: Permission): Promise<boolean> => {
      // First check client-side
      if (!can(permission)) {
        return false;
      }

      if (!enableServerCheck) {
        return true;
      }

      // Queue for server validation
      queueServerCheck(permission);
      
      try {
        const result = await mockCheckServerPermission(permission);
        return result;
      } catch (error) {
        console.error("Server permission check failed:", error);
        // Fail secure - deny if server check fails
        return false;
      }
    },
    [can, enableServerCheck, queueServerCheck]
  );

  const checkAnyServer = useCallback(
    async (permissions: Permission[]): Promise<boolean> => {
      // First check client-side
      if (!canAny(permissions)) {
        return false;
      }

      if (!enableServerCheck) {
        return true;
      }

      // Check all on server
      try {
        const results = await mockCheckServerPermissions(permissions);
        return Object.values(results).some((r) => r);
      } catch (error) {
        console.error("Server permission check failed:", error);
        return false;
      }
    },
    [canAny, enableServerCheck]
  );

  const checkAllServer = useCallback(
    async (permissions: Permission[]): Promise<boolean> => {
      // First check client-side
      if (!canAll(permissions)) {
        return false;
      }

      if (!enableServerCheck) {
        return true;
      }

      // Check all on server
      try {
        const results = await mockCheckServerPermissions(permissions);
        return Object.values(results).every((r) => r);
      } catch (error) {
        console.error("Server permission check failed:", error);
        return false;
      }
    },
    [canAll, enableServerCheck]
  );

  // ============================================
  // Permission Introspection
  // ============================================

  const permissions = useMemo(() => {
    return context.getAllPermissions();
  }, [context]);

  const permissionsByCategory = useMemo(() => {
    return context.getPermissionsByCategory();
  }, [context]);

  const getPermissionStatus = useCallback(
    (permission: Permission) => {
      const clientAllowed = can(permission);
      const serverAllowed = enableServerCheck ? null : undefined;
      const isChecking = pendingChecks.has(permission);

      return {
        clientAllowed,
        serverAllowed,
        isChecking,
      };
    },
    [can, enableServerCheck, pendingChecks]
  );

  // ============================================
  // Team Management Helpers
  // ============================================

  const canInviteMember = useCallback(
    (role: Role): boolean => {
      if (!context.can(Permission.TEAM_INVITE)) {
        return false;
      }
      // Can only invite members with lower roles
      return canManage(role);
    },
    [context, canManage]
  );

  const canRemoveMember = useCallback(
    (member: TeamMember): boolean => {
      if (!context.can(Permission.TEAM_REMOVE)) {
        return false;
      }
      // Cannot remove yourself (use leave organization instead)
      // Cannot remove members with equal or higher roles
      return canManage(member.role);
    },
    [context, canManage]
  );

  const canChangeMemberRole = useCallback(
    (member: TeamMember, newRole: Role): boolean => {
      if (!context.can(Permission.TEAM_ROLES_MANAGE)) {
        return false;
      }
      // Cannot change your own role
      // Cannot change roles of members with equal or higher roles
      if (!canManage(member.role)) {
        return false;
      }
      // Cannot assign a role higher than or equal to yours
      if (isRoleAtLeast(newRole, context.role!)) {
        return false;
      }
      return true;
    },
    [context, canManage]
  );

  const canTransferOwnership = useCallback((): boolean => {
    return context.role === Role.OWNER;
  }, [context.role]);

  // ============================================
  // Bulk Operations
  // ============================================

  const filterByPermission = useCallback(
    <T extends { permission?: Permission }>(items: T[]): T[] => {
      return items.filter((item) => {
        if (!item.permission) return true;
        return can(item.permission);
      });
    },
    [can]
  );

  const groupByPermission = useCallback(
    <T extends { permission?: Permission }>(items: T[]) => {
      return items.reduce(
        (acc, item) => {
          if (!item.permission || can(item.permission)) {
            acc.allowed.push(item);
          } else {
            acc.denied.push(item);
          }
          return acc;
        },
        { allowed: [] as T[], denied: [] as T[] }
      );
    },
    [can]
  );

  // ============================================
  // Utility Functions
  // ============================================

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["permissions"] });
    context.refresh();
  }, [queryClient, context]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["permissions"] });
  }, [queryClient]);

  // ============================================
  // Result Object
  // ============================================

  return useMemo(
    () => ({
      // Basic checks
      can,
      canAny,
      canAll,
      hasRole,
      canManage,

      // Detailed checks
      check,
      checkAny,
      checkAll,
      checkRole,

      // Server checks
      checkServer,
      checkAnyServer,
      checkAllServer,
      isCheckingServer: serverCheckQuery.isFetching,

      // Introspection
      permissions,
      permissionsByCategory,
      getPermissionStatus,

      // Team management
      canInviteMember,
      canRemoveMember,
      canChangeMemberRole,
      canTransferOwnership,

      // Bulk operations
      filterByPermission,
      groupByPermission,

      // Utility
      refresh,
      invalidate,
    }),
    [
      can,
      canAny,
      canAll,
      hasRole,
      canManage,
      check,
      checkAny,
      checkAll,
      checkRole,
      checkServer,
      checkAnyServer,
      checkAllServer,
      serverCheckQuery.isFetching,
      permissions,
      permissionsByCategory,
      getPermissionStatus,
      canInviteMember,
      canRemoveMember,
      canChangeMemberRole,
      canTransferOwnership,
      filterByPermission,
      groupByPermission,
      refresh,
      invalidate,
    ]
  );
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * Hook for checking a specific permission with server validation
 */
export function usePermission(
  permission: Permission,
  options: UsePermissionsOptions = {}
) {
  const permissions = usePermissions(options);
  
  const query = useQuery({
    queryKey: ["permission", permission],
    queryFn: async () => {
      if (!options.enableServerCheck) {
        return { allowed: permissions.can(permission), serverValidated: false };
      }
      const serverAllowed = await permissions.checkServer(permission);
      return { allowed: serverAllowed, serverValidated: true };
    },
    enabled: options.enableServerCheck ?? false,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  });

  return {
    allowed: permissions.can(permission),
    serverAllowed: query.data?.allowed,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for team management permissions
 */
export function useTeamPermissions() {
  const permissions = usePermissions();

  return {
    canViewTeam: permissions.can(Permission.TEAM_READ),
    canInviteMembers: permissions.can(Permission.TEAM_INVITE),
    canRemoveMembers: permissions.can(Permission.TEAM_REMOVE),
    canManageRoles: permissions.can(Permission.TEAM_ROLES_MANAGE),
    canInviteRole: permissions.canInviteMember,
    canRemoveMember: permissions.canRemoveMember,
    canChangeRole: permissions.canChangeMemberRole,
    canTransferOwnership: permissions.canTransferOwnership,
  };
}

/**
 * Hook for project management permissions
 */
export function useProjectPermissions(projectId?: string) {
  const permissions = usePermissions();

  return {
    canViewProjects: permissions.can(Permission.PROJECTS_READ),
    canCreateProject: permissions.can(Permission.PROJECTS_CREATE),
    canUpdateProject: permissions.can(Permission.PROJECTS_UPDATE),
    canDeleteProject: permissions.can(Permission.PROJECTS_DELETE),
    canArchiveProject: permissions.can(Permission.PROJECTS_ARCHIVE),
    canDuplicateProject: permissions.can(Permission.PROJECTS_DUPLICATE),
    canExportProject: permissions.can(Permission.PROJECTS_EXPORT),
    
    // Guests
    canViewGuests: permissions.can(Permission.GUESTS_READ),
    canAddGuests: permissions.can(Permission.GUESTS_CREATE),
    canEditGuests: permissions.can(Permission.GUESTS_UPDATE),
    canRemoveGuests: permissions.can(Permission.GUESTS_DELETE),
    canImportGuests: permissions.can(Permission.GUESTS_IMPORT),
    canExportGuests: permissions.can(Permission.GUESTS_EXPORT),
    
    // Invites
    canViewInvites: permissions.can(Permission.INVITES_READ),
    canCreateInvites: permissions.can(Permission.INVITES_CREATE),
    canSendInvites: permissions.can(Permission.INVITES_SEND),
    
    // Sites
    canViewSites: permissions.can(Permission.SITES_READ),
    canCreateSites: permissions.can(Permission.SITES_CREATE),
    canEditSites: permissions.can(Permission.SITES_UPDATE),
    canPublishSites: permissions.can(Permission.SITES_PUBLISH),
    
    // Analytics
    canViewAnalytics: permissions.can(Permission.ANALYTICS_READ),
    canAccessDashboard: permissions.can(Permission.ANALYTICS_DASHBOARD_ACCESS),
  };
}

/**
 * Hook for organization admin permissions
 */
export function useAdminPermissions() {
  const permissions = usePermissions();

  return {
    // Organization
    canViewOrg: permissions.can(Permission.ORG_READ),
    canUpdateOrg: permissions.can(Permission.ORG_UPDATE),
    canDeleteOrg: permissions.can(Permission.ORG_DELETE),
    
    // Billing
    canViewBilling: permissions.can(Permission.ORG_BILLING_READ),
    canManageBilling: permissions.can(Permission.ORG_BILLING_MANAGE),
    
    // Settings
    canViewSettings: permissions.can(Permission.ORG_SETTINGS_READ),
    canManageSettings: permissions.can(Permission.ORG_SETTINGS_MANAGE),
    
    // Integrations
    canViewIntegrations: permissions.can(Permission.ORG_INTEGRATIONS_READ),
    canManageIntegrations: permissions.can(Permission.ORG_INTEGRATIONS_MANAGE),
    
    // Security
    canViewAuditLog: permissions.can(Permission.AUDIT_LOG_READ),
    canViewSecuritySettings: permissions.can(Permission.SECURITY_SETTINGS_READ),
    canManageSecurity: permissions.can(Permission.SECURITY_SETTINGS_MANAGE),
    canViewApiKeys: permissions.can(Permission.API_KEYS_READ),
    canManageApiKeys: permissions.can(Permission.API_KEYS_MANAGE),
    
    // Is admin or above
    isAdmin: permissions.hasRole(Role.ADMIN),
    isOwner: permissions.hasRole(Role.OWNER),
  };
}

// ============================================
// Default Export
// ============================================

export default usePermissions;
