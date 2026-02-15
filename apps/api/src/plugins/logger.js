/**
 * Logger Plugin
 * Request logging with correlation ID injection for distributed tracing
 */

const { v4: uuidv4 } = require("uuid");
const { LOGGING } = require("../config");

/**
 * Generate correlation ID
 * @param {import('fastify').FastifyRequest} req
 * @returns {string}
 */
function generateCorrelationId(req) {
  // Check for existing correlation ID from upstream
  const existingId = req.headers[LOGGING.CORRELATION_ID_HEADER];
  if (existingId && typeof existingId === "string") {
    return existingId;
  }
  // Generate new correlation ID
  return uuidv4();
}

/**
 * Extract request context for logging
 * @param {import('fastify').FastifyRequest} req
 * @returns {Object}
 */
function extractRequestContext(req) {
  return {
    correlationId: req.correlationId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    orgId: req.headers["x-org-id"] || req.body?.orgId,
    projectId: req.headers["x-project-id"] || req.body?.projectId,
    userId: req.user?.id,
  };
}

/**
 * Register correlation ID plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerCorrelationId(fastify, options = {}) {
  // Decorate request with correlation ID
  fastify.decorateRequest("correlationId", "");
  
  // Hook to inject correlation ID on each request
  fastify.addHook("onRequest", async (request, reply) => {
    // Generate and set correlation ID
    request.correlationId = generateCorrelationId(request);
    
    // Add correlation ID to response headers
    reply.header(LOGGING.CORRELATION_ID_HEADER, request.correlationId);
    
    // Add to request log context
    request.log = request.log.child({
      correlationId: request.correlationId,
    });
  });
  
  fastify.log.debug("Correlation ID plugin registered");
}

/**
 * Register request logging plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerRequestLogging(fastify, options = {}) {
  // Log incoming requests
  fastify.addHook("onRequest", async (request, reply) => {
    // Skip logging for health checks in production to reduce noise
    if (process.env.NODE_ENV === "production" && 
        (request.url === "/health" || request.url === "/ready")) {
      return;
    }
    
    request.log.info({
      req: {
        method: request.method,
        url: request.url,
        headers: {
          "user-agent": request.headers["user-agent"],
          "content-type": request.headers["content-type"],
        },
      },
    }, "incoming request");
  });
  
  // Log completed requests with timing
  fastify.addHook("onResponse", async (request, reply) => {
    // Skip logging for health checks in production
    if (process.env.NODE_ENV === "production" && 
        (request.url === "/health" || request.url === "/ready")) {
      return;
    }
    
    const logLevel = reply.statusCode >= 400 ? "warn" : "info";
    
    request.log[logLevel]({
      res: {
        statusCode: reply.statusCode,
      },
      responseTime: reply.elapsedTime,
      context: extractRequestContext(request),
    }, "request completed");
  });
  
  // Log request errors
  fastify.addHook("onError", async (request, reply, error) => {
    request.log.error({
      err: error,
      context: extractRequestContext(request),
    }, "request error");
  });
  
  fastify.log.debug("Request logging plugin registered");
}

/**
 * Register audit logging helper
 * This provides a method to log audit events
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerAuditLogging(fastify, options = {}) {
  /**
   * Log an audit event
   * @param {Object} event
   * @param {string} event.action - Action name (e.g., "project.created")
   * @param {string} event.targetType - Target resource type
   * @param {string} event.targetId - Target resource ID
   * @param {Object} [event.metadata] - Additional event metadata
   * @param {import('fastify').FastifyRequest} [req] - Request for context extraction
   */
  function logAudit(event, req = null) {
    const auditRecord = {
      timestamp: new Date().toISOString(),
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: event.metadata || {},
    };
    
    if (req) {
      const context = extractRequestContext(req);
      auditRecord.correlationId = context.correlationId;
      auditRecord.ipAddress = context.ip;
      auditRecord.userAgent = context.userAgent;
      auditRecord.actorUserId = context.userId;
      auditRecord.orgId = context.orgId;
      auditRecord.projectId = context.projectId;
    }
    
    // Log as info level - can be shipped to external audit system
    fastify.log.info({ audit: auditRecord }, `audit: ${event.action}`);
    
    return auditRecord;
  }
  
  // Decorate fastify with audit logger
  fastify.decorate("audit", logAudit);
  
  // Also decorate request for convenience
  fastify.decorateRequest("audit", function(event) {
    return logAudit(event, this);
  });
  
  fastify.log.debug("Audit logging plugin registered");
}

/**
 * Register all logging plugins
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerLogging(fastify, options = {}) {
  await registerCorrelationId(fastify, options);
  await registerRequestLogging(fastify, options);
  await registerAuditLogging(fastify, options);
  
  fastify.log.info("Logging plugins registered");
}

module.exports = {
  registerCorrelationId,
  registerRequestLogging,
  registerAuditLogging,
  registerLogging,
  generateCorrelationId,
  extractRequestContext,
};
