-- Migration: Create Webhooks Tables
-- Created: 2026-02-17
-- Description: Webhook configuration and delivery tracking

-- =====================================================
-- Webhook Configurations
-- =====================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Configuration
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- For HMAC signature
  
  -- Event filtering
  event_types TEXT[] NOT NULL, -- ['guest.created', 'rsvp.submitted', etc.]
  event_filter JSONB, -- Additional filtering: {"project_id": "uuid"}
  
  -- HTTP configuration
  http_method TEXT NOT NULL DEFAULT 'POST',
  http_headers JSONB DEFAULT '{}', -- Custom headers
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_multiplier": 2}'::jsonb,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ,
  deactivated_reason TEXT,
  
  -- Health tracking
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_url CHECK (url ~ '^https?://'),
  CONSTRAINT valid_http_method CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH')),
  CONSTRAINT positive_timeout CHECK (timeout_seconds > 0)
);

-- =====================================================
-- Webhook Deliveries (log of each attempt)
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_id UUID, -- ID of the entity that triggered the event
  payload JSONB NOT NULL,
  
  -- Delivery attempt
  attempt_number INTEGER NOT NULL DEFAULT 1,
  
  -- Request
  request_headers JSONB,
  request_body TEXT,
  
  -- Response
  response_status_code INTEGER,
  response_headers JSONB,
  response_body TEXT,
  
  -- Timing
  request_started_at TIMESTAMPTZ NOT NULL,
  request_completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Result
  is_success BOOLEAN,
  error_message TEXT,
  
  -- Retry tracking
  next_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Webhook Event Queue (for async processing)
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_event_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event details
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id UUID,
  payload JSONB NOT NULL,
  
  -- Processing
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  process_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Retry tracking
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_queue_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- =====================================================
-- Indexes
-- =====================================================

-- Webhook lookups
CREATE INDEX idx_webhooks_org ON webhooks(org_id) WHERE is_active = TRUE;
CREATE INDEX idx_webhooks_event_types ON webhooks USING GIN(event_types);

-- Delivery lookups
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type, created_at DESC);
CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(webhook_id, is_success) 
  WHERE is_success = FALSE;

-- Queue processing
CREATE INDEX idx_webhook_queue_pending ON webhook_event_queue(status, process_after) 
  WHERE status = 'PENDING';
CREATE INDEX idx_webhook_queue_org ON webhook_event_queue(org_id, status);

-- =====================================================
-- View: Webhook Health Summary
-- =====================================================

CREATE OR REPLACE VIEW webhook_health_summary AS
SELECT 
  w.id,
  w.org_id,
  w.name,
  w.url,
  w.is_active,
  w.consecutive_failures,
  w.last_success_at,
  w.last_failure_at,
  COUNT(d.id) FILTER (WHERE d.created_at > NOW() - INTERVAL '24 hours') as deliveries_24h,
  COUNT(d.id) FILTER (WHERE d.created_at > NOW() - INTERVAL '24 hours' AND d.is_success) as successful_24h,
  CASE 
    WHEN w.is_active = FALSE THEN 'DISABLED'
    WHEN w.consecutive_failures >= 5 THEN 'UNHEALTHY'
    WHEN w.consecutive_failures >= 3 THEN 'DEGRADED'
    ELSE 'HEALTHY'
  END as health_status
FROM webhooks w
LEFT JOIN webhook_deliveries d ON w.id = d.webhook_id
GROUP BY w.id, w.org_id, w.name, w.url, w.is_active, w.consecutive_failures, 
         w.last_success_at, w.last_failure_at;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Queue a webhook event
CREATE OR REPLACE FUNCTION queue_webhook_event(
  p_org_id UUID,
  p_event_type TEXT,
  p_event_id UUID,
  p_payload JSONB
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO webhook_event_queue (
    org_id,
    event_type,
    event_id,
    payload
  ) VALUES (
    p_org_id,
    p_event_type,
    p_event_id,
    p_payload
  )
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Deactivate a failing webhook
CREATE OR REPLACE FUNCTION deactivate_failing_webhook(
  p_webhook_id UUID,
  p_reason TEXT DEFAULT 'Too many consecutive failures'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE webhooks SET
    is_active = FALSE,
    deactivated_at = NOW(),
    deactivated_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_webhook_id AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Get webhooks for an event type
CREATE OR REPLACE FUNCTION get_webhooks_for_event(
  p_org_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(webhook_id UUID, url TEXT, secret TEXT, headers JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.url,
    w.secret,
    w.http_headers
  FROM webhooks w
  WHERE w.org_id = p_org_id
    AND w.is_active = TRUE
    AND p_event_type = ANY(w.event_types)
    AND (w.event_filter IS NULL OR w.event_filter <@ p_payload);
END;
$$ LANGUAGE plpgsql;
