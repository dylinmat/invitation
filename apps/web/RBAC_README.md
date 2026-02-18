# Role-Based Access Control (RBAC) System

A comprehensive, enterprise-grade RBAC system inspired by GitHub, Vercel, and AWS IAM.

## Overview

This RBAC system provides:

- **4 Role Levels**: Owner, Admin, Member, Viewer
- **50+ Permissions**: Granular control over all features
- **Hierarchical Permissions**: Higher roles inherit from lower ones
- **Server-side Validation**: Secure permission checks
- **Client-side Gates**: Conditional UI rendering
- **Team Management**: Invite, manage, and organize team members

## Quick Start

### 1. Wrap your app with PermissionProvider

```tsx
// app/layout.tsx or app/dashboard/layout.tsx
import { PermissionProvider } from "@/components/permissions";

export default function Layout({ children }) {
  const { data: permissions } = useMyPermissions();
  
  return (
    <PermissionProvider
      role={permissions?.role}
      isAuthenticated={true}
      isLoading={false}
    >
      {children}
    </PermissionProvider>
  );
}
```

### 2. Use Permission Gates in Components

```tsx
import { PermissionGate, Permission } from "@/components/permissions";

function ProjectCard() {
  return (
    <div>
      <h2>Project Name</h2>
      
      {/* Only show delete button to users with delete permission */}
      <PermissionGate permission={Permission.PROJECTS_DELETE}>
        <button>Delete Project</button>
      </PermissionGate>
    </div>
  );
}
```

### 3. Use the usePermissions Hook

```tsx
import { usePermissions, Permission } from "@/components/permissions";

function ProjectActions() {
  const { can, canAny, canAll } = usePermissions();
  
  return (
    <div>
      {can(Permission.PROJECTS_UPDATE) && (
        <button>Edit</button>
      )}
      
      {canAny([Permission.PROJECTS_DELETE, Permission.PROJECTS_ARCHIVE]) && (
        <button>Danger Zone</button>
      )}
    </div>
  );
}
```

## Roles

| Role | Description | Use Case |
|------|-------------|----------|
| **Owner** | Full access to everything | Organization creator |
| **Admin** | Can manage everything except billing/org deletion | Team leads |
| **Member** | Can create and manage projects, cannot delete | Regular team members |
| **Viewer** | Read-only access | Clients, stakeholders |

## Permission Categories

### Organization
- `org:read` - View organization details
- `org:update` - Update organization settings
- `org:delete` - Delete organization (Owner only)
- `org:billing:read` - View billing information
- `org:billing:manage` - Manage billing and subscriptions
- `org:settings:read` - View settings
- `org:settings:manage` - Manage settings

### Team Management
- `team:read` - View team members
- `team:invite` - Invite new members
- `team:remove` - Remove team members
- `team:roles:manage` - Change member roles

### Projects
- `projects:read` - View projects
- `projects:create` - Create new projects
- `projects:update` - Edit projects
- `projects:delete` - Delete projects
- `projects:archive` - Archive/unarchive projects
- `projects:duplicate` - Duplicate projects
- `projects:export` - Export project data

### Guests
- `guests:read` - View guests
- `guests:create` - Add guests
- `guests:update` - Edit guests
- `guests:delete` - Remove guests
- `guests:import` - Import from CSV
- `guests:export` - Export guest lists
- `guests:bulk:manage` - Bulk operations

### Invitations
- `invites:read` - View invitation status
- `invites:create` - Create invitations
- `invites:send` - Send invitations
- `invites:cancel` - Cancel invitations
- `invites:resend` - Resend invitations
- `invites:bulk:send` - Bulk send invitations

### Sites & Editor
- `sites:read` - View sites
- `sites:create` - Create sites
- `sites:update` - Edit sites
- `sites:delete` - Delete sites
- `sites:publish` - Publish sites
- `sites:unpublish` - Unpublish sites
- `sites:preview` - Preview sites

