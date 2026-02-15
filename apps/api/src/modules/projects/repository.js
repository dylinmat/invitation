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

const listProjectsByOrg = async (orgId) => {
  const result = await query(
    `select p.id, p.owner_org_id, p.manager_org_id, p.name, p.status, p.timezone, 
            p.created_by, p.created_at, p.updated_at
     from projects p
     where p.owner_org_id = $1 and p.status != 'DELETED'
     order by p.created_at desc`,
    [orgId]
  );
  return result.rows;
};

const listProjectsByUser = async (userId) => {
  const result = await query(
    `select distinct p.id, p.owner_org_id, p.manager_org_id, p.name, p.status, p.timezone,
            p.created_by, p.created_at, p.updated_at,
            o.name as org_name, o.type as org_type
     from projects p
     join organizations o on p.owner_org_id = o.id
     join organization_members om on o.id = om.org_id
     where om.user_id = $1 and p.status != 'DELETED'
     order by p.created_at desc`,
    [userId]
  );
  return result.rows;
};

const updateProject = async (id, updates) => {
  const allowedFields = ["name", "timezone", "status", "manager_org_id"];
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
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
       (select count(*) from events where project_id = $1) as event_count`,
    [projectId]
  );
  return result.rows[0] || {
    guest_count: 0,
    group_count: 0,
    invite_count: 0,
    site_count: 0,
    event_count: 0
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
