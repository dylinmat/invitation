const crypto = require("crypto");
const {
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
} = require("./repository");

// =====================
// Floor Plans Service
// =====================

const VALID_SHAPES = ['ROUND', 'RECTANGLE', 'SQUARE', 'CUSTOM'];

const getEventFloorPlans = async (eventId) => {
  return listFloorPlans(eventId);
};

const getFloorPlan = async (floorPlanId) => {
  const floorPlan = await getFloorPlanById(floorPlanId);
  if (!floorPlan) {
    throw new Error("Floor plan not found");
  }
  return floorPlan;
};

const createEventFloorPlan = async (eventId, { name, width, height, backgroundImageUrl }) => {
  if (!name) {
    throw new Error("Floor plan name is required");
  }

  return createFloorPlan({
    eventId,
    name,
    width,
    height,
    backgroundImageUrl
  });
};

const updateEventFloorPlan = async (floorPlanId, updates) => {
  const floorPlan = await getFloorPlanById(floorPlanId);
  if (!floorPlan) {
    throw new Error("Floor plan not found");
  }

  return updateFloorPlan(floorPlanId, updates);
};

const deleteEventFloorPlan = async (floorPlanId) => {
  const floorPlan = await getFloorPlanById(floorPlanId);
  if (!floorPlan) {
    throw new Error("Floor plan not found");
  }

  await deleteFloorPlan(floorPlanId);
  return { success: true };
};

// =====================
// Tables Service
// =====================

const getFloorPlanTables = async (floorPlanId) => {
  return listTablesByFloorPlan(floorPlanId);
};

const getTable = async (tableId) => {
  const table = await getTableById(tableId);
  if (!table) {
    throw new Error("Table not found");
  }
  return table;
};

const createFloorPlanTable = async (floorPlanId, { name, shape, positionX, positionY, width, height, capacity, rotation }) => {
  if (!name) {
    throw new Error("Table name is required");
  }

  if (shape && !VALID_SHAPES.includes(shape)) {
    throw new Error(`Invalid shape. Valid shapes: ${VALID_SHAPES.join(", ")}`);
  }

  return createTable({
    floorPlanId,
    name,
    shape,
    positionX,
    positionY,
    width,
    height,
    capacity,
    rotation
  });
};

const updateFloorPlanTable = async (tableId, updates) => {
  const table = await getTableById(tableId);
  if (!table) {
    throw new Error("Table not found");
  }

  if (updates.shape && !VALID_SHAPES.includes(updates.shape)) {
    throw new Error(`Invalid shape. Valid shapes: ${VALID_SHAPES.join(", ")}`);
  }

  return updateTable(tableId, updates);
};

const updateTablePositionService = async (tableId, { positionX, positionY, rotation }) => {
  const table = await getTableById(tableId);
  if (!table) {
    throw new Error("Table not found");
  }

  if (positionX === undefined || positionY === undefined) {
    throw new Error("Position X and Y are required");
  }

  return updateTablePosition(tableId, { positionX, positionY, rotation });
};

const deleteFloorPlanTable = async (tableId) => {
  const table = await getTableById(tableId);
  if (!table) {
    throw new Error("Table not found");
  }

  await deleteTable(tableId);
  return { success: true };
};

// =====================
// Assignments Service
// =====================

const getTableAssignments = async (tableId) => {
  return listAssignmentsByTable(tableId);
};

const assignGuestToTable = async (guestId, tableId, seatNumber) => {
  // Check if guest is already assigned to another table
  const existingAssignment = await getAssignmentByGuest(guestId);
  if (existingAssignment) {
    // Remove existing assignment
    await deleteAssignmentByGuest(guestId);
  }

  const table = await getTableById(tableId);
  if (!table) {
    throw new Error("Table not found");
  }

  // Check if table is at capacity
  const assignedCount = parseInt(table.assigned_guests, 10) || 0;
  const capacity = parseInt(table.capacity, 10) || 0;
  if (assignedCount >= capacity) {
    throw new Error("Table is at capacity");
  }

  // If seat number is provided, check if it's already taken
  if (seatNumber !== undefined && seatNumber !== null) {
    const assignments = await listAssignmentsByTable(tableId);
    const seatTaken = assignments.some(a => a.seat_number === seatNumber);
    if (seatTaken) {
      throw new Error(`Seat ${seatNumber} is already taken`);
    }
  }

  return createAssignment({ tableId, guestId, seatNumber });
};

