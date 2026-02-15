const { query } = require("../../db");

// =====================
// Floor Plans
// =====================

const listFloorPlans = async (eventId) => {
  const result = await query(
    `SELECT id, event_id, name, width, height, background_image_url, created_at, updated_at
     FROM floor_plans
     WHERE event_id = $1
     ORDER BY created_at DESC`,
    [eventId]
  );
  return result.rows;
};

const getFloorPlanById = async (floorPlanId) => {
  const result = await query(
    `SELECT id, event_id, name, width, height, background_image_url, created_at, updated_at
     FROM floor_plans
     WHERE id = $1`,
    [floorPlanId]
  );
  return result.rows[0] || null;
};

const createFloorPlan = async ({ eventId, name, width, height, backgroundImageUrl }) => {
  const result = await query(
    `INSERT INTO floor_plans (event_id, name, width, height, background_image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [eventId, name, width || 2000, height || 1500, backgroundImageUrl || null]
  );
  return result.rows[0]?.id;
};

const updateFloorPlan = async (floorPlanId, updates) => {
  const fields = [];
  const values = [];
  let paramIdx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIdx++}`);
    values.push(updates.name);
  }
  if (updates.width !== undefined) {
    fields.push(`width = $${paramIdx++}`);
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push(`height = $${paramIdx++}`);
    values.push(updates.height);
  }
  if (updates.backgroundImageUrl !== undefined) {
    fields.push(`background_image_url = $${paramIdx++}`);
    values.push(updates.backgroundImageUrl);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(floorPlanId);

  const result = await query(
    `UPDATE floor_plans SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deleteFloorPlan = async (floorPlanId) => {
  await query("DELETE FROM floor_plans WHERE id = $1", [floorPlanId]);
};

// =====================
// Seating Tables
// =====================

const listTablesByFloorPlan = async (floorPlanId) => {
  const result = await query(
    `SELECT t.id, t.floor_plan_id, t.name, t.shape, t.position_x, t.position_y, 
            t.width, t.height, t.capacity, t.rotation, t.created_at,
            COUNT(sa.id) as assigned_guests
     FROM seating_tables t
     LEFT JOIN seating_assignments sa ON sa.table_id = t.id
     WHERE t.floor_plan_id = $1
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [floorPlanId]
  );
  return result.rows;
};

const getTableById = async (tableId) => {
  const result = await query(
    `SELECT t.id, t.floor_plan_id, t.name, t.shape, t.position_x, t.position_y, 
            t.width, t.height, t.capacity, t.rotation, t.created_at,
            COUNT(sa.id) as assigned_guests
     FROM seating_tables t
     LEFT JOIN seating_assignments sa ON sa.table_id = t.id
     WHERE t.id = $1
     GROUP BY t.id`,
    [tableId]
  );
  return result.rows[0] || null;
};

const createTable = async ({ floorPlanId, name, shape, positionX, positionY, width, height, capacity, rotation }) => {
  const result = await query(
    `INSERT INTO seating_tables (floor_plan_id, name, shape, position_x, position_y, width, height, capacity, rotation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      floorPlanId,
      name,
      shape || 'ROUND',
      positionX || 0,
      positionY || 0,
      width || 100,
      height || 100,
      capacity || 8,
      rotation || 0
    ]
  );
  return result.rows[0]?.id;
};

const updateTable = async (tableId, updates) => {
  const fields = [];
  const values = [];
  let paramIdx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIdx++}`);
    values.push(updates.name);
  }
  if (updates.shape !== undefined) {
    fields.push(`shape = $${paramIdx++}`);
    values.push(updates.shape);
  }
  if (updates.width !== undefined) {
    fields.push(`width = $${paramIdx++}`);
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push(`height = $${paramIdx++}`);
    values.push(updates.height);
  }
  if (updates.capacity !== undefined) {
    fields.push(`capacity = $${paramIdx++}`);
    values.push(updates.capacity);
  }

  if (fields.length === 0) return null;

  values.push(tableId);
  const result = await query(
    `UPDATE seating_tables SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING id`,
    values
  );
  return result.rows[0]?.id || null;
};

const updateTablePosition = async (tableId, { positionX, positionY, rotation }) => {
  const result = await query(
    `UPDATE seating_tables 
     SET position_x = $1, position_y = $2, rotation = $3
     WHERE id = $4
     RETURNING id`,
    [positionX, positionY, rotation || 0, tableId]
  );
  return result.rows[0]?.id || null;
};

const deleteTable = async (tableId) => {
  await query("DELETE FROM seating_tables WHERE id = $1", [tableId]);
};

// =====================
// Seating Assignments
// =====================

const listAssignmentsByTable = async (tableId) => {
  const result = await query(
    `SELECT sa.id, sa.table_id, sa.guest_id, sa.seat_number, sa.created_at,
            g.first_name, g.last_name, g.role,
            gg.name as group_name
     FROM seating_assignments sa
     JOIN guests g ON sa.guest_id = g.id
     LEFT JOIN guest_groups gg ON g.group_id = gg.id
     WHERE sa.table_id = $1
     ORDER BY sa.seat_number NULLS LAST, sa.created_at`,
    [tableId]
  );
  return result.rows;
};

const getAssignmentById = async (assignmentId) => {
  const result = await query(
    `SELECT sa.id, sa.table_id, sa.guest_id, sa.seat_number, sa.created_at,
            g.first_name, g.last_name
     FROM seating_assignments sa
     JOIN guests g ON sa.guest_id = g.id
     WHERE sa.id = $1`,
    [assignmentId]
  );
  return result.rows[0] || null;
};

