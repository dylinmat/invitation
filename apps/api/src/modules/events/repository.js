/**
 * Events Repository - Database Queries
 *
 * Database Schema:
 * ```sql
 * CREATE TABLE events (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   organization_id UUID NOT NULL REFERENCES organizations(id),
 *   name VARCHAR(255) NOT NULL,
 *   type VARCHAR(50),
 *   date DATE,
 *   location VARCHAR(500),
 *   budget DECIMAL(10,2),
 *   status VARCHAR(20) DEFAULT 'planning',
 *   description TEXT,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * CREATE TABLE event_tasks (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 *   title VARCHAR(255) NOT NULL,
 *   description TEXT,
 *   due_date DATE,
 *   status VARCHAR(20) DEFAULT 'pending',
 *   priority VARCHAR(20) DEFAULT 'medium',
 *   assigned_to UUID REFERENCES users(id),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 * ```
 */

const { query } = require("../../db");

// =====================
// Events
// =====================

/**
 * Find events by organization with optional filters
 * @param {string} organizationId - Organization ID
 * @param {Object} filters - Query filters
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.type] - Filter by type
 * @param {string} [filters.search] - Search in name/description
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.limit=20] - Items per page
 * @returns {Promise<{events: Array, total: number, page: number, limit: number}>}
 */
