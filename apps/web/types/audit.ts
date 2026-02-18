/**
 * Audit Log Types - Enterprise-grade audit logging system
 * Inspired by AWS CloudTrail and GitHub Security Log
 */

// ============================================================================
// Audit Event Actions
// ============================================================================

export type AuditAction = 
  // CRUD Operations
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'bulk_create'
  | 'bulk_update'
  | 'bulk_delete'
  | 'list'
  | 'search'
  
  // Auth & Security
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'token_refresh'
  | 'session_expired'
  | 'permission_denied'
  
  // Permission & Access
  | 'permission_grant'
  | 'permission_revoke'
  | 'role_assign'
  | 'role_remove'
  | 'access_granted'
  | 'access_revoked'
  | 'ownership_transfer'
  
  // Export & Data
  | 'export'
  | 'import'
  | 'download'
  | 'upload'
  | 'backup'
  | 'restore'
  | 'archive'
  
  // Configuration
  | 'config_update'
  | 'setting_change'
  | 'integration_connect'
  | 'integration_disconnect'
  
  // Publishing
  | 'publish'
  | 'unpublish'
  | 'deploy'
  | 'undeploy'
  
  // Invitations & Guests
  | 'invite_sent'
  | 'invite_resend'
  | 'invite_revoke'
  | 'rsvp_received'
  | 'guest_checkin'
  
  // System
  | 'system_maintenance'
  | 'system_error'
  | 'api_call'
  | 'webhook_received'
  | 'webhook_sent';

// ============================================================================
// Resource Types
// ============================================================================

export type AuditResourceType =
  | 'user'
  | 'project'
  | 'site'
  | 'guest'
  | 'invite'
  | 'rsvp'
  | 'template'
  | 'asset'
  | 'team'
  | 'organization'
  | 'api_key'
  | 'webhook'
  | 'integration'
  | 'setting'
  | 'audit_log'
  | 'session'
  | 'role'
  | 'permission';

// ============================================================================
// Severity Levels
// ============================================================================

export type AuditSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// Status Types
// ============================================================================

export type AuditStatus = 'success' | 'failure' | 'warning' | 'pending';

// ============================================================================
// Actor Types
// ============================================================================

export type AuditActorType = 'user' | 'system' | 'api_key' | 'webhook' | 'integration';

export interface AuditActor {
  id: string;
  type: AuditActorType;
  email?: string;
  name?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

// ============================================================================
// Change Tracking
// ============================================================================

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditMetadata {
  [key: string]: unknown;
}

// ============================================================================
// Main Audit Event
// ============================================================================

export interface AuditEvent {
  // Unique identifier
  id: string;
  
  // Event classification
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  
  // Who performed the action
  actor: AuditActor;
  
  // Where it happened
  projectId?: string;
  organizationId?: string;
  
  // Change tracking
  changes?: AuditChange[];
  metadata?: AuditMetadata;
  
  // Event classification
  severity: AuditSeverity;
  status: AuditStatus;
  
  // Error information (if applicable)
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  
  // Timestamps
  timestamp: string;
  createdAt: string;
  
  // Client-side tracking
  clientTimestamp?: string;
  offlineQueued?: boolean;
}

// ============================================================================
// Audit Event Input (for creating events)
// ============================================================================

export interface AuditEventInput {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  projectId?: string;
  organizationId?: string;
  changes?: AuditChange[];
  metadata?: AuditMetadata;
  severity?: AuditSeverity;
  status?: AuditStatus;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Audit Log Filters
// ============================================================================

export interface AuditLogFilters {
  // Date range
  startDate?: string;
  endDate?: string;
  
  // Event filters
  actions?: AuditAction[];
  resourceTypes?: AuditResourceType[];
  resourceIds?: string[];
  severities?: AuditSeverity[];
  statuses?: AuditStatus[];
  
  // Actor filters
  actorIds?: string[];
  actorTypes?: AuditActorType[];
  
  // Scope filters
  projectId?: string;
  organizationId?: string;
  
  // Search
  searchQuery?: string;
  
  // IP address
  ipAddress?: string;
}

// ============================================================================
// Audit Log Query Options
// ============================================================================

export interface AuditLogQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'severity' | 'action' | 'resourceType';
  sortOrder?: 'asc' | 'desc';
  filters?: AuditLogFilters;
}

// ============================================================================
// Audit Log Response
// ============================================================================

export interface AuditLogResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  
  // Aggregations
  aggregations?: {
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    bySeverity: Record<string, number>;
    byDay: Record<string, number>;
  };
}

// ============================================================================
// Real-time Audit Event
// ============================================================================

export interface RealtimeAuditEvent {
  type: 'audit_event';
  event: AuditEvent;
  timestamp: string;
}

// ============================================================================
// Audit Configuration
// ============================================================================

