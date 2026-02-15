/**
 * Sites Module - Fastify Plugin
 * 
 * This module handles site management, including:
 * - Site creation and management
 * - Site versions and publishing
 * - Scene graph editing
 * - Domain management
 */

const { siteRoutes, publicSiteRoutes } = require("./routes");

const {
  createSite,
  getSite,
  listProjectSites,
  updateSiteDetails,
  removeSite,
  createSiteVersion,
  listSiteVersions,
  getSiteVersion,
  updateVersionSceneGraph,
  publishVersion,
  unpublishSiteVersions,
  getPublishedSceneGraphForSite,
  validateSubdomain,
  validateCustomDomain,
  updateSiteDomains,
  getPublicSiteBySubdomain
} = require("./service");

const {
  validateSceneGraph,
  validateAssetReferences,
  sanitizeSceneGraph,
  createMinimalSceneGraph
} = require("./scene-graph");

const repository = require("./repository");

/**
 * Fastify plugin for Sites module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function sitesPlugin(fastify, opts) {
  // Register site routes
  await fastify.register(siteRoutes);

  // Register public site routes
  await fastify.register(publicSiteRoutes);

  fastify.log.info("Sites module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "sites",
  prefix: "/sites",
  register: sitesPlugin,
};

// Export route handlers for testing or custom registration
module.exports.siteRoutes = siteRoutes;
module.exports.publicSiteRoutes = publicSiteRoutes;

// Export service methods for programmatic use
module.exports.createSite = createSite;
module.exports.getSite = getSite;
module.exports.listProjectSites = listProjectSites;
module.exports.updateSiteDetails = updateSiteDetails;
module.exports.removeSite = removeSite;
module.exports.createSiteVersion = createSiteVersion;
module.exports.listSiteVersions = listSiteVersions;
module.exports.getSiteVersion = getSiteVersion;
module.exports.updateVersionSceneGraph = updateVersionSceneGraph;
module.exports.publishVersion = publishVersion;
module.exports.unpublishSiteVersions = unpublishSiteVersions;
module.exports.getPublishedSceneGraphForSite = getPublishedSceneGraphForSite;
module.exports.validateSubdomain = validateSubdomain;
module.exports.validateCustomDomain = validateCustomDomain;
module.exports.updateSiteDomains = updateSiteDomains;
module.exports.getPublicSiteBySubdomain = getPublicSiteBySubdomain;

// Export scene graph utilities
module.exports.validateSceneGraph = validateSceneGraph;
module.exports.validateAssetReferences = validateAssetReferences;
module.exports.sanitizeSceneGraph = sanitizeSceneGraph;
module.exports.createMinimalSceneGraph = createMinimalSceneGraph;

// Export repository for advanced use cases
module.exports.repository = repository;
