const {
  previewCSV,
  importGuests,
  importClients,
  getTemplate
} = require("./service");

/**
 * Register import routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function importRoutes(fastify, opts) {
  // Use authenticate hook from parent if available
  const authenticate = fastify.authenticate || opts.authenticate;

  // ========== CSV Import ==========

  /**
   * POST /api/import/csv
   * Import CSV file for guests or clients
   */
  fastify.post("/csv", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Import CSV file for guests or clients",
      tags: ["Import"],
      consumes: ["multipart/form-data"],
      body: {
        type: "object",
        required: ["file", "type"],
        properties: {
          file: { type: "string", format: "binary" },
          type: { type: "string", enum: ["guests", "clients"] },
          projectId: { type: "string" },
          organizationId: { type: "string" },
          skipDuplicates: { type: "boolean", default: false },
          skipValidation: { type: "boolean", default: false }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            imported: { type: "integer" },
            totalRows: { type: "integer" },
            validRows: { type: "integer" },
            invalidRows: { type: "integer" },
            duplicates: { type: "integer" },
            errors: { type: "array", items: { type: "string" } },
            warnings: { type: "array", items: { type: "string" } },
            duplicateDetails: { type: "array" },
            failedRows: { type: "array" }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const parts = request.parts();
      let fileBuffer = null;
      let importType = null;
      let projectId = null;
      let organizationId = null;
      let skipDuplicates = false;
      let skipValidation = false;

      // Process multipart form data
      for await (const part of parts) {
        if (part.type === "file") {
          fileBuffer = await part.toBuffer();
        } else {
          const value = await part.value;
          switch (part.fieldname) {
            case "type":
              importType = value;
              break;
            case "projectId":
              projectId = value;
              break;
            case "organizationId":
              organizationId = value;
              break;
            case "skipDuplicates":
              skipDuplicates = value === "true" || value === true;
              break;
            case "skipValidation":
              skipValidation = value === "true" || value === true;
              break;
          }
        }
      }

      // Validate required fields
      if (!fileBuffer) {
        reply.status(400);
        return { success: false, error: "No file provided" };
      }

      if (!importType || !["guests", "clients"].includes(importType)) {
        reply.status(400);
        return { success: false, error: "Invalid or missing import type. Must be 'guests' or 'clients'" };
      }

      // Validate context IDs based on type
      if (importType === "guests" && !projectId) {
        reply.status(400);
        return { success: false, error: "projectId is required for guest imports" };
      }

      if (importType === "clients" && !organizationId) {
        reply.status(400);
        return { success: false, error: "organizationId is required for client imports" };
      }

      // Get user info for context validation
      const userId = request.user?.id;
      const userOrgId = request.user?.organizationId;

      // Import based on type
      let result;
      const options = { skipDuplicates, skipValidation };

      if (importType === "guests") {
        result = await importGuests(projectId, fileBuffer, options);
      } else {
        result = await importClients(organizationId, fileBuffer, options);
      }

      if (!result.success) {
        reply.status(400);
      }

      return result;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: error.message || "Failed to process import"
      };
    }
  });

  /**
   * POST /api/import/preview
   * Preview CSV data without importing
   */
  fastify.post("/preview", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Preview CSV data without importing",
      tags: ["Import"],
      consumes: ["multipart/form-data"],
      body: {
        type: "object",
        required: ["file", "type"],
        properties: {
          file: { type: "string", format: "binary" },
          type: { type: "string", enum: ["guests", "clients"] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const parts = request.parts();
      let fileBuffer = null;
      let importType = null;

      for await (const part of parts) {
        if (part.type === "file") {
          fileBuffer = await part.toBuffer();
        } else if (part.fieldname === "type") {
          importType = await part.value;
        }
      }

      if (!fileBuffer) {
        reply.status(400);
        return { success: false, error: "No file provided" };
      }

      if (!importType) {
        reply.status(400);
        return { success: false, error: "Import type is required" };
      }

      const result = await previewCSV(fileBuffer, importType);

      if (!result.success) {
        reply.status(400);
      }

      return result;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: error.message || "Failed to preview CSV"
      };
    }
  });

  /**
   * GET /api/import/template/:type
   * Download CSV template for guests or clients
   */
  fastify.get("/template/:type", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Download CSV template",
      tags: ["Import"],
      params: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["guests", "clients"] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type } = request.params;
      
      if (!["guests", "clients"].includes(type)) {
        reply.status(400);
        return { success: false, error: "Invalid template type" };
      }

      const template = getTemplate(type);
      const filename = type === "guests" ? "guests_template.csv" : "clients_template.csv";

      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      
      return template;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: error.message || "Failed to generate template"
      };
    }
  });

  /**
   * GET /api/import/template-content/:type
   * Get CSV template content (for UI display)
   */
  fastify.get("/template-content/:type", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get CSV template content",
      tags: ["Import"],
      params: {
        type: "object",
        required: ["type"],
        properties: {
          type: { type: "string", enum: ["guests", "clients"] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type } = request.params;
      
      if (!["guests", "clients"].includes(type)) {
        reply.status(400);
        return { success: false, error: "Invalid template type" };
      }

      const template = getTemplate(type);
      const rows = template.split("\n");
      const headers = rows[0].split(",");
      const exampleRows = rows.slice(1).map(row => {
        const values = row.split(",");
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || "";
        });
        return obj;
      });

      return {
        success: true,
        headers,
        exampleRows
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: error.message || "Failed to get template content"
      };
    }
  });
}

module.exports = importRoutes;
