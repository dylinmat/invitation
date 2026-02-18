-- Migration: Create Analytics Tables
-- Created: 2026-02-17
-- Description: Analytics infrastructure for business intelligence

-- =====================================================
-- Daily Statistics Aggregates
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Date dimensions
  date DATE NOT NULL,
  date_year INTEGER NOT NULL,
  date_month INTEGER NOT NULL,
  date_week INTEGER NOT NULL,
  date_day_of_week INTEGER NOT NULL,
  
  -- Organization (NULL for platform-wide stats)
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Guest metrics
  guests_created INTEGER NOT NULL DEFAULT 0,
  guests_active INTEGER NOT NULL DEFAULT 0, -- Guests with activity
  guests_deleted INTEGER NOT NULL DEFAULT 0,
  total_guests INTEGER NOT NULL DEFAULT 0, -- Running total
  
  -- Invite metrics
  invites_created INTEGER NOT NULL DEFAULT 0,
  invites_sent INTEGER NOT NULL DEFAULT 0,
  invites_opened INTEGER NOT NULL DEFAULT 0,
  total_invites INTEGER NOT NULL DEFAULT 0,
  
  -- RSVP metrics
  rsvp_submissions INTEGER NOT NULL DEFAULT 0,
  rsvp_yes_count INTEGER NOT NULL DEFAULT 0,
  rsvp_no_count INTEGER NOT NULL DEFAULT 0,
  rsvp_pending_count INTEGER NOT NULL DEFAULT 0,
  
  -- Site metrics
  site_visits INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  
  -- Photo metrics
  photos_uploaded INTEGER NOT NULL DEFAULT 0,
  photos_approved INTEGER NOT NULL DEFAULT 0,
  photos_rejected INTEGER NOT NULL DEFAULT 0,
  
  -- Messaging metrics
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_delivered INTEGER NOT NULL DEFAULT 0,
  messages_failed INTEGER NOT NULL DEFAULT 0,
  
  -- User engagement
  active_users INTEGER NOT NULL DEFAULT 0, -- Users who logged in
  new_users INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_daily_stats UNIQUE (date, org_id)
);

-- =====================================================
-- Hourly Stats (for real-time dashboards)
-- =====================================================

CREATE TABLE IF NOT EXISTS hourly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  hour TIMESTAMPTZ NOT NULL, -- Truncated to hour
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Metrics (simpler than daily)
  guests_created INTEGER NOT NULL DEFAULT 0,
  rsvp_submissions INTEGER NOT NULL DEFAULT 0,
  site_visits INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_hourly_stats UNIQUE (hour, org_id)
);