const findEventsByOrganization = async (organizationId, filters = {}) => {
  const {
    status,
    type,
    search,
    page = 1,
    limit = 20
  } = filters;

  const validatedPage = Math.max(1, parseInt(page, 10) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (validatedPage - 1) * validatedLimit;

  // Build where clause
  const whereConditions = ["organization_id = $1"];
  const params = [organizationId];
  let paramIdx = 2;

  if (status) {
    whereConditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  if (type) {
    whereConditions.push(`type = $${paramIdx++}`);
    params.push(type);
  }

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = whereConditions.join(" AND ");

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM events WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated events
  const result = await query(
    `SELECT 
       e.id, e.organization_id, e.name, e.type, e.date, e.location, 
       e.budget, e.status, e.description, e.created_at, e.updated_at,
       (SELECT COUNT(*) FROM event_tasks WHERE event_id = e.id) as task_count
     FROM events e
     WHERE ${whereClause}
     ORDER BY e.date ASC NULLS LAST, e.created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, validatedLimit, offset]
  );

  return {
    events: result.rows,
    total,
    page: validatedPage,
    limit: validatedLimit
  };
};

/**
 * Find event by ID with organization check
 * @param {string} id - Event ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>}
 */
const findEventById = async (id, organizationId) => {
  const result = await query(
    `SELECT 
       e.id, e.organization_id, e.name, e.type, e.date, e.location, 
       e.budget, e.status, e.description, e.created_at, e.updated_at,
       (SELECT COUNT(*) FROM event_tasks WHERE event_id = e.id) as task_count
     FROM events e
     WHERE e.id = $1 AND e.organization_id = $2`,
    [id, organizationId]
  );
  return result.rows[0] || null;
};

/**
 * Create a new event
 * @param {Object} data - Event data
 * @param {string} data.organizationId - Organization ID
 * @param {string} data.name - Event name
 * @param {string} [data.type] - Event type
 * @param {string} [data.date] - Event date
 * @param {string} [data.location] - Event location
 * @param {number} [data.budget] - Event budget
 * @param {string} [data.status] - Event status
 * @param {string} [data.description] - Event description
 * @returns {Promise<Object>} Created event
 */
const createEvent = async (data) => {
  const {
    organizationId,
    name,
    type,
    date,
    location,
    budget,
    status = "planning",
    description
  } = data;

  const result = await query(
    `INSERT INTO events 
       (organization_id, name, type, date, location, budget, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      organizationId,
      name,
      type || null,
      date || null,
      location || null,
      budget || null,
      status,
      description || null
    ]
  );

  return result.rows[0];
};

/**
 * Update an event
 * @param {string} id - Event ID
 * @param {Object} data - Update data
 * @returns {Promise<Object|null>} Updated event
 */
const updateEvent = async (id, data) => {
  const updates = [];
  const values = [];
  let paramIdx = 1;

  const fields = {
    name: "name",
    type: "type",
    date: "date",
    location: "location",
    budget: "budget",
    status: "status",
    description: "description"
  };

  for (const [key, column] of Object.entries(fields)) {
    if (data[key] !== undefined) {
      updates.push(`${column} = $${paramIdx++}`);
      values.push(data[key]);
    }
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE events SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete an event
 * @param {string} id - Event ID
 * @returns {Promise<boolean>}
 */
const deleteEvent = async (id) => {
  const result = await query(
    "DELETE FROM events WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows.length > 0;
};

// =====================
// Event Tasks
// =====================

/**
 * Find tasks by event ID
 * @param {string} eventId - Event ID
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.priority] - Filter by priority
 * @param {string} [options.assignedTo] - Filter by assigned user
 * @returns {Promise<Array>}
 */
const findTasksByEvent = async (eventId, options = {}) => {
  const { status, priority, assignedTo } = options;

  let sql = `
    SELECT 
      t.id, t.event_id, t.title, t.description, t.due_date, 
      t.status, t.priority, t.assigned_to, t.created_at, t.updated_at,
      u.email as assigned_to_email, u.first_name as assigned_to_first_name, u.last_name as assigned_to_last_name
    FROM event_tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.event_id = $1
  `;
  const params = [eventId];
  let paramIdx = 2;

  if (status) {
    sql += ` AND t.status = $${paramIdx++}`;
    params.push(status);
  }

  if (priority) {
    sql += ` AND t.priority = $${paramIdx++}`;
    params.push(priority);
  }

  if (assignedTo) {
    sql += ` AND t.assigned_to = $${paramIdx++}`;
    params.push(assignedTo);
  }

  sql += ` ORDER BY 
    CASE t.priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
      ELSE 4 
    END,
    t.due_date ASC NULLS LAST,
    t.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Find a single task by ID
 * @param {string} id - Task ID
 * @returns {Promise<Object|null>}
 */
const findTaskById = async (id) => {
  const result = await query(
    `SELECT 
       t.id, t.event_id, t.title, t.description, t.due_date, 
       t.status, t.priority, t.assigned_to, t.created_at, t.updated_at,
       u.email as assigned_to_email, u.first_name as assigned_to_first_name, u.last_name as assigned_to_last_name
     FROM event_tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Create a new task for an event
 * @param {Object} data - Task data
 * @param {string} data.eventId - Event ID
 * @param {string} data.title - Task title
 * @param {string} [data.description] - Task description
 * @param {string} [data.dueDate] - Due date
 * @param {string} [data.status] - Task status
 * @param {string} [data.priority] - Task priority
 * @param {string} [data.assignedTo] - Assigned user ID
 * @returns {Promise<Object>} Created task
 */
const createTask = async (data) => {
  const {
    eventId,
    title,
    description,
    dueDate,
    status = "pending",
    priority = "medium",
    assignedTo
  } = data;

  const result = await query(
    `INSERT INTO event_tasks 
       (event_id, title, description, due_date, status, priority, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      eventId,
      title,
      description || null,
      dueDate || null,
      status,
      priority,
      assignedTo || null
    ]
  );

  return result.rows[0];
};

/**
 * Update a task
 * @param {string} id - Task ID
 * @param {Object} data - Update data
 * @returns {Promise<Object|null>} Updated task
 */
const updateTask = async (id, data) => {
  const updates = [];
  const values = [];
  let paramIdx = 1;

  const fields = {
    title: "title",
    description: "description",
    dueDate: "due_date",
    status: "status",
    priority: "priority",
    assignedTo: "assigned_to"
  };

  for (const [key, column] of Object.entries(fields)) {
    if (data[key] !== undefined) {
      updates.push(`${column} = $${paramIdx++}`);
      values.push(data[key]);
    }
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE event_tasks SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete a task
 * @param {string} id - Task ID
 * @returns {Promise<boolean>}
 */
const deleteTask = async (id) => {
  const result = await query(
    "DELETE FROM event_tasks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows.length > 0;
};

module.exports = {
  // Events
  findEventsByOrganization,
  findEventById,
  createEvent,
  updateEvent,
  deleteEvent,

  // Tasks
  findTasksByEvent,
  findTaskById,
  createTask,
  updateTask,
  deleteTask
};
