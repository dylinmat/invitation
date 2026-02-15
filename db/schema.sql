-- Core schema draft for EIOS (PostgreSQL)

create extension if not exists "uuid-ossp";

-- Enums
create type org_type as enum ('COUPLE', 'PLANNER', 'VENUE');
create type project_status as enum ('ACTIVE', 'ARCHIVED', 'COLD_ARCHIVED', 'DELETED');
create type site_visibility as enum ('PUBLIC', 'UNLISTED', 'INVITE_ONLY');
create type site_type as enum ('PUBLIC', 'INTERNAL');
create type invite_security_mode as enum (
  'OPEN',
  'LINK_LOCKED',
  'PASSCODE',
  'OTP_FIRST_TIME',
  'OTP_EVERY_SESSION',
  'OTP_EVERY_TIME'
);
create type rsvp_question_type as enum (
  'TEXT',
  'YES_NO',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'NUMBER',
  'DATE',
  'FILE'
);
create type settings_scope as enum (
  'PLATFORM',
  'PLAN',
  'ORG',
  'PROJECT',
  'EVENT',
  'INVITE'
);
create type settings_value_type as enum (
  'BOOLEAN',
  'NUMBER',
  'STRING',
  'ENUM',
  'JSON'
);

create type message_channel as enum ('EMAIL', 'WHATSAPP');

-- Users and organizations
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  locale text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  type org_type not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table plans (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table plan_entitlements (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references plans(id) on delete cascade,
  key text not null,
  value_json jsonb not null,
  updated_at timestamptz not null default now(),
  unique (plan_id, key)
);

create table org_plan_assignments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references plans(id),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, plan_id)
);

create table settings_definitions (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value_type settings_value_type not null,
  default_value jsonb not null,
  allowed_values jsonb,
  entitlements_key text,
  entitlements_values jsonb,
  scope_min settings_scope not null,
  scope_max settings_scope not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table settings_values (
  id uuid primary key default uuid_generate_v4(),
  scope settings_scope not null,
  scope_id uuid,
  key text not null references settings_definitions(key) on delete cascade,
  value jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now(),
  unique (scope, scope_id, key)
);

create table entitlement_overrides (
  id uuid primary key default uuid_generate_v4(),
  scope settings_scope not null,
  scope_id uuid,
  key text not null,
  value_json jsonb not null,
  updated_at timestamptz not null default now(),
  unique (scope, scope_id, key)
);

create table organization_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Projects and events
create table projects (
  id uuid primary key default uuid_generate_v4(),
  owner_org_id uuid not null references organizations(id),
  manager_org_id uuid references organizations(id),
  name text not null,
  status project_status not null default 'ACTIVE',
  timezone text not null default 'UTC',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_plan_assignments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  plan_id uuid not null references plans(id),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, plan_id)
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null,
  venue_name text,
  venue_address text,
  venue_lat double precision,
  venue_lng double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sites and publishing
create table sites (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  type site_type not null default 'PUBLIC',
  visibility site_visibility not null default 'PUBLIC',
  subdomain_slug text,
  custom_domain text,
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, subdomain_slug),
  unique (custom_domain)
);

create table site_versions (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid not null references sites(id) on delete cascade,
  version integer not null,
  status text not null default 'DRAFT',
  scene_graph jsonb,
  created_at timestamptz not null default now(),
  unique (site_id, version)
);

alter table sites
  add constraint fk_sites_published_version
  foreign key (published_version_id) references site_versions(id);

-- Guests and groups
create table guest_groups (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text,
  household_label text,
  created_at timestamptz not null default now()
);

