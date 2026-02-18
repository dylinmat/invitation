"use client";

/**
 * Permission Gate Component
 * Conditionally render content based on user permissions
 * Inspired by GitHub's permission-based UI and Vercel's team access controls
 */

import React, { ReactNode, ReactElement } from "react";
import { Permission, Role, PermissionCheckOptions } from "@/lib/permissions";
import { usePermissionContext } from "./permission-provider";
import { cn } from "@/lib/utils";

// ============================================
// Props Types
// ============================================

interface PermissionGateBaseProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  showLoading?: boolean;
}

interface SinglePermissionProps extends PermissionGateBaseProps {
  permission: Permission;
  permissions?: never;
  requireAll?: never;
  minimumRole?: never;
}

interface MultiplePermissionsProps extends PermissionGateBaseProps {
  permission?: never;
  permissions: Permission[];
  requireAll?: boolean;
  minimumRole?: never;
}

interface RoleBasedProps extends PermissionGateBaseProps {
  permission?: never;
  permissions?: never;
  requireAll?: never;
  minimumRole: Role;
}

type PermissionGateProps =
  | SinglePermissionProps
  | MultiplePermissionsProps
  | RoleBasedProps;

interface PermissionToggleProps extends PermissionGateBaseProps {
  enabled?: boolean;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  minimumRole?: Role;
}

// ============================================
// Main Permission Gate Component
// ============================================

export function PermissionGate({
  children,
  fallback = null,
  loading = null,
  showLoading = false,
  permission,
  permissions,
  requireAll = true,
  minimumRole,
}: PermissionGateProps) {
  const { isLoading, can, canAny, canAll, hasRole } = usePermissionContext();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return <>{loading}</>;
  }

  // Determine if access is allowed
  let allowed = false;

  if (permission) {
    // Single permission check
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    // Multiple permissions check
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  } else if (minimumRole) {
    // Role-based check
    allowed = hasRole(minimumRole);
  }

  // Render children if allowed, otherwise render fallback
  return allowed ? <>{children}</> : <>{fallback}</>;
}

// ============================================
// Permission Toggle (shows both states with visual indicator)
// ============================================

export function PermissionToggle({
  children,
  fallback,
  enabled = true,
  permission,
  permissions,
  requireAll = true,
  minimumRole,
}: PermissionToggleProps) {
  const { isLoading, can, canAny, canAll, hasRole } = usePermissionContext();

  if (isLoading) {
    return (
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    );
  }

  // Determine if access is allowed
  let allowed = enabled;

  if (enabled) {
    if (permission) {
      allowed = can(permission);
    } else if (permissions && permissions.length > 0) {
      allowed = requireAll ? canAll(permissions) : canAny(permissions);
    } else if (minimumRole) {
      allowed = hasRole(minimumRole);
    }
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default disabled state with visual indicator
  return (
    <div
      className="relative"
      title="You don't have permission to access this feature"
    >
      <div className="opacity-40 pointer-events-none grayscale">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="sr-only">Permission denied</span>
      </div>
    </div>
  );
}

// ============================================
// Conditional Rendering Helpers
// ============================================

interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  minimumRole?: Role;
  hideWhenDenied?: boolean;
  disabledTooltip?: string;
}

