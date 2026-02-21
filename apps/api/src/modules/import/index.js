/**
 * Import Module - Fastify Plugin
 * 
 * This module handles CSV import functionality for:
 * - Guest imports (for couple users)
 * - Client imports (for business users)
 * 
 * Features:
 * - CSV parsing and validation
 * - Header validation
 * - Row-level validation
 * - Duplicate detection
 * - Preview mode
 * - Partial imports
 * - Template downloads
 */

const importRoutes = require("./routes");
const {
  previewCSV,
  importGuests,
  importClients,
  getTemplate
} = require("./service");
const {
  validateHeaders,
  validateRows,
  getCSVTemplate
} = require("./validation");
const {
  insertGuestsBatch,
  insertClientsBatch,
  checkExistingGuests,
  checkExistingClients
} = require("./repository");

/**
 * Fastify plugin for Import module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function importPlugin(fastify, opts) {
  // Register import routes
  await fastify.register(importRoutes);

  fastify.log.info("Import module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "import",
  prefix: "/import",
  register: importPlugin,
};

// Export route handlers for testing or custom registration
module.exports.importRoutes = importRoutes;

// Export service methods for programmatic use
module.exports.previewCSV = previewCSV;
module.exports.importGuests = importGuests;
module.exports.importClients = importClients;
module.exports.getTemplate = getTemplate;

// Export validation methods
module.exports.validateHeaders = validateHeaders;
module.exports.validateRows = validateRows;
module.exports.getCSVTemplate = getCSVTemplate;

// Export repository methods
module.exports.insertGuestsBatch = insertGuestsBatch;
module.exports.insertClientsBatch = insertClientsBatch;
module.exports.checkExistingGuests = checkExistingGuests;
module.exports.checkExistingClients = checkExistingClients;