create table guests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  group_id uuid references guest_groups(id) on delete set null,
  first_name text,
  last_name text,
  role text, -- e.g. VIP, PLUS_ONE, CHILD
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guest_contacts (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid not null references guests(id) on delete cascade,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table guest_tags (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  unique (project_id, name)
);

create table guest_tag_assignments (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid not null references guests(id) on delete cascade,
  tag_id uuid not null references guest_tags(id) on delete cascade,
  unique (guest_id, tag_id)
);

-- Invites and access
create table invites (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  group_id uuid references guest_groups(id) on delete set null,
  token_hash text not null,
  security_mode invite_security_mode not null default 'OPEN',
  passcode_hash text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (token_hash)
);

create table invite_access_logs (
  id uuid primary key default uuid_generate_v4(),
  invite_id uuid not null references invites(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  ip_address inet,
  user_agent text
);

-- RSVP forms and submissions
create table rsvp_forms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table rsvp_questions (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references rsvp_forms(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  label text not null,
  help_text text,
  type rsvp_question_type not null,
  required boolean not null default false,
  sort_order integer not null default 0
);

create table rsvp_question_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references rsvp_questions(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0
);

create table rsvp_logic_rules (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references rsvp_questions(id) on delete cascade,
  depends_on_question_id uuid not null references rsvp_questions(id) on delete cascade,
  operator text not null, -- e.g. equals, contains
  value text not null
);

create table rsvp_submissions (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references rsvp_forms(id) on delete cascade,
  invite_id uuid references invites(id) on delete set null,
  guest_id uuid references guests(id) on delete set null,
  submitted_at timestamptz not null default now(),
  channel text
);

create table rsvp_answers (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references rsvp_submissions(id) on delete cascade,
  question_id uuid not null references rsvp_questions(id) on delete cascade,
  answer_text text,
  answer_json jsonb
);

-- Messaging
create table messaging_campaigns (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  channel message_channel not null,
  subject text,
  body_html text,
  body_text text,
  status text not null default 'DRAFT',
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create table message_jobs (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references messaging_campaigns(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  contact_email text,
  contact_phone text,
  channel message_channel not null,
  status text not null default 'QUEUED',
  provider_message_id text,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table message_events (
  id uuid primary key default uuid_generate_v4(),
  message_job_id uuid not null references message_jobs(id) on delete cascade,
  event_type text not null,
  event_at timestamptz not null default now(),
  metadata jsonb
);

-- Seating and check-in
CREATE TYPE table_shape AS ENUM ('ROUND', 'RECTANGLE', 'SQUARE', 'CUSTOM');

CREATE TABLE floor_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 2000,
  height INTEGER NOT NULL DEFAULT 1500,
  background_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seating_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape table_shape NOT NULL DEFAULT 'ROUND',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 100,
  height INTEGER NOT NULL DEFAULT 100,
  capacity INTEGER NOT NULL DEFAULT 8,
  rotation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seating_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES seating_tables(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  seat_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (table_id, seat_number)
);

CREATE TABLE check_in_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID REFERENCES users(id),
  method TEXT DEFAULT 'QR', -- QR, MANUAL, IMPORT
  notes TEXT,
  UNIQUE (event_id, guest_id)
);

-- Photo wall
CREATE TYPE photo_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_REJECTED');
CREATE TYPE photo_upload_source AS ENUM ('UPLOAD', 'WHATSAPP', 'EMAIL');

CREATE TABLE photo_wall_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  upload_access TEXT NOT NULL DEFAULT 'INVITE_TOKEN', -- LINK, INVITE_TOKEN, BOTH
  moderation_mode TEXT NOT NULL DEFAULT 'APPROVAL', -- INSTANT, APPROVAL
  family_friendly BOOLEAN NOT NULL DEFAULT TRUE,
  max_upload_mb INTEGER NOT NULL DEFAULT 10,
  allowed_formats TEXT[] DEFAULT '{"jpg","jpeg","png"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id)
);

CREATE TABLE photo_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  invite_id UUID REFERENCES invites(id) ON DELETE SET NULL,
  status photo_status NOT NULL DEFAULT 'PENDING',
  source photo_upload_source NOT NULL DEFAULT 'UPLOAD',
  
  -- Storage
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  processed_url TEXT,
  storage_key TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  
  -- Metadata
  caption TEXT,
  uploaded_by_ip INET,
  uploaded_by_user_agent TEXT,
  
  -- Moderation
  moderation_score JSONB, -- Rekognition results
  moderation_labels TEXT[],
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(id),
  moderation_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE photo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photo_uploads(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (photo_id, guest_id)
);
