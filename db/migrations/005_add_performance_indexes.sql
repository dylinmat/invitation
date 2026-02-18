-- Migration: Add Performance Indexes
-- Created: 2026-02-17
-- Description: Additional indexes for query optimization

-- =====================================================
-- GIN Indexes for JSONB Columns
-- =====================================================

-- Plan entitlements value lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plan_entitlements_value_gin 
  ON plan_entitlements USING GIN (value_json);

-- Entitlement overrides value lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entitlement_overrides_value_gin 
  ON entitlement_overrides USING GIN (value_json);

-- Settings values lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_values_value_gin 
  ON settings_values USING GIN (value);

-- Photo moderation score lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_moderation_gin 
  ON photo_uploads USING GIN (moderation_score) 
  WHERE moderation_score IS NOT NULL;

-- Message events metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_events_metadata_gin 
  ON message_events USING GIN (metadata) 
  WHERE metadata IS NOT NULL;

-- =====================================================
-- Composite Indexes for Common Queries
-- =====================================================

-- Guest list with project filter (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guests_project_name 
  ON guests (project_id, last_name, first_name) 
  WHERE deleted_at IS NULL;

-- RSVP submissions by form and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_submissions_form_date 
  ON rsvp_submissions (form_id, submitted_at DESC);

-- Photo uploads by project and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_project_status_date 
  ON photo_uploads (project_id, status, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Active invites lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_active 
  ON invites (token_hash, project_id) 
  WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Message jobs by campaign and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_jobs_campaign_status 
  ON message_jobs (campaign_id, status, created_at);

-- Site versions by site and version
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_versions_lookup 
  ON site_versions (site_id, version DESC);

-- =====================================================
-- Partial Indexes for Soft Deletes
-- =====================================================

-- Only index non-deleted organizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active_name 
  ON organizations (name) 
  WHERE deleted_at IS NULL;

-- Only index non-deleted guest groups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_groups_active 
  ON guest_groups (project_id, name) 
  WHERE deleted_at IS NULL;

-- =====================================================
-- Indexes for Date Range Queries
-- =====================================================

-- Event date lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_range 
  ON events (starts_at, ends_at) 
  WHERE deleted_at IS NULL;

-- Created at for recent items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created 
  ON projects (created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guests_created 
  ON guests (created_at DESC) 
  WHERE deleted_at IS NULL;

-- Invite access logs by time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_access_logs_time 
  ON invite_access_logs (accessed_at DESC);

-- Check-in records by time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_in_records_time 
  ON check_in_records (checked_in_at DESC);

-- =====================================================
-- Indexes for Analytics
-- =====================================================

-- RSVP answers by question for aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_answers_question 
  ON rsvp_answers (question_id, answer_text) 
  WHERE answer_text IS NOT NULL;

-- Photo likes by photo for counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_likes_count 
  ON photo_likes (photo_id);

-- Message events by type for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_events_type 
  ON message_events (event_type, event_at);

-- =====================================================
-- Indexes for Search
-- =====================================================

-- Guest name search (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guests_name_trgm 
  ON guests USING gin ((lower(first_name || ' ' || coalesce(last_name, ''))) gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- Guest email search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_contacts_email 
  ON guest_contacts (lower(email)) 
  WHERE email IS NOT NULL;

-- Note: Requires pg_trgm extension
create extension if not exists "pg_trgm";

-- =====================================================
-- Index Maintenance Recommendations
-- =====================================================

-- Monitor index usage with:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
-- FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
