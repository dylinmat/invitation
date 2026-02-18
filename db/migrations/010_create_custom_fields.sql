-- Migration: Create Custom Fields Tables
-- Created: 2026-02-17
-- Description: Extensible custom fields for guests, events, etc.

-- =====================================================
-- Custom Field Definitions
-- =====================================================

CREATE TYPE custom_field_type AS ENUM (
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'DATETIME',
  'BOOLEAN',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'URL',
  'EMAIL',
  'PHONE'
);

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- NULL = org-wide
  
  -- Field definition
  entity_type TEXT NOT NULL, -- 'GUEST', 'EVENT', 'PROJECT', etc.
  field_key TEXT NOT NULL, -- internal identifier (e.g., 'dietary_restrictions')
  field_type custom_field_type NOT NULL,
  
  -- Display
  label TEXT NOT NULL,
  placeholder TEXT,
  help_text TEXT,
  
  -- Options (for select types)
  options JSONB, -- [{"value": "vegan", "label": "Vegan"}, ...]
  
  -- Validation
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  validation_regex TEXT,
  validation_message TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  min_length INTEGER,
  max_length INTEGER,
  
  -- UI configuration
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_list BOOLEAN NOT NULL DEFAULT FALSE, -- Show in table view
  
  -- Timestamps
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_field_key UNIQUE (org_id, project_id, entity_type, field_key),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('GUEST', 'EVENT', 'PROJECT', 'ORGANIZATION'))
);

-- =====================================================
-- Custom Field Values
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference
  field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL, -- ID of the guest/event/project
  entity_type TEXT NOT NULL, -- Matches custom_fields.entity_type
  
  -- Value storage (flexible based on field_type)
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  value_date DATE,
  value_timestamp TIMESTAMPTZ,
  value_json JSONB, -- For multi-select, complex values
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_entity_field UNIQUE (field_id, entity_id),
  CONSTRAINT valid_entity_reference CHECK (entity_type IN ('GUEST', 'EVENT', 'PROJECT', 'ORGANIZATION'))
);

-- =====================================================
-- Custom Field Groups (for organizing fields)
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_field_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link fields to groups
ALTER TABLE custom_fields 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES custom_field_groups(id) ON DELETE SET NULL;

-- =====================================================
-- Indexes
-- =====================================================

-- Custom field lookups
CREATE INDEX idx_custom_fields_org ON custom_fields(org_id) WHERE is_active = TRUE;
CREATE INDEX idx_custom_fields_project ON custom_fields(project_id) WHERE is_active = TRUE;
CREATE INDEX idx_custom_fields_entity ON custom_fields(entity_type, org_id, project_id) WHERE is_active = TRUE;

-- Value lookups
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_values_lookup ON custom_field_values(entity_type, entity_id, field_id);

-- Group lookups
CREATE INDEX idx_custom_field_groups_org ON custom_field_groups(org_id, entity_type);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Get custom fields for an entity
CREATE OR REPLACE FUNCTION get_custom_fields_for_entity(
  p_org_id UUID,
  p_project_id UUID,
  p_entity_type TEXT
)
RETURNS TABLE(
  field_id UUID,
  field_key TEXT,
  field_type custom_field_type,
  label TEXT,
  is_required BOOLEAN,
  options JSONB,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.id,
    cf.field_key,
    cf.field_type,
    cf.label,
    cf.is_required,
    cf.options,
    cf.display_order
  FROM custom_fields cf
  WHERE cf.org_id = p_org_id
    AND cf.entity_type = p_entity_type
    AND cf.is_active = TRUE
    AND (cf.project_id IS NULL OR cf.project_id = p_project_id)
  ORDER BY cf.display_order, cf.label;
END;
$$ LANGUAGE plpgsql;

-- Set custom field value
CREATE OR REPLACE FUNCTION set_custom_field_value(
  p_field_id UUID,
  p_entity_id UUID,
  p_entity_type TEXT,
  p_value JSONB
)
RETURNS UUID AS $$
DECLARE
  v_field custom_fields%ROWTYPE;
  v_value_id UUID;
BEGIN
  -- Get field definition
  SELECT * INTO v_field FROM custom_fields WHERE id = p_field_id;
  
  IF v_field IS NULL THEN
    RAISE EXCEPTION 'Custom field not found';
  END IF;
  
  -- Convert value based on field type
  INSERT INTO custom_field_values (
    field_id,
    entity_id,
    entity_type,
    value_text,
    value_number,
    value_boolean,
    value_date,
    value_timestamp,
    value_json
  ) VALUES (
    p_field_id,
    p_entity_id,
    p_entity_type,
    CASE WHEN v_field.field_type IN ('TEXT', 'TEXTAREA', 'URL', 'EMAIL', 'PHONE') 
         THEN p_value->>'value' END,
    CASE WHEN v_field.field_type = 'NUMBER' 
         THEN (p_value->>'value')::NUMERIC END,
    CASE WHEN v_field.field_type = 'BOOLEAN' 
         THEN (p_value->>'value')::BOOLEAN END,
    CASE WHEN v_field.field_type = 'DATE' 
         THEN (p_value->>'value')::DATE END,
    CASE WHEN v_field.field_type = 'DATETIME' 
         THEN (p_value->>'value')::TIMESTAMPTZ END,
    CASE WHEN v_field.field_type IN ('SINGLE_SELECT', 'MULTI_SELECT') 
         THEN p_value->'value' END
  )
  ON CONFLICT (field_id, entity_id) 
  DO UPDATE SET
    value_text = EXCLUDED.value_text,
    value_number = EXCLUDED.value_number,
    value_boolean = EXCLUDED.value_boolean,
    value_date = EXCLUDED.value_date,
    value_timestamp = EXCLUDED.value_timestamp,
    value_json = EXCLUDED.value_json,
    updated_at = NOW()
  RETURNING id INTO v_value_id;
  
  RETURN v_value_id;
END;
$$ LANGUAGE plpgsql;

-- Get entity with custom fields (returns JSON)
CREATE OR REPLACE FUNCTION get_entity_with_custom_fields(
  p_entity_id UUID,
  p_entity_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_object_agg(cf.field_key, 
    CASE cf.field_type
      WHEN 'TEXT' THEN to_jsonb(cfv.value_text)
      WHEN 'TEXTAREA' THEN to_jsonb(cfv.value_text)
      WHEN 'NUMBER' THEN to_jsonb(cfv.value_number)
      WHEN 'DATE' THEN to_jsonb(cfv.value_date)
      WHEN 'DATETIME' THEN to_jsonb(cfv.value_timestamp)
      WHEN 'BOOLEAN' THEN to_jsonb(cfv.value_boolean)
      WHEN 'SINGLE_SELECT' THEN cfv.value_json
      WHEN 'MULTI_SELECT' THEN cfv.value_json
      ELSE to_jsonb(cfv.value_text)
    END
  ) INTO v_result
  FROM custom_field_values cfv
  JOIN custom_fields cf ON cfv.field_id = cf.id
  WHERE cfv.entity_id = p_entity_id
    AND cfv.entity_type = p_entity_type
    AND cf.is_active = TRUE;
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;
