/**
 * Events Module - Fastify Plugin
 *
 * This module handles event management, including:
 * - Event CRUD operations
 * - Event task management
 * - Event scheduling and planning
 */

const eventRoutes = require("./routes");

const {
  // Events
  getOrganizationEvents,
  getEvent,
  createNewEvent,
  updateExistingEvent,
  removeEvent,

  // Tasks
  getEventTasks,
  createNewTask,
  updateExistingTask,
  removeTask
} = require("./service");

/**
 * Fastify plugin for Events module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function eventsPlugin(fastify, opts) {
  // Register event routes with prefix
  await fastify.register(eventRoutes, { prefix: "/events" });

  fastify.log.info("Events module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "events",
  prefix: "/events",
  register: eventsPlugin,
};

// Export route handlers for testing or custom registration
module.exports.eventRoutes = eventRoutes;

// Export service methods for programmatic use
module.exports.getOrganizationEvents = getOrganizationEvents;
module.exports.getEvent = getEvent;
module.exports.createNewEvent = createNewEvent;
module.exports.updateExistingEvent = updateExistingEvent;
module.exports.removeEvent = removeEvent;
module.exports.getEventTasks = getEventTasks;
module.exports.createNewTask = createNewTask;
module.exports.updateExistingTask = updateExistingTask;
module.exports.removeTask = removeTask;