export interface AuditConfig {
  // Batch settings
  batchSize: number;
  batchIntervalMs: number;
  maxQueueSize: number;
  
  // Retry settings
  maxRetries: number;
  retryDelayMs: number;
  
  // Storage settings
  localStorageKey: string;
  maxOfflineEvents: number;
  
  // Feature flags
  enabled: boolean;
  captureClientEvents: boolean;
  capturePageViews: boolean;
  captureErrors: boolean;
}

// ============================================================================
// Action Categories for UI
// ============================================================================

export const AUDIT_ACTION_CATEGORIES: Record<string, AuditAction[]> = {
  crud: ['create', 'read', 'update', 'delete', 'bulk_create', 'bulk_update', 'bulk_delete', 'list', 'search'],
  auth: ['login', 'logout', 'login_failed', 'password_change', 'password_reset', 'mfa_enabled', 'mfa_disabled', 'token_refresh', 'session_expired', 'permission_denied'],
  permissions: ['permission_grant', 'permission_revoke', 'role_assign', 'role_remove', 'access_granted', 'access_revoked', 'ownership_transfer'],
  data: ['export', 'import', 'download', 'upload', 'backup', 'restore', 'archive'],
  config: ['config_update', 'setting_change', 'integration_connect', 'integration_disconnect'],
  publishing: ['publish', 'unpublish', 'deploy', 'undeploy'],
  invitations: ['invite_sent', 'invite_resend', 'invite_revoke', 'rsvp_received', 'guest_checkin'],
  system: ['system_maintenance', 'system_error', 'api_call', 'webhook_received', 'webhook_sent'],
};

// ============================================================================
// Action Labels for UI
// ============================================================================

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Created',
  read: 'Viewed',
  update: 'Updated',
  delete: 'Deleted',
  bulk_create: 'Bulk Created',
  bulk_update: 'Bulk Updated',
  bulk_delete: 'Bulk Deleted',
  list: 'Listed',
  search: 'Searched',
  login: 'Logged In',
  logout: 'Logged Out',
  login_failed: 'Login Failed',
  password_change: 'Changed Password',
  password_reset: 'Reset Password',
  mfa_enabled: 'Enabled MFA',
  mfa_disabled: 'Disabled MFA',
  token_refresh: 'Refreshed Token',
  session_expired: 'Session Expired',
  permission_denied: 'Permission Denied',
  permission_grant: 'Granted Permission',
  permission_revoke: 'Revoked Permission',
  role_assign: 'Assigned Role',
  role_remove: 'Removed Role',
  access_granted: 'Granted Access',
  access_revoked: 'Revoked Access',
  ownership_transfer: 'Transferred Ownership',
  export: 'Exported Data',
  import: 'Imported Data',
  download: 'Downloaded File',
  upload: 'Uploaded File',
  backup: 'Created Backup',
  restore: 'Restored Data',
  archive: 'Archived',
  config_update: 'Updated Configuration',
  setting_change: 'Changed Setting',
  integration_connect: 'Connected Integration',
  integration_disconnect: 'Disconnected Integration',
  publish: 'Published',
  unpublish: 'Unpublished',
  deploy: 'Deployed',
  undeploy: 'Undeployed',
  invite_sent: 'Sent Invitation',
  invite_resend: 'Resent Invitation',
  invite_revoke: 'Revoked Invitation',
  rsvp_received: 'Received RSVP',
  guest_checkin: 'Guest Checked In',
  system_maintenance: 'System Maintenance',
  system_error: 'System Error',
  api_call: 'API Call',
  webhook_received: 'Webhook Received',
  webhook_sent: 'Webhook Sent',
};

// ============================================================================
// Resource Type Labels
// ============================================================================

export const AUDIT_RESOURCE_LABELS: Record<AuditResourceType, string> = {
  user: 'User',
  project: 'Project',
  site: 'Site',
  guest: 'Guest',
  invite: 'Invitation',
  rsvp: 'RSVP',
  template: 'Template',
  asset: 'Asset',
  team: 'Team',
  organization: 'Organization',
  api_key: 'API Key',
  webhook: 'Webhook',
  integration: 'Integration',
  setting: 'Setting',
  audit_log: 'Audit Log',
  session: 'Session',
  role: 'Role',
  permission: 'Permission',
};

// ============================================================================
// Severity Configuration
// ============================================================================

export const AUDIT_SEVERITY_CONFIG: Record<AuditSeverity, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  info: {
    label: 'Info',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: 'Info',
  },
  low: {
    label: 'Low',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: 'Minus',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: 'AlertTriangle',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: 'AlertOctagon',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: 'ShieldAlert',
  },
};

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  batchSize: 10,
  batchIntervalMs: 5000,
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
  localStorageKey: 'eios_audit_queue',
  maxOfflineEvents: 50,
  enabled: true,
  captureClientEvents: true,
  capturePageViews: false,
  captureErrors: true,
};
