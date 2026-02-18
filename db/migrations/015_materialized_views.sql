-- Migration: Materialized Views for Analytics
-- Created: 2026-02-17
-- Description: Pre-computed analytics views for performance

-- =====================================================
-- Guest Summary by Project
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_guest_summary_by_project AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.owner_org_id as org_id,
  COUNT(DISTINCT g.id) as total_guests,
  COUNT(DISTINCT g.id) FILTER (WHERE g.deleted_at IS NULL) as active_guests,
  COUNT(DISTINCT g.id) FILTER (WHERE g.deleted_at IS NOT NULL) as deleted_guests,
  COUNT(DISTINCT gg.id) as total_groups,
  COUNT(DISTINCT gc.id) as total_contacts,
  COUNT(DISTINCT gc.id) FILTER (WHERE gc.email IS NOT NULL) as guests_with_email,
  COUNT(DISTINCT gta.tag_id) as tags_used,
  MAX(g.created_at) as last_guest_added_at
FROM projects p
LEFT JOIN guests g ON g.project_id = p.id
LEFT JOIN guest_groups gg ON gg.project_id = p.id AND gg.deleted_at IS NULL
LEFT JOIN guest_contacts gc ON gc.guest_id = g.id
LEFT JOIN guest_tag_assignments gta ON gta.guest_id = g.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.owner_org_id;

CREATE UNIQUE INDEX idx_mv_guest_summary_project ON mv_guest_summary_by_project(project_id);
CREATE INDEX idx_mv_guest_summary_org ON mv_guest_summary_by_project(org_id);

-- =====================================================
-- RSVP Summary by Form
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_rsvp_summary_by_form AS
SELECT 
  rf.id as form_id,
  rf.name as form_name,
  rf.project_id,
  p.owner_org_id as org_id,
  COUNT(DISTINCT rs.id) as total_submissions,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.submitted_at > NOW() - INTERVAL '7 days') as submissions_last_7_days,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.submitted_at > NOW() - INTERVAL '30 days') as submissions_last_30_days,
  COUNT(DISTINCT rs.guest_id) as unique_guests,
  COUNT(DISTINCT rs.invite_id) as unique_invites,
  MIN(rs.submitted_at) as first_submission_at,
  MAX(rs.submitted_at) as last_submission_at
FROM rsvp_forms rf
JOIN projects p ON rf.project_id = p.id
LEFT JOIN rsvp_submissions rs ON rs.form_id = rf.id
WHERE rf.deleted_at IS NULL
GROUP BY rf.id, rf.name, rf.project_id, p.owner_org_id;

CREATE UNIQUE INDEX idx_mv_rsvp_summary_form ON mv_rsvp_summary_by_form(form_id);
CREATE INDEX idx_mv_rsvp_summary_project ON mv_rsvp_summary_by_form(project_id);

-- =====================================================
-- Invite Performance Summary
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_invite_performance AS
SELECT 
  i.project_id,
  p.owner_org_id as org_id,
  COUNT(DISTINCT i.id) as total_invites,
  COUNT(DISTINCT i.id) FILTER (WHERE i.revoked_at IS NULL AND (i.expires_at IS NULL OR i.expires_at > NOW())) as active_invites,
  COUNT(DISTINCT i.id) FILTER (WHERE i.revoked_at IS NOT NULL) as revoked_invites,
  COUNT(DISTINCT i.id) FILTER (WHERE i.access_count > 0) as opened_invites,
  AVG(i.access_count) FILTER (WHERE i.access_count > 0) as avg_opens_per_invite,
  MAX(i.last_accessed_at) as last_invite_opened_at,
  COUNT(DISTINCT ial.id) as total_access_logs
FROM invites i
JOIN projects p ON i.project_id = p.id
LEFT JOIN invite_access_logs ial ON ial.invite_id = i.id
GROUP BY i.project_id, p.owner_org_id;

CREATE UNIQUE INDEX idx_mv_invite_performance_project ON mv_invite_performance(project_id);
CREATE INDEX idx_mv_invite_performance_org ON mv_invite_performance(org_id);

-- =====================================================
-- Messaging Campaign Performance
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_messaging_performance AS
SELECT 
  mc.id as campaign_id,
  mc.project_id,
  p.owner_org_id as org_id,
  mc.channel,
  mc.status as campaign_status,
  COUNT(DISTINCT mj.id) as total_jobs,
  COUNT(DISTINCT mj.id) FILTER (WHERE mj.status = 'SENT') as sent_count,
  COUNT(DISTINCT mj.id) FILTER (WHERE mj.status = 'FAILED') as failed_count,
  COUNT(DISTINCT mj.id) FILTER (WHERE mj.status = 'QUEUED') as queued_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'delivered') as delivered_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'opened') as opened_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'bounced') as bounced_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'complained') as complained_count,
  ROUND(
    COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'delivered') * 100.0 / 
    NULLIF(COUNT(DISTINCT mj.id) FILTER (WHERE mj.status = 'SENT'), 0),
    2
  ) as delivery_rate_pct,
  ROUND(
    COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'opened') * 100.0 / 
    NULLIF(COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'delivered'), 0),
    2
  ) as open_rate_pct
