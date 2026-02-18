const { query } = require("../../db");

// ============== Project CRUD ==============

const createProject = async ({ orgId, name, timezone = "UTC", createdBy }) => {
  const result = await query(
    `insert into projects (owner_org_id, name, timezone, created_by, status)
     values ($1, $2, $3, $4, 'ACTIVE')
     returning id, owner_org_id, name, timezone, status, created_at, updated_at`,
    [orgId, name, timezone, createdBy]
  );
  return result.rows[0];
};

const getProjectById = async (id) => {
  const result = await query(
    `select p.id, p.owner_org_id, p.manager_org_id, p.name, p.status, p.timezone, 
            p.created_by, p.created_at, p.updated_at,
            o.name as org_name, o.type as org_type
     from projects p
     join organizations o on p.owner_org_id = o.id
     where p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const listProjectsByOrg = async (orgId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const result = await query(
    `select p.id, p.owner_org_id, p.manager_org_id, p.name, p.status, p.timezone, 
            p.created_by, p.created_at, p.updated_at
     from projects p
     where p.owner_org_id = $1 and p.status != 'DELETED'
     order by p.created_at desc
     limit $2 offset $3`,
    [orgId, limit, offset]
  );
  return result.rows;
};

// SECURE: Field mapping to prevent SQL injection
const ALLOWED_UPDATE_FIELDS = new Set(["name", "timezone", "status", "manager_org_id"]);
const FIELD_MAPPINGS = {
  name: "name",
  timezone: "timezone",
  status: "status",
  managerOrgId: "manager_org_id"
};

/**
 * List projects for a user with embedded stats (fixes N+1 query)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20, max: 100)
 * @returns {Promise<{projects: Array, total: number, page: number, limit: number}>}
 */
const listProjectsByUser = async (userId, { page = 1, limit = 20 } = {}) => {
  // Validate and clamp pagination
  const validatedPage = Math.max(1, parseInt(page, 10) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (validatedPage - 1) * validatedLimit;

  // Get total count for pagination metadata
  const countResult = await query(
    `select count(distinct p.id) as total
     from projects p
     join organizations o on p.owner_org_id = o.id
     join organization_members om on o.id = om.org_id
     where om.user_id = $1 and p.status != 'DELETED'`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Single query with embedded stats (fixes N+1 query problem)
  const result = await query(
    `select distinct 
            p.id, p.owner_org_id, p.manager_org_id, p.name, p.status, p.timezone,
            p.created_by, p.created_at, p.updated_at,
            o.name as org_name, o.type as org_type,
            (select count(*) from guests where project_id = p.id) as guest_count,
            (select count(*) from invites where project_id = p.id) as invite_count,
            (select count(*) from events where project_id = p.id) as event_count
     from projects p
     join organizations o on p.owner_org_id = o.id
     join organization_members om on o.id = om.org_id
     where om.user_id = $1 and p.status != 'DELETED'
     order by p.created_at desc
     limit $2 offset $3`,
    [userId, validatedLimit, offset]
  );
  
  return {
    projects: result.rows,
    total,
    page: validatedPage,
    limit: validatedLimit
  };
};

/**
 * Update project with field mapping for security
 * @param {string} id - Project ID
 * @param {Object} updates - Field updates (camelCase keys)
 * @returns {Promise<Object|null>}
 */
const updateProject = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [clientKey, value] of Object.entries(updates)) {
    // Map camelCase to snake_case
    const dbColumn = FIELD_MAPPINGS[clientKey] || clientKey;
    
    // Security: Only allow known fields
    if (!ALLOWED_UPDATE_FIELDS.has(dbColumn)) {
      continue;
    }
    
    // Security: Validate value type
    if (value !== undefined && value !== null) {
      if (typeof value !== "string") {
        throw new Error(`Invalid type for field ${clientKey}: expected string`);
      }
      fields.push(`${dbColumn} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    return getProjectById(id);
  }

  values.push(id);
  const result = await query(
    `update projects set ${fields.join(", ")}, updated_at = now() 
     where id = $${paramIndex} 
     returning id, owner_org_id, manager_org_id, name, status, timezone, created_by, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
};

const deleteProject = async (id) => {
  // Soft delete by setting status to DELETED
  const result = await query(
    `update projects set status = 'DELETED', updated_at = now() 
     where id = $1 
     returning id`,
    [id]
  );
  return result.rows[0] || null;
};

// ============== Project Access Control ==============

const getProjectOwnerOrg = async (projectId) => {
  const result = await query(
    "select owner_org_id from projects where id = $1",
    [projectId]
  );
  return result.rows[0]?.owner_org_id || null;
};

const isUserProjectMember = async (userId, projectId) => {
  const result = await query(
    `select 1
     from projects p
     join organization_members om on p.owner_org_id = om.org_id
     where p.id = $1 and om.user_id = $2
     limit 1`,
    [projectId, userId]
  );
  return result.rows.length > 0;
};

const getUserProjectRole = async (userId, projectId) => {
  const result = await query(
    `select om.role
     from projects p
     join organization_members om on p.owner_org_id = om.org_id
     where p.id = $1 and om.user_id = $2
     limit 1`,
    [projectId, userId]
  );
  return result.rows[0]?.role || null;
};

// ============== Project Stats ==============

const getProjectStats = async (projectId) => {
  const result = await query(
    `select 
       (select count(*) from guests where project_id = $1) as guest_count,
       (select count(*) from guest_groups where project_id = $1) as group_count,
       (select count(*) from invites where project_id = $1) as invite_count,
       (select count(*) from sites where project_id = $1) as site_count,
       (select count(*) from events where project_id = $1) as event_count,
       (select count(distinct rs.id) 
        from rsvp_submissions rs
        join invites i on rs.invite_id = i.id
        where i.project_id = $1 
        and rs.status = 'accepted') as rsvp_yes_count,
       (select count(distinct rs.id) 
        from rsvp_submissions rs
        join invites i on rs.invite_id = i.id
        where i.project_id = $1 
        and rs.status = 'declined') as rsvp_no_count,
       (select count(*) 
        from invites i
        where i.project_id = $1 
        and not exists (
          select 1 from rsvp_submissions rs where rs.invite_id = i.id
        )) as rsvp_pending_count`,
    [projectId]
  );
  return result.rows[0] || {
    guest_count: 0,
    group_count: 0,
    invite_count: 0,
    site_count: 0,
    event_count: 0,
    rsvp_yes_count: 0,
    rsvp_no_count: 0,
    rsvp_pending_count: 0
  };
};

module.exports = {
  // Project CRUD
  createProject,
  getProjectById,
  listProjectsByOrg,
  listProjectsByUser,
  updateProject,
  deleteProject,

  // Access Control
  getProjectOwnerOrg,
  isUserProjectMember,
  getUserProjectRole,

  // Stats
  getProjectStats
};