const getAssignmentByGuest = async (guestId) => {
  const result = await query(
    `SELECT sa.id, sa.table_id, sa.guest_id, sa.seat_number, sa.created_at,
            t.name as table_name, t.floor_plan_id
     FROM seating_assignments sa
     JOIN seating_tables t ON sa.table_id = t.id
     WHERE sa.guest_id = $1`,
    [guestId]
  );
  return result.rows[0] || null;
};

const createAssignment = async ({ tableId, guestId, seatNumber }) => {
  const result = await query(
    `INSERT INTO seating_assignments (table_id, guest_id, seat_number)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [tableId, guestId, seatNumber || null]
  );
  return result.rows[0]?.id;
};

const deleteAssignment = async (assignmentId) => {
  await query("DELETE FROM seating_assignments WHERE id = $1", [assignmentId]);
};

const deleteAssignmentByGuest = async (guestId) => {
  await query("DELETE FROM seating_assignments WHERE guest_id = $1", [guestId]);
};

// =====================
// Check-in Records
// =====================

const listCheckInsByEvent = async (eventId) => {
  const result = await query(
    `SELECT ci.id, ci.event_id, ci.guest_id, ci.checked_in_at, ci.checked_in_by, 
            ci.method, ci.notes,
            g.first_name, g.last_name,
            u.full_name as checked_in_by_name
     FROM check_in_records ci
     JOIN guests g ON ci.guest_id = g.id
     LEFT JOIN users u ON ci.checked_in_by = u.id
     WHERE ci.event_id = $1
     ORDER BY ci.checked_in_at DESC`,
    [eventId]
  );
  return result.rows;
};

const getCheckInById = async (checkInId) => {
  const result = await query(
    `SELECT ci.id, ci.event_id, ci.guest_id, ci.checked_in_at, ci.checked_in_by, 
            ci.method, ci.notes,
            g.first_name, g.last_name
     FROM check_in_records ci
     JOIN guests g ON ci.guest_id = g.id
     WHERE ci.id = $1`,
    [checkInId]
  );
  return result.rows[0] || null;
};

const getCheckInByGuest = async (eventId, guestId) => {
  const result = await query(
    `SELECT id, event_id, guest_id, checked_in_at, checked_in_by, method, notes
     FROM check_in_records
     WHERE event_id = $1 AND guest_id = $2`,
    [eventId, guestId]
  );
  return result.rows[0] || null;
};

const createCheckIn = async ({ eventId, guestId, checkedInBy, method, notes }) => {
  const result = await query(
    `INSERT INTO check_in_records (event_id, guest_id, checked_in_by, method, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [eventId, guestId, checkedInBy || null, method || 'QR', notes || null]
  );
  return result.rows[0]?.id;
};

const deleteCheckIn = async (checkInId) => {
  await query("DELETE FROM check_in_records WHERE id = $1", [checkInId]);
};

// =====================
// Statistics
// =====================

const getSeatingStats = async (eventId) => {
  // Get all floor plans for this event with their tables and assignments
  const floorPlansResult = await query(
    `SELECT 
       fp.id as floor_plan_id,
       fp.name as floor_plan_name,
       COUNT(DISTINCT t.id) as table_count,
       COALESCE(SUM(t.capacity), 0) as total_capacity,
       COUNT(DISTINCT sa.id) as assigned_guests
     FROM floor_plans fp
     LEFT JOIN seating_tables t ON t.floor_plan_id = fp.id
     LEFT JOIN seating_assignments sa ON sa.table_id = t.id
     WHERE fp.event_id = $1
     GROUP BY fp.id, fp.name`,
    [eventId]
  );

  // Get check-in stats
  const checkInResult = await query(
    `SELECT 
       COUNT(DISTINCT g.id) as total_guests,
       COUNT(DISTINCT ci.id) as checked_in_count
     FROM guests g
     JOIN projects p ON g.project_id = p.id
     JOIN events e ON e.project_id = p.id
     LEFT JOIN check_in_records ci ON ci.guest_id = g.id AND ci.event_id = $1
     WHERE e.id = $1`,
    [eventId]
  );

  return {
    floorPlans: floorPlansResult.rows,
    checkIns: checkInResult.rows[0] || { total_guests: 0, checked_in_count: 0 }
  };
};

const getGuestSeatingInfo = async (eventId, guestId) => {
  const result = await query(
    `SELECT 
       sa.id as assignment_id,
       sa.seat_number,
       t.id as table_id,
       t.name as table_name,
       t.shape as table_shape,
       fp.id as floor_plan_id,
       fp.name as floor_plan_name,
       ci.id as check_in_id,
       ci.checked_in_at,
       ci.method as check_in_method
     FROM seating_assignments sa
     JOIN seating_tables t ON sa.table_id = t.id
     JOIN floor_plans fp ON t.floor_plan_id = fp.id
     LEFT JOIN check_in_records ci ON ci.guest_id = sa.guest_id AND ci.event_id = fp.event_id
     WHERE fp.event_id = $1 AND sa.guest_id = $2`,
    [eventId, guestId]
  );
  return result.rows[0] || null;
};

module.exports = {
  // Floor Plans
  listFloorPlans,
  getFloorPlanById,
  createFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,

  // Tables
  listTablesByFloorPlan,
  getTableById,
  createTable,
  updateTable,
  updateTablePosition,
  deleteTable,

  // Assignments
  listAssignmentsByTable,
  getAssignmentById,
  getAssignmentByGuest,
  createAssignment,
  deleteAssignment,
  deleteAssignmentByGuest,

  // Check-ins
  listCheckInsByEvent,
  getCheckInById,
  getCheckInByGuest,
  createCheckIn,
  deleteCheckIn,

  // Statistics
  getSeatingStats,
  getGuestSeatingInfo
};
