# Audit Logging System Guide

A comprehensive enterprise-grade audit logging system for tracking all activities in your application.

## Features

- **Event Batching** - Efficient batching of events for performance
- **Offline Queue** - Local storage persistence for offline events
- **Real-time Updates** - WebSocket integration for live activity feeds
- **Change Tracking** - Detailed before/after change detection
- **Enterprise UI** - AWS CloudTrail/GitHub Security Log inspired interface
- **Full-text Search** - Search across all audit events
- **Export to CSV** - Export audit logs for compliance

## Quick Start

### 1. Basic Usage

```typescript
import { logAudit, auditLogger } from '@/lib/audit';

// Simple logging
auditLogger.create('project', projectId, projectName);
auditLogger.update('project', projectId, projectName);
auditLogger.delete('project', projectId, projectName);

// With custom metadata
logAudit({
  action: 'update',
  resourceType: 'project',
  resourceId: projectId,
  changes: [
    { field: 'name', oldValue: 'Old Name', newValue: 'New Name' }
  ],
  metadata: { updatedBy: 'user@example.com' }
});
```

### 2. In React Components

```typescript
import { useLogAudit } from '@/hooks/audit/useAudit';

function ProjectForm() {
  const { logCreate, logUpdate } = useLogAudit();
  
  const handleSubmit = async (data) => {
    const result = await createProject(data);
    logCreate('project', result.id, result.name);
  };
}
```

### 3. Real-time Activity Feed

```typescript
import { LiveActivityFeed } from '@/components/audit';

function Dashboard() {
  return (
    <LiveActivityFeed
      maxEvents={50}
      showNotifications
      notificationSeverities={['high', 'critical']}
    />
  );
}
```

## File Structure

```
apps/web/
├── types/
│   └── audit.ts              # TypeScript types & constants
├── lib/
│   ├── audit.ts              # Core audit service
│   ├── audit-api.ts          # API client
│   └── audit-integrations.ts # Integration examples
├── hooks/audit/
│   ├── useAudit.ts           # React Query hooks
│   └── index.ts              # Hooks exports
├── components/audit/
│   ├── audit-log-filters.tsx # Filter component
│   ├── audit-log-table.tsx   # Paginated table
│   ├── audit-log-detail.tsx  # Event detail view
│   ├── activity-timeline.tsx # Visual timeline
│   ├── change-diff.tsx       # Before/after diff
│   ├── live-activity-feed.tsx# Real-time feed
│   └── index.ts              # Component exports
└── app/dashboard/audit/
    └── page.tsx              # Main audit log page
```

## Audit Events

### Event Structure

```typescript
interface AuditEvent {
  id: string;                 // Unique event ID
  action: AuditAction;        // What happened
  resourceType: AuditResourceType;  // What was affected
  resourceId?: string;        // Resource identifier
  resourceName?: string;      // Human-readable name
  actor: AuditActor;          // Who did it
  projectId?: string;         // Project scope
  changes?: AuditChange[];    // Before/after values
  metadata?: Record<string, unknown>;  // Extra data
  severity: AuditSeverity;    // info | low | medium | high | critical
  status: AuditStatus;        // success | failure | warning | pending
  timestamp: string;          // When it happened
}
```

### Available Actions

**CRUD Operations:**
- `create`, `read`, `update`, `delete`
- `bulk_create`, `bulk_update`, `bulk_delete`
- `list`, `search`

**Authentication:**
- `login`, `logout`, `login_failed`
- `password_change`, `password_reset`
- `mfa_enabled`, `mfa_disabled`
- `token_refresh`, `session_expired`
- `permission_denied`

**Permissions:**
- `permission_grant`, `permission_revoke`
- `role_assign`, `role_remove`

**Data Operations:**
- `export`, `import`, `download`, `upload`
- `backup`, `restore`, `archive`

**Publishing:**
- `publish`, `unpublish`, `deploy`, `undeploy`

**Invitations:**
- `invite_sent`, `invite_resend`, `invite_revoke`
- `rsvp_received`, `guest_checkin`

### Resource Types

`user`, `project`, `site`, `guest`, `invite`, `rsvp`, `template`, `asset`, `team`, `organization`, `api_key`, `webhook`, `integration`, `setting`, `audit_log`, `session`, `role`, `permission`

## Configuration

```typescript
import { configureAudit } from '@/lib/audit';

configureAudit({
  batchSize: 10,              // Events per batch
  batchIntervalMs: 5000,      // Max time before sending
  maxQueueSize: 100,          // Max queue size
  maxRetries: 3,              // Retry failed sends
  localStorageKey: 'eios_audit_queue',
  maxOfflineEvents: 50,       // Max stored offline
  enabled: true,              // Master switch
  captureClientEvents: true,  // Log client events
  captureErrors: true,        // Log JS errors
});
```

## Components

### AuditLogFilters

Advanced filtering with date range, action types, resource types, severity, and status.

```typescript
import { AuditLogFiltersComponent } from '@/components/audit';

<AuditLogFiltersComponent
  filters={filters}
  onFiltersChange={setFilters}
/>
```

### AuditLogTable

Paginated table with sorting and selection.

```typescript
import { AuditLogTable } from '@/components/audit';

<AuditLogTable
  events={events}
  loading={isLoading}
  onRowClick={handleRowClick}
  pagination={{ page, limit, total, hasMore }}
  onPageChange={setPage}
  sort={sort}
  onSort={handleSort}
/>
```

### ActivityTimeline

Visual timeline view of events.

```typescript
import { ActivityTimeline } from '@/components/audit';

<ActivityTimeline
  events={events}
  onEventClick={handleEventClick}
  groupByDate={true}
  compact={false}
/>
```

### ChangeDiff

Show before/after changes with highlighting.

```typescript
import { ChangeDiff } from '@/components/audit';

<ChangeDiff
  changes={event.changes}
  defaultExpanded={false}
/>
```

## API Endpoints (Backend Required)

Your backend needs to implement these endpoints:

```
POST /api/audit/events          # Receive batched events
POST /api/audit/query           # Query audit logs
GET  /api/audit/events/:id      # Get single event
GET  /api/audit/resources/:type/:id/history  # Resource history
POST /api/audit/users/:id/activity           # User activity
POST /api/audit/projects/:id/activity        # Project activity
POST /api/audit/export          # Export logs
GET  /api/audit/stats           # Statistics
```

## Integration Examples

See `apps/web/lib/audit-integrations.ts` for complete integration patterns including:

- Mutation wrapping
- Auth event logging
- Permission change tracking
- Data export/import logging
- Error logging
- View tracking

## Security Considerations

1. **Sensitive Data** - Exclude passwords, tokens from metadata
2. **PII Handling** - Be careful with IP addresses, emails
3. **Retention** - Implement automatic cleanup
4. **Access Control** - Only admins should access audit logs
5. **Integrity** - Consider signing audit events

## License

MIT
