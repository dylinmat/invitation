/**
 * Projects Routes - Fastify
 * Full CRUD operations for projects
 */

const {
  createProject,
  getProjectById,
  listProjectsByUser,
  listProjectsByOrg,
  updateProject,
  deleteProject,
  getProjectStats
} = require("./repository");

// Valid IANA timezones - common ones for validation
const VALID_TIMEZONES = new Set([
  "UTC", "GMT", "EST", "CST", "MST", "PST", "AST", "HST",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "America/Honolulu", "America/Phoenix", "America/Toronto",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Europe/Rome",
  "Europe/Madrid", "Europe/Amsterdam", "Europe/Vienna", "Europe/Stockholm",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Seoul",
  "Asia/Mumbai", "Asia/Dubai", "Asia/Bangkok", "Asia/Jakarta", "Asia/Manila",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
  "Africa/Johannesburg", "Africa/Cairo", "Africa/Lagos", "Africa/Nairobi",
  "America/Sao_Paulo", "America/Buenos_Aires", "America/Santiago", "America/Lima",
  "America/Mexico_City", "America/Bogota", "America/Caracas"
]);

/**
 * Validate timezone string
 * @param {string} timezone - Timezone to validate
 * @returns {boolean}
 */
const isValidTimezone = (timezone) => {
  if (!timezone || typeof timezone !== "string") return false;
  if (VALID_TIMEZONES.has(timezone)) return true;
  
  // Try to validate using Intl API if available
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate project name
 * @param {string} name - Project name to validate
 * @returns {{valid: boolean, error?: string}}
 */
const validateProjectName = (name) => {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Project name is required" };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Project name cannot be empty" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Project name must be 100 characters or less" };
  }
  return { valid: true };
};

// Helper to format error responses consistently
const formatError = (statusCode, error, message) => ({
  statusCode,
  error,
  message
});

// Helper to format success responses
const formatSuccess = (data, message) => ({
  success: true,
  ...data,
  ...(message && { message })
});

// Helper to transform database project to API format
const transformProject = (project) => ({
  id: project.id,
  name: project.name,
  description: null, // Add to schema if needed
  status: project.status?.toLowerCase() || "active",
  eventDate: null, // Add to schema if needed
  timezone: project.timezone || "UTC",
  createdAt: project.created_at,
  updatedAt: project.updated_at,
  orgId: project.owner_org_id,
  settings: {
    timezone: project.timezone || "UTC",
    dateFormat: "MM/DD/YYYY",
    language: "en",
    branding: {
      logo: null,
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981"
    }
  },
  stats: {
    totalGuests: parseInt(project.guest_count) || 0,
    totalInvites: parseInt(project.invite_count) || 0,
    rsvpYes: parseInt(project.rsvp_yes_count) || 0,
    rsvpNo: parseInt(project.rsvp_no_count) || 0,
    rsvpPending: parseInt(project.rsvp_pending_count) || 0
  }
});

/**
 * Register projects routes on Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 */