const removeGuestFromTable = async (assignmentId) => {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    throw new Error("Assignment not found");
  }

  await deleteAssignment(assignmentId);
  return { success: true };
};

const moveGuestToTable = async (guestId, newTableId, seatNumber) => {
  // Remove existing assignment if any
  const existingAssignment = await getAssignmentByGuest(guestId);
  if (existingAssignment) {
    await deleteAssignmentByGuest(guestId);
  }

  // Create new assignment
  return assignGuestToTable(guestId, newTableId, seatNumber);
};

// =====================
// Check-in Service
// =====================

const VALID_CHECKIN_METHODS = ['QR', 'MANUAL', 'IMPORT'];

const getEventCheckIns = async (eventId) => {
  return listCheckInsByEvent(eventId);
};

const checkInGuest = async (eventId, guestId, method, userId, notes) => {
  // Validate check-in method
  if (method && !VALID_CHECKIN_METHODS.includes(method)) {
    throw new Error(`Invalid check-in method. Valid methods: ${VALID_CHECKIN_METHODS.join(", ")}`);
  }

  // Check if guest is already checked in
  const existingCheckIn = await getCheckInByGuest(eventId, guestId);
  if (existingCheckIn) {
    throw new Error("Guest is already checked in");
  }

  return createCheckIn({
    eventId,
    guestId,
    checkedInBy: userId,
    method: method || 'MANUAL',
    notes
  });
};

const undoCheckIn = async (checkInId) => {
  const checkIn = await getCheckInById(checkInId);
  if (!checkIn) {
    throw new Error("Check-in record not found");
  }

  await deleteCheckIn(checkInId);
  return { success: true };
};

const isGuestCheckedIn = async (eventId, guestId) => {
  const checkIn = await getCheckInByGuest(eventId, guestId);
  return !!checkIn;
};

// =====================
// QR Code Check-in
// =====================

/**
 * Generate QR code data for event check-in
 * Format: encrypted JSON containing eventId and timestamp
 */
const generateCheckInQR = async (eventId) => {
  const data = {
    eventId,
    timestamp: Date.now(),
    type: 'EVENT_CHECKIN'
  };

  // Simple encryption using AES-256
  // In production, use a proper key management system
  const encryptionKey = process.env.QR_ENCRYPTION_KEY || 'default-key-for-development-only';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.scryptSync(encryptionKey, 'salt', 32),
    iv
  );

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const qrData = {
    data: encrypted,
    iv: iv.toString('hex'),
    v: 1 // version
  };

  return Buffer.from(JSON.stringify(qrData)).toString('base64');
};

/**
 * Generate QR code data for a specific guest
 * Format: encrypted JSON containing eventId, guestId and timestamp
 */
const generateGuestCheckInQR = async (eventId, guestId) => {
  const data = {
    eventId,
    guestId,
    timestamp: Date.now(),
    type: 'GUEST_CHECKIN'
  };

  const encryptionKey = process.env.QR_ENCRYPTION_KEY || 'default-key-for-development-only';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.scryptSync(encryptionKey, 'salt', 32),
    iv
  );

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const qrData = {
    data: encrypted,
    iv: iv.toString('hex'),
    v: 1
  };

  return Buffer.from(JSON.stringify(qrData)).toString('base64');
};

/**
 * Validate and process QR code check-in
 */
