const {
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

  // QR Code
  generateCheckInQR,
  generateGuestCheckInQR,
  validateQRCheckIn,

  // Statistics
  getEventSeatingStats
} = require("./service");

// =====================
// Route Handlers - Floor Plans
// =====================

const handleListFloorPlans = async (req, res, eventId) => {
  const floorPlans = await getEventFloorPlans(eventId);
  return { status: 200, body: { floorPlans } };
};

const handleCreateFloorPlan = async (req, res, eventId, body) => {
  const floorPlanId = await createEventFloorPlan(eventId, {
    name: body.name,
    width: body.width,
    height: body.height,
    backgroundImageUrl: body.backgroundImageUrl
  });
  return { status: 201, body: { id: floorPlanId, message: "Floor plan created successfully" } };
};

const handleGetFloorPlan = async (req, res, floorPlanId) => {
  const floorPlan = await getFloorPlan(floorPlanId);
  return { status: 200, body: { floorPlan } };
};

const handleUpdateFloorPlan = async (req, res, floorPlanId, body) => {
  await updateEventFloorPlan(floorPlanId, {
    name: body.name,
    width: body.width,
    height: body.height,
    backgroundImageUrl: body.backgroundImageUrl
  });
  return { status: 200, body: { message: "Floor plan updated successfully" } };
};

const handleDeleteFloorPlan = async (req, res, floorPlanId) => {
  await deleteEventFloorPlan(floorPlanId);
  return { status: 200, body: { message: "Floor plan deleted successfully" } };
};

// =====================
// Route Handlers - Tables
// =====================

const handleListTables = async (req, res, floorPlanId) => {
  const tables = await getFloorPlanTables(floorPlanId);
  return { status: 200, body: { tables } };
};

const handleCreateTable = async (req, res, floorPlanId, body) => {
  const tableId = await createFloorPlanTable(floorPlanId, {
    name: body.name,
    shape: body.shape,
    positionX: body.positionX,
    positionY: body.positionY,
    width: body.width,
    height: body.height,
    capacity: body.capacity,
    rotation: body.rotation
  });
  return { status: 201, body: { id: tableId, message: "Table created successfully" } };
};

const handleUpdateTable = async (req, res, tableId, body) => {
  await updateFloorPlanTable(tableId, {
    name: body.name,
    shape: body.shape,
    width: body.width,
    height: body.height,
    capacity: body.capacity
  });
  return { status: 200, body: { message: "Table updated successfully" } };
};

const handleDeleteTable = async (req, res, tableId) => {
  await deleteFloorPlanTable(tableId);
  return { status: 200, body: { message: "Table deleted successfully" } };
};

const handleUpdateTablePosition = async (req, res, tableId, body) => {
  await updateTablePositionService(tableId, {
    positionX: body.positionX,
    positionY: body.positionY,
    rotation: body.rotation
  });
  return { status: 200, body: { message: "Table position updated successfully" } };
};

// =====================
// Route Handlers - Assignments
// =====================

const handleListAssignments = async (req, res, tableId) => {
  const assignments = await getTableAssignments(tableId);
  return { status: 200, body: { assignments } };
};

const handleCreateAssignment = async (req, res, body) => {
  const assignmentId = await assignGuestToTable(body.guestId, body.tableId, body.seatNumber);
  return { status: 201, body: { id: assignmentId, message: "Guest assigned to table successfully" } };
};

const handleDeleteAssignment = async (req, res, assignmentId) => {
  await removeGuestFromTable(assignmentId);
  return { status: 200, body: { message: "Guest removed from table successfully" } };
};

const handleMoveGuest = async (req, res, body) => {
  const assignmentId = await moveGuestToTable(body.guestId, body.tableId, body.seatNumber);
  return { status: 200, body: { id: assignmentId, message: "Guest moved to table successfully" } };
};

// =====================
// Route Handlers - Check-in
// =====================

