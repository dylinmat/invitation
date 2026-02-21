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
 * Register client routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function clientRoutes(fastify, opts) {
  // Use authenticate hook from parent if available
  const authenticate = fastify.authenticate || opts.authenticate;

  // ========== Clients ==========

  fastify.get("/", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List clients for an organization",
      tags: ["Clients"],
      querystring: {
        type: "object",
        properties: {
          organizationId: { type: "string" },
          search: { type: "string" },
          type: { type: "string", enum: ["couple", "corporate", "individual"] },
          status: { type: "string", enum: ["active", "inactive", "archived"] },
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { organizationId, ...filters } = request.query;

        if (!organizationId) {
          reply.status(400);
          return { success: false, error: "organizationId is required" };
        }

        // Verify user has access to this organization
        await verifyOrganizationAccess(userId, organizationId);

        const result = await getOrganizationClients(organizationId, filters);
        return {
          success: true,
          data: result.clients,
          pagination: result.pagination
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(error.message?.includes("Access denied") ? 403 : 500);
        return { success: false, error: error.message || "Failed to list clients" };
      }
    }
  });

  fastify.post("/", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a new client",
      tags: ["Clients"],
      body: {
        type: "object",
        required: ["organizationId", "name"],
        properties: {
          organizationId: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          type: { type: "string", enum: ["couple", "corporate", "individual"] },
          status: { type: "string", enum: ["active", "inactive", "archived"] },
          notes: { type: "string" }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { organizationId, ...clientData } = request.body;

        // Verify user has access to this organization
        await verifyOrganizationAccess(userId, organizationId);

        const clientId = await createOrganizationClient(organizationId, clientData);
        reply.status(201);
        return {
          success: true,
          data: { id: clientId }
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(error.message?.includes("Access denied") ? 403 : 400);
        return { success: false, error: error.message || "Failed to create client" };
      }
    }
  });

  fastify.get("/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get a client by ID",
      tags: ["Clients"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { id } = request.params;

        const client = await getClient(id);

        // Verify user has access to this client's organization
        await verifyOrganizationAccess(userId, client.organization_id);

        return {
          success: true,
          data: client
        };
      } catch (error) {
        fastify.log.error(error);
        const statusCode = error.message?.includes("not found") ? 404 :
                           error.message?.includes("Access denied") ? 403 : 500;
        reply.status(statusCode);
        return { success: false, error: error.message || "Failed to get client" };
      }
    }
  });

  fastify.put("/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update a client",
      tags: ["Clients"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          type: { type: "string", enum: ["couple", "corporate", "individual"] },
          status: { type: "string", enum: ["active", "inactive", "archived"] },
          notes: { type: "string" }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { id } = request.params;

        // Get client first to check organization access
        const client = await getClient(id);
        await verifyOrganizationAccess(userId, client.organization_id);

        await updateOrganizationClient(id, request.body);
        return { success: true };
      } catch (error) {
        fastify.log.error(error);
        const statusCode = error.message?.includes("not found") ? 404 :
                           error.message?.includes("Access denied") ? 403 : 400;
        reply.status(statusCode);
        return { success: false, error: error.message || "Failed to update client" };
      }
    }
  });

  fastify.delete("/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a client",
      tags: ["Clients"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { id } = request.params;

        // Get client first to check organization access
        const client = await getClient(id);
        await verifyOrganizationAccess(userId, client.organization_id);

        await deleteOrganizationClient(id);
        return { success: true };
      } catch (error) {
        fastify.log.error(error);
        const statusCode = error.message?.includes("not found") ? 404 :
                           error.message?.includes("Access denied") ? 403 : 500;
        reply.status(statusCode);
        return { success: false, error: error.message || "Failed to delete client" };
      }
    }
  });

  // ========== Client Events ==========

  fastify.get("/:id/events", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get events for a client",
      tags: ["Clients"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { id } = request.params;

        // Get client first to check organization access
        const client = await getClient(id);
        await verifyOrganizationAccess(userId, client.organization_id);

        const events = await getClientEventsList(id);
        return {
          success: true,
          data: events
        };
      } catch (error) {
        fastify.log.error(error);
        const statusCode = error.message?.includes("not found") ? 404 :
                           error.message?.includes("Access denied") ? 403 : 500;
        reply.status(statusCode);
        return { success: false, error: error.message || "Failed to get client events" };
      }
    }
  });

  // ========== Client Notes ==========

  fastify.get("/:id/notes", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get notes for a client",
      tags: ["Clients"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { id } = request.params;

        // Get client first to check organization access
        const client = await getClient(id);
        await verifyOrganizationAccess(userId, client.organization_id);

        const notes = await getClientNotesList(id);
        return {
          success: true,
          data: notes
        };
      } catch (error) {
        fastify.log.error(error);
        const statusCode = error.message?.includes("not found") ? 404 :
                           error.message?.includes("Access denied") ? 403 : 500;
        reply.status(statusCode);
        return { success: false, error: error.message || "Failed to get client notes" };
      }
    }
  });

  fastify.post("/:id/notes", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Add a note to a client",
      tags: ["Clients"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["note"],
        properties: {
          note: { type: "string" }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const { id } = request.params;
        const { note } = request.body;

        // Get client first to check organization access
        const client = await getClient(id);
        await verifyOrganizationAccess(userId, client.organization_id);

        const noteId = await addClientNote(id, { note, createdBy: userId });
        reply.status(201);
        return {
          success: true,
          data: { id: noteId }
        };
      } catch (error) {
        fastify.log.error(error);
        const statusCode = error.message?.includes("not found") ? 404 :
                           error.message?.includes("Access denied") ? 403 : 400;
        reply.status(statusCode);
        return { success: false, error: error.message || "Failed to add client note" };
      }
    }
  });
}

module.exports = clientRoutes;
