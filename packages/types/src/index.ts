/**
 * EIOS Shared Types Package
 * Contains type definitions for API, Database models, and DTOs
 */

// ============================================================================
// Enums
// ============================================================================

export type OrganizationType = 'personal' | 'team' | 'enterprise';

export type ProjectStatus = 'draft' | 'active' | 'archived' | 'suspended';

export type GuestRole = 'host' | 'guest' | 'vip' | 'staff' | 'vendor';

export type InviteSecurityMode = 'none' | 'passcode' | 'token_only';

export type InviteStatus = 'pending' | 'sent' | 'opened' | 'responded' | 'revoked';

export type CampaignChannel = 'email' | 'sms' | 'whatsapp';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';

export type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'auto_rejected';

export type ModerationMode = 'INSTANT' | 'APPROVAL';

export type UploadAccess = 'LINK' | 'INVITE_TOKEN' | 'BOTH';

// ============================================================================
// Base Types
// ============================================================================

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserDb {
  id: string;
  email: string;
  full_name: string;
  locale: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateUserDto = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Organization Types
// ============================================================================

export interface OrganizationDb {
  id: string;
  type: OrganizationType;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Organization {
  id: string;
  type: OrganizationType;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOrganizationDto = Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateOrganizationDto = Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Project Types
// ============================================================================

export interface ProjectStats {
  guestCount: number;
  inviteCount: number;
  rsvpCount: number;
  eventCount?: number;
}

export interface ProjectDb {
  id: string;
  owner_org_id: string;
  name: string;
  status: ProjectStatus;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  ownerOrgId: string;
  name: string;
  status: ProjectStatus;
  timezone: string;
  stats?: ProjectStats;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProjectDto = Omit<Project, 'id' | 'stats' | 'createdAt' | 'updatedAt'>;

export type UpdateProjectDto = Partial<Omit<Project, 'id' | 'stats' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Guest Types
// ============================================================================

export interface GuestContact {
  id?: string;
  email?: string;
  phone?: string;
  type?: 'email' | 'phone';
  isPrimary?: boolean;
}

export interface GuestDb {
  id: string;
  project_id: string;
  group_id?: string;
  first_name: string;
  last_name: string;
  role: GuestRole;
  created_at: Date;
  updated_at: Date;
}

export interface Guest {
  id: string;
  projectId: string;
  groupId?: string;
  firstName: string;
  lastName: string;
  role: GuestRole;
  contacts?: GuestContact[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateGuestDto = Omit<Guest, 'id' | 'contacts' | 'tags' | 'createdAt' | 'updatedAt'> & {
  contacts?: Array<Pick<GuestContact, 'email' | 'phone'>>;
  tagIds?: string[];
};

export type UpdateGuestDto = Partial<Omit<Guest, 'id' | 'projectId' | 'contacts' | 'tags' | 'createdAt' | 'updatedAt'>> & {
  contacts?: Array<Pick<GuestContact, 'email' | 'phone'>>;
};

// ============================================================================
// Guest Group Types
// ============================================================================

export interface GuestGroupDb {
  id: string;
  project_id: string;
  name: string;
  household_label?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GuestGroup {
  id: string;
  projectId: string;
  name: string;
  householdLabel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateGuestGroupDto = Omit<GuestGroup, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateGuestGroupDto = Partial<Omit<GuestGroup, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Guest Tag Types
// ============================================================================

export interface GuestTagDb {
  id: string;
  project_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface GuestTag {
  id: string;
  projectId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateGuestTagDto = Omit<GuestTag, 'id' | 'createdAt' | 'updatedAt'>;

// ============================================================================
// Invite Types
// ============================================================================

export interface InviteDb {
  id: string;
  project_id: string;
  site_id: string;
  guest_id?: string;
  group_id?: string;
  token_hash: string;
  security_mode: InviteSecurityMode;
  passcode?: string;
  status: InviteStatus;
  expires_at?: Date;
  sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Invite {
  id: string;
  projectId: string;
  siteId: string;
  guestId?: string;
  groupId?: string;
  tokenHash: string;
  securityMode: InviteSecurityMode;
  passcode?: string;
  status: InviteStatus;
  expiresAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateInviteDto = Omit<Invite, 'id' | 'tokenHash' | 'status' | 'sentAt' | 'createdAt' | 'updatedAt'>;

export type UpdateInviteDto = Partial<Omit<Invite, 'id' | 'projectId' | 'tokenHash' | 'createdAt' | 'updatedAt'>>;

export interface InviteValidationResult {
  valid: boolean;
  invite?: Invite & { guest?: Guest };
  requiresPasscode?: boolean;
  error?: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionDb {
  id: string;
  user_id: string;
  token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionWithUser extends Session {
  user: User;
}

export type CreateSessionDto = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>;

// ============================================================================
// RSVP Types
// ============================================================================

export interface RsvpQuestion {
  id?: string;
  eventId?: string;
  label: string;
  helpText?: string;
  type: string;
  required: boolean;
  sortOrder: number;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  logicRules?: unknown[];
}

export interface RsvpFormDb {
  id: string;
  project_id: string;
  name: string;
  questions?: RsvpQuestion[];
  created_at: Date;
  updated_at: Date;
}

export interface RsvpForm {
  id: string;
  projectId: string;
  name: string;
  questions?: RsvpQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRsvpFormDto = Omit<RsvpForm, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateRsvpFormDto = Partial<Omit<RsvpForm, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

export interface RsvpAnswer {
  questionId: string;
  value: unknown;
}

export interface RsvpSubmissionDb {
  id: string;
  form_id: string;
  invite_id?: string;
  guest_id?: string;
  answers: RsvpAnswer[];
  created_at: Date;
  updated_at: Date;
}

export interface RsvpSubmission {
  id: string;
  formId: string;
  inviteId?: string;
  guestId?: string;
  answers: RsvpAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitRsvpDto {
  formId: string;
  inviteToken?: string;
  guestId?: string;
  answers: RsvpAnswer[];
  channel?: string;
}

// ============================================================================
// Site Types
// ============================================================================

export interface SiteDb {
  id: string;
  project_id: string;
  name: string;
  template_id?: string;
  config?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Site {
  id: string;
  projectId: string;
  name: string;
  templateId?: string;
  config?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSiteDto = Omit<Site, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateSiteDto = Partial<Omit<Site, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Event Types (for seating/check-in)
// ============================================================================

export interface EventDb {
  id: string;
  project_id: string;
  name: string;
  start_time?: Date;
  end_time?: Date;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  projectId: string;
  name: string;
  startTime?: Date;
  endTime?: Date;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Floor Plan Types
// ============================================================================

export type TableShape = 'ROUND' | 'RECTANGLE' | 'SQUARE' | 'CUSTOM';

export interface FloorPlanDb {
  id: string;
  event_id: string;
  name: string;
  width?: number;
  height?: number;
  background_image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FloorPlan {
  id: string;
  eventId: string;
  name: string;
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableDb {
  id: string;
  floor_plan_id: string;
  name: string;
  shape: TableShape;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  capacity?: number;
  rotation?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: string;
  floorPlanId: string;
  name: string;
  shape: TableShape;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  capacity?: number;
  rotation?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableAssignment {
  id: string;
  tableId: string;
  guestId: string;
  seatNumber?: number;
  createdAt: Date;
}

// ============================================================================
// Check-in Types
// ============================================================================

export type CheckInMethod = 'QR' | 'MANUAL' | 'IMPORT';

export interface CheckInDb {
  id: string;
  event_id: string;
  guest_id: string;
  method: CheckInMethod;
  checked_in_by?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CheckIn {
  id: string;
  eventId: string;
  guestId: string;
  method: CheckInMethod;
  checkedInBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Photo Types
// ============================================================================

export interface PhotoDb {
  id: string;
  project_id: string;
  guest_id?: string;
  invite_id?: string;
  storage_key: string;
  caption?: string;
  status: PhotoStatus;
  likes_count: number;
  file_size_bytes?: number;
  mime_type?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Photo {
  id: string;
  projectId: string;
  guestId?: string;
  inviteId?: string;
  storageKey: string;
  caption?: string;
  status: PhotoStatus;
  likesCount: number;
  fileSizeBytes?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoWallSettings {
  enabled: boolean;
  uploadAccess: UploadAccess;
  moderationMode: ModerationMode;
  familyFriendly: boolean;
  maxUploadMb: number;
  allowedFormats: string[];
}

// ============================================================================
// Messaging/Campaign Types
// ============================================================================

export interface CampaignRecipient {
  guestId?: string;
  email?: string;
  phone?: string;
  variables?: Record<string, unknown>;
}

export interface CampaignDb {
  id: string;
  project_id: string;
  channel: CampaignChannel;
  subject?: string;
  body_html?: string;
  body_text?: string;
  status: CampaignStatus;
  scheduled_at?: Date;
  sent_at?: Date;
  recipient_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: string;
  projectId: string;
  channel: CampaignChannel;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  recipientCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignDto {
  projectId: string;
  channel: CampaignChannel;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  scheduledAt?: Date;
  recipients: CampaignRecipient[];
}

// ============================================================================
// Settings Types
// ============================================================================

export type SettingsScope = 'org' | 'project' | 'event' | 'invite';

export interface SettingsValueDb {
  id: string;
  scope: SettingsScope;
  scope_id: string;
  key: string;
  value: unknown;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SettingsValue {
  id: string;
  scope: SettingsScope;
  scopeId: string;
  key: string;
  value: unknown;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsDefinition {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue: unknown;
  public: boolean;
  description?: string;
  category?: string;
}

export interface ResolveSettingsRequest {
  key: string;
  projectId?: string;
  orgId?: string;
  eventId?: string;
  inviteId?: string;
  overrides?: Array<{ scope: SettingsScope; scopeId: string; value: unknown }>;
  entitlements?: Record<string, unknown>;
}

export interface ResolveSettingsResponse {
  key: string;
  value: unknown;
  source: string;
  scope?: SettingsScope;
  scopeId?: string;
}

// ============================================================================
// Entitlements Types
// ============================================================================

export interface PlanDb {
  id: string;
  code: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanEntitlementDb {
  id: string;
  plan_id: string;
  key: string;
  value_json: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface PlanEntitlement {
  id: string;
  planId: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrgPlanDb {
  id: string;
  org_id: string;
  plan_id: string;
  starts_at?: Date;
  ends_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OrgPlan {
  id: string;
  orgId: string;
  planId: string;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPlanDb {
  id: string;
  project_id: string;
  plan_id: string;
  starts_at?: Date;
  ends_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectPlan {
  id: string;
  projectId: string;
  planId: string;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntitlementOverrideDb {
  id: string;
  scope: SettingsScope;
  scope_id: string;
  key: string;
  value_json: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface EntitlementOverride {
  id: string;
  scope: SettingsScope;
  scopeId: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolvedEntitlements {
  [key: string]: unknown;
}

// ============================================================================
// API Error Types
// ============================================================================

export type ErrorCode = 
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorDetails {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code: ErrorCode;
  details?: ApiErrorDetails[];
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: ErrorCode;
  details?: ApiErrorDetails[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
  id?: string;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthCredentials {
  email: string;
  password?: string;
}

export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface MagicLinkVerification {
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  user: User;
  sessionToken: string;
  isNewUser?: boolean;
}

export interface JwtPayload {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export type AuditAction = 
  | 'user.created'
  | 'user.updated'
  | 'user.login'
  | 'user.logout'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'guest.created'
  | 'guest.updated'
  | 'guest.deleted'
  | 'guest.imported'
  | 'invite.created'
  | 'invite.sent'
  | 'invite.revoked'
  | 'invite.regenerated'
  | 'rsvp.submitted'
  | 'settings.updated'
  | 'entitlements.changed'
  | 'plan.created'
  | 'photo.uploaded'
  | 'photo.moderated'
  | 'photo.liked'
  | 'checkin.completed'
  | 'seating.assigned'
  | 'campaign.sent';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actorId?: string;
  actorType?: 'user' | 'guest' | 'system';
  targetType: string;
  targetId: string;
  projectId?: string;
  orgId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditLogEntryDb {
  id: string;
  action: AuditAction;
  actor_id?: string;
  actor_type?: 'user' | 'guest' | 'system';
  target_type: string;
  target_id: string;
  project_id?: string;
  org_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  role?: string;
  [key: string]: unknown;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type CamelCase<S extends string> = 
  S extends `${infer P}_${infer Q}` 
    ? `${P}${Capitalize<CamelCase<Q>>}` 
    : S;

export type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends object ? KeysToCamelCase<T[K]> : T[K];
};

// Database row to camelCase object converter type
export type DbToEntity<T> = KeysToCamelCase<T>;