const handleListCheckIns = async (req, res, eventId) => {
  const checkIns = await getEventCheckIns(eventId);
  return { status: 200, body: { checkIns } };
};

const handleCheckInGuest = async (req, res, eventId, body, userId) => {
  const checkInId = await checkInGuest(
    eventId,
    body.guestId,
    body.method,
    userId,
    body.notes
  );
  return { status: 201, body: { id: checkInId, message: "Guest checked in successfully" } };
};

const handleUndoCheckIn = async (req, res, checkInId) => {
  await undoCheckIn(checkInId);
  return { status: 200, body: { message: "Check-in undone successfully" } };
};

// =====================
// Route Handlers - QR Code
// =====================

const handleGenerateEventQR = async (req, res, eventId) => {
  const qrCode = await generateCheckInQR(eventId);
  return { status: 200, body: { qrCode, eventId } };
};

const handleGenerateGuestQR = async (req, res, eventId, body) => {
  const qrCode = await generateGuestCheckInQR(eventId, body.guestId);
  return { status: 200, body: { qrCode, eventId, guestId: body.guestId } };
};

const handleValidateQR = async (req, res, body, userId) => {
  const result = await validateQRCheckIn(body.qrData, userId);
  return { status: 200, body: result };
};

// =====================
// Route Handlers - Statistics
// =====================

const handleGetSeatingStats = async (req, res, eventId) => {
  const stats = await getEventSeatingStats(eventId);
  return { status: 200, body: stats };
};

// =====================
// Route Matching
// =====================

