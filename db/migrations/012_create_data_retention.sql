-- Migration: Create Data Retention Tables
-- Created: 2026-02-17
-- Description: GDPR compliance and data retention policy management

-- =====================================================
-- Data Retention Policies
-- =====================================================

CREATE TYPE retention_action AS ENUM (
  'ANONYMIZE',  -- Remove PII but keep aggregate data
  'ARCHIVE',    -- Move to cold storage
  'DELETE',     -- Hard delete
  'NOTIFY'      -- Send notification only
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = platform default
  
  -- Policy definition
  policy_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'PROJECT', 'GUEST', 'USER', 'AUDIT_LOG', etc.
  
  -- Retention rules
  retention_period_days INTEGER NOT NULL,
  action retention_action NOT NULL DEFAULT 'ANONYMIZE',
  
  -- Conditions (JSON for flexibility)
  conditions JSONB DEFAULT '{}'::jsonb, -- e.g., {"status": "ARCHIVED"}
  
  -- Schedule
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Data Export Requests (GDPR Article 20)
-- =====================================================

CREATE TYPE export_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'READY',
  'EXPIRED',
  'FAILED'
);

CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Requester
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Scope
  export_type TEXT NOT NULL, -- 'USER_DATA', 'ORG_DATA', 'PROJECT_DATA'
  entity_id UUID, -- Project ID, Org ID, etc. (NULL for user-only data)
  
  -- Status
  status export_status NOT NULL DEFAULT 'PENDING',
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  file_size_bytes BIGINT,
  file_url TEXT, -- Signed URL (encrypted)
  checksum TEXT,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Data Deletion Requests (GDPR Article 17 - Right to be Forgotten)
-- =====================================================

