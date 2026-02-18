-- Migration: Create Admin Audit Log
-- Created: 2026-02-17
-- Description: Audit logging infrastructure for compliance

-- =====================================================
-- Core Audit Log Table
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor information
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_ip_address INET,
  actor_user_agent TEXT,
  
  -- Organization/Project context
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Action details
  action_category TEXT NOT NULL, -- 'PROJECT', 'GUEST', 'INVITE', 'SETTINGS', 'AUTH', 'BILLING', 'SYSTEM'
  action TEXT NOT NULL, -- 'CREATED', 'UPDATED', 'DELETED', 'VIEWED', 'EXPORTED', etc.
  
  -- Target information
  target_type TEXT NOT NULL, -- table name or entity type
  target_id UUID,
  target_display_name TEXT, -- human-readable identifier
  
  -- Change tracking
  previous_values JSONB,
  new_values JSONB,
  changed_fields TEXT[], -- list of fields that changed
  
  -- Additional context
  metadata JSONB, -- flexible additional data
  correlation_id TEXT, -- for tracing related actions
  session_id TEXT, -- for grouping actions in a session
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (action IN (
    'CREATED', 'UPDATED', 'DELETED', 'ARCHIVED', 'RESTORED',
    'VIEWED', 'EXPORTED', 'IMPORTED', 'SENT', 'REVOKED',
    'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGED',
    'SETTINGS_CHANGED', 'PERMISSION_CHANGED', 'OWNERSHIP_TRANSFERRED'
  ))
);

-- =====================================================
-- Indexes for Audit Log
-- =====================================================

-- Primary lookup by actor
CREATE INDEX idx_audit_log_actor ON admin_audit_log(actor_user_id, created_at DESC);

-- Lookup by organization
CREATE INDEX idx_audit_log_org ON admin_audit_log(org_id, created_at DESC) 
  WHERE org_id IS NOT NULL;

-- Lookup by project
CREATE INDEX idx_audit_log_project ON admin_audit_log(project_id, created_at DESC) 
  WHERE project_id IS NOT NULL;

-- Lookup by target (for "show me history of this record")
CREATE INDEX idx_audit_log_target ON admin_audit_log(target_type, target_id, created_at DESC);

-- Lookup by action category
CREATE INDEX idx_audit_log_category ON admin_audit_log(action_category, created_at DESC);

-- Lookup by correlation ID (for tracing)
CREATE INDEX idx_audit_log_correlation ON admin_audit_log(correlation_id) 
  WHERE correlation_id IS NOT NULL;

-- Time-based queries for data retention
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at);

-- =====================================================
-- Audit Log Archive Table (for old records)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_log_archive (
  LIKE admin_audit_log INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition the archive by year for better performance
-- Note: This creates inheritance-based partitioning
-- Consider native partitioning for PostgreSQL 11+

-- =====================================================
-- Helper Function: Log Audit Event
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_user_id UUID,
  p_action_category TEXT,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_previous_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_correlation_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user email for denormalization
  SELECT email INTO v_user_email 
  FROM users WHERE id = p_actor_user_id;
  
  INSERT INTO admin_audit_log (
    actor_user_id,
    actor_email,
    action_category,
    action,
    target_type,
    target_id,
    previous_values,
    new_values,
    changed_fields,
    metadata,
    correlation_id
  ) VALUES (
    p_actor_user_id,
    v_user_email,
    p_action_category,
    p_action,
    p_target_type,
    p_target_id,
    p_previous_values,
    p_new_values,
    CASE 
      WHEN p_previous_values IS NOT NULL AND p_new_values IS NOT NULL 
      THEN ARRAY(
        SELECT jsonb_object_keys(p_new_values) 
        INTERSECT 
        SELECT jsonb_object_keys(p_previous_values)
      )
      ELSE NULL
    END,
    p_metadata,
    p_correlation_id
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Helper Function: Get Changed Fields
-- =====================================================

CREATE OR REPLACE FUNCTION get_changed_fields(
  old_record JSONB,
  new_record JSONB
)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT key
    FROM jsonb_each(old_record) AS old_data(key, value)
    FULL OUTER JOIN jsonb_each(new_record) AS new_data(key, value)
    ON old_data.key = new_data.key
    WHERE old_data.value IS DISTINCT FROM new_data.value
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- View: Recent Audit Summary
-- =====================================================

CREATE OR REPLACE VIEW audit_summary_recent AS
SELECT 
  action_category,
  action,
  target_type,
  COUNT(*) as action_count,
  DATE_TRUNC('hour', created_at) as hour_bucket
FROM admin_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_category, action, target_type, DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC, action_count DESC;
