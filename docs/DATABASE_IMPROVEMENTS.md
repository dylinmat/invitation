# EIOS Database Improvement Plan

## Executive Summary

This document outlines a comprehensive review of the EIOS database schema and provides recommendations for enterprise readiness. The current schema is well-designed with proper normalization, foreign keys, and cascade rules, but requires enhancements for audit trails, soft deletes, RLS, and analytics.

**Current State:** 32 tables, good normalization, basic indexes  
**Target State:** Enterprise-grade with audit logging, RLS, analytics, and archival support

---

## 1. Current Schema Analysis

### 1.1 Table Inventory (32 Tables)

| Category | Tables | Count |
|----------|--------|-------|
| **Core Identity** | users, organizations, organization_members | 3 |
| **Billing/Plans** | plans, plan_entitlements, org_plan_assignments, project_plan_assignments | 4 |
| **Settings** | settings_definitions, settings_values, entitlement_overrides | 3 |
| **Project Management** | projects, events | 2 |
| **Sites/Publishing** | sites, site_versions | 2 |
| **Guest Management** | guest_groups, guests, guest_contacts, guest_tags, guest_tag_assignments | 5 |
| **Invites/Access** | invites, invite_access_logs | 2 |
| **RSVP System** | rsvp_forms, rsvp_questions, rsvp_question_options, rsvp_logic_rules, rsvp_submissions, rsvp_answers | 6 |
| **Messaging** | messaging_campaigns, message_jobs, message_events | 3 |
| **Seating/Check-in** | floor_plans, seating_tables, seating_assignments, check_in_records | 4 |
| **Photo Wall** | photo_wall_settings, photo_uploads, photo_likes | 3 |

### 1.2 Current Strengths

✅ **Proper Primary Keys:** All tables use UUID primary keys with `uuid_generate_v4()`  
✅ **Foreign Key Constraints:** Comprehensive FK constraints with appropriate cascade rules  
✅ **Timestamps:** `created_at` and `updated_at` on most tables  
✅ **Enums:** Proper PostgreSQL enums for type safety  
✅ **Indexes:** Critical indexes added in `001_add_critical_indexes.sql`  
✅ **Soft Delete Support:** `project_status` includes 'DELETED' state  

### 1.3 Current Indexes Summary

| Table | Indexed Columns |
|-------|----------------|
| projects | owner_org_id, manager_org_id, status, created_by |
| guests | project_id, group_id, (first_name, last_name) |
| invites | token_hash, project_id, guest_id, site_id |
| sites | project_id, subdomain_slug, custom_domain |
| rsvp_* | All FK columns indexed |
| messaging_* | All FK columns indexed |
| photo_* | project_id, guest_id, status |

---

## 2. Critical Issues Identified

### 2.1 Data Integrity Issues

| Issue | Severity | Tables Affected | Impact |
|-------|----------|-----------------|--------|
| Missing `updated_at` triggers | 🔴 High | All tables with updated_at | Stale timestamps |
| Missing unique constraints | 🔴 High | organization_members, settings_values | Duplicate data |
| No check constraints | 🟡 Medium | guests (role), events (dates) | Invalid data |
| Inconsistent cascade rules | 🟡 Medium | org_plan_assignments | Orphan records |

### 2.2 Audit & Compliance Gaps

| Issue | Severity | Compliance Impact |
|-------|----------|-------------------|
| No audit log table | 🔴 High | SOC 2, GDPR compliance impossible |
| No `created_by`/`updated_by` | 🔴 High | Cannot track data ownership |
| No soft delete pattern | 🟡 Medium | Data recovery issues |
| No data retention tracking | 🟡 Medium | GDPR Article 17 violations |

### 2.3 Performance Concerns

| Issue | Severity | Query Impact |
|-------|----------|--------------|
| No GIN indexes for JSONB | 🟡 Medium | Slow settings/entitlement lookups |
| No partial indexes for active data | 🟡 Medium | Slower queries with soft deletes |
| No table partitioning | 🟡 Medium | Large table scan issues |
| Missing composite indexes | 🟡 Medium | Multi-column filter inefficiency |

### 2.4 Security Gaps

| Issue | Severity | Risk |
|-------|----------|------|
| No Row Level Security (RLS) | 🔴 Critical | Multi-tenant data isolation missing |
| No encryption markers | 🟡 Medium | Cannot verify encryption at rest |
| No API key table | 🟡 Medium | No programmatic access control |

---

## 3. Required Additions