### Analytics
- `analytics:read` - View analytics
- `analytics:export` - Export analytics
- `analytics:dashboard:access` - Access dashboard

### Security
- `audit:log:read` - View audit logs
- `security:settings:read` - View security settings
- `security:settings:manage` - Manage security
- `api:keys:read` - View API keys
- `api:keys:manage` - Manage API keys

## Components

### PermissionGate

Conditionally renders content based on permissions:

```tsx
// Single permission
<PermissionGate permission={Permission.PROJECTS_DELETE}>
  <DeleteButton />
</PermissionGate>

// Multiple permissions (require all)
<PermissionGate permissions={[Permission.TEAM_INVITE, Permission.TEAM_ROLES_MANAGE]}>
  <InviteWithRoleSelection />
</PermissionGate>

// Multiple permissions (require any)
<PermissionGate permissions={[Permission.PROJECTS_DELETE, Permission.PROJECTS_ARCHIVE]} requireAll={false}>
  <DangerZone />
</PermissionGate>

// Role-based
<PermissionGate minimumRole="admin">
  <AdminPanel />
</PermissionGate>

// With fallback
<PermissionGate 
  permission={Permission.PROJECTS_DELETE}
  fallback={<span>Contact an admin to delete projects</span>}
>
  <DeleteButton />
</PermissionGate>
```

### PermissionButton / PermissionLink

Button and link components with built-in permission checking:

```tsx
<PermissionButton
  permission={Permission.PROJECTS_DELETE}
  onClick={handleDelete}
  hideWhenDenied
>
  Delete
</PermissionButton>

<PermissionLink
  permission={Permission.TEAM_READ}
  href="/dashboard/team"
>
  Team Settings
</PermissionLink>
```

### RoleBadge

Display user roles with appropriate styling:

```tsx
// Basic badge
<RoleBadge role="admin" />

// Different variants
<RoleBadge role="owner" variant="outline" />
<RoleBadge role="member" size="sm" />

// With description
<RoleLabel role="admin" showDescription />

// Role comparison
<RoleComparison fromRole="member" toRole="admin" />

// Dot indicator
<RoleDot role="owner" pulse />
```

## Hooks

### usePermissions

Main hook for permission checking:

```tsx
const {
  // Basic checks
  can,
  canAny,
  canAll,
  hasRole,
  canManage,
  
  // Detailed checks with reasons
  check,
  checkAny,
  checkAll,
  
  // Server-side validation
  checkServer,
  isCheckingServer,
  
  // Introspection
  permissions,
  permissionsByCategory,
  
  // Team management
  canInviteMember,
  canRemoveMember,
  canChangeMemberRole,
  canTransferOwnership,
} = usePermissions();
```

### Specialized Hooks

```tsx
// Team permissions
const teamPerms = useTeamPermissions();
// { canViewTeam, canInviteMembers, canRemoveMembers, ... }

// Project permissions
const projectPerms = useProjectPermissions(projectId);
// { canViewProjects, canCreateProject, canUpdateProject, ... }

// Admin permissions
const adminPerms = useAdminPermissions();
// { canViewBilling, canManageBilling, canViewAuditLog, ... }
```

## Team Management

Access the team management page at `/dashboard/team`:

- View all team members with their roles
- Invite new members by email
- Change member roles (with confirmation)
- Remove team members
- View pending invitations
- Resend or revoke invitations
- Visual permissions matrix

### Permission Matrix

The permissions matrix (`/dashboard/team` → Permissions tab) shows:
- Grid view: All permissions by role
- List view: Permission groups by role
- Compare view: Differences between two roles
- Filter by category or permission type

## Middleware

