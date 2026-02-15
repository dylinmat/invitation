/**
 * Projects Module - Fastify Plugin
 * 
 * This module handles project management, including:
 * - Creating and managing projects
 * - Organization-scoped access control
 * - Project statistics and metadata
 */

const { registerProjectsRoutes: projectRoutes } = require("./routes");

// Export service methods for programmatic use
const {
  createProjectForOrg,
  getProject,
  listUserProjects,
  listOrgProjects,
  updateProjectDetails,
  removeProject,
  checkProjectAccess,
  requireProjectAccess,
  requireProjectAdmin
} = require("./service");

// Export repository for advanced use cases
const repository = require("./repository");

/**
 * Fastify plugin for Projects module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function projectsPlugin(fastify, opts) {
  // Register routes with /projects prefix
  await fastify.register(projectRoutes, { prefix: "/projects" });

  fastify.log.info("Projects module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "projects",
  prefix: "/projects",
  register: projectsPlugin,
};

// Also export individual components
module.exports.projectRoutes = projectRoutes;
module.exports.createProjectForOrg = createProjectForOrg;
module.exports.getProject = getProject;
module.exports.listUserProjects = listUserProjects;
module.exports.listOrgProjects = listOrgProjects;
module.exports.updateProjectDetails = updateProjectDetails;
module.exports.removeProject = removeProject;
module.exports.checkProjectAccess = checkProjectAccess;
module.exports.requireProjectAccess = requireProjectAccess;
module.exports.requireProjectAdmin = requireProjectAdmin;
module.exports.repository = repository;
