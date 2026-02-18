/**
 * Audit Log Integration Examples
 * 
 * This file demonstrates how to integrate audit logging throughout your application.
 * Copy these patterns into your actual mutation hooks and components.
 */

import { logAudit, auditLogger } from './audit';
import { AuditAction, AuditResourceType, AuditEventInput } from '@/types/audit';

// ============================================================================
// Pattern 1: Direct Audit Logging in Mutations
// ============================================================================

/**
 * Example: Project Creation
 */
export async function createProjectWithAudit(data: { name: string; description?: string }) {
  // 1. Perform the operation
  const project = await fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(r => r.json());

  // 2. Log the audit event
  auditLogger.create('project', project.id, project.name, {
    description: data.description,
  });

  return project;
}

/**
 * Example: Project Update with Change Tracking
 */
export async function updateProjectWithAudit(
  projectId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
) {
  // 1. Perform the operation
  const project = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(newData),
  }).then(r => r.json());

  // 2. Log with automatic change detection
  logAudit({
    action: 'update',
    resourceType: 'project',
    resourceId: projectId,
    resourceName: project.name,
    changes: Object.keys(newData).map(key => ({
      field: key,
      oldValue: oldData[key],
      newValue: newData[key],
    })),
  });

  return project;
}

/**
 * Example: Bulk Delete with Severity
 */
export async function bulkDeleteWithAudit(ids: string[]) {
  // 1. Perform the operation
  await fetch('/api/projects/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });

  // 2. Log as high severity bulk operation
  auditLogger.bulkDelete('project', ids);

  return { success: true, deleted: ids.length };
}

// ============================================================================
// Pattern 2: Wrapper Hook for Mutations
// ============================================================================

/**
 * Higher-order function to wrap mutations with audit logging
 */
export function withAuditLog<TArgs extends Record<string, unknown>, TResult>(
  operation: (args: TArgs) => Promise<TResult>,
  auditConfig: {
    action: AuditAction;
    resourceType: AuditResourceType;
    getResourceId: (result: TResult) => string | undefined;
    getResourceName: (result: TResult) => string | undefined;
    getMetadata?: (args: TArgs, result: TResult) => Record<string, unknown>;
    severity?: AuditEventInput['severity'];
  }
) {
  return async (args: TArgs): Promise<TResult> => {
    try {
      // Perform operation
      const result = await operation(args);

      // Log success
      logAudit({
        action: auditConfig.action,
        resourceType: auditConfig.resourceType,
        resourceId: auditConfig.getResourceId(result),
        resourceName: auditConfig.getResourceName(result),
        metadata: auditConfig.getMetadata?.(args, result),
        severity: auditConfig.severity,
        status: 'success',
      });

      return result;
    } catch (error) {
      // Log failure
      logAudit({
        action: auditConfig.action,
        resourceType: auditConfig.resourceType,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          args: Object.keys(args),
        },
        severity: 'high',
        status: 'failure',
      });

      throw error;
    }
  };
}

// ============================================================================
// Pattern 3: Auth Event Logging
// ============================================================================

/**
 * Login handler with audit logging
 */
export async function handleLogin(email: string, success: boolean, error?: string) {
  if (success) {
    auditLogger.login({ email });
  } else {
    auditLogger.loginFailed(email, error || 'Invalid credentials');
  }
}

/**
 * Logout handler with audit logging
 */
export async function handleLogout() {
  auditLogger.logout();
}

/**
 * Permission check failure
 */
export function logPermissionDenied(
  resourceType: AuditResourceType,
  attemptedAction: string,
  resourceId?: string
) {
  auditLogger.permissionDenied(resourceType, attemptedAction, { resourceId });
}

// ============================================================================
// Pattern 4: Data Export/Import Logging
// ============================================================================

/**
 * Export handler with audit logging
 */
export async function handleExport(
  resourceType: AuditResourceType,
  format: 'csv' | 'json' | 'pdf',
  recordCount: number
) {
  auditLogger.export(resourceType, format, { recordCount });
}

/**
 * Import handler with audit logging
 */
export async function handleImport(
  resourceType: AuditResourceType,
  results: { created: number; updated: number; failed: number }
) {
  auditLogger.import(resourceType, results.created + results.updated, results);
}

