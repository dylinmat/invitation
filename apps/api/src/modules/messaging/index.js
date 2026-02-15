/**
 * Messaging Module - Fastify Plugin
 * 
 * This module handles messaging campaigns, including:
 * - Campaign creation and management
 * - Email/SMS/WhatsApp delivery
 * - Suppression list management
 * - Delivery tracking and webhooks
 */

const { messagingRoutes, webhookRoutes } = require("./routes");

const {
  createCampaign,
  createCampaignWithJobs,
  getCampaignReadiness,
  approveCampaign,
  cancelCampaign,
  getCampaignStats,
  listCampaigns,
  getCampaign,
  addToSuppressionList,
  handleSESEvent,
  getProjectSuppressionList,
  removeFromSuppressionList
} = require("./service");

const scoring = require("./scoring");
const repository = require("./repository");

/**
 * Fastify plugin for Messaging module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function messagingPlugin(fastify, opts) {
  // Register messaging routes
  await fastify.register(messagingRoutes);

  // Register webhook routes
  await fastify.register(webhookRoutes);

  fastify.log.info("Messaging module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "messaging",
  prefix: "/messaging",
  register: messagingPlugin,
};

// Export route handlers for testing or custom registration
module.exports.messagingRoutes = messagingRoutes;
module.exports.webhookRoutes = webhookRoutes;

// Export service methods for programmatic use
module.exports.createCampaign = createCampaign;
module.exports.createCampaignWithJobs = createCampaignWithJobs;
module.exports.getCampaignReadiness = getCampaignReadiness;
module.exports.approveCampaign = approveCampaign;
module.exports.cancelCampaign = cancelCampaign;
module.exports.getCampaignStats = getCampaignStats;
module.exports.listCampaigns = listCampaigns;
module.exports.getCampaign = getCampaign;
module.exports.addToSuppressionList = addToSuppressionList;
module.exports.handleSESEvent = handleSESEvent;
module.exports.getProjectSuppressionList = getProjectSuppressionList;
module.exports.removeFromSuppressionList = removeFromSuppressionList;

// Export scoring utilities
module.exports.scoring = scoring;

// Export repository for advanced use cases
module.exports.repository = repository;