### 3.1 Admin & System Tables

```sql
-- Audit logging for compliance
admin_audit_log          -- All administrative actions
system_settings          -- Platform-wide configuration
feature_flags            -- A/B testing and feature gating
support_tickets          -- Customer support system
announcements            -- Platform announcements
scheduled_maintenance    -- Maintenance windows
```

### 3.2 Analytics Tables

```sql
-- Materialized views recommended
daily_stats              -- Aggregated daily metrics
user_activity_summary    -- User engagement metrics
event_analytics          -- Per-event analytics
revenue_summary          -- Billing/revenue tracking
api_usage_stats          -- API rate limit tracking
```

### 3.3 Enterprise Tables

```sql
-- Multi-tenancy & isolation
tenant_isolation_policies -- RLS policy definitions

-- Data retention & compliance
data_retention_policies  -- Automated retention rules
data_export_requests     -- GDPR data export tracking
data_deletion_requests   -- GDPR right to be forgotten

-- Extensibility
custom_fields            -- User-defined fields
custom_field_values      -- Values for custom fields

-- Integrations
webhooks                 -- Outgoing webhook configs
webhook_deliveries       -- Delivery attempt logs
api_keys                 -- API access keys
api_key_usage            -- API key rate tracking

-- Security
login_attempts           -- Brute force protection
security_events          -- Security incident log
```

---

## 4. Schema Changes Required

### 4.1 Add to Existing Tables

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| users | email_verified_at | timestamptz | Email verification tracking |
| users | last_login_at | timestamptz | User activity tracking |
| users | failed_login_count | integer | Brute force protection |
| users | locked_until | timestamptz | Account lockout |
| organizations | deleted_at | timestamptz | Soft delete support |
| organizations | deleted_by | uuid | Audit trail |
| projects | archived_at | timestamptz | Archive tracking |
| projects | archived_by | uuid | Archive audit |
| guests | deleted_at | timestamptz | Soft delete |
| guests | deleted_by | uuid | Soft delete audit |
| invites | last_accessed_at | timestamptz | Activity tracking |
| invites | access_count | integer | Usage metrics |
| photo_uploads | deleted_at | timestamptz | Soft delete |

### 4.2 Modify Existing Constraints

```sql
-- Add missing unique constraints
ALTER TABLE organization_members 
  ADD CONSTRAINT unique_org_member UNIQUE (org_id, user_id);

ALTER TABLE settings_values 
  ADD CONSTRAINT unique_setting_scope UNIQUE (scope, scope_id, key);

-- Add check constraints
ALTER TABLE events 
  ADD CONSTRAINT check_event_dates CHECK (ends_at IS NULL OR ends_at > starts_at);

ALTER TABLE guests 
  ADD CONSTRAINT check_guest_names CHECK (first_name IS NOT NULL OR last_name IS NOT NULL);
```

---

## 5. Index Recommendations

### 5.1 New Indexes Required

```sql
-- Analytics queries
CREATE INDEX idx_rsvp_submissions_submitted_at ON rsvp_submissions(submitted_at);
CREATE INDEX idx_invite_access_logs_accessed_at ON invite_access_logs(accessed_at);
CREATE INDEX idx_photo_uploads_created_at ON photo_uploads(created_at);

-- Soft delete queries (partial indexes)
CREATE INDEX idx_projects_active ON projects(id) WHERE status = 'ACTIVE';
CREATE INDEX idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;

-- GIN indexes for JSONB
CREATE INDEX idx_plan_entitlements_value ON plan_entitlements USING GIN(value_json);
CREATE INDEX idx_entitlement_overrides_value ON entitlement_overrides USING GIN(value_json);
CREATE INDEX idx_settings_values_value ON settings_values USING GIN(value);

-- Composite indexes for common queries
CREATE INDEX idx_guests_project_deleted ON guests(project_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_invites_project_active ON invites(project_id, revoked_at, expires_at) 
  WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());
```

### 5.2 Index Maintenance

```sql
-- Analyze tables after major data changes
ANALYZE guests;
ANALYZE projects;
ANALYZE rsvp_submissions;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 6. Row Level Security (RLS) Implementation

### 6.1 Enable RLS on Tables

```sql
-- Core tables requiring RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_uploads ENABLE ROW LEVEL SECURITY;
```

### 6.2 Example RLS Policies

```sql
-- Users can only access their organization's projects
CREATE POLICY project_org_isolation ON projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = projects.owner_org_id
      AND om.user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Guests scoped to accessible projects
