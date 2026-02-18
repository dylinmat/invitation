/**
 * Role-Based Access Control (RBAC) System
 * Enterprise-grade permission management inspired by GitHub, Vercel, and AWS IAM
 */

// ============================================
// Role Definitions
// ============================================

export const Role = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const RoleHierarchy: Role[] = [Role.VIEWER, Role.MEMBER, Role.ADMIN, Role.OWNER];

export const RoleDisplayNames: Record<Role, string> = {
  [Role.OWNER]: "Owner",
  [Role.ADMIN]: "Admin",
  [Role.MEMBER]: "Member",
  [Role.VIEWER]: "Viewer",
};

export const RoleDescriptions: Record<Role, string> = {
  [Role.OWNER]: "Full access to all resources and settings, including billing and team management",
  [Role.ADMIN]: "Can manage projects, guests, and team members, but cannot delete the organization",
  [Role.MEMBER]: "Can create and manage projects and guests, cannot manage team settings",
  [Role.VIEWER]: "Read-only access to projects and analytics, cannot make changes",
};

// ============================================
// Permission Definitions
// ============================================

export const Permission = {
  // Organization-level permissions
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",
  ORG_BILLING_READ: "org:billing:read",
  ORG_BILLING_MANAGE: "org:billing:manage",
  ORG_INTEGRATIONS_READ: "org:integrations:read",
  ORG_INTEGRATIONS_MANAGE: "org:integrations:manage",
  ORG_SETTINGS_READ: "org:settings:read",
  ORG_SETTINGS_MANAGE: "org:settings:manage",

  // Team management permissions
  TEAM_READ: "team:read",
  TEAM_INVITE: "team:invite",
  TEAM_REMOVE: "team:remove",
  TEAM_ROLES_MANAGE: "team:roles:manage",

  // Project permissions
  PROJECTS_READ: "projects:read",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_UPDATE: "projects:update",
  PROJECTS_DELETE: "projects:delete",
  PROJECTS_ARCHIVE: "projects:archive",
  PROJECTS_DUPLICATE: "projects:duplicate",
  PROJECTS_EXPORT: "projects:export",

  // Guest management permissions
  GUESTS_READ: "guests:read",
  GUESTS_CREATE: "guests:create",
  GUESTS_UPDATE: "guests:update",
  GUESTS_DELETE: "guests:delete",
  GUESTS_IMPORT: "guests:import",
  GUESTS_EXPORT: "guests:export",
  GUESTS_BULK_MANAGE: "guests:bulk:manage",

  // Invite management permissions
  INVITES_READ: "invites:read",
  INVITES_CREATE: "invites:create",
  INVITES_SEND: "invites:send",
  INVITES_CANCEL: "invites:cancel",
  INVITES_RESEND: "invites:resend",
  INVITES_BULK_SEND: "invites:bulk:send",

  // Site/editor permissions
  SITES_READ: "sites:read",
  SITES_CREATE: "sites:create",
  SITES_UPDATE: "sites:update",
  SITES_DELETE: "sites:delete",
  SITES_PUBLISH: "sites:publish",
  SITES_UNPUBLISH: "sites:unpublish",
  SITES_PREVIEW: "sites:preview",

  // Analytics permissions
  ANALYTICS_READ: "analytics:read",
  ANALYTICS_EXPORT: "analytics:export",
  ANALYTICS_DASHBOARD_ACCESS: "analytics:dashboard:access",

  // Template permissions
  TEMPLATES_READ: "templates:read",
  TEMPLATES_CREATE: "templates:create",
  TEMPLATES_UPDATE: "templates:update",
  TEMPLATES_DELETE: "templates:delete",
  TEMPLATES_SHARE: "templates:share",

  // Audit and security
  AUDIT_LOG_READ: "audit:log:read",
  SECURITY_SETTINGS_READ: "security:settings:read",
  SECURITY_SETTINGS_MANAGE: "security:settings:manage",
  API_KEYS_READ: "api:keys:read",
  API_KEYS_MANAGE: "api:keys:manage",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ============================================
// Permission Categories for UI Organization
// ============================================

export const PermissionCategories = {
  ORGANIZATION: {
    label: "Organization",
    description: "Manage organization settings and billing",
    permissions: [
      Permission.ORG_READ,
      Permission.ORG_UPDATE,
      Permission.ORG_DELETE,
      Permission.ORG_BILLING_READ,
      Permission.ORG_BILLING_MANAGE,
      Permission.ORG_INTEGRATIONS_READ,
      Permission.ORG_INTEGRATIONS_MANAGE,
      Permission.ORG_SETTINGS_READ,
      Permission.ORG_SETTINGS_MANAGE,
    ],
  },
  TEAM: {
    label: "Team Management",
    description: "Manage team members and their roles",
    permissions: [
      Permission.TEAM_READ,
      Permission.TEAM_INVITE,
      Permission.TEAM_REMOVE,
      Permission.TEAM_ROLES_MANAGE,
    ],
  },
  PROJECTS: {
    label: "Projects",
    description: "Create and manage event projects",
    permissions: [
      Permission.PROJECTS_READ,
      Permission.PROJECTS_CREATE,
      Permission.PROJECTS_UPDATE,
      Permission.PROJECTS_DELETE,
      Permission.PROJECTS_ARCHIVE,
      Permission.PROJECTS_DUPLICATE,
      Permission.PROJECTS_EXPORT,
    ],
  },
  GUESTS: {
    label: "Guest Management",
    description: "Manage event guests and RSVPs",
    permissions: [
      Permission.GUESTS_READ,
      Permission.GUESTS_CREATE,
      Permission.GUESTS_UPDATE,
      Permission.GUESTS_DELETE,
      Permission.GUESTS_IMPORT,
      Permission.GUESTS_EXPORT,
      Permission.GUESTS_BULK_MANAGE,
    ],
  },
  INVITES: {
    label: "Invitations",
    description: "Send and manage event invitations",
    permissions: [
      Permission.INVITES_READ,
      Permission.INVITES_CREATE,
      Permission.INVITES_SEND,
      Permission.INVITES_CANCEL,
      Permission.INVITES_RESEND,
      Permission.INVITES_BULK_SEND,
    ],
  },
  SITES: {
    label: "Sites & Editor",
    description: "Design and publish event sites",
    permissions: [
      Permission.SITES_READ,
      Permission.SITES_CREATE,
      Permission.SITES_UPDATE,
      Permission.SITES_DELETE,
      Permission.SITES_PUBLISH,
      Permission.SITES_UNPUBLISH,
      Permission.SITES_PREVIEW,
    ],
  },
  ANALYTICS: {
    label: "Analytics",
    description: "View event analytics and reports",
    permissions: [
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_EXPORT,
      Permission.ANALYTICS_DASHBOARD_ACCESS,
    ],
  },
  TEMPLATES: {
    label: "Templates",
    description: "Manage reusable templates",
    permissions: [
      Permission.TEMPLATES_READ,
      Permission.TEMPLATES_CREATE,
      Permission.TEMPLATES_UPDATE,
      Permission.TEMPLATES_DELETE,
      Permission.TEMPLATES_SHARE,
    ],
  },
  SECURITY: {
    label: "Security & Audit",
    description: "Security settings and audit logs",
    permissions: [
      Permission.AUDIT_LOG_READ,
      Permission.SECURITY_SETTINGS_READ,
      Permission.SECURITY_SETTINGS_MANAGE,
      Permission.API_KEYS_READ,
      Permission.API_KEYS_MANAGE,
    ],
  },
} as const;

export type PermissionCategoryKey = keyof typeof PermissionCategories;

// ============================================
// Permission Metadata
// ============================================

export interface PermissionMetadata {
  label: string;
  description: string;
  category: PermissionCategoryKey;
  requires?: Permission; // Parent permission that must also be granted
  dangerous?: boolean; // Requires additional confirmation
}

export const PermissionMetadataMap: Record<Permission, PermissionMetadata> = {
  // Organization
  [Permission.ORG_READ]: {
    label: "View Organization",
    description: "View organization details and settings",
    category: "ORGANIZATION",
  },
  [Permission.ORG_UPDATE]: {
    label: "Update Organization",
    description: "Modify organization name, branding, and general settings",
    category: "ORGANIZATION",
    requires: Permission.ORG_READ,
  },
  [Permission.ORG_DELETE]: {
    label: "Delete Organization",
    description: "Permanently delete the organization and all associated data",
    category: "ORGANIZATION",
    dangerous: true,
    requires: Permission.ORG_READ,
  },
  [Permission.ORG_BILLING_READ]: {
    label: "View Billing",
    description: "View billing information, invoices, and subscription details",
    category: "ORGANIZATION",
  },
  [Permission.ORG_BILLING_MANAGE]: {
    label: "Manage Billing",
    description: "Update payment methods, change plans, and manage subscriptions",
    category: "ORGANIZATION",
    requires: Permission.ORG_BILLING_READ,
  },
  [Permission.ORG_INTEGRATIONS_READ]: {
    label: "View Integrations",
    description: "View connected integrations and their status",
    category: "ORGANIZATION",
  },
  [Permission.ORG_INTEGRATIONS_MANAGE]: {
    label: "Manage Integrations",
    description: "Connect, configure, and disconnect third-party integrations",
    category: "ORGANIZATION",
    requires: Permission.ORG_INTEGRATIONS_READ,
  },
  [Permission.ORG_SETTINGS_READ]: {
    label: "View Settings",
    description: "View organization configuration settings",
    category: "ORGANIZATION",
  },
  [Permission.ORG_SETTINGS_MANAGE]: {
    label: "Manage Settings",
    description: "Modify organization-wide settings and defaults",
    category: "ORGANIZATION",
    requires: Permission.ORG_SETTINGS_READ,
  },

  // Team
  [Permission.TEAM_READ]: {
    label: "View Team",
    description: "View team members and their roles",
    category: "TEAM",
  },
  [Permission.TEAM_INVITE]: {
    label: "Invite Members",
    description: "Invite new members to the organization",
    category: "TEAM",
    requires: Permission.TEAM_READ,
  },
  [Permission.TEAM_REMOVE]: {
    label: "Remove Members",
    description: "Remove members from the organization",
    category: "TEAM",
    dangerous: true,
    requires: Permission.TEAM_READ,
  },
  [Permission.TEAM_ROLES_MANAGE]: {
    label: "Manage Roles",
    description: "Change roles of team members",
    category: "TEAM",
    requires: Permission.TEAM_READ,
  },

  // Projects
  [Permission.PROJECTS_READ]: {
    label: "View Projects",
    description: "View projects and their details",
    category: "PROJECTS",
  },
  [Permission.PROJECTS_CREATE]: {
    label: "Create Projects",
    description: "Create new event projects",
    category: "PROJECTS",
  },
  [Permission.PROJECTS_UPDATE]: {
    label: "Update Projects",
    description: "Edit project details and settings",
    category: "PROJECTS",
    requires: Permission.PROJECTS_READ,
  },
  [Permission.PROJECTS_DELETE]: {
    label: "Delete Projects",
    description: "Permanently delete projects",
    category: "PROJECTS",
    dangerous: true,
    requires: Permission.PROJECTS_READ,
  },
  [Permission.PROJECTS_ARCHIVE]: {
    label: "Archive Projects",
    description: "Archive and unarchive projects",
    category: "PROJECTS",
    requires: Permission.PROJECTS_READ,
  },
  [Permission.PROJECTS_DUPLICATE]: {
    label: "Duplicate Projects",
    description: "Duplicate existing projects",
    category: "PROJECTS",
    requires: Permission.PROJECTS_READ,
  },
  [Permission.PROJECTS_EXPORT]: {
    label: "Export Projects",
    description: "Export project data and configurations",
    category: "PROJECTS",
    requires: Permission.PROJECTS_READ,
  },

  // Guests
  [Permission.GUESTS_READ]: {
    label: "View Guests",
    description: "View guest lists and details",
    category: "GUESTS",
  },
  [Permission.GUESTS_CREATE]: {
    label: "Add Guests",
    description: "Add new guests to events",
    category: "GUESTS",
    requires: Permission.GUESTS_READ,
  },
  [Permission.GUESTS_UPDATE]: {
    label: "Edit Guests",
    description: "Modify guest information",
    category: "GUESTS",
    requires: Permission.GUESTS_READ,
  },
  [Permission.GUESTS_DELETE]: {
    label: "Remove Guests",
    description: "Remove guests from events",
    category: "GUESTS",
    requires: Permission.GUESTS_READ,
  },
  [Permission.GUESTS_IMPORT]: {
    label: "Import Guests",
    description: "Import guests from CSV or other sources",
    category: "GUESTS",
    requires: Permission.GUESTS_CREATE,
  },
  [Permission.GUESTS_EXPORT]: {
    label: "Export Guests",
    description: "Export guest lists to various formats",
    category: "GUESTS",
    requires: Permission.GUESTS_READ,
  },
  [Permission.GUESTS_BULK_MANAGE]: {
    label: "Bulk Manage Guests",
    description: "Perform bulk operations on guests",
    category: "GUESTS",
    requires: Permission.GUESTS_UPDATE,
  },

  // Invites
  [Permission.INVITES_READ]: {
    label: "View Invites",
    description: "View invitation status and history",
    category: "INVITES",
  },
  [Permission.INVITES_CREATE]: {
    label: "Create Invites",
    description: "Generate new invitations",
    category: "INVITES",
    requires: Permission.INVITES_READ,
  },
  [Permission.INVITES_SEND]: {
    label: "Send Invites",
    description: "Send invitations to guests",
    category: "INVITES",
    requires: Permission.INVITES_CREATE,
  },
  [Permission.INVITES_CANCEL]: {
    label: "Cancel Invites",
    description: "Cancel pending invitations",
    category: "INVITES",
    requires: Permission.INVITES_READ,
  },
  [Permission.INVITES_RESEND]: {
    label: "Resend Invites",
    description: "Resend invitations to guests",
    category: "INVITES",
    requires: Permission.INVITES_SEND,
  },
  [Permission.INVITES_BULK_SEND]: {
    label: "Bulk Send Invites",
    description: "Send invitations to multiple guests at once",
    category: "INVITES",
    requires: Permission.INVITES_SEND,
  },

  // Sites
  [Permission.SITES_READ]: {
    label: "View Sites",
    description: "View event sites and designs",
    category: "SITES",
  },
  [Permission.SITES_CREATE]: {
    label: "Create Sites",
    description: "Create new event sites",
    category: "SITES",
    requires: Permission.SITES_READ,
  },
  [Permission.SITES_UPDATE]: {
    label: "Edit Sites",
    description: "Modify site designs and content",
    category: "SITES",
    requires: Permission.SITES_READ,
  },
  [Permission.SITES_DELETE]: {
    label: "Delete Sites",
    description: "Delete event sites",
    category: "SITES",
    dangerous: true,
    requires: Permission.SITES_READ,
  },
  [Permission.SITES_PUBLISH]: {
    label: "Publish Sites",
    description: "Make sites live and publicly accessible",
    category: "SITES",
    requires: Permission.SITES_UPDATE,
  },
  [Permission.SITES_UNPUBLISH]: {
    label: "Unpublish Sites",
    description: "Take sites offline",
    category: "SITES",
    requires: Permission.SITES_PUBLISH,
  },
  [Permission.SITES_PREVIEW]: {
    label: "Preview Sites",
    description: "Preview sites before publishing",
    category: "SITES",
    requires: Permission.SITES_READ,
  },

  // Analytics
  [Permission.ANALYTICS_READ]: {
    label: "View Analytics",
    description: "View event analytics and statistics",
    category: "ANALYTICS",
  },
  [Permission.ANALYTICS_EXPORT]: {
    label: "Export Analytics",
    description: "Export analytics data and reports",
    category: "ANALYTICS",
    requires: Permission.ANALYTICS_READ,
  },
  [Permission.ANALYTICS_DASHBOARD_ACCESS]: {
    label: "Dashboard Access",
    description: "Access the main analytics dashboard",
    category: "ANALYTICS",
    requires: Permission.ANALYTICS_READ,
  },

  // Templates
  [Permission.TEMPLATES_READ]: {
    label: "View Templates",
    description: "View available templates",
    category: "TEMPLATES",
  },
  [Permission.TEMPLATES_CREATE]: {
    label: "Create Templates",
    description: "Create new custom templates",
    category: "TEMPLATES",
    requires: Permission.TEMPLATES_READ,
  },
  [Permission.TEMPLATES_UPDATE]: {
    label: "Edit Templates",
    description: "Modify existing templates",
    category: "TEMPLATES",
    requires: Permission.TEMPLATES_READ,
  },
  [Permission.TEMPLATES_DELETE]: {
    label: "Delete Templates",
    description: "Delete custom templates",
    category: "TEMPLATES",
    dangerous: true,
    requires: Permission.TEMPLATES_READ,
  },
  [Permission.TEMPLATES_SHARE]: {
    label: "Share Templates",
    description: "Share templates with the organization",
    category: "TEMPLATES",
    requires: Permission.TEMPLATES_READ,
  },

  // Security
  [Permission.AUDIT_LOG_READ]: {
    label: "View Audit Log",
    description: "View organization audit logs",
    category: "SECURITY",
  },
  [Permission.SECURITY_SETTINGS_READ]: {
    label: "View Security Settings",
    description: "View security configuration",
    category: "SECURITY",
  },
  [Permission.SECURITY_SETTINGS_MANAGE]: {
    label: "Manage Security",
    description: "Modify security settings and policies",
    category: "SECURITY",
    requires: Permission.SECURITY_SETTINGS_READ,
  },
  [Permission.API_KEYS_READ]: {
    label: "View API Keys",
    description: "View API keys and their usage",
    category: "SECURITY",
  },
  [Permission.API_KEYS_MANAGE]: {
    label: "Manage API Keys",
    description: "Create and revoke API keys",
    category: "SECURITY",
    requires: Permission.API_KEYS_READ,
  },
};

// ============================================
// Role-to-Permission Mappings
// ============================================

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),
  
  [Role.ADMIN]: [
    // Organization (no delete)
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_BILLING_READ,
    Permission.ORG_BILLING_MANAGE,
    Permission.ORG_INTEGRATIONS_READ,
    Permission.ORG_INTEGRATIONS_MANAGE,
    Permission.ORG_SETTINGS_READ,
    Permission.ORG_SETTINGS_MANAGE,
    
    // Team (full access except owner transfer)
    Permission.TEAM_READ,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE,
    Permission.TEAM_ROLES_MANAGE,
    
    // Projects (full access)
    Permission.PROJECTS_READ,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_UPDATE,
    Permission.PROJECTS_DELETE,
    Permission.PROJECTS_ARCHIVE,
    Permission.PROJECTS_DUPLICATE,
    Permission.PROJECTS_EXPORT,
    
    // Guests (full access)
    Permission.GUESTS_READ,
    Permission.GUESTS_CREATE,
    Permission.GUESTS_UPDATE,
    Permission.GUESTS_DELETE,
    Permission.GUESTS_IMPORT,
    Permission.GUESTS_EXPORT,
    Permission.GUESTS_BULK_MANAGE,
    
    // Invites (full access)
    Permission.INVITES_READ,
    Permission.INVITES_CREATE,
    Permission.INVITES_SEND,
    Permission.INVITES_CANCEL,
    Permission.INVITES_RESEND,
    Permission.INVITES_BULK_SEND,
    
    // Sites (full access)
    Permission.SITES_READ,
    Permission.SITES_CREATE,
    Permission.SITES_UPDATE,
    Permission.SITES_DELETE,
    Permission.SITES_PUBLISH,
    Permission.SITES_UNPUBLISH,
    Permission.SITES_PREVIEW,
    
    // Analytics (full access)
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_DASHBOARD_ACCESS,
    
    // Templates (full access)
    Permission.TEMPLATES_READ,
    Permission.TEMPLATES_CREATE,
    Permission.TEMPLATES_UPDATE,
    Permission.TEMPLATES_DELETE,
    Permission.TEMPLATES_SHARE,
    
    // Security (read only, no manage)
    Permission.AUDIT_LOG_READ,
    Permission.SECURITY_SETTINGS_READ,
    Permission.API_KEYS_READ,
  ],
  
  [Role.MEMBER]: [
    // Organization (read only)
    Permission.ORG_READ,
    Permission.ORG_SETTINGS_READ,
    
    // Team (view only)
    Permission.TEAM_READ,
    
    // Projects (full access except delete)
    Permission.PROJECTS_READ,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_UPDATE,
    Permission.PROJECTS_ARCHIVE,
    Permission.PROJECTS_DUPLICATE,
    Permission.PROJECTS_EXPORT,
    
    // Guests (full access except delete)
    Permission.GUESTS_READ,
    Permission.GUESTS_CREATE,
    Permission.GUESTS_UPDATE,
    Permission.GUESTS_IMPORT,
    Permission.GUESTS_EXPORT,
    Permission.GUESTS_BULK_MANAGE,
    
    // Invites (full access)
    Permission.INVITES_READ,
    Permission.INVITES_CREATE,
    Permission.INVITES_SEND,
    Permission.INVITES_CANCEL,
    Permission.INVITES_RESEND,
    Permission.INVITES_BULK_SEND,
    
    // Sites (full access except delete)
    Permission.SITES_READ,
    Permission.SITES_CREATE,
    Permission.SITES_UPDATE,
    Permission.SITES_PUBLISH,
    Permission.SITES_UNPUBLISH,
    Permission.SITES_PREVIEW,
    
    // Analytics (read only)
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_DASHBOARD_ACCESS,
    
    // Templates (read and share only)
    Permission.TEMPLATES_READ,
    Permission.TEMPLATES_SHARE,
  ],
  
  [Role.VIEWER]: [
    // Organization (read only)
    Permission.ORG_READ,
    
    // Team (view only)
    Permission.TEAM_READ,
    
    // Projects (read only)
    Permission.PROJECTS_READ,
    
    // Guests (read only)
    Permission.GUESTS_READ,
    
    // Invites (read only)
    Permission.INVITES_READ,
    
    // Sites (read only)
    Permission.SITES_READ,
    Permission.SITES_PREVIEW,
    
    // Analytics (read only)
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_DASHBOARD_ACCESS,
    
    // Templates (read only)
    Permission.TEMPLATES_READ,
  ],
};

