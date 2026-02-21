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
  isGuestCheckedIn,

  // QR Code
  generateCheckInQR,
  generateGuestCheckInQR,
  validateQRCheckIn,

  // Statistics
  getEventSeatingStats,
  getGuestSeatingDetails
} = require("./service");

const handleSeatingRoutes = require("./routes");

module.exports = {
  // Route handler for Fastify integration
  handleSeatingRoutes,

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
