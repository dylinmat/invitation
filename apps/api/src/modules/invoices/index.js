/**
 * Invoices Module - Fastify Plugin
 * 
 * This module handles invoice management, including:
 * - Creating and managing invoices
 * - Invoice items management
 * - Invoice status tracking (draft, sent, paid, overdue, cancelled)
 * - Invoice number auto-generation
 * - Email sending (logging for now)
 */

const registerInvoicesRoutes = require("./routes");

// Export service methods for programmatic use
const {
  listOrganizationInvoices,
  getInvoice,
  createNewInvoice,
  updateInvoiceDetails,
  removeInvoice,
  sendInvoice,
  payInvoice,
  getNextNumber
} = require("./service");

// Export repository for advanced use cases
const repository = require("./repository");

/**
 * Fastify plugin for Invoices module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function invoicesPlugin(fastify, opts) {
  // Register routes with /invoices prefix
  await fastify.register(registerInvoicesRoutes, { prefix: "/invoices" });

  fastify.log.info("Invoices module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "invoices",
  prefix: "/invoices",
  register: invoicesPlugin,
};

// Also export individual components
module.exports.registerInvoicesRoutes = registerInvoicesRoutes;
module.exports.listOrganizationInvoices = listOrganizationInvoices;
module.exports.getInvoice = getInvoice;
module.exports.createNewInvoice = createNewInvoice;
module.exports.updateInvoiceDetails = updateInvoiceDetails;
module.exports.removeInvoice = removeInvoice;
module.exports.sendInvoice = sendInvoice;
module.exports.payInvoice = payInvoice;
module.exports.getNextNumber = getNextNumber;
module.exports.repository = repository;