FROM messaging_campaigns mc
JOIN projects p ON mc.project_id = p.id
LEFT JOIN message_jobs mj ON mj.campaign_id = mc.id
LEFT JOIN message_events me ON me.message_job_id = mj.id
WHERE mc.deleted_at IS NULL
GROUP BY mc.id, mc.project_id, p.owner_org_id, mc.channel, mc.status;

CREATE UNIQUE INDEX idx_mv_messaging_campaign ON mv_messaging_performance(campaign_id);
CREATE INDEX idx_mv_messaging_project ON mv_messaging_performance(project_id);

-- =====================================================
-- Photo Wall Activity Summary
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_photo_wall_summary AS
SELECT 
  pu.project_id,
  p.owner_org_id as org_id,
  COUNT(DISTINCT pu.id) as total_uploads,
  COUNT(DISTINCT pu.id) FILTER (WHERE pu.status = 'PENDING') as pending_count,
  COUNT(DISTINCT pu.id) FILTER (WHERE pu.status = 'APPROVED') as approved_count,
  COUNT(DISTINCT pu.id) FILTER (WHERE pu.status = 'REJECTED') as rejected_count,
  COUNT(DISTINCT pu.guest_id) as unique_uploaders,
  COUNT(DISTINCT pl.id) as total_likes,
  COALESCE(SUM(pu.file_size_bytes), 0) as total_storage_bytes,
  AVG(pu.file_size_bytes) FILTER (WHERE pu.file_size_bytes IS NOT NULL) as avg_file_size_bytes,
  MAX(pu.created_at) as last_upload_at
FROM photo_uploads pu
JOIN projects p ON pu.project_id = p.id
LEFT JOIN photo_likes pl ON pl.photo_id = pu.id
WHERE pu.deleted_at IS NULL
GROUP BY pu.project_id, p.owner_org_id;

CREATE UNIQUE INDEX idx_mv_photo_wall_project ON mv_photo_wall_summary(project_id);
CREATE INDEX idx_mv_photo_wall_org ON mv_photo_wall_summary(org_id);

-- =====================================================
-- Organization Dashboard Summary
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_org_dashboard AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.type as org_type,
  COUNT(DISTINCT p.id) FILTER (WHERE p.deleted_at IS NULL) as total_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL) as active_projects,
  COUNT(DISTINCT om.user_id) as total_members,
  COUNT(DISTINCT g.id) as total_guests,
  COUNT(DISTINCT i.id) as total_invites,
  COUNT(DISTINCT mc.id) as total_campaigns,
  COUNT(DISTINCT s.id) as total_sites,
  MAX(p.created_at) as last_project_created_at,
  MAX(g.created_at) as last_guest_added_at
FROM organizations o
LEFT JOIN projects p ON p.owner_org_id = o.id
LEFT JOIN organization_members om ON om.org_id = o.id
LEFT JOIN guests g ON g.project_id = p.id AND g.deleted_at IS NULL
LEFT JOIN invites i ON i.project_id = p.id
LEFT JOIN messaging_campaigns mc ON mc.project_id = p.id AND mc.deleted_at IS NULL
LEFT JOIN sites s ON s.project_id = p.id AND s.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.type;

CREATE UNIQUE INDEX idx_mv_org_dashboard ON mv_org_dashboard(org_id);

-- =====================================================
-- Refresh Function
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE(view_name TEXT, duration_ms INTEGER) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
BEGIN
  -- Guest summary
  v_start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_guest_summary_by_project;
  RETURN QUERY SELECT 'mv_guest_summary_by_project'::TEXT, 
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
  
  -- RSVP summary
  v_start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rsvp_summary_by_form;
  RETURN QUERY SELECT 'mv_rsvp_summary_by_form'::TEXT, 
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
  
  -- Invite performance
  v_start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_invite_performance;
  RETURN QUERY SELECT 'mv_invite_performance'::TEXT, 
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
  
  -- Messaging performance
  v_start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_messaging_performance;
  RETURN QUERY SELECT 'mv_messaging_performance'::TEXT, 
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
  
  -- Photo wall
  v_start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_photo_wall_summary;
  RETURN QUERY SELECT 'mv_photo_wall_summary'::TEXT, 
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
  
  -- Org dashboard
  v_start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_org_dashboard;
  RETURN QUERY SELECT 'mv_org_dashboard'::TEXT, 
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- View: Materialized View Status
-- =====================================================

CREATE OR REPLACE VIEW materialized_view_status AS
SELECT 
  schemaname,
  matviewname as view_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
  pg_total_relation_size(schemaname||'.'||matviewname) as size_bytes
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||matviewname) DESC;