Route protection is handled by Next.js middleware:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Automatically protects routes based on configuration
  // Redirects to login if not authenticated
  // Checks permissions for specific routes
}
```

### Route Configuration

```typescript
// Protected routes configuration
const routePermissions = {
  "/dashboard/team": { permission: Permission.TEAM_READ },
  "/dashboard/settings": { minimumRole: Role.ADMIN },
  "/dashboard/projects/new": { permission: Permission.PROJECTS_CREATE },
};
```

## Server-side Validation

Always validate permissions on the server:

```typescript
// API Route
import { checkPermissionWithCache } from "@/lib/permissions-api";

export async function POST(request: Request) {
  const allowed = await checkPermissionWithCache(
    Permission.PROJECTS_DELETE,
    { resourceId: projectId }
  );
  
  if (!allowed) {
    return new Response("Permission denied", { status: 403 });
  }
  
  // Proceed with deletion
}
```

## Protected Layouts

Use the ProtectedLayout component for page-level protection:

```tsx
// app/dashboard/team/page.tsx
import { ProtectedLayout } from "@/components/permissions";

export default function TeamPage() {
  return (
    <ProtectedLayout permission={Permission.TEAM_READ}>
      <TeamContent />
    </ProtectedLayout>
  );
}

// Or with HOC
import { withProtection } from "@/components/permissions";

function AdminPage() {
  return <AdminContent />;
}

export default withProtection(AdminPage, { minimumRole: "admin" });
```

## Best Practices

1. **Always check on server**: Client-side checks are for UX only
2. **Fail securely**: Deny access if permission check fails
3. **Use granular permissions**: Prefer specific permissions over broad role checks
4. **Cache results**: Use `checkPermissionWithCache` for repeated checks
5. **Show helpful fallbacks**: Don't just hide elements - explain why
6. **Audit sensitive actions**: Log permission changes and dangerous operations

## Security Considerations

- **Never trust client-side checks** - always validate on server
- **Use HTTPS** for all permission-related API calls
- **Implement rate limiting** on permission check endpoints
- **Log security events** to the audit log
- **Regular reviews** of role assignments and permissions

## API Reference

### permissionsApi

- `checkPermission(permission, resource?)` - Check single permission
- `checkPermissionsBatch(permissions, resource?)` - Batch check
- `getMyPermissions(orgId?)` - Get current user's permissions
- `getUserPermissions(userId)` - Get specific user's permissions

### teamApi

- `getMembers(orgId?)` - Get all team members
- `getPendingInvites(orgId?)` - Get pending invitations
- `inviteMembers(data, orgId?)` - Invite new members
- `resendInvite(inviteId, orgId?)` - Resend invitation
- `revokeInvite(inviteId, orgId?)` - Revoke invitation
- `updateMemberRole(userId, role, orgId?)` - Change member role
- `removeMember(userId, orgId?)` - Remove team member
- `transferOwnership(newOwnerId, orgId?)` - Transfer ownership

### auditLogApi

- `getEntries(params?)` - Get audit log entries
- `getResourceLog(type, id, params?)` - Get resource-specific log
- `exportLog(params?)` - Export audit log

## Troubleshooting

### Permission check returns false unexpectedly

1. Verify the user's role is correctly set
2. Check that PermissionProvider is properly configured
3. Ensure the permission is defined in `RolePermissions`

### Client and server disagree on permissions

1. Clear the permission cache: `permissionCache.clear()`
2. Refresh permissions from server
3. Check for race conditions in permission loading

### Performance issues

1. Use permission caching with appropriate TTL
2. Batch permission checks when possible
3. Consider using `can()` for simple boolean checks vs `check()` for detailed results

## Migration Guide

### From simple role checks

Before:
```tsx
{user.role === "admin" && <AdminPanel />}
```

After:
```tsx
<PermissionGate minimumRole="admin">
  <AdminPanel />
</PermissionGate>
```

### From manual permission arrays

Before:
```tsx
const canDelete = ["owner", "admin"].includes(user.role);
```

After:
```tsx
const { can } = usePermissions();
const canDelete = can(Permission.PROJECTS_DELETE);
```