CREATE POLICY guest_project_isolation ON guests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.owner_org_id = om.org_id
      WHERE p.id = guests.project_id
      AND om.user_id = current_setting('app.current_user_id')::uuid
    )
  );
```

---

## 7. Migration Plan

### Phase 1: Foundation (Immediate)

1. **002_add_soft_delete_columns.sql** - Add deleted_at columns
2. **003_add_audit_columns.sql** - Add created_by/updated_by
3. **004_add_missing_constraints.sql** - Unique/check constraints
4. **005_add_performance_indexes.sql** - Additional indexes

### Phase 2: Audit System (Week 1-2)

5. **006_create_admin_audit_log.sql** - Audit infrastructure
6. **007_create_audit_triggers.sql** - Automatic audit logging

### Phase 3: Enterprise Features (Week 3-4)

7. **008_create_api_keys_table.sql** - API access management
8. **009_create_webhooks_tables.sql** - Webhook infrastructure
9. **010_create_custom_fields.sql** - Extensibility

### Phase 4: Analytics & Compliance (Week 5-6)

10. **011_create_analytics_tables.sql** - Analytics infrastructure
11. **012_create_data_retention.sql** - GDPR compliance
12. **013_enable_rls.sql** - Row level security

### Phase 5: Optimization (Week 7-8)

13. **014_partition_large_tables.sql** - Table partitioning
14. **015_materialized_views.sql** - Analytics views

---

## 8. Implementation Checklist

### Schema Completeness

- [ ] All tables have `created_at` and `updated_at`
- [ ] All tables have `created_by` and `updated_by` where applicable
- [ ] Soft delete columns added to all data tables
- [ ] All foreign keys have proper indexes
- [ ] Unique constraints prevent duplicates
- [ ] Check constraints validate data

### Audit & Compliance

- [ ] `admin_audit_log` table created
- [ ] Audit triggers on critical tables
- [ ] Data retention policies table
- [ ] Data export request tracking
- [ ] RLS policies implemented and tested

### Performance

- [ ] GIN indexes on JSONB columns
- [ ] Partial indexes for soft deletes
- [ ] Composite indexes for common queries
- [ ] Table partitioning for large tables (>10M rows)
- [ ] Materialized views for analytics

### Security

- [ ] RLS enabled on all tenant tables
- [ ] API keys table with rate limiting
- [ ] Login attempts tracking
- [ ] Security events logging

---

## 9. Query Optimization Examples

### Before: N+1 Query Problem
```sql
-- Get projects with counts (N+1 queries)
SELECT * FROM projects WHERE owner_org_id = $1;
-- For each project:
SELECT COUNT(*) FROM guests WHERE project_id = $1;
SELECT COUNT(*) FROM invites WHERE project_id = $1;
```

### After: Single Query with CTEs
```sql
WITH project_stats AS (
  SELECT 
    p.*,
    COUNT(DISTINCT g.id) as guest_count,
    COUNT(DISTINCT i.id) as invite_count
  FROM projects p
  LEFT JOIN guests g ON g.project_id = p.id AND g.deleted_at IS NULL
  LEFT JOIN invites i ON i.project_id = p.id
  WHERE p.owner_org_id = $1 AND p.deleted_at IS NULL
  GROUP BY p.id
)
SELECT * FROM project_stats;
```

---

## 10. Monitoring & Maintenance

### Regular Maintenance Tasks

```sql
-- Weekly: Update statistics
ANALYZE;

-- Monthly: Reindex if needed
REINDEX INDEX CONCURRENTLY idx_guests_name_search;

-- Quarterly: Archive old audit logs
INSERT INTO admin_audit_log_archive 
SELECT * FROM admin_audit_log 
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM admin_audit_log 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Monitoring Queries

```sql
-- Table sizes
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries (requires pg_stat_statements)
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 11. Summary

This improvement plan transforms the EIOS database from a well-designed MVP schema to an enterprise-grade foundation. Key deliverables:

1. **16 new migration files** implementing all recommendations
2. **Complete audit trail** for compliance (SOC 2, GDPR)
3. **Row Level Security** for multi-tenant isolation
4. **Soft delete pattern** for data recovery
5. **Analytics infrastructure** for business insights
6. **Performance optimizations** for scale

**Estimated Implementation Time:** 6-8 weeks  
**Risk Level:** Low (non-breaking additive changes)  
**Rollback Strategy:** Each migration reversible with down scripts
