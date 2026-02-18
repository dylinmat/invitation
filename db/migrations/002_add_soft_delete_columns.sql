-- Migration: Add Soft Delete Columns
-- Created: 2026-02-17
-- Description: Adds deleted_at and deleted_by columns for soft delete support

-- =====================================================
-- Core Tables - Soft Delete Support
-- =====================================================

-- Organizations
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Projects (already has status, adding deleted_at for consistency)
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Guests
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guests_deleted_at ON guests(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Events
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Sites
ALTER TABLE sites 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sites_deleted_at ON sites(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Guest Groups
ALTER TABLE guest_groups 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guest_groups_deleted_at ON guest_groups(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Guest Tags
ALTER TABLE guest_tags 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guest_tags_deleted_at ON guest_tags(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- RSVP Forms
ALTER TABLE rsvp_forms 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rsvp_forms_deleted_at ON rsvp_forms(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Messaging Campaigns
ALTER TABLE messaging_campaigns 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messaging_campaigns_deleted_at ON messaging_campaigns(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Photo Uploads
ALTER TABLE photo_uploads 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_photo_uploads_deleted_at ON photo_uploads(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Floor Plans
ALTER TABLE floor_plans 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_floor_plans_deleted_at ON floor_plans(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- =====================================================
-- Partial Indexes for Active Record Queries
-- =====================================================

-- These indexes optimize queries that only fetch non-deleted records
CREATE INDEX IF NOT EXISTS idx_guests_active ON guests(project_id, deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(owner_org_id, deleted_at) 
  WHERE deleted_at IS NULL AND status != 'DELETED';

CREATE INDEX IF NOT EXISTS idx_events_active ON events(project_id, deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(project_id, deleted_at) 
  WHERE deleted_at IS NULL;
