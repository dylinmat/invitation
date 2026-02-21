/**
 * Admin Module
 * Administrative functions for platform management
 */

const registerAdminRoutes = require("./routes");
const repository = require("./repository");

module.exports = {
  registerAdminRoutes,
  ...repository
};
