/**
 * Admin Routes
 * Administrative API endpoints for system management
 */

const {
  getUsersList,
  getUserById,
  getOrganizationsList,
  getOrganizationById,
  getAdminStats,
  getAdminRevenue
} = require("./service");

/**
 * Check if user is admin
 * In production, this should check user roles/permissions
 */
const requireAdmin = async (request, reply) => {
  // TODO: Implement proper admin role check
  // For now, just check if user is authenticated
  if (!request.user) {
    return reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Authentication required"
    });
  }
  
  // In production, check admin role:
  // const { getUserOrgRole } = require("../auth/service");
  // const isAdmin = await checkIfGlobalAdmin(request.user.id);
  // if (!isAdmin) {
  //   return reply.status(403).send({
  //     statusCode: 403,
  //     error: "Forbidden",
  //     message: "Admin access required"
  //   });
  // }
};

/**
 * Register admin routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function adminRoutes(fastify, opts) {
  // Use authenticate hook from parent if available
  const authenticate = fastify.authenticate || opts.authenticate;

  // ============== Users Management ==============

  /**
   * GET /admin/users
   * List all users (paginated)
   */
  fastify.get("/users", {
    preHandler: authenticate ? [authenticate, requireAdmin] : [requireAdmin],
    schema: {
      description: "List all users (admin only)",
      tags: ["Admin"],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            users: { type: "array" },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" }
          }
        }
      }
    }
  }, async (request) => {
    const { page = 1, limit = 20, search } = request.query;
    const result = await getUsersList({ page: parseInt(page, 10), limit: parseInt(limit, 10), search });
    return { success: true, ...result };
  });

  /**
   * GET /admin/users/:id
   * Get detailed user information
   */
  fastify.get("/users/:id", {
    preHandler: authenticate ? [authenticate, requireAdmin] : [requireAdmin],
    schema: {
      description: "Get user details (admin only)",
      tags: ["Admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = await getUserById(request.params.id);
      return { success: true, user };
    } catch (error) {
      if (error.message === "User not found") {
        return reply.status(404).send({
          success: false,
          error: "User not found"
        });
      }
      throw error;
    }
  });

  // ============== Organizations Management ==============

  /**
   * GET /admin/organizations
   * List all organizations (paginated)
   */
  fastify.get("/organizations", {
    preHandler: authenticate ? [authenticate, requireAdmin] : [requireAdmin],
    schema: {
      description: "List all organizations (admin only)",
      tags: ["Admin"],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { page = 1, limit = 20, search } = request.query;
    const result = await getOrganizationsList({ page: parseInt(page, 10), limit: parseInt(limit, 10), search });
    return { success: true, ...result };
  });

  /**
   * GET /admin/organizations/:id
   * Get detailed organization information
   */
  fastify.get("/organizations/:id", {
    preHandler: authenticate ? [authenticate, requireAdmin] : [requireAdmin],
    schema: {
      description: "Get organization details (admin only)",
      tags: ["Admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const org = await getOrganizationById(request.params.id);
      return { success: true, organization: org };
    } catch (error) {
      if (error.message === "Organization not found") {
        return reply.status(404).send({
          success: false,
          error: "Organization not found"
        });
      }
      throw error;
    }
  });

  // ============== System Statistics ==============

  /**
   * GET /admin/stats
   * Get system-wide statistics
   */
  fastify.get("/stats", {
    preHandler: authenticate ? [authenticate, requireAdmin] : [requireAdmin],
    schema: {
      description: "Get system statistics (admin only)",
      tags: ["Admin"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            stats: { type: "object" }
          }
        }
      }
    }
  }, async () => {
    const stats = await getAdminStats();
    return { success: true, stats };
  });

  /**
   * GET /admin/revenue
   * Get revenue statistics
   */
  fastify.get("/revenue", {
    preHandler: authenticate ? [authenticate, requireAdmin] : [requireAdmin],
    schema: {
      description: "Get revenue statistics (admin only)",
      tags: ["Admin"],
      querystring: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["day", "week", "month", "year"], default: "month" }
        }
      }
    }
  }, async (request) => {
    const { period = "month" } = request.query;
    const result = await getAdminRevenue({ period });
    return { success: true, ...result };
  });

  fastify.log.info("Admin routes registered");
}

module.exports = {
  adminRoutes
};
