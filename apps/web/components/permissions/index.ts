/**
 * Permissions Components
 * Role-Based Access Control (RBAC) UI Components
 */

// Provider
export {
  PermissionProvider,
  usePermissionContext,
  withPermissions,
  type WithPermissionsProps,
} from "./permission-provider";

// Protected Layout
export {
  ProtectedLayout,
  withProtection,
  AdminLayout,
  OwnerLayout,
  type ProtectedLayoutProps,
} from "./protected-layout";

// Permission Gate
export {
  PermissionGate,
  PermissionToggle,
  PermissionButton,
  PermissionLink,
  PermissionField,
  PermissionActions,
  PermissionTable,
  AdminGate,
  OwnerGate,
  MemberGate,
  ViewerGate,
} from "./permission-gate";

// Hooks
export {
  usePermissions,
  usePermission,
  useTeamPermissions,
  useProjectPermissions,
  useAdminPermissions,
} from "./use-permissions";

// Role Badge
export {
  RoleBadge,
  RoleDot,
  RoleBadgeGroup,
  RoleLabel,
  RoleHierarchy,
  RoleComparison,
  RoleBadgeIcons,
} from "./role-badge";

// Default export for convenience
export { default } from "./permission-provider";