async function registerProjectsRoutes(fastify) {
  // Use authenticate hook from fastify instance (provided by auth plugin)
  const authenticate = fastify.authenticate;
  
  // CRITICAL SECURITY: Fail hard if auth middleware is not available
  if (!authenticate) {
    fastify.log.error("Authentication middleware not available - projects routes cannot be registered safely");
    throw new Error("Authentication middleware not available - cannot register project routes");
  }

  // ========== Projects CRUD ==========

  /**
   * GET /projects
   * List user's projects
   */
  fastify.get("/projects", {
    preHandler: [authenticate],
    schema: {
      description: "List user's projects",
      tags: ["Projects"],
      querystring: {
        type: "object",
        properties: {
          page: { type: "number", default: 1 },
          limit: { type: "number", default: 20 },
          status: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            projects: { type: "array" },
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" }
          }
        }
      }
    }
  }, async (request) => {
    const { page = 1, limit = 20 } = request.query;
    
    // Get projects with embedded stats (single query, no N+1 problem)
    const { projects, total, page: validatedPage, limit: validatedLimit } = 
      await listProjectsByUser(request.user.id, { page, limit });
    
    // Transform projects with stats
    const projectsWithStats = projects.map((project) =>
      transformProject({
        ...project,
        stats: {
          totalGuests: parseInt(project.guest_count) || 0,
          totalInvites: parseInt(project.invite_count) || 0,
          rsvpYes: parseInt(project.rsvp_yes_count) || 0,
          rsvpNo: parseInt(project.rsvp_no_count) || 0,
          rsvpPending: parseInt(project.rsvp_pending_count) || 0
        }
      })
    );

    return formatSuccess({
      projects: projectsWithStats,
      total,
      page: validatedPage,
      limit: validatedLimit
    });
  });

  /**
   * POST /projects
   * Create a new project
   */
  fastify.post("/projects", {
    preHandler: [authenticate],
    schema: {
      description: "Create a new project",
      tags: ["Projects"],
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string" },
          eventDate: { type: "string" },
          timezone: { type: "string", default: "UTC" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, description, eventDate, timezone = "UTC" } = request.body;

      // Validate project name
      const nameValidation = validateProjectName(name);
      if (!nameValidation.valid) {
        reply.status(400);
        return formatError(400, "Bad Request", nameValidation.error);
      }

      // Validate timezone
      if (!isValidTimezone(timezone)) {
        reply.status(400);
        return formatError(400, "Bad Request", `Invalid timezone: ${timezone}`);
      }

      // Get user's organization (use first one for now)
      const { listUserOrganizations } = require("../auth/repository");
      const orgs = await listUserOrganizations(request.user.id);
      
      if (orgs.length === 0) {
        reply.status(400);
        return formatError(400, "Bad Request", "User must belong to an organization to create a project");
      }

      const orgId = orgs[0].id;
      const trimmedName = name.trim();

      // Check for duplicate project name within the same organization
      const existingProjects = await listProjectsByOrg(orgId);
      const duplicateName = existingProjects.find(
        p => p.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (duplicateName) {
        reply.status(409);
        return formatError(409, "Conflict", `A project with the name "${trimmedName}" already exists in this organization`);
      }

      const project = await createProject({
        orgId,
        name: trimmedName,
        timezone,
        createdBy: request.user.id
      });

      // Add audit log entry
      if (request.audit) {
        request.audit({
          action: "project.created",
          targetType: "project",
          targetId: project.id,
          metadata: { name: trimmedName, timezone }
        });
      }

      reply.status(201);
      return formatSuccess({
        project: transformProject(project)
      }, "Project created successfully");
    } catch (error) {
      fastify.log.error({ err: error.message }, "Error creating project");
      reply.status(500);
      return formatError(500, "Internal Server Error", "An error occurred while creating the project");
    }
  });

  /**
   * GET /projects/:id
   * Get a specific project
   */
  fastify.get("/projects/:id", {
    preHandler: [authenticate],
    schema: {
      description: "Get project by ID",
      tags: ["Projects"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    }
  }, async (request, reply) => {
    const project = await getProjectById(request.params.id);

    if (!project) {
      reply.status(404);
      return formatError(404, "Not Found", "Project not found");
    }

    // Check if user has access to this project
    const { isUserProjectMember } = require("./repository");
    const hasAccess = await isUserProjectMember(request.user.id, request.params.id);
    
    if (!hasAccess) {
      reply.status(403);
      return formatError(403, "Forbidden", "Access denied to this project");
    }

    const stats = await getProjectStats(project.id);
    return formatSuccess({
      project: transformProject({
        ...project,
        guest_count: stats.guest_count,
        invite_count: stats.invite_count,
        rsvp_yes_count: stats.rsvp_yes_count,
        rsvp_no_count: stats.rsvp_no_count,
        rsvp_pending_count: stats.rsvp_pending_count
      })
    });
  });

  /**
   * PATCH /projects/:id
   * Update a project
   */
  fastify.patch("/projects/:id", {
    preHandler: [authenticate],
    schema: {
      description: "Update project",
      tags: ["Projects"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          eventDate: { type: "string" },
          timezone: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "ARCHIVED", "DRAFT"] }
        }
      }
    }
  }, async (request, reply) => {
    const { name, description, eventDate, timezone, status } = request.body;

    // Check if project exists
    const existingProject = await getProjectById(request.params.id);
    if (!existingProject) {
      reply.status(404);
      return formatError(404, "Not Found", "Project not found");
    }

    // Check if user has access
    const { isUserProjectMember } = require("./repository");
    const hasAccess = await isUserProjectMember(request.user.id, request.params.id);
    
    if (!hasAccess) {
      reply.status(403);
      return formatError(403, "Forbidden", "Access denied to this project");
    }

    // Build updates object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (timezone !== undefined) updates.timezone = timezone;
    if (status !== undefined) updates.status = status;
    // description and eventDate would need to be added to the database schema

    const updatedProject = await updateProject(request.params.id, updates);
    
    const stats = await getProjectStats(updatedProject.id);
    return formatSuccess({
      project: transformProject({
        ...updatedProject,
        guest_count: stats.guest_count,
        invite_count: stats.invite_count,
        rsvp_yes_count: stats.rsvp_yes_count,
        rsvp_no_count: stats.rsvp_no_count,
        rsvp_pending_count: stats.rsvp_pending_count
      })
    }, "Project updated successfully");
  });

  /**
   * DELETE /projects/:id
   * Delete a project (soft delete)
   */
  fastify.delete("/projects/:id", {
    preHandler: [authenticate],
    schema: {
      description: "Delete project",
      tags: ["Projects"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    }
  }, async (request, reply) => {
    // Check if project exists
    const existingProject = await getProjectById(request.params.id);
    if (!existingProject) {
      reply.status(404);
      return formatError(404, "Not Found", "Project not found");
    }

    // Check if user has access
    const { isUserProjectMember } = require("./repository");
    const hasAccess = await isUserProjectMember(request.user.id, request.params.id);
    
    if (!hasAccess) {
      reply.status(403);
      return formatError(403, "Forbidden", "Access denied to this project");
    }

    await deleteProject(request.params.id);
    
    reply.status(200);
    return formatSuccess({}, "Project deleted successfully");
  });

  /**
   * POST /projects/:id/duplicate
   * Duplicate a project
   */
  fastify.post("/projects/:id/duplicate", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Duplicate project",
      tags: ["Projects"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    }
  }, async (request, reply) => {
    // Check if project exists
    const existingProject = await getProjectById(request.params.id);
    if (!existingProject) {
      reply.status(404);
      return formatError(404, "Not Found", "Project not found");
    }

    // Check if user has access
    const { isUserProjectMember } = require("./repository");
    const hasAccess = await isUserProjectMember(request.user.id, request.params.id);
    
    if (!hasAccess) {
      reply.status(403);
      return formatError(403, "Forbidden", "Access denied to this project");
    }

    // Create new project with "(Copy)" suffix
    const { listUserOrganizations } = require("../auth/repository");
    const orgs = await listUserOrganizations(request.user.id);
    
    const newProject = await createProject({
      orgId: orgs[0].id,
      name: `${existingProject.name} (Copy)`,
      timezone: existingProject.timezone,
      createdBy: request.user.id
    });

    reply.status(201);
    return formatSuccess({
      project: transformProject(newProject)
    }, "Project duplicated successfully");
  });

  /**
   * GET /projects/:id/stats
   * Get project statistics
   */
  fastify.get("/projects/:id/stats", {
    preHandler: [authenticate],
    schema: {
      description: "Get project statistics",
      tags: ["Projects"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    }
  }, async (request, reply) => {
    // Check if project exists
    const existingProject = await getProjectById(request.params.id);
    if (!existingProject) {
      reply.status(404);
      return formatError(404, "Not Found", "Project not found");
    }

    // Check if user has access
    const { isUserProjectMember, getProjectStats } = require("./repository");
    const hasAccess = await isUserProjectMember(request.user.id, request.params.id);
    
    if (!hasAccess) {
      reply.status(403);
      return formatError(403, "Forbidden", "Access denied to this project");
    }

    const stats = await getProjectStats(request.params.id);
    
    return formatSuccess({
      stats: {
        totalGuests: parseInt(stats.guest_count, 10) || 0,
        totalGroups: parseInt(stats.group_count, 10) || 0,
        totalInvites: parseInt(stats.invite_count, 10) || 0,
        totalSites: parseInt(stats.site_count, 10) || 0,
        totalEvents: parseInt(stats.event_count, 10) || 0
      }
    });
  });

  fastify.log.info("Projects routes registered");
}

module.exports = registerProjectsRoutes;