export function PermissionButton({
  children,
  permission,
  permissions,
  requireAll = true,
  minimumRole,
  hideWhenDenied = false,
  disabledTooltip = "You don't have permission to perform this action",
  className,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { can, canAny, canAll, hasRole } = usePermissionContext();

  // Check permission
  let allowed = true;
  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  } else if (minimumRole) {
    allowed = hasRole(minimumRole);
  }

  // Hide if no permission and hideWhenDenied is true
  if (!allowed && hideWhenDenied) {
    return null;
  }

  const isDisabled = disabled || !allowed;

  return (
    <button
      type="button"
      className={cn(
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={isDisabled}
      title={isDisabled && !disabled ? disabledTooltip : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

interface PermissionLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  minimumRole?: Role;
  hideWhenDenied?: boolean;
  fallbackHref?: string;
}

export function PermissionLink({
  children,
  permission,
  permissions,
  requireAll = true,
  minimumRole,
  hideWhenDenied = false,
  fallbackHref,
  href,
  className,
  onClick,
  ...props
}: PermissionLinkProps) {
  const { can, canAny, canAll, hasRole } = usePermissionContext();

  // Check permission
  let allowed = true;
  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  } else if (minimumRole) {
    allowed = hasRole(minimumRole);
  }

  // Hide if no permission and hideWhenDenied is true
  if (!allowed && hideWhenDenied) {
    return null;
  }

  const linkHref = allowed ? href : fallbackHref || href;
  const isDisabled = !allowed && !fallbackHref;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <a
      href={linkHref}
      className={cn(
        isDisabled && "opacity-50 pointer-events-none cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      aria-disabled={isDisabled}
      {...props}
    >
      {children}
    </a>
  );
}

// ============================================
// Permission-aware Form Elements
// ============================================

interface PermissionFieldProps {
  children: ReactElement;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  readOnlyFallback?: ReactNode;
}

export function PermissionField({
  children,
  permission,
  permissions,
  requireAll = true,
  readOnlyFallback,
}: PermissionFieldProps) {
  const { can, canAny, canAll } = usePermissionContext();

  let allowed = true;
  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (allowed) {
    return children;
  }

  if (readOnlyFallback) {
    return <>{readOnlyFallback}</>;
  }

  // Clone the child with readOnly/disabled props
  return React.cloneElement(children, {
    readOnly: true,
    disabled: true,
    className: cn(
      children.props.className,
      "opacity-60 bg-gray-50 cursor-not-allowed"
    ),
  });
}

// ============================================
// Permission-aware Menu/Actions
// ============================================

interface PermissionAction {
  id: string;
  label: string;
  icon?: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface PermissionActionsProps {
  actions: PermissionAction[];
  className?: string;
  itemClassName?: string;
}

export function PermissionActions({
  actions,
  className,
  itemClassName,
}: PermissionActionsProps) {
  const { can, canAny, canAll } = usePermissionContext();

  // Filter actions based on permissions
  const visibleActions = actions.filter((action) => {
    if (action.permission) {
      return can(action.permission);
    }
    if (action.permissions && action.permissions.length > 0) {
      return action.requireAll !== false
        ? canAll(action.permissions)
        : canAny(action.permissions);
    }
    return true;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {visibleActions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            action.danger
              ? "text-red-700 hover:bg-red-50"
              : "text-gray-700 hover:bg-gray-100",
            action.disabled && "opacity-50 cursor-not-allowed",
            itemClassName
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Permission-aware Table/Lists
// ============================================

interface PermissionColumn<T> {
  key: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
}

interface PermissionTableProps<T> {
  data: T[];
  columns: PermissionColumn<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function PermissionTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = "No data available",
}: PermissionTableProps<T>) {
  const { can, canAny, canAll } = usePermissionContext();

  // Filter columns based on permissions
  const visibleColumns = columns.filter((col) => {
    if (col.permission) {
      return can(col.permission);
    }
    if (col.permissions && col.permissions.length > 0) {
      return col.requireAll !== false
        ? canAll(col.permissions)
        : canAny(col.permissions);
    }
    return true;
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <table className={cn("min-w-full divide-y divide-gray-200", className)}>
      <thead className="bg-gray-50">
        <tr>
          {visibleColumns.map((col) => (
            <th
              key={col.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((item) => (
          <tr key={keyExtractor(item)}>
            {visibleColumns.map((col) => (
              <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                {col.cell(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================
// Convenience Exports
// ============================================

// Shorthand for common permission checks
export function AdminGate(props: Omit<PermissionGateProps, "minimumRole">) {
  return <PermissionGate {...props} minimumRole="admin" />;
}

export function OwnerGate(props: Omit<PermissionGateProps, "minimumRole">) {
  return <PermissionGate {...props} minimumRole="owner" />;
}

export function MemberGate(props: Omit<PermissionGateProps, "minimumRole">) {
  return <PermissionGate {...props} minimumRole="member" />;
}

export function ViewerGate(props: Omit<PermissionGateProps, "minimumRole">) {
  return <PermissionGate {...props} minimumRole="viewer" />;
}

// ============================================
// Default Export
// ============================================

export default PermissionGate;
