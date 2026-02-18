-- Migration: Create Audit Triggers
-- Created: 2026-02-17
-- Description: Automatic audit logging triggers for critical tables

-- =====================================================
-- Trigger Function: Generic Audit Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values JSONB := NULL;
  v_new_values JSONB := NULL;
  v_action TEXT;
  v_user_id UUID;
  v_correlation_id TEXT;
BEGIN
  -- Get current user from session variable (set by application)
  BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  -- Get correlation ID for request tracing
  BEGIN
    v_correlation_id := current_setting('app.correlation_id', true);
  EXCEPTION WHEN OTHERS THEN
    v_correlation_id := NULL;
  END;
  
  -- Determine action and values
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATED';
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATED';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETED';
    v_old_values := to_jsonb(OLD);
  END IF;
  
  -- Skip if no actual changes on UPDATE
  IF TG_OP = 'UPDATE' AND v_old_values = v_new_values THEN
    RETURN NEW;
  END IF;
  
  -- Insert audit record
  INSERT INTO admin_audit_log (
    actor_user_id,
    action_category,
    action,
    target_type,
    target_id,
    previous_values,
    new_values,
    changed_fields,
    correlation_id
  ) VALUES (
    v_user_id,
    TG_TABLE_NAME, -- Use table name as category
    v_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END,
    v_old_values,
    v_new_values,
    CASE 
      WHEN TG_OP = 'UPDATE' THEN get_changed_fields(v_old_values, v_new_values)
      ELSE NULL
    END,
    v_correlation_id
  );
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Create Audit Triggers for Critical Tables
-- =====================================================

-- Projects
DROP TRIGGER IF EXISTS audit_projects ON projects;
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Guests
DROP TRIGGER IF EXISTS audit_guests ON guests;
CREATE TRIGGER audit_guests
  AFTER INSERT OR UPDATE OR DELETE ON guests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Invites
DROP TRIGGER IF EXISTS audit_invites ON invites;
CREATE TRIGGER audit_invites
  AFTER INSERT OR UPDATE OR DELETE ON invites
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Events
DROP TRIGGER IF EXISTS audit_events ON events;
CREATE TRIGGER audit_events
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Sites
DROP TRIGGER IF EXISTS audit_sites ON sites;
CREATE TRIGGER audit_sites
  AFTER INSERT OR UPDATE OR DELETE ON sites
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Messaging Campaigns
DROP TRIGGER IF EXISTS audit_messaging_campaigns ON messaging_campaigns;
CREATE TRIGGER audit_messaging_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON messaging_campaigns
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Organizations
DROP TRIGGER IF EXISTS audit_organizations ON organizations;
CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Organization Members (permission changes)
DROP TRIGGER IF EXISTS audit_organization_members ON organization_members;
CREATE TRIGGER audit_organization_members
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- Trigger Function: Auto-update updated_at and updated_by
-- =====================================================

CREATE OR REPLACE FUNCTION update_audit_columns()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  NEW.updated_at = NOW();
  NEW.updated_by = v_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create updated_at/updated_by Triggers
-- =====================================================

-- Projects
DROP TRIGGER IF EXISTS update_projects_audit ON projects;
CREATE TRIGGER update_projects_audit
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_audit_columns();

-- Guests
DROP TRIGGER IF EXISTS update_guests_audit ON guests;
CREATE TRIGGER update_guests_audit
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_audit_columns();

-- Events
DROP TRIGGER IF EXISTS update_events_audit ON events;
CREATE TRIGGER update_events_audit
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_audit_columns();

-- Organizations
DROP TRIGGER IF EXISTS update_organizations_audit ON organizations;
CREATE TRIGGER update_organizations_audit
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_audit_columns();

-- Users
DROP TRIGGER IF EXISTS update_users_audit ON users;
CREATE TRIGGER update_users_audit
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_audit_columns();

-- Sites
DROP TRIGGER IF EXISTS update_sites_audit ON sites;
CREATE TRIGGER update_sites_audit
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_audit_columns();

-- =====================================================
-- Special Audit: Invite Access Logging
-- =====================================================

CREATE OR REPLACE FUNCTION log_invite_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Update access statistics
  NEW.last_accessed_at = NOW();
  NEW.access_count = COALESCE(NEW.access_count, 0) + 1;
  
  -- Log to invite_access_logs (already exists)
  -- Additional audit log entry
  INSERT INTO admin_audit_log (
    action_category,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    'INVITE',
    'VIEWED',
    'invites',
    NEW.id,
    jsonb_build_object(
      'access_count', NEW.access_count,
      'security_mode', NEW.security_mode
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This would need to be triggered by application code
-- as we can't easily detect "access" vs "update" in SQL
