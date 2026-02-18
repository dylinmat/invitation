-- Migration: Create API Keys Table
-- Created: 2026-02-17
-- Description: API key management for programmatic access

-- =====================================================
-- API Keys Table
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Key identification (hashed for security)
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "eios_pk_")
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the full key
  
  -- Key metadata
  name TEXT NOT NULL, -- Human-readable name
  description TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}', -- ['read:guests', 'write:invites', 'admin']
  
  -- Rate limiting
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER NOT NULL DEFAULT 0,
  
  -- Security
  ip_allowlist INET[], -- NULL = any IP
  ip_denylist INET[],
  
  -- Status
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_reason TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_key_prefix CHECK (key_prefix ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT positive_rate_limits CHECK (
    rate_limit_per_minute > 0 AND 
    rate_limit_per_hour > 0 AND 
    rate_limit_per_day > 0
  )
);

-- =====================================================
-- API Key Usage Log
-- =====================================================

CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  
  -- Performance
  request_started_at TIMESTAMPTZ NOT NULL,
  request_completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- API key lookups
CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) 
  WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Active keys for validation
CREATE INDEX idx_api_keys_active ON api_keys(id) 
  WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Usage tracking
CREATE INDEX idx_api_key_usage_key ON api_key_usage(api_key_id, created_at DESC);
CREATE INDEX idx_api_key_usage_endpoint ON api_key_usage(endpoint, created_at DESC);
CREATE INDEX idx_api_key_usage_time ON api_key_usage(created_at);

-- =====================================================
-- API Key Rate Limit Tracking (for enforcement)
-- =====================================================

CREATE TABLE IF NOT EXISTS api_key_rate_limit_status (
  api_key_id UUID PRIMARY KEY REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Minute window
  minute_window_start TIMESTAMPTZ NOT NULL,
  minute_request_count INTEGER NOT NULL DEFAULT 0,
  
  -- Hour window
  hour_window_start TIMESTAMPTZ NOT NULL,
  hour_request_count INTEGER NOT NULL DEFAULT 0,
  
  -- Day window
  day_window_start TIMESTAMPTZ NOT NULL,
  day_request_count INTEGER NOT NULL DEFAULT 0,
  
  -- Last updated
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Generate a new API key (returns the plain key - store it safely!)
CREATE OR REPLACE FUNCTION generate_api_key(
  p_org_id UUID,
  p_name TEXT,
  p_scopes TEXT[],
  p_rate_limit_per_minute INTEGER DEFAULT 60,
  p_rate_limit_per_hour INTEGER DEFAULT 1000,
  p_rate_limit_per_day INTEGER DEFAULT 10000,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(key_id UUID, plain_key TEXT, key_prefix TEXT) AS $$
DECLARE
  v_key_id UUID;
  v_plain_key TEXT;
  v_prefix TEXT;
  v_hash TEXT;
BEGIN
  -- Generate key
  v_prefix := 'eios_' || lower(substring(md5(random()::text) from 1 for 4)) || '_';
  v_plain_key := v_prefix || encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_plain_key, 'sha256'), 'hex');
  
  -- Insert
  INSERT INTO api_keys (
    org_id,
    key_prefix,
    key_hash,
    name,
    scopes,
    rate_limit_per_minute,
    rate_limit_per_hour,
    rate_limit_per_day,
    expires_at
  ) VALUES (
    p_org_id,
    substring(v_plain_key from 1 for 12),
    v_hash,
    p_name,
    p_scopes,
    p_rate_limit_per_minute,
    p_rate_limit_per_hour,
    p_rate_limit_per_day,
    p_expires_at
  )
  RETURNING id INTO v_key_id;
  
  RETURN QUERY SELECT v_key_id, v_plain_key, v_prefix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke an API key
CREATE OR REPLACE FUNCTION revoke_api_key(
  p_key_id UUID,
  p_revoked_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE api_keys SET
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoked_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_key_id AND revoked_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Check rate limit for an API key
CREATE OR REPLACE FUNCTION check_api_key_rate_limit(
  p_key_id UUID
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, retry_after INTEGER) AS $$
DECLARE
  v_key RECORD;
  v_status RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get key details
  SELECT * INTO v_key FROM api_keys 
  WHERE id = p_key_id AND revoked_at IS NULL 
  AND (expires_at IS NULL OR expires_at > v_now);
  
  IF v_key IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Key revoked or expired'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Get or create rate limit status
  SELECT * INTO v_status FROM api_key_rate_limit_status 
  WHERE api_key_id = p_key_id;
  
  IF v_status IS NULL THEN
    INSERT INTO api_key_rate_limit_status (
      api_key_id, minute_window_start, hour_window_start, day_window_start
    ) VALUES (p_key_id, v_now, v_now, v_now);
    v_status := ROW(p_key_id, v_now, 0, v_now, 0, v_now, 0, v_now);
  END IF;
  
  -- Reset windows if needed
  IF v_status.minute_window_start < v_now - INTERVAL '1 minute' THEN
    v_status.minute_window_start := v_now;
    v_status.minute_request_count := 0;
  END IF;
  
  IF v_status.hour_window_start < v_now - INTERVAL '1 hour' THEN
    v_status.hour_window_start := v_now;
    v_status.hour_request_count := 0;
  END IF;
  
  IF v_status.day_window_start < v_now - INTERVAL '1 day' THEN
    v_status.day_window_start := v_now;
    v_status.day_request_count := 0;
  END IF;
  
  -- Check limits
  IF v_status.minute_request_count >= v_key.rate_limit_per_minute THEN
    RETURN QUERY SELECT FALSE, 'Rate limit exceeded (per minute)'::TEXT, 
      EXTRACT(EPOCH FROM (v_status.minute_window_start + INTERVAL '1 minute' - v_now))::INTEGER;
    RETURN;
  END IF;
  
  IF v_status.hour_request_count >= v_key.rate_limit_per_hour THEN
    RETURN QUERY SELECT FALSE, 'Rate limit exceeded (per hour)'::TEXT,
      EXTRACT(EPOCH FROM (v_status.hour_window_start + INTERVAL '1 hour' - v_now))::INTEGER;
    RETURN;
  END IF;
  
  IF v_status.day_request_count >= v_key.rate_limit_per_day THEN
    RETURN QUERY SELECT FALSE, 'Rate limit exceeded (per day)'::TEXT,
      EXTRACT(EPOCH FROM (v_status.day_window_start + INTERVAL '1 day' - v_now))::INTEGER;
    RETURN;
  END IF;
  
  -- Update counts
  UPDATE api_key_rate_limit_status SET
    minute_request_count = v_status.minute_request_count + 1,
    hour_request_count = v_status.hour_request_count + 1,
    day_request_count = v_status.day_request_count + 1,
    updated_at = v_now
  WHERE api_key_id = p_key_id;
  
  RETURN QUERY SELECT TRUE, NULL::TEXT, 0;
END;
$$ LANGUAGE plpgsql;

-- Note: Requires pgcrypto extension
create extension if not exists "pgcrypto";
