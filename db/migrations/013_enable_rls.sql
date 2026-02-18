-- Migration: Enable Row Level Security
-- Created: 2026-02-17
-- Description: Multi-tenant isolation via PostgreSQL RLS

-- =====================================================
-- Enable RLS on Core Tables
-- =====================================================

-- Organizations (users can view their own orgs)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Guest Groups
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;

-- Guest Contacts
ALTER TABLE guest_contacts ENABLE ROW LEVEL SECURITY;

-- Guest Tags
ALTER TABLE guest_tags ENABLE ROW LEVEL SECURITY;

-- Guest Tag Assignments
ALTER TABLE guest_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Sites
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Site Versions
ALTER TABLE site_versions ENABLE ROW LEVEL SECURITY;

-- RSVP Forms
ALTER TABLE rsvp_forms ENABLE ROW LEVEL SECURITY;

-- RSVP Questions
ALTER TABLE rsvp_questions ENABLE ROW LEVEL SECURITY;

-- RSVP Submissions
ALTER TABLE rsvp_submissions ENABLE ROW LEVEL SECURITY;

-- RSVP Answers
ALTER TABLE rsvp_answers ENABLE ROW LEVEL SECURITY;

-- Messaging Campaigns
ALTER TABLE messaging_campaigns ENABLE ROW LEVEL SECURITY;

-- Message Jobs
ALTER TABLE message_jobs ENABLE ROW LEVEL SECURITY;

-- Floor Plans
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;

-- Seating Tables
ALTER TABLE seating_tables ENABLE ROW LEVEL SECURITY;

-- Seating Assignments
ALTER TABLE seating_assignments ENABLE ROW LEVEL SECURITY;

-- Check-in Records
ALTER TABLE check_in_records ENABLE ROW LEVEL SECURITY;

-- Photo Wall Settings
ALTER TABLE photo_wall_settings ENABLE ROW LEVEL SECURITY;

-- Photo Uploads
ALTER TABLE photo_uploads ENABLE ROW LEVEL SECURITY;

-- Photo Likes
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper Function: Get Current User's Org IDs
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_user_org_ids()
RETURNS UUID[] AS $$
DECLARE
  v_user_id UUID;
  v_org_ids UUID[];
BEGIN
  -- Get user ID from session variable
  BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN ARRAY[]::UUID[];
  END;
  
  -- Get all orgs the user is a member of
  SELECT array_agg(org_id) INTO v_org_ids
  FROM organization_members
  WHERE user_id = v_user_id;
  
  RETURN COALESCE(v_org_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Helper Function: Check if User is Org Member
-- =====================================================

CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_org_id = ANY(get_current_user_org_ids());
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Organizations: Users can view orgs they belong to
CREATE POLICY org_select_policy ON organizations
  FOR SELECT USING (
    deleted_at IS NULL 
    AND is_org_member(id)
  );

CREATE POLICY org_update_policy ON organizations
  FOR UPDATE USING (is_org_member(id));

-- Projects: Scoped by organization membership
CREATE POLICY project_select_policy ON projects
  FOR SELECT USING (
    deleted_at IS NULL 
    AND is_org_member(owner_org_id)
  );

CREATE POLICY project_insert_policy ON projects
  FOR INSERT WITH CHECK (is_org_member(owner_org_id));

CREATE POLICY project_update_policy ON projects
  FOR UPDATE USING (is_org_member(owner_org_id));

CREATE POLICY project_delete_policy ON projects
  FOR DELETE USING (is_org_member(owner_org_id));

-- Events: Scoped by project access
CREATE POLICY event_select_policy ON events
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = events.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY event_insert_policy ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = events.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY event_update_policy ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = events.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Guests: Scoped by project access
CREATE POLICY guest_select_policy ON guests
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = guests.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY guest_insert_policy ON guests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = guests.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY guest_update_policy ON guests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = guests.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY guest_delete_policy ON guests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = guests.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Guest Groups: Scoped by project
CREATE POLICY guest_group_select_policy ON guest_groups
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = guest_groups.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY guest_group_insert_policy ON guest_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = guest_groups.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Invites: Scoped by project
CREATE POLICY invite_select_policy ON invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = invites.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY invite_insert_policy ON invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = invites.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY invite_update_policy ON invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = invites.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Sites: Scoped by project
CREATE POLICY site_select_policy ON sites
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sites.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

CREATE POLICY site_insert_policy ON sites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sites.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Site Versions: Scoped by site ownership
CREATE POLICY site_version_select_policy ON site_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = site_versions.site_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- RSVP Forms: Scoped by project
CREATE POLICY rsvp_form_select_policy ON rsvp_forms
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rsvp_forms.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- RSVP Questions: Scoped by form ownership
CREATE POLICY rsvp_question_select_policy ON rsvp_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rsvp_forms f
      JOIN projects p ON f.project_id = p.id
      WHERE f.id = rsvp_questions.form_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- RSVP Submissions: Scoped by form ownership
CREATE POLICY rsvp_submission_select_policy ON rsvp_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rsvp_forms f
      JOIN projects p ON f.project_id = p.id
      WHERE f.id = rsvp_submissions.form_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Messaging Campaigns: Scoped by project
CREATE POLICY messaging_campaign_select_policy ON messaging_campaigns
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = messaging_campaigns.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- Photo Uploads: Scoped by project
CREATE POLICY photo_upload_select_policy ON photo_uploads
  FOR SELECT USING (
    deleted_at IS NULL 
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = photo_uploads.project_id
      AND is_org_member(p.owner_org_id)
    )
  );

-- =====================================================
-- Create Application User Setup Function
-- =====================================================

CREATE OR REPLACE FUNCTION set_app_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Force RLS for Table Owners
-- =====================================================

-- Ensure RLS applies to table owners too
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE guests FORCE ROW LEVEL SECURITY;
ALTER TABLE invites FORCE ROW LEVEL SECURITY;
ALTER TABLE sites FORCE ROW LEVEL SECURITY;
ALTER TABLE messaging_campaigns FORCE ROW LEVEL SECURITY;
ALTER TABLE photo_uploads FORCE ROW LEVEL SECURITY;