// ============================================
// Permission Checking Utilities
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role is at least as privileged as another role
 */
export function isRoleAtLeast(role: Role, minimumRole: Role): boolean {
  const roleIndex = RoleHierarchy.indexOf(role);
  const minimumIndex = RoleHierarchy.indexOf(minimumRole);
  return roleIndex >= minimumIndex;
}

/**
 * Check if a user can manage another user's role
 * Users can only manage roles lower than their own
 */
export function canManageRole(userRole: Role, targetRole: Role): boolean {
  const userIndex = RoleHierarchy.indexOf(userRole);
  const targetIndex = RoleHierarchy.indexOf(targetRole);
  return userIndex > targetIndex;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return [...RolePermissions[role]];
}

/**
 * Get all permissions grouped by category for a role
 */
export function getRolePermissionsByCategory(
  role: Role
): Record<PermissionCategoryKey, Permission[]> {
  const permissions = getRolePermissions(role);
  const result = {} as Record<PermissionCategoryKey, Permission[]>;

  (Object.keys(PermissionCategories) as PermissionCategoryKey[]).forEach((category) => {
    result[category] = permissions.filter((p) =>
      PermissionCategories[category].permissions.includes(p)
    );
  });

  return result;
}

/**
 * Get permissions that differ between two roles
 */
