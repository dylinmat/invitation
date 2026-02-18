"use client";

/**
 * Permission Provider
 * Context provider for RBAC permissions throughout the application
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  Role,
  Permission,
  PermissionCheckResult,
  PermissionCheckOptions,
  TeamMember,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  canManageRole,
  getRolePermissions,
  getRolePermissionsByCategory,
  PermissionCategoryKey,
} from "@/lib/permissions";

// ============================================
// Context Types
// ============================================

interface PermissionContextValue {
  // Current user's role and permissions
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Permission checking methods
  check: (permission: Permission) => PermissionCheckResult;
  checkAny: (permissions: Permission[]) => PermissionCheckResult;
  checkAll: (permissions: Permission[]) => PermissionCheckResult;
  checkRole: (minimumRole: Role) => PermissionCheckResult;

  // Boolean check methods (for simpler usage)
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  hasRole: (minimumRole: Role) => boolean;
  canManage: (targetRole: Role) => boolean;

  // Permission listing methods
  getAllPermissions: () => Permission[];
  getPermissionsByCategory: () => Record<PermissionCategoryKey, Permission[]>;

  // Team member operations
  canManageMember: (member: TeamMember) => boolean;
  canChangeRole: (fromRole: Role, toRole: Role) => boolean;

  // Utility
  refresh: () => Promise<void>;
}

interface PermissionProviderProps {
  children: ReactNode;
  role?: Role | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  onRefresh?: () => Promise<void>;
}

// ============================================
// Context Creation
// ============================================

const PermissionContext = createContext<PermissionContextValue | null>(null);

// ============================================
// Helper Functions
// ============================================

function createCheckResult(
  allowed: boolean,
  reason?: string,
  requiredPermission?: Permission,
  currentRole?: Role | null
): PermissionCheckResult {
  return {
    allowed,
    reason,
    requiredPermission,
    currentRole: currentRole ?? undefined,
  };
}

// ============================================
// Provider Component
// ============================================

export function PermissionProvider({
  children,
  role = null,
  isLoading = false,
  isAuthenticated = false,
  onRefresh,
}: PermissionProviderProps) {
  // Refresh handler
  const refresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  // Single permission check
  const check = useCallback(
    (permission: Permission): PermissionCheckResult => {
      if (!isAuthenticated) {
        return createCheckResult(
          false,
          "You must be authenticated to access this resource",
          permission,
          role
        );
      }

      if (!role) {
        return createCheckResult(
          false,
          "Your role has not been determined",
          permission,
          role
        );
      }

      const allowed = hasPermission(role, permission);

      return createCheckResult(
        allowed,
        allowed
          ? undefined
          : `Your current role (${role}) does not have permission to perform this action`,
        permission,
        role
      );
    },
    [role, isAuthenticated]
  );

  // Any permission check
  const checkAny = useCallback(
    (permissions: Permission[]): PermissionCheckResult => {
      if (!isAuthenticated) {
        return createCheckResult(
          false,
          "You must be authenticated to access this resource",
          undefined,
          role
        );
      }

      if (!role) {
        return createCheckResult(
          false,
          "Your role has not been determined",
          undefined,
          role
        );
      }

      const allowed = hasAnyPermission(role, permissions);

      return createCheckResult(
        allowed,
        allowed
          ? undefined
          : `Your current role (${role}) does not have any of the required permissions`,
        undefined,
        role
      );
    },
    [role, isAuthenticated]
  );

  // All permissions check
  const checkAll = useCallback(
    (permissions: Permission[]): PermissionCheckResult => {
      if (!isAuthenticated) {
        return createCheckResult(
          false,
          "You must be authenticated to access this resource",
          undefined,
          role
        );
      }

      if (!role) {
        return createCheckResult(
          false,
          "Your role has not been determined",
          undefined,
          role
        );
      }

      const allowed = hasAllPermissions(role, permissions);

      return createCheckResult(
        allowed,
        allowed
          ? undefined
          : `Your current role (${role}) is missing some required permissions`,
        undefined,
        role
      );
    },
    [role, isAuthenticated]
  );

  // Role level check
  const checkRole = useCallback(
    (minimumRole: Role): PermissionCheckResult => {
      if (!isAuthenticated) {
        return createCheckResult(
          false,
          "You must be authenticated to access this resource",
          undefined,
          role
        );
      }

      if (!role) {
        return createCheckResult(
          false,
          "Your role has not been determined",
          undefined,
          role
        );
      }

      const allowed = isRoleAtLeast(role, minimumRole);

      return createCheckResult(
        allowed,
        allowed
          ? undefined
          : `This action requires at least ${minimumRole} privileges`,
        undefined,
        role
      );
    },
    [role, isAuthenticated]
  );

  // Boolean shortcuts
  const can = useCallback(
    (permission: Permission): boolean => {
      return isAuthenticated && !!role && hasPermission(role, permission);
    },
    [role, isAuthenticated]
  );

  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      return isAuthenticated && !!role && hasAnyPermission(role, permissions);
    },
    [role, isAuthenticated]
  );

  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      return isAuthenticated && !!role && hasAllPermissions(role, permissions);
    },
    [role, isAuthenticated]
  );

  const hasRole = useCallback(
    (minimumRole: Role): boolean => {
      return isAuthenticated && !!role && isRoleAtLeast(role, minimumRole);
    },
    [role, isAuthenticated]
  );

  const canManage = useCallback(
    (targetRole: Role): boolean => {
      return isAuthenticated && !!role && canManageRole(role, targetRole);
    },
    [role, isAuthenticated]
  );

  // Get all permissions for current role
  const getAllPermissions = useCallback((): Permission[] => {
    if (!role) return [];
    return getRolePermissions(role);
  }, [role]);

  // Get permissions grouped by category
  const getPermissionsByCategory = useCallback(() => {
    if (!role) {
      return {} as Record<PermissionCategoryKey, Permission[]>;
    }
    return getRolePermissionsByCategory(role);
  }, [role]);

  // Team member management checks
  const canManageMember = useCallback(
    (member: TeamMember): boolean => {
      if (!isAuthenticated || !role) return false;
      
      // Cannot manage yourself through this check
      // This should be handled by the caller
      
      // Can only manage members with lower roles
      return canManageRole(role, member.role);
    },
    [role, isAuthenticated]
  );

  // Role change validation
  const canChangeRole = useCallback(
    (fromRole: Role, toRole: Role): boolean => {
      if (!isAuthenticated || !role) return false;

      // Cannot change your own role through this mechanism
      // Must use a separate ownership transfer flow

      // Can only manage roles lower than yours
      if (!canManageRole(role, fromRole)) return false;
      if (!canManageRole(role, toRole)) return false;

      // Cannot assign a role higher than or equal to yours
      if (isRoleAtLeast(toRole, role)) return false;

      return true;
    },
    [role, isAuthenticated]
  );

  // Memoized context value
  const value = useMemo<PermissionContextValue>(
    () => ({
      role,
      isLoading,
      isAuthenticated,
      check,
      checkAny,
      checkAll,
      checkRole,
      can,
      canAny,
      canAll,
      hasRole,
      canManage,
      getAllPermissions,
      getPermissionsByCategory,
      canManageMember,
      canChangeRole,
      refresh,
    }),
    [
      role,
      isLoading,
      isAuthenticated,
      check,
      checkAny,
      checkAll,
      checkRole,
      can,
      canAny,
      canAll,
      hasRole,
      canManage,
      getAllPermissions,
      getPermissionsByCategory,
      canManageMember,
      canChangeRole,
      refresh,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error(
      "usePermissionContext must be used within a PermissionProvider"
    );
  }
  
  return context;
}

// ============================================
// HOC for class components (if needed)
// ============================================

export interface WithPermissionsProps {
  permissions: PermissionContextValue;
}

export function withPermissions<P extends WithPermissionsProps>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, keyof WithPermissionsProps>> {
  return function WithPermissionsWrapper(props) {
    const permissions = usePermissionContext();
    return <Component {...(props as P)} permissions={permissions} />;
  };
}

export default PermissionProvider;
