/**
 * Clients Module - Fastify Plugin
 * 
 * This module handles client management, including:
 * - Client CRUD operations
 * - Client notes
 * - Client events lookup
 * - Organization-based access control
 */

const clientRoutes = require("./routes");

const {
  getOrganizationClients,
  getClient,
  createOrganizationClient,
  updateOrganizationClient,
  deleteOrganizationClient,
  getClientNotesList,
  addClientNote,
  getClientEventsList,
  verifyOrganizationAccess
} = require("./service");

/**
 * Fastify plugin for Clients module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function clientsPlugin(fastify, opts) {
  // Register client routes with prefix
  await fastify.register(clientRoutes, { prefix: "/clients" });

  fastify.log.info("Clients module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "clients",
  prefix: "/clients",
  register: clientsPlugin,
};

// Export route handlers for testing or custom registration
module.exports.clientRoutes = clientRoutes;

// Export service methods for programmatic use
module.exports.getOrganizationClients = getOrganizationClients;
module.exports.getClient = getClient;
module.exports.createOrganizationClient = createOrganizationClient;
module.exports.updateOrganizationClient = updateOrganizationClient;
module.exports.deleteOrganizationClient = deleteOrganizationClient;
module.exports.getClientNotesList = getClientNotesList;
module.exports.addClientNote = addClientNote;
module.exports.getClientEventsList = getClientEventsList;
module.exports.verifyOrganizationAccess = verifyOrganizationAccess;
