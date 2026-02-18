-- Migration: Add Missing Constraints
-- Created: 2026-02-17
-- Description: Adds unique and check constraints for data integrity

-- =====================================================
-- Unique Constraints
-- =====================================================

-- Prevent duplicate organization memberships
ALTER TABLE organization_members 
  DROP CONSTRAINT IF EXISTS unique_org_member,
  ADD CONSTRAINT unique_org_member UNIQUE (org_id, user_id);

-- Prevent duplicate settings per scope
ALTER TABLE settings_values 
  DROP CONSTRAINT IF EXISTS unique_setting_scope,
  ADD CONSTRAINT unique_setting_scope UNIQUE (scope, scope_id, key);

-- Prevent duplicate entitlement overrides per scope
ALTER TABLE entitlement_overrides 
  DROP CONSTRAINT IF EXISTS unique_entitlement_scope,
  ADD CONSTRAINT unique_entitlement_scope UNIQUE (scope, scope_id, key);

-- Prevent duplicate photo likes
-- Note: Already has UNIQUE (photo_id, guest_id) in schema

-- Prevent duplicate seating assignments at same seat
-- Note: Already has UNIQUE (table_id, seat_number) in schema

-- Prevent duplicate check-ins
-- Note: Already has UNIQUE (event_id, guest_id) in schema

-- =====================================================
-- Check Constraints
-- =====================================================

-- Events: end date must be after start date
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS check_event_dates,
  ADD CONSTRAINT check_event_dates 
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at);

-- Guests: at least one name field required
ALTER TABLE guests 
  DROP CONSTRAINT IF EXISTS check_guest_names,
  ADD CONSTRAINT check_guest_names 
    CHECK (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Guest contacts: at least email or phone required
ALTER TABLE guest_contacts 
  DROP CONSTRAINT IF EXISTS check_contact_info,
  ADD CONSTRAINT check_contact_info 
    CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Plans: valid date ranges
ALTER TABLE org_plan_assignments 
  DROP CONSTRAINT IF EXISTS check_plan_dates,
  ADD CONSTRAINT check_plan_dates 
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at);

ALTER TABLE project_plan_assignments 
  DROP CONSTRAINT IF EXISTS check_project_plan_dates,
  ADD CONSTRAINT check_project_plan_dates 
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at);

-- Invites: expires_at must be in the future when set
-- Note: This is a business rule, not a constraint (can change over time)

-- Sites: subdomain must be lowercase alphanumeric with hyphens
ALTER TABLE sites 
  DROP CONSTRAINT IF EXISTS check_subdomain_format,
  ADD CONSTRAINT check_subdomain_format 
    CHECK (subdomain_slug IS NULL OR subdomain_slug ~ '^[a-z0-9-]+$');

-- Message jobs: valid status values
ALTER TABLE message_jobs 
  DROP CONSTRAINT IF EXISTS check_message_job_status,
  ADD CONSTRAINT check_message_job_status 
    CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'RETRYING', 'CANCELLED'));

-- Photo uploads: valid file size
ALTER TABLE photo_uploads 
  DROP CONSTRAINT IF EXISTS check_file_size,
  ADD CONSTRAINT check_file_size 
    CHECK (file_size_bytes IS NULL OR file_size_bytes > 0);

-- =====================================================
-- Foreign Key Constraint Improvements
-- =====================================================

-- Ensure org_plan_assignments cascades properly
ALTER TABLE org_plan_assignments 
  DROP CONSTRAINT IF EXISTS org_plan_assignments_plan_id_fkey,
  ADD CONSTRAINT org_plan_assignments_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Ensure project_plan_assignments cascades properly  
ALTER TABLE project_plan_assignments 
  DROP CONSTRAINT IF EXISTS project_plan_assignments_plan_id_fkey,
  ADD CONSTRAINT project_plan_assignments_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- =====================================================
-- NOT NULL Constraints (for critical fields)
-- =====================================================

-- Ensure all timestamps have defaults
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE organizations ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE projects ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE projects ALTER COLUMN updated_at SET NOT NULL;

-- Note: Existing NULL values may cause errors - run cleanup first if needed
-- UPDATE table SET created_at = NOW() WHERE created_at IS NULL;
