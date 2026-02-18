/**
 * Logger Plugin
 * Request logging with correlation ID injection for distributed tracing
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as uuid from "uuid";
import { LOGGING } from "../config";

interface AuditEvent {
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

interface AuditRecord extends AuditEvent {
  timestamp: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  actorUserId?: string;
  orgId?: string;
  projectId?: string;
}

interface RequestContext {
  correlationId: string;
  ip: string;
  userAgent?: string;
  orgId?: string;
  projectId?: string;
  userId?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    correlationId: string;
  }
}

/**
 * Generate correlation ID
 */
function generateCorrelationId(req: FastifyRequest): string {
  const existingId = req.headers[LOGGING.CORRELATION_ID_HEADER];
  if (existingId && typeof existingId === "string") {
    return existingId;
  }
  return uuid.v4();
}

/**
 * Extract request context for logging
 */
function extractRequestContext(req: FastifyRequest): RequestContext {
  const body = req.body as Record<string, unknown> | undefined;
  return {
    correlationId: req.correlationId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    orgId: (req.headers["x-org-id"] as string) || (body?.orgId as string),
    projectId: (req.headers["x-project-id"] as string) || (body?.projectId as string),
    userId: (req as FastifyRequest & { user?: { id: string } }).user?.id,
  };
}

/**
 * Register correlation ID plugin
 */
export async function registerCorrelationId(fastify: FastifyInstance): Promise<void> {
  fastify.decorateRequest("correlationId", "");
  
  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    request.correlationId = generateCorrelationId(request);
    reply.header(LOGGING.CORRELATION_ID_HEADER, request.correlationId);
    request.log = request.log.child({ correlationId: request.correlationId });
  });
  
  fastify.log.debug("Correlation ID plugin registered");
}

/**
 * Register request logging plugin
 */
export async function registerRequestLogging(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    // Skip logging for health checks in production
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
  
  fastify.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
    if (process.env.NODE_ENV === "production" && 
        (request.url === "/health" || request.url === "/ready")) {
      return;
    }
    
    const logLevel = reply.statusCode >= 400 ? "warn" : "info";
    
    (request.log as unknown as Record<string, (obj: unknown, msg?: string) => void>)[logLevel]({
      res: { statusCode: reply.statusCode },
      responseTime: reply.elapsedTime,
      context: extractRequestContext(request),
    }, "request completed");
  });
  
  fastify.addHook("onError", async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    request.log.error({
      err: error,
      context: extractRequestContext(request),
    }, "request error");
  });
  
  fastify.log.debug("Request logging plugin registered");
}

/**
 * Register audit logging helper
 */
export async function registerAuditLogging(fastify: FastifyInstance): Promise<void> {
  function logAudit(event: AuditEvent, req: FastifyRequest | null = null): AuditRecord {
    const auditRecord: AuditRecord = {
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
    
    fastify.log.info({ audit: auditRecord }, `audit: ${event.action}`);
    return auditRecord;
  }
  
  fastify.decorate("audit", logAudit);
  fastify.decorateRequest("audit", function(this: FastifyRequest, event: AuditEvent) {
    return logAudit(event, this);
  });
  
  fastify.log.debug("Audit logging plugin registered");
}

/**
 * Register all logging plugins
 */
export async function registerLogging(fastify: FastifyInstance): Promise<void> {
  await registerCorrelationId(fastify);
  await registerRequestLogging(fastify);
  await registerAuditLogging(fastify);
  
  fastify.log.info("Logging plugins registered");
}
