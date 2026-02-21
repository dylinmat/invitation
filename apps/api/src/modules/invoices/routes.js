/**
 * Invoices Routes - Fastify Plugin
 * API endpoints for invoice management
 */

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

// ============== Helper Functions ==============

const formatSuccess = (data, message) => ({
  success: true,
  data,
  ...(message && { message })
});

const formatError = (error, statusCode = 400) => ({
  success: false,
  error,
  statusCode
});

// ============== Route Handlers ==============

/**
 * Register invoices routes on Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 */
async function registerInvoicesRoutes(fastify) {
  const authenticate = fastify.authenticate;

  // CRITICAL SECURITY: Fail hard if auth middleware is not available
  if (!authenticate) {
    fastify.log.error("Authentication middleware not available - invoices routes cannot be registered safely");
    throw new Error("Authentication middleware not available - cannot register invoices routes");
  }

  // ========== List Invoices ==========
  fastify.get("/", {
    preHandler: [authenticate],
    schema: {
      description: "List invoices for organization",
      tags: ["Invoices"],
      querystring: {
        type: "object",
        properties: {
          organizationId: { type: "string" },
          status: { type: "string", enum: ["draft", "sent", "paid", "overdue", "cancelled"] },
          clientId: { type: "string" },
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 }
        },
        required: ["organizationId"]
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
    try {
      const { organizationId, status, clientId, page, limit } = request.query;

      const result = await listOrganizationInvoices(
        request.user.id,
        organizationId,
        { status, clientId, page, limit }
      );

      return formatSuccess(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  // ========== Create Invoice ==========
  fastify.post("/", {
    preHandler: [authenticate],
    schema: {
      description: "Create a new invoice",
      tags: ["Invoices"],
      body: {
        type: "object",
        required: ["organizationId", "clientId", "items", "dueDate"],
        properties: {
          organizationId: { type: "string" },
          clientId: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", format: "date" },
          taxRate: { type: "number", default: 0 },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["description", "quantity", "unitPrice"],
              properties: {
                description: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
                unitPrice: { type: "number", minimum: 0 }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { organizationId, clientId, description, dueDate, taxRate, items } = request.body;

      const result = await createNewInvoice(request.user.id, organizationId, {
        clientId,
        description,
        dueDate,
        taxRate,
        items
      });

      reply.status(201);
      return formatSuccess(result, "Invoice created successfully");
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  // ========== Get Invoice Details ==========
  fastify.get("/:id", {
    preHandler: [authenticate],
    schema: {
      description: "Get invoice by ID",
      tags: ["Invoices"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      querystring: {
        type: "object",
        properties: {
          organizationId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { organizationId } = request.query;

      const result = await getInvoice(request.user.id, id, organizationId);

      return formatSuccess(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(404);
      return formatError(error.message, 404);
    }
  });

  // ========== Update Invoice ==========
  fastify.put("/:id", {
    preHandler: [authenticate],
    schema: {
      description: "Update invoice",
      tags: ["Invoices"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          organizationId: { type: "string" },
          clientId: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", format: "date" },
          taxRate: { type: "number" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
                unitPrice: { type: "number", minimum: 0 }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { organizationId, clientId, description, dueDate, taxRate, items } = request.body;

      const updates = {};
      if (clientId !== undefined) updates.clientId = clientId;
      if (description !== undefined) updates.description = description;
      if (dueDate !== undefined) updates.dueDate = dueDate;
      if (taxRate !== undefined) updates.taxRate = taxRate;
      if (items !== undefined) updates.items = items;

      const result = await updateInvoiceDetails(
        request.user.id,
        id,
        organizationId,
        updates
      );

      return formatSuccess(result, "Invoice updated successfully");
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  // ========== Delete Invoice ==========
  fastify.delete("/:id", {
    preHandler: [authenticate],
    schema: {
      description: "Delete invoice (draft only)",
      tags: ["Invoices"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      querystring: {
        type: "object",
        properties: {
          organizationId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { organizationId } = request.query;

      const result = await removeInvoice(request.user.id, id, organizationId);

      return formatSuccess(result, "Invoice deleted successfully");
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  // ========== Send Invoice ==========
  fastify.post("/:id/send", {
    preHandler: [authenticate],
    schema: {
      description: "Send invoice to client",
      tags: ["Invoices"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          organizationId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { organizationId } = request.body || {};

      const result = await sendInvoice(request.user.id, id, organizationId);

      return formatSuccess(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  // ========== Mark Invoice as Paid ==========
  fastify.post("/:id/mark-paid", {
    preHandler: [authenticate],
    schema: {
      description: "Mark invoice as paid",
      tags: ["Invoices"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          organizationId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { organizationId } = request.body || {};

      const result = await payInvoice(request.user.id, id, organizationId);

      return formatSuccess(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  // ========== Get Next Invoice Number ==========
  fastify.get("/next-number", {
    preHandler: [authenticate],
    schema: {
      description: "Get next invoice number",
      tags: ["Invoices"],
      querystring: {
        type: "object",
        required: ["organizationId"],
        properties: {
          organizationId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { organizationId } = request.query;

      const result = await getNextNumber(request.user.id, organizationId);

      return formatSuccess(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(400);
      return formatError(error.message, 400);
    }
  });

  fastify.log.info("Invoices routes registered");
}

module.exports = registerInvoicesRoutes;