const validateQRCheckIn = async (qrData, userId) => {
  try {
    // Decode base64
    const decoded = JSON.parse(Buffer.from(qrData, 'base64').toString('utf8'));
    
    if (!decoded.data || !decoded.iv) {
      throw new Error("Invalid QR code format");
    }

    // Decrypt
    const encryptionKey = process.env.QR_ENCRYPTION_KEY || 'default-key-for-development-only';
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.scryptSync(encryptionKey, 'salt', 32),
      Buffer.from(decoded.iv, 'hex')
    );

    let decrypted = decipher.update(decoded.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);

    // Validate timestamp (QR codes expire after 24 hours for single-use)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - payload.timestamp > maxAge) {
      throw new Error("QR code has expired");
    }

    // Handle different QR code types
    if (payload.type === 'GUEST_CHECKIN') {
      // Check if guest is already checked in
      const existingCheckIn = await getCheckInByGuest(payload.eventId, payload.guestId);
      if (existingCheckIn) {
        return {
          success: false,
          alreadyCheckedIn: true,
          checkIn: existingCheckIn
        };
      }

      // Perform check-in
      const checkInId = await createCheckIn({
        eventId: payload.eventId,
        guestId: payload.guestId,
        checkedInBy: userId,
        method: 'QR',
        notes: 'Checked in via QR code'
      });

      return {
        success: true,
        checkInId,
        eventId: payload.eventId,
        guestId: payload.guestId
      };
    } else if (payload.type === 'EVENT_CHECKIN') {
      // This is a general event QR code, needs guest ID to be provided separately
      return {
        success: true,
        requiresGuestId: true,
        eventId: payload.eventId
      };
    } else {
      throw new Error("Unknown QR code type");
    }
  } catch (error) {
    if (error.message.includes("Invalid") || error.message.includes("expired")) {
      throw error;
    }
    throw new Error("Invalid QR code");
  }
};

// =====================
// Statistics Service
// =====================

const getEventSeatingStats = async (eventId) => {
  const stats = await getSeatingStats(eventId);
  
  // Calculate derived statistics
  let totalCapacity = 0;
  let totalAssigned = 0;
  let totalTables = 0;

  for (const fp of stats.floorPlans) {
    totalCapacity += parseInt(fp.total_capacity, 10) || 0;
    totalAssigned += parseInt(fp.assigned_guests, 10) || 0;
    totalTables += parseInt(fp.table_count, 10) || 0;
  }

  const checkedIn = parseInt(stats.checkIns.checked_in_count, 10) || 0;
  const totalGuests = parseInt(stats.checkIns.total_guests, 10) || 0;

  return {
    floorPlans: stats.floorPlans,
    summary: {
      totalFloorPlans: stats.floorPlans.length,
      totalTables,
      totalCapacity,
      totalAssigned,
      unassignedSeats: totalCapacity - totalAssigned,
      fillRate: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0,
      totalGuests,
      checkedIn,
      checkInRate: totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0,
      pendingCheckIn: totalGuests - checkedIn
    }
  };
};

const getGuestSeatingDetails = async (eventId, guestId) => {
  return getGuestSeatingInfo(eventId, guestId);
};

module.exports = {
  // Floor Plans
  getEventFloorPlans,
  getFloorPlan,
  createEventFloorPlan,
  updateEventFloorPlan,
  deleteEventFloorPlan,

  // Tables
  getFloorPlanTables,
  getTable,
  createFloorPlanTable,
  updateFloorPlanTable,
  updateTablePositionService,
  deleteFloorPlanTable,

  // Assignments
  getTableAssignments,
  assignGuestToTable,
  removeGuestFromTable,
  moveGuestToTable,

  // Check-in
  getEventCheckIns,
  checkInGuest,
  undoCheckIn,
  isGuestCheckedIn,

  // QR Code
  generateCheckInQR,
  generateGuestCheckInQR,
  validateQRCheckIn,

  // Statistics
  getEventSeatingStats,
  getGuestSeatingDetails
};