CREATE TYPE deletion_status AS ENUM (
  'PENDING',
  'VERIFYING',     -- Waiting for confirmation
  'PROCESSING',    -- Actively deleting
  'COMPLETED',
  'FAILED',
  'REJECTED'
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Requester
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- For verification
  
  -- Scope
  deletion_type TEXT NOT NULL, -- 'USER_ACCOUNT', 'ORG_DATA', 'PROJECT_DATA'
  entity_id UUID, -- Org or Project ID
  
  -- Justification
  reason TEXT, -- User-provided reason
  legal_basis TEXT, -- 'GDPR_ARTICLE_17', 'CONTRACT_END', 'USER_REQUEST'
  
  -- Verification
  verification_token TEXT,
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Status
  status deletion_status NOT NULL DEFAULT 'PENDING',
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deleted_records JSONB, -- Log of what was deleted
  
  -- Admin review
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Anonymization Log (for audit trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS anonymization_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What was anonymized
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Anonymization details
  fields_anonymized TEXT[] NOT NULL,
  original_hash TEXT, -- Hash of original data (for verification)
  
  -- Context
  triggered_by TEXT NOT NULL, -- 'POLICY', 'USER_REQUEST', 'ADMIN'
  request_id UUID, -- Reference to deletion request if applicable
  
  -- Actor
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  anonymized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Data Retention Execution Log
-- =====================================================

CREATE TABLE IF NOT EXISTS data_retention_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  policy_id UUID NOT NULL REFERENCES data_retention_policies(id) ON DELETE CASCADE,
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Results
  entities_scanned INTEGER NOT NULL DEFAULT 0,
  entities_processed INTEGER NOT NULL DEFAULT 0,
  entities_failed INTEGER NOT NULL DEFAULT 0,
  
  -- Details
  details JSONB, -- Per-entity results
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Retention policies
CREATE INDEX idx_retention_policies_org ON data_retention_policies(org_id) WHERE is_active = TRUE;
CREATE INDEX idx_retention_policies_entity ON data_retention_policies(entity_type);

-- Export requests
CREATE INDEX idx_export_requests_user ON data_export_requests(user_id, requested_at DESC);
CREATE INDEX idx_export_requests_status ON data_export_requests(status) WHERE status IN ('PENDING', 'PROCESSING');

-- Deletion requests
CREATE INDEX idx_deletion_requests_user ON data_deletion_requests(user_id, requested_at DESC);
CREATE INDEX idx_deletion_requests_status ON data_deletion_requests(status) WHERE status IN ('PENDING', 'VERIFYING', 'PROCESSING');

-- Anonymization log
CREATE INDEX idx_anonymization_log_entity ON anonymization_log(entity_type, entity_id);
CREATE INDEX idx_anonymization_log_time ON anonymization_log(anonymized_at);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Anonymize a guest (GDPR compliant)
CREATE OR REPLACE FUNCTION anonymize_guest(
  p_guest_id UUID,
  p_actor_user_id UUID DEFAULT NULL,
  p_request_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get project ID for logging
  SELECT project_id INTO v_project_id FROM guests WHERE id = p_guest_id;
  
  -- Anonymize guest record
  UPDATE guests SET
    first_name = 'Anonymous',
    last_name = substring(md5(random()::text) from 1 for 8),
    deleted_at = NOW(),
    deleted_by = p_actor_user_id
  WHERE id = p_guest_id;
  
  -- Anonymize contacts
  UPDATE guest_contacts SET
    email = 'anonymous@deleted.local',
    phone = NULL
  WHERE guest_id = p_guest_id;
  
  -- Log the anonymization
  INSERT INTO anonymization_log (
    entity_type,
    entity_id,
    fields_anonymized,
    triggered_by,
    request_id,
    actor_user_id
  ) VALUES (
    'GUEST',
    p_guest_id,
    ARRAY['first_name', 'last_name', 'email', 'phone'],
    CASE WHEN p_request_id IS NOT NULL THEN 'USER_REQUEST' ELSE 'POLICY' END,
    p_request_id,
    p_actor_user_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a data export request
CREATE OR REPLACE FUNCTION request_data_export(
  p_user_id UUID,
  p_export_type TEXT,
  p_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_org_id UUID;
BEGIN
  -- Get user's org
  SELECT org_id INTO v_org_id 
  FROM organization_members 
  WHERE user_id = p_user_id 
  LIMIT 1;
  
  INSERT INTO data_export_requests (
    user_id,
    org_id,
    export_type,
    entity_id,
    expires_at
  ) VALUES (
    p_user_id,
    v_org_id,
    p_export_type,
    p_entity_id,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Create a deletion request
CREATE OR REPLACE FUNCTION request_data_deletion(
  p_user_id UUID,
  p_deletion_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_user_email TEXT;
  v_verification_token TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
  
  -- Generate verification token
  v_verification_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO data_deletion_requests (
    user_id,
    email,
    deletion_type,
    entity_id,
    reason,
    verification_token,
    verification_sent_at
  ) VALUES (
    p_user_id,
    v_user_email,
    p_deletion_type,
    p_entity_id,
    p_reason,
    v_verification_token,
    NOW()
  )
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Verify deletion request
CREATE OR REPLACE FUNCTION verify_deletion_request(
  p_request_id UUID,
  p_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE data_deletion_requests SET
    status = 'PROCESSING',
    verified_at = NOW(),
    started_at = NOW()
  WHERE id = p_request_id 
    AND verification_token = p_token 
    AND status = 'VERIFYING'
    AND verification_sent_at > NOW() - INTERVAL '24 hours';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Apply retention policy to a project
CREATE OR REPLACE FUNCTION apply_retention_policy(
  p_project_id UUID,
  p_policy_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_policy RECORD;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_policy FROM data_retention_policies WHERE id = p_policy_id;
  
  IF v_policy IS NULL THEN
    RAISE EXCEPTION 'Policy not found';
  END IF;
  
  -- Apply based on entity type
  CASE v_policy.entity_type
    WHEN 'GUEST' THEN
      SELECT COUNT(*) INTO v_count
      FROM guests g
      WHERE g.project_id = p_project_id
        AND g.created_at < NOW() - (v_policy.retention_period_days || ' days')::INTERVAL
        AND g.deleted_at IS NULL;
      
      IF v_policy.action = 'ANONYMIZE' THEN
        -- Anonymize matching guests
        PERFORM anonymize_guest(g.id)
        FROM guests g
        WHERE g.project_id = p_project_id
          AND g.created_at < NOW() - (v_policy.retention_period_days || ' days')::INTERVAL
          AND g.deleted_at IS NULL;
      END IF;
      
    WHEN 'AUDIT_LOG' THEN
      -- Archive old audit logs
      INSERT INTO admin_audit_log_archive
      SELECT *, NOW() as archived_at
      FROM admin_audit_log
      WHERE project_id = p_project_id
        AND created_at < NOW() - (v_policy.retention_period_days || ' days')::INTERVAL;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      
      DELETE FROM admin_audit_log
      WHERE project_id = p_project_id
        AND created_at < NOW() - (v_policy.retention_period_days || ' days')::INTERVAL;
        
    ELSE
      -- Handle other entity types
      NULL;
  END CASE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