const matchRoute = (method, pathname) => {
  // Floor Plans
  if (method === "GET" && /^\/events\/[^/]+\/floor-plans$/.test(pathname)) {
    return { handler: "listFloorPlans", params: { eventId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/events\/[^/]+\/floor-plans$/.test(pathname)) {
    return { handler: "createFloorPlan", params: { eventId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/floor-plans\/[^/]+$/.test(pathname)) {
    return { handler: "getFloorPlan", params: { floorPlanId: pathname.split("/")[2] } };
  }
  if (method === "PATCH" && /^\/floor-plans\/[^/]+$/.test(pathname)) {
    return { handler: "updateFloorPlan", params: { floorPlanId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/floor-plans\/[^/]+$/.test(pathname)) {
    return { handler: "deleteFloorPlan", params: { floorPlanId: pathname.split("/")[2] } };
  }

  // Tables
  if (method === "GET" && /^\/floor-plans\/[^/]+\/tables$/.test(pathname)) {
    return { handler: "listTables", params: { floorPlanId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/floor-plans\/[^/]+\/tables$/.test(pathname)) {
    return { handler: "createTable", params: { floorPlanId: pathname.split("/")[2] } };
  }
  if (method === "PATCH" && /^\/tables\/[^/]+$/.test(pathname)) {
    return { handler: "updateTable", params: { tableId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/tables\/[^/]+$/.test(pathname)) {
    return { handler: "deleteTable", params: { tableId: pathname.split("/")[2] } };
  }
  if (method === "PATCH" && /^\/tables\/[^/]+\/position$/.test(pathname)) {
    return { handler: "updateTablePosition", params: { tableId: pathname.split("/")[2] } };
  }

  // Assignments
  if (method === "GET" && /^\/tables\/[^/]+\/assignments$/.test(pathname)) {
    return { handler: "listAssignments", params: { tableId: pathname.split("/")[2] } };
  }
  if (method === "POST" && pathname === "/seating/assignments") {
    return { handler: "createAssignment", params: {} };
  }
  if (method === "DELETE" && /^\/seating\/assignments\/[^/]+$/.test(pathname)) {
    return { handler: "deleteAssignment", params: { assignmentId: pathname.split("/")[3] } };
  }
  if (method === "POST" && pathname === "/seating/move-guest") {
    return { handler: "moveGuest", params: {} };
  }

  // Check-in
  if (method === "POST" && /^\/events\/[^/]+\/check-in$/.test(pathname)) {
    return { handler: "checkInGuest", params: { eventId: pathname.split("/")[2] } };
  }
  if (method === "POST" && pathname === "/check-in/qr") {
    return { handler: "validateQR", params: {} };
  }
  if (method === "GET" && /^\/events\/[^/]+\/check-ins$/.test(pathname)) {
    return { handler: "listCheckIns", params: { eventId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/check-ins\/[^/]+$/.test(pathname)) {
    return { handler: "undoCheckIn", params: { checkInId: pathname.split("/")[2] } };
  }

  // QR Code Generation
  if (method === "POST" && /^\/events\/[^/]+\/qr-code$/.test(pathname)) {
    return { handler: "generateEventQR", params: { eventId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/events\/[^/]+\/guest-qr-code$/.test(pathname)) {
    return { handler: "generateGuestQR", params: { eventId: pathname.split("/")[2] } };
  }

  // Statistics
  if (method === "GET" && /^\/events\/[^/]+\/seating-stats$/.test(pathname)) {
    return { handler: "getSeatingStats", params: { eventId: pathname.split("/")[2] } };
  }

  return null;
};

// =====================
// Main Handler
// =====================

const handleSeatingRoutes = async (req, res, body, reqInfo) => {
  const route = matchRoute(req.method, req.pathname);

  if (!route) {
    return null; // Not a seating route
  }

  const { handler, params } = route;

  try {
    let result;

    switch (handler) {
      // Floor Plans
      case "listFloorPlans":
        result = await handleListFloorPlans(req, res, params.eventId);
        break;
      case "createFloorPlan":
        result = await handleCreateFloorPlan(req, res, params.eventId, body);
        break;
      case "getFloorPlan":
        result = await handleGetFloorPlan(req, res, params.floorPlanId);
        break;
      case "updateFloorPlan":
        result = await handleUpdateFloorPlan(req, res, params.floorPlanId, body);
        break;
      case "deleteFloorPlan":
        result = await handleDeleteFloorPlan(req, res, params.floorPlanId);
        break;

      // Tables
      case "listTables":
        result = await handleListTables(req, res, params.floorPlanId);
        break;
      case "createTable":
        result = await handleCreateTable(req, res, params.floorPlanId, body);
        break;
      case "updateTable":
        result = await handleUpdateTable(req, res, params.tableId, body);
        break;
      case "deleteTable":
        result = await handleDeleteTable(req, res, params.tableId);
        break;
      case "updateTablePosition":
        result = await handleUpdateTablePosition(req, res, params.tableId, body);
        break;

      // Assignments
      case "listAssignments":
        result = await handleListAssignments(req, res, params.tableId);
        break;
      case "createAssignment":
        result = await handleCreateAssignment(req, res, body);
        break;
      case "deleteAssignment":
        result = await handleDeleteAssignment(req, res, params.assignmentId);
        break;
      case "moveGuest":
        result = await handleMoveGuest(req, res, body);
        break;

      // Check-in
      case "listCheckIns":
        result = await handleListCheckIns(req, res, params.eventId);
        break;
      case "checkInGuest":
        result = await handleCheckInGuest(req, res, params.eventId, body, reqInfo.userId);
        break;
      case "undoCheckIn":
        result = await handleUndoCheckIn(req, res, params.checkInId);
        break;

      // QR Code
      case "generateEventQR":
        result = await handleGenerateEventQR(req, res, params.eventId);
        break;
      case "generateGuestQR":
        result = await handleGenerateGuestQR(req, res, params.eventId, body);
        break;
      case "validateQR":
        result = await handleValidateQR(req, res, body, reqInfo.userId);
        break;

      // Statistics
      case "getSeatingStats":
        result = await handleGetSeatingStats(req, res, params.eventId);
        break;

      default:
        return null;
    }

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = handleSeatingRoutes;