// ============================================================================
// Pattern 5: Permission Changes
// ============================================================================

/**
 * Grant permission with audit logging
 */
export async function grantPermission(
  resourceType: AuditResourceType,
  resourceId: string,
  userId: string,
  permission: string
) {
  // Perform operation
  await fetch('/api/permissions', {
    method: 'POST',
    body: JSON.stringify({ resourceType, resourceId, userId, permission }),
  });

  // Log permission grant
  auditLogger.permissionChange(
    'permission_grant',
    resourceType,
    resourceId,
    userId,
    { permission }
  );
}

/**
 * Revoke permission with audit logging
 */
export async function revokePermission(
  resourceType: AuditResourceType,
  resourceId: string,
  userId: string,
  permission: string
) {
  // Perform operation
  await fetch(`/api/permissions/${resourceId}/${userId}`, {
    method: 'DELETE',
    body: JSON.stringify({ permission }),
  });

  // Log permission revoke
  auditLogger.permissionChange(
    'permission_revoke',
    resourceType,
    resourceId,
    userId,
    { permission }
  );
}

// ============================================================================
// Pattern 6: Error Logging
// ============================================================================

/**
 * Log system errors
 */
export function logSystemError(error: Error, context?: Record<string, unknown>) {
  auditLogger.error('system', error, context);
}

/**
 * Log API errors
 */
export function logApiError(
  resourceType: AuditResourceType,
  error: Error,
  endpoint: string
) {
  logAudit({
    action: 'system_error',
    resourceType,
    metadata: {
      errorMessage: error.message,
      endpoint,
    },
    severity: 'high',
    status: 'failure',
  });
}

// ============================================================================
// Pattern 7: View/Read Tracking
// ============================================================================

/**
 * Track resource views
 */
export function trackResourceView(
  resourceType: AuditResourceType,
  resourceId: string,
  resourceName?: string
) {
  // Debounce to prevent spam
  const key = `view_${resourceType}_${resourceId}`;
  const lastView = sessionStorage.getItem(key);
  const now = Date.now();

  if (!lastView || now - parseInt(lastView) > 60000) { // 1 minute debounce
    auditLogger.read(resourceType, resourceId, resourceName);
    sessionStorage.setItem(key, now.toString());
  }
}

// ============================================================================
// Pattern 8: Publishing Events
// ============================================================================

/**
 * Site publish with audit logging
 */
export async function publishSite(projectId: string, siteId: string, siteName: string) {
  // Perform operation
  await fetch(`/api/projects/${projectId}/sites/${siteId}/publish`, {
    method: 'POST',
  });

  // Log publish
  auditLogger.publish('site', siteId, { projectId, siteName });
}

/**
 * Site unpublish with audit logging
 */
export async function unpublishSite(projectId: string, siteId: string, siteName: string) {
  // Perform operation
  await fetch(`/api/projects/${projectId}/sites/${siteId}/unpublish`, {
    method: 'POST',
  });

  // Log unpublish
  auditLogger.unpublish('site', siteId, { projectId, siteName });
}

// ============================================================================
// Pattern 9: Invitation Events
// ============================================================================

/**
 * Send invitation with audit logging
 */
export async function sendInvitation(
  projectId: string,
  guestId: string,
  guestEmail: string
) {
  // Perform operation
  const invite = await fetch(`/api/projects/${projectId}/invites`, {
    method: 'POST',
    body: JSON.stringify({ guestId }),
  }).then(r => r.json());

  // Log invitation sent
  logAudit({
    action: 'invite_sent',
    resourceType: 'invite',
    resourceId: invite.id,
    projectId,
    metadata: { guestId, guestEmail },
  });

  return invite;
}

// ============================================================================
// Pattern 10: Configuration Changes
// ============================================================================

/**
 * Update settings with audit logging
 */
export async function updateSettings(
  category: string,
  oldSettings: Record<string, unknown>,
  newSettings: Record<string, unknown>
) {
  // Perform operation
  await fetch('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(newSettings),
  });

  // Log setting change
  logAudit({
    action: 'setting_change',
    resourceType: 'setting',
    changes: Object.keys(newSettings).map(key => ({
      field: `${category}.${key}`,
      oldValue: oldSettings[key],
      newValue: newSettings[key],
    })),
  });
}
