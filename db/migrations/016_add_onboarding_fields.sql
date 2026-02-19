-- Migration: Add onboarding and dashboard fields
-- Created: 2025-02-20

-- Add columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_plan text DEFAULT 'FREE';

-- Add columns to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS couple_names jsonb,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS business_type text;

-- Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    text text NOT NULL,
    completed boolean DEFAULT false,
    category text DEFAULT 'general',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checklists_org ON checklists(organization_id);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id uuid REFERENCES events(id),
    invoice_number text,
    client_name text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    due_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);

-- Update existing users to have onboarding_completed = true if they have organization
UPDATE users SET onboarding_completed = true 
WHERE organization_id IS NOT NULL AND onboarding_completed = false;