export function getPermissionDifferences(
  fromRole: Role,
  toRole: Role
): {
  added: Permission[];
  removed: Permission[];
} {
  const fromPerms = new Set(RolePermissions[fromRole]);
  const toPerms = new Set(RolePermissions[toRole]);

  const added = RolePermissions[toRole].filter((p) => !fromPerms.has(p));
  const removed = RolePermissions[fromRole].filter((p) => !toPerms.has(p));

  return { added, removed };
}

/**
 * Check if a permission requires additional confirmation
 */
export function isDangerousPermission(permission: Permission): boolean {
  return PermissionMetadataMap[permission]?.dangerous ?? false;
}

// ============================================
// Permission Sets for Common Operations
// ============================================

export const PermissionSets = {
  // Full project management
  PROJECT_MANAGEMENT: [
    Permission.PROJECTS_READ,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_UPDATE,
    Permission.PROJECTS_DELETE,
  ],

  // Full guest management
  GUEST_MANAGEMENT: [
    Permission.GUESTS_READ,
    Permission.GUESTS_CREATE,
    Permission.GUESTS_UPDATE,
    Permission.GUESTS_DELETE,
    Permission.GUESTS_IMPORT,
    Permission.GUESTS_EXPORT,
  ],

  // Invitation workflow
  INVITATION_WORKFLOW: [
    Permission.INVITES_READ,
    Permission.INVITES_CREATE,
    Permission.INVITES_SEND,
    Permission.INVITES_RESEND,
  ],

  // Site publishing
  SITE_PUBLISHING: [
    Permission.SITES_READ,
    Permission.SITES_UPDATE,
    Permission.SITES_PUBLISH,
  ],

  // Admin capabilities
  ADMIN_CAPABILITIES: [
    Permission.TEAM_READ,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE,
    Permission.TEAM_ROLES_MANAGE,
    Permission.ORG_SETTINGS_READ,
    Permission.ORG_SETTINGS_MANAGE,
  ],

  // Read-only access
  READ_ONLY: [
    Permission.PROJECTS_READ,
    Permission.GUESTS_READ,
    Permission.INVITES_READ,
    Permission.SITES_READ,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_DASHBOARD_ACCESS,
  ],
} as const;

// ============================================
// Type Guards
// ============================================

export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// API Types
// ============================================

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
  joinedAt: string;
  invitedBy?: string;
  lastActiveAt?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "revoked";
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: Permission;
  currentRole?: Role;
}

export interface PermissionCheckOptions {
  requireAll?: boolean;
  redirectTo?: string;
  showToast?: boolean;
}

// ============================================
// Default Export
// ============================================

export default {
  Role,
  RoleHierarchy,
  RoleDisplayNames,
  RoleDescriptions,
  Permission,
  PermissionCategories,
  PermissionMetadataMap,
  RolePermissions,
  PermissionSets,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  canManageRole,
  getRolePermissions,
  getRolePermissionsByCategory,
  getPermissionDifferences,
  isDangerousPermission,
  isValidRole,
  isValidPermission,
};