-- =====================================================
-- Project-Level Analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS project_analytics (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Counters
  total_guests INTEGER NOT NULL DEFAULT 0,
  total_invites INTEGER NOT NULL DEFAULT 0,
  total_invites_sent INTEGER NOT NULL DEFAULT 0,
  total_invites_opened INTEGER NOT NULL DEFAULT 0,
  total_rsvp_submissions INTEGER NOT NULL DEFAULT 0,
  total_site_visits INTEGER NOT NULL DEFAULT 0,
  total_photos INTEGER NOT NULL DEFAULT 0,
  total_messages_sent INTEGER NOT NULL DEFAULT 0,
  
  -- Rates
  rsvp_response_rate DECIMAL(5,2), -- Percentage
  invite_open_rate DECIMAL(5,2),
  message_delivery_rate DECIMAL(5,2),
  
  -- Timestamps
  last_guest_created_at TIMESTAMPTZ,
  last_invite_sent_at TIMESTAMPTZ,
  last_rsvp_at TIMESTAMPTZ,
  last_site_visit_at TIMESTAMPTZ,
  
  -- Computed
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- User Activity Summary
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_summary (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Login tracking
  first_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  total_logins INTEGER NOT NULL DEFAULT 0,
  
  -- Activity
  total_projects_created INTEGER NOT NULL DEFAULT 0,
  total_guests_added INTEGER NOT NULL DEFAULT 0,
  total_invites_sent INTEGER NOT NULL DEFAULT 0,
  total_messages_sent INTEGER NOT NULL DEFAULT 0,
  
  -- Time spent (if tracking enabled)
  total_session_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Computed
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Event Timeline (for activity feeds)
-- =====================================================

CREATE TABLE IF NOT EXISTS event_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Context
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Event
  event_type TEXT NOT NULL, -- 'GUEST_CREATED', 'RSVP_SUBMITTED', etc.
  event_category TEXT NOT NULL, -- 'GUEST', 'INVITE', 'RSVP', 'SYSTEM'
  
  -- Actor
  actor_type TEXT NOT NULL DEFAULT 'USER', -- 'USER', 'SYSTEM', 'API'
  actor_id UUID,
  actor_name TEXT, -- Denormalized for performance
  
  -- Target
  target_type TEXT, -- 'guest', 'invite', etc.
  target_id UUID,
  target_name TEXT, -- e.g., guest name
  
  -- Details
  details JSONB,
  is_important BOOLEAN NOT NULL DEFAULT FALSE, -- Highlight in UI
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Daily stats
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
CREATE INDEX idx_daily_stats_org ON daily_stats(org_id, date DESC);
CREATE INDEX idx_daily_stats_month ON daily_stats(date_year, date_month);

-- Hourly stats
CREATE INDEX idx_hourly_stats_hour ON hourly_stats(hour);
CREATE INDEX idx_hourly_stats_org ON hourly_stats(org_id, hour DESC);

-- Timeline
CREATE INDEX idx_event_timeline_org ON event_timeline(org_id, occurred_at DESC);
CREATE INDEX idx_event_timeline_project ON event_timeline(project_id, occurred_at DESC);
CREATE INDEX idx_event_timeline_type ON event_timeline(event_type, occurred_at DESC);
CREATE INDEX idx_event_timeline_important ON event_timeline(project_id, is_important, occurred_at DESC) 
  WHERE is_important = TRUE;

-- =====================================================
-- Materialized Views for Common Reports
-- =====================================================

-- Monthly rollup
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_stats AS
SELECT 
  date_year,
  date_month,
  org_id,
  SUM(guests_created) as total_guests_created,
  SUM(rsvp_submissions) as total_rsvp_submissions,
  SUM(site_visits) as total_site_visits,
  SUM(messages_sent) as total_messages_sent,
  MAX(total_guests) as ending_guest_count
FROM daily_stats
GROUP BY date_year, date_month, org_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_stats 
  ON monthly_stats(date_year, date_month, org_id);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats;
END;
$$ LANGUAGE plpgsql;

-- Record daily stats (idempotent - can be run multiple times per day)
CREATE OR REPLACE FUNCTION record_daily_stats(
  p_date DATE,
  p_org_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_stats_id UUID;
BEGIN
  INSERT INTO daily_stats (
    date,
    date_year,
    date_month,
    date_week,
    date_day_of_week,
    org_id,
    guests_created,
    total_guests
  )
  SELECT 
    p_date,
    EXTRACT(YEAR FROM p_date),
    EXTRACT(MONTH FROM p_date),
    EXTRACT(WEEK FROM p_date),
    EXTRACT(ISODOW FROM p_date),
    p_org_id,
    COALESCE((
      SELECT COUNT(*) FROM guests g
      JOIN projects p ON g.project_id = p.id
      WHERE p.owner_org_id = p_org_id
        AND DATE(g.created_at) = p_date
        AND g.deleted_at IS NULL
    ), 0),
    COALESCE((
      SELECT COUNT(*) FROM guests g
      JOIN projects p ON g.project_id = p.id
      WHERE p.owner_org_id = p_org_id
        AND DATE(g.created_at) <= p_date
        AND g.deleted_at IS NULL
    ), 0)
  ON CONFLICT (date, org_id) 
  DO UPDATE SET
    guests_created = EXCLUDED.guests_created,
    total_guests = EXCLUDED.total_guests,
    updated_at = NOW()
  RETURNING id INTO v_stats_id;
  
  RETURN v_stats_id;
END;
$$ LANGUAGE plpgsql;

-- Add event to timeline
CREATE OR REPLACE FUNCTION add_timeline_event(
  p_org_id UUID,
  p_project_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_actor_type TEXT,
  p_actor_id UUID,
  p_actor_name TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_name TEXT,
  p_details JSONB DEFAULT NULL,
  p_is_important BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO event_timeline (
    org_id,
    project_id,
    event_type,
    event_category,
    actor_type,
    actor_id,
    actor_name,
    target_type,
    target_id,
    target_name,
    details,
    is_important
  ) VALUES (
    p_org_id,
    p_project_id,
    p_event_type,
    p_event_category,
    p_actor_type,
    p_actor_id,
    p_actor_name,
    p_target_type,
    p_target_id,
    p_target_name,
    p_details,
    p_is_important
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;
