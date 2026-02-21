/**
 * Events Routes - Fastify Plugin
 *
 * Endpoints:
 * - GET    /api/events              - List events with pagination
 * - POST   /api/events              - Create new event
 * - GET    /api/events/:id          - Get single event
 * - PUT    /api/events/:id          - Update event
 * - DELETE /api/events/:id          - Delete event
 * - GET    /api/events/:id/tasks    - List event tasks
 * - POST   /api/events/:id/tasks    - Create task
 * - PUT    /api/events/:id/tasks/:taskId - Update task
 * - DELETE /api/events/:id/tasks/:taskId - Delete task
 */

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
 * Register event routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function eventRoutes(fastify, opts) {
  // Use authenticate hook from parent if available
  const authenticate = fastify.authenticate || opts.authenticate;

  // ========== Events ==========

  /**
   * GET /api/events
   * List events with pagination and filters
   */
  fastify.get("/", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List events for the user's organization",
      tags: ["Events"],
      querystring: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["planning", "confirmed", "in_progress", "completed", "cancelled"] },
          type: { type: "string" },
          search: { type: "string" },
          page: { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 20 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                events: { type: "array" },
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await getOrganizationEvents(organizationId, request.query);

    if (!result.success) {
      return reply.status(400).send(result);
    }

    return result;
  });

  /**
   * POST /api/events
   * Create a new event
   */
  fastify.post("/", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a new event",
      tags: ["Events"],
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 255 },
          type: { type: "string", enum: ["wedding", "corporate", "birthday", "conference", "party", "meeting", "workshop", "other"] },
          date: { type: "string", format: "date" },
          location: { type: "string", maxLength: 500 },
          budget: { type: "number", minimum: 0 },
          status: { type: "string", enum: ["planning", "confirmed", "in_progress", "completed", "cancelled"], default: "planning" },
          description: { type: "string" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await createNewEvent({
      ...request.body,
      organizationId
    });

    if (!result.success) {
      return reply.status(400).send(result);
    }

    reply.status(201);
    return result;
  });

  /**
   * GET /api/events/:id
   * Get a single event by ID
   */
  fastify.get("/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get an event by ID",
      tags: ["Events"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await getEvent(request.params.id, organizationId);

    if (!result.success) {
      return reply.status(result.error === "Event not found" ? 404 : 400).send(result);
    }

    return result;
  });

  /**
   * PUT /api/events/:id
   * Update an existing event
   */
  fastify.put("/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update an event",
      tags: ["Events"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 255 },
          type: { type: "string", enum: ["wedding", "corporate", "birthday", "conference", "party", "meeting", "workshop", "other"] },
          date: { type: "string", format: "date" },
          location: { type: "string", maxLength: 500 },
          budget: { type: "number", minimum: 0 },
          status: { type: "string", enum: ["planning", "confirmed", "in_progress", "completed", "cancelled"] },
          description: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await updateExistingEvent(
      request.params.id,
      organizationId,
      request.body
    );

    if (!result.success) {
      return reply.status(result.error === "Event not found" ? 404 : 400).send(result);
    }

    return result;
  });

  /**
   * DELETE /api/events/:id
   * Delete an event
   */
  fastify.delete("/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete an event",
      tags: ["Events"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await removeEvent(request.params.id, organizationId);

    if (!result.success) {
      return reply.status(result.error === "Event not found" ? 404 : 400).send(result);
    }

    return result;
  });

  // ========== Tasks ==========

  /**
   * GET /api/events/:id/tasks
   * List tasks for an event
   */
  fastify.get("/:id/tasks", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List tasks for an event",
      tags: ["Events", "Tasks"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      },
      querystring: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          assignedTo: { type: "string", format: "uuid" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                tasks: { type: "array" },
                eventId: { type: "string" },
                total: { type: "integer" }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await getEventTasks(
      request.params.id,
      organizationId,
      request.query
    );

    if (!result.success) {
      return reply.status(result.error === "Event not found" ? 404 : 400).send(result);
    }

    return result;
  });

  /**
   * POST /api/events/:id/tasks
   * Create a new task for an event
   */
  fastify.post("/:id/tasks", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a task for an event",
      tags: ["Events", "Tasks"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      },
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 255 },
          description: { type: "string" },
          dueDate: { type: "string", format: "date" },
          status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"], default: "pending" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], default: "medium" },
          assignedTo: { type: "string", format: "uuid" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await createNewTask(
      request.params.id,
      organizationId,
      request.body
    );

    if (!result.success) {
      return reply.status(result.error === "Event not found" ? 404 : 400).send(result);
    }

    reply.status(201);
    return result;
  });

  /**
   * PUT /api/events/:id/tasks/:taskId
   * Update an existing task
   */
  fastify.put("/:id/tasks/:taskId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update a task",
      tags: ["Events", "Tasks"],
      params: {
        type: "object",
        required: ["id", "taskId"],
        properties: {
          id: { type: "string", format: "uuid" },
          taskId: { type: "string", format: "uuid" }
        }
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 255 },
          description: { type: "string" },
          dueDate: { type: "string", format: "date" },
          status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          assignedTo: { type: "string", format: "uuid", nullable: true }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await updateExistingTask(
      request.params.id,
      request.params.taskId,
      organizationId,
      request.body
    );

    if (!result.success) {
      const statusCode = result.error === "Event not found" || result.error === "Task not found" ? 404 : 400;
      return reply.status(statusCode).send(result);
    }

    return result;
  });

  /**
   * DELETE /api/events/:id/tasks/:taskId
   * Delete a task
   */
  fastify.delete("/:id/tasks/:taskId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a task",
      tags: ["Events", "Tasks"],
      params: {
        type: "object",
        required: ["id", "taskId"],
        properties: {
          id: { type: "string", format: "uuid" },
          taskId: { type: "string", format: "uuid" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const organizationId = request.user?.orgId || request.user?.organizationId;

    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        error: "Organization ID not found in user context"
      });
    }

    const result = await removeTask(
      request.params.id,
      request.params.taskId,
      organizationId
    );

    if (!result.success) {
      const statusCode = result.error === "Event not found" || result.error === "Task not found" ? 404 : 400;
      return reply.status(statusCode).send(result);
    }

    return result;
  });
}

module.exports = eventRoutes;
