const { query } = require("../../db");

// =====================
// Clients
// =====================

const listClients = async (organizationId, { search, type, status, page = 1, limit = 20 } = {}) => {
  let sql = `
    select id, organization_id, name, email, phone, address, type, status, notes, created_at, updated_at
    from clients
    where organization_id = $1
  `;
  const params = [organizationId];
  let paramIdx = 2;

  if (search) {
    sql += ` and (name ilike $${paramIdx} or email ilike $${paramIdx} or phone ilike $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (type) {
    sql += ` and type = $${paramIdx++}`;
    params.push(type);
  }
  if (status) {
    sql += ` and status = $${paramIdx++}`;
    params.push(status);
  }

  // Get total count for pagination
  const countResult = await query(`select count(*) from (${sql}) as count_query`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // Add pagination
  const offset = (page - 1) * limit;
  sql += ` order by created_at desc limit $${paramIdx++} offset $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return {
    clients: result.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total
    }
  };
};

const getClientById = async (clientId) => {
  const result = await query(
    `select id, organization_id, name, email, phone, address, type, status, notes, created_at, updated_at
     from clients
     where id = $1`,
    [clientId]
  );
  return result.rows[0] || null;
};

const createClient = async ({ organizationId, name, email, phone, address, type, status, notes }) => {
  const result = await query(
    `insert into clients (organization_id, name, email, phone, address, type, status, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [organizationId, name, email || null, phone || null, address || null, type || null, status || "active", notes || null]
  );
  return result.rows[0]?.id;
};

const updateClient = async (clientId, { name, email, phone, address, type, status, notes }) => {
  const updates = [];
  const values = [];
  let paramIdx = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIdx++}`);
    values.push(name);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIdx++}`);
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIdx++}`);
    values.push(phone);
  }
  if (address !== undefined) {
    updates.push(`address = $${paramIdx++}`);
    values.push(address);
  }
  if (type !== undefined) {
    updates.push(`type = $${paramIdx++}`);
    values.push(type);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramIdx++}`);
    values.push(status);
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramIdx++}`);
    values.push(notes);
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push(`updated_at = now()`);
  values.push(clientId);

  const result = await query(
    `update clients set ${updates.join(", ")} where id = $${paramIdx} returning id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deleteClient = async (clientId) => {
  await query("delete from clients where id = $1", [clientId]);
};

// =====================
// Client Notes
// =====================

const listClientNotes = async (clientId) => {
  const result = await query(
    `select cn.id, cn.client_id, cn.note, cn.created_at, cn.created_by,
            u.full_name as created_by_name
     from client_notes cn
     left join users u on cn.created_by = u.id
     where cn.client_id = $1
     order by cn.created_at desc`,
    [clientId]
  );
  return result.rows;
};

const createClientNote = async ({ clientId, note, createdBy }) => {
  const result = await query(
    `insert into client_notes (client_id, note, created_by)
     values ($1, $2, $3)
     returning id`,
    [clientId, note, createdBy || null]
  );
  return result.rows[0]?.id;
};

// =====================
// Client Events
// =====================

const getClientEvents = async (clientId) => {
  const result = await query(
    `select e.id, e.name, e.date, e.location, e.status, e.created_at,
            p.id as project_id, p.name as project_name
     from events e
     join projects p on e.project_id = p.id
     where p.client_id = $1
     order by e.date desc`,
    [clientId]
  );
  return result.rows;
};

// =====================
// Organization Access Check
// =====================

const checkOrganizationAccess = async (userId, organizationId) => {
  const result = await query(
    `select 1 from users where id = $1 and organization_id = $2`,
    [userId, organizationId]
  );
  return result.rows.length > 0;
};

module.exports = {
  // Clients
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,

  // Client Notes
  listClientNotes,
  createClientNote,

  // Client Events
  getClientEvents,

  // Access Control
  checkOrganizationAccess
};
