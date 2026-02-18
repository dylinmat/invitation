-- Migration: Add Critical Indexes for Performance
-- Created: 2026-02-18
-- Description: Adds indexes for foreign keys and frequently queried columns

-- =====================================================
-- CRITICAL: Project lookup indexes (every page load)
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner_org ON projects(owner_org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_manager_org ON projects(manager_org_id) WHERE manager_org_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status) WHERE status != 'DELETED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- =====================================================
-- CRITICAL: Guest lookup indexes (heavily used)
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guests_project ON guests(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guests_group ON guests(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guests_name_search ON guests(first_name, last_name);

-- =====================================================
-- CRITICAL: Invite indexes (token validation on every public access)
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_token ON invites(token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_project ON invites(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_guest ON invites(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_site ON invites(site_id);

-- =====================================================
-- CRITICAL: Site lookup indexes (subdomain resolution)
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_project ON sites(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_subdomain ON sites(subdomain_slug) WHERE subdomain_slug IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_custom_domain ON sites(custom_domain) WHERE custom_domain IS NOT NULL;

-- =====================================================
-- HIGH: Event indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_project ON events(project_id);

-- =====================================================
-- HIGH: Site version indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_versions_site ON site_versions(site_id);

-- =====================================================
-- HIGH: Guest groups indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_groups_project ON guest_groups(project_id);

-- =====================================================
-- HIGH: Guest contacts indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_contacts_guest ON guest_contacts(guest_id);

-- =====================================================
-- HIGH: Guest tag indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_tags_project ON guest_tags(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_tag_assignments_guest ON guest_tag_assignments(guest_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guest_tag_assignments_tag ON guest_tag_assignments(tag_id);

-- =====================================================
-- HIGH: RSVP indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_forms_project ON rsvp_forms(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_questions_form ON rsvp_questions(form_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_questions_event ON rsvp_questions(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_question_options_question ON rsvp_question_options(question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_submissions_form ON rsvp_submissions(form_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_submissions_invite ON rsvp_submissions(invite_id) WHERE invite_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_submissions_guest ON rsvp_submissions(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_answers_submission ON rsvp_answers(submission_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_answers_question ON rsvp_answers(question_id);

-- =====================================================
-- HIGH: Messaging indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messaging_campaigns_project ON messaging_campaigns(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_jobs_campaign ON message_jobs(campaign_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_jobs_guest ON message_jobs(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_events_job ON message_events(message_job_id);

-- =====================================================
-- HIGH: Seating indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_floor_plans_event ON floor_plans(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seating_tables_floor_plan ON seating_tables(floor_plan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seating_assignments_table ON seating_assignments(table_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seating_assignments_guest ON seating_assignments(guest_id);

-- =====================================================
-- HIGH: Check-in indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_in_records_event ON check_in_records(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_in_records_guest ON check_in_records(guest_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_in_records_checked_in_by ON check_in_records(checked_in_by) WHERE checked_in_by IS NOT NULL;

-- =====================================================
-- HIGH: Photo indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_project ON photo_uploads(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_guest ON photo_uploads(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_status ON photo_uploads(project_id, status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_likes_photo ON photo_likes(photo_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_likes_guest ON photo_likes(guest_id) WHERE guest_id IS NOT NULL;

-- =====================================================
-- HIGH: Organization indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_org ON organization_members(org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);

-- =====================================================
-- MEDIUM: Plan and settings indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plan_entitlements_plan ON plan_entitlements(plan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_plan_assignments_org ON org_plan_assignments(org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_plan_assignments_plan ON org_plan_assignments(plan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_plan_assignments_project ON project_plan_assignments(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_plan_assignments_plan ON project_plan_assignments(plan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_values_scope ON settings_values(scope, scope_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entitlement_overrides_scope ON entitlement_overrides(scope, scope_id);

-- =====================================================
-- MEDIUM: Invite access log indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_access_logs_invite ON invite_access_logs(invite_id);

-- =====================================================
-- MEDIUM: RSVP logic rules indexes
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_logic_rules_question ON rsvp_logic_rules(question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvp_logic_rules_depends ON rsvp_logic_rules(depends_on_question_id);

-- =====================================================
-- UNIQUE constraint indexes (for performance on lookups)
-- =====================================================
-- Note: These should already exist from PRIMARY KEY and UNIQUE constraints,
-- but included here for documentation
-- users(email) - Should have unique index
-- organizations(name) - If unique
-- plans(code) - Should have unique index
-- sites(subdomain_slug) - WHERE subdomain_slug IS NOT NULL
-- sites(custom_domain) - WHERE custom_domain IS NOT NULL
-- invites(token_hash) - Should have unique index
