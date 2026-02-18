/**
 * EIOS API Server
 * Fastify-based API with modular domain architecture
 */

import Fastify from "fastify";
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyLoggerOptions } from "fastify";
import type { LoggerOptions } from "pino";
import * as path from "path";
import * as fs from "fs";

import { SERVER } from "./config";

// Plugin imports
import { registerCors } from "./plugins/cors";
import { registerSecurity } from "./plugins/security";
import { registerLogging } from "./plugins/logger";
import { registerErrorHandler } from "./plugins/error-handler";
import { registerModuleLoader } from "./plugins/module-loader";
import { registerSwagger } from "./plugins/swagger";

// Type imports
import type { User, Session } from "@eios/types";

// Extend Fastify types
declare module "fastify" {
  interface FastifyRequest {
    user?: User & { name?: string; avatar?: string };
    session?: Session;
    orgId?: string;
    projectId?: string;
    audit: (data: {
      action: string;
      targetType: string;
      targetId: string;
      metadata?: Record<string, unknown>;
    }) => void;
  }

  interface FastifyInstance {
    ApiError: {
      notFound: (message?: string) => Error;
      badRequest: (message?: string) => Error;
      unauthorized: (message?: string) => Error;
      forbidden: (message?: string) => Error;
      conflict: (message?: string) => Error;
    };
  }
}

interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

interface ReadyCheckResponse {
  status: string;
  checks: {
    database: string;
  };
}

interface AuthResult {
  user: User;
  sessionToken: string;
  isNewUser?: boolean;
}

/**
 * Create and configure Fastify instance
 */
export function createServer(): FastifyInstance {
  const loggerConfig: FastifyLoggerOptions & LoggerOptions = {
    level: "info",
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: (request.socket as { remotePort?: number })?.remotePort,
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
  };
  
  // Add pretty printing in development
  if (process.env.NODE_ENV === "development") {
    loggerConfig.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    };
  }
  
  // Create Fastify instance with type assertion
  const fastify = Fastify({
    logger: loggerConfig as unknown as boolean,
    bodyLimit: SERVER.BODY_LIMIT,
    connectionTimeout: SERVER.TIMEOUT,
    keepAliveTimeout: SERVER.KEEP_ALIVE_TIMEOUT,
    trustProxy: SERVER.TRUST_PROXY,
    disableRequestLogging: true,
    jsonShorthand: true,
    caseSensitive: false,
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
    maxParamLength: 100,
  }) as FastifyInstance;
  
  return fastify;
}

/**
 * Register core plugins
 */
export async function registerCorePlugins(fastify: FastifyInstance): Promise<void> {
  await registerErrorHandler(fastify);
  await registerLogging(fastify);
  await registerSecurity(fastify);
  await registerCors(fastify);
  
  try {
    await registerSwagger(fastify);
    fastify.log.info("Swagger plugin registered successfully");
  } catch (error) {
    fastify.log.error({ err: (error as Error).message }, "Failed to register Swagger plugin");
  }
  
  try {
    await fastify.register(require("@fastify/cookie"), {
      secret: process.env.COOKIE_SECRET || "change-me-in-production",
      parseOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      }
    });
    fastify.log.debug("Cookie plugin registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Cookie plugin not available");
  }
}

/**
 * Register health check routes
 */
export async function registerHealthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/health", {
    config: { rateLimit: false },
  }, async (): Promise<HealthCheckResponse> => {
    return {
      status: "ok",
      service: "eios-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  });
  
  fastify.get("/ready", {
    config: { rateLimit: false },
  }, async (): Promise<ReadyCheckResponse> => {
    return {
      status: "ready",
      checks: { database: "ok" },
    };
  });
  
  fastify.get("/live", {
    config: { rateLimit: false },
  }, async (): Promise<{ status: string }> => {
    return { status: "alive" };
  });
}

/**
 * Register API info route
 */
export async function registerInfoRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", {
    config: { rateLimit: false },
  }, async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const indexPath = path.join(__dirname, "public", "index.html");
      const html = fs.readFileSync(indexPath, "utf-8");
      reply.type("text/html").send(html);
    } catch {
      reply.send({
        name: "Event Invitation OS API",
        version: "1.0.0",
        environment: SERVER.NODE_ENV,
        docs: "/health",
      });
    }
  });
}

/**
 * Register Auth Routes
 */
async function registerAuthRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const { registerUser, sendLoginMagicLink, loginWithMagicLink } = require("./modules/auth/service");
    
    fastify.post("/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
      const { email, fullName } = request.body as { email: string; fullName: string };
      if (!email || !fullName) {
        reply.status(400);
        return { statusCode: 400, error: "Bad Request", message: "email and fullName are required" };
      }
      const result = await registerUser(email, fullName);
      reply.status(201);
      return { success: true, user: result.user, message: result.message };
    });
    
    fastify.post("/auth/magic-link", async (request: FastifyRequest, reply: FastifyReply) => {
      const { email } = request.body as { email: string };
      if (!email) {
        reply.status(400);
        return { statusCode: 400, error: "Bad Request", message: "email is required" };
      }
      const result = await sendLoginMagicLink(email);
      return { success: true, message: result.message };
    });
    
    fastify.post("/auth/otp/verify", async (request: FastifyRequest) => {
      const { token } = request.body as { token: string };
      const result: AuthResult = await loginWithMagicLink(token, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      const user = result.user as User & { name?: string; avatar?: string };
      return {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: user.name || result.user.fullName,
          avatar: user.avatar || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: result.sessionToken,
        isNewUser: result.isNewUser
      };
    });
    
    fastify.post("/auth/logout", async () => ({ success: true, message: "Logged out successfully" }));
    
    fastify.get("/auth/me", async (request: FastifyRequest) => ({ success: true, user: request.user }));
    
    fastify.patch("/auth/profile", async (request: FastifyRequest) => {
      const { name, avatar } = request.body as { name?: string; avatar?: string };
      const user = request.user;
      return { 
        success: true, 
        user: user ? { 
          ...user, 
          name: name || user.name,
          avatar: avatar || user.avatar
        } : undefined
      };
    });
    
    fastify.log.info("Auth routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Auth routes not available");
  }
}

/**
 * Register legacy routes
 */
export async function registerLegacyRoutes(fastify: FastifyInstance): Promise<void> {
  const sharedPath = path.join(__dirname, "../../../packages/shared/src");

  // Settings module
  try {
    const { resolveSettingForContext, setSettingsValue, getSettingsValues } = require("./modules/settings");
    const { resolveSetting, getDefinition, getPublicDefinitions } = require(sharedPath);
    
    fastify.get("/settings/definitions", async () => ({ settings: getPublicDefinitions() }));
    
    fastify.post("/settings/resolve", async (request: FastifyRequest) => {
      const body = request.body as Record<string, unknown>;
      const definition = getDefinition(body.key as string);
      if (!definition) throw (fastify as FastifyInstance & { ApiError: { notFound: (msg: string) => Error } }).ApiError.notFound("Unknown setting key");
      
      const hasContext = Boolean(body.projectId || body.orgId || body.eventId || body.inviteId);
      if (hasContext) {
        const result = await resolveSettingForContext(body as { key: string; projectId?: string; eventId?: string; inviteId?: string; orgId?: string });
        if (!result) throw (fastify as FastifyInstance & { ApiError: { notFound: (msg: string) => Error } }).ApiError.notFound("Unknown setting key");
        return result;
      }
      return resolveSetting(definition, (body.overrides as unknown[]) || [], (body.entitlements as Record<string, unknown>) || {});
    });
    
    fastify.post("/settings/values", async (request: FastifyRequest) => {
      const id = await setSettingsValue(request.body as { scope: string; scopeId: string; key: string; value: unknown; updatedBy?: string });
      return { id };
    });
    
    fastify.get("/settings/values", async (request: FastifyRequest) => {
      const values = await getSettingsValues(request.query as Record<string, string>);
      return { values };
    });
    
    fastify.log.info("Legacy settings routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Settings module not available");
  }
  
  // Entitlements module
  try {
    const entitlements = require("./modules/entitlements");
    
    fastify.get("/entitlements/resolve", async (request: FastifyRequest) => {
      const { projectId, orgId } = request.query as { projectId?: string; orgId?: string };
      return { entitlements: await entitlements.resolveEntitlements({ projectId, orgId }) };
    });
    
    fastify.post("/admin/plans", async (request: FastifyRequest) => {
      const body = request.body as { code: string; name: string };
      const id = await entitlements.createPlanEntry(body);
      request.audit({ action: "plan.created", targetType: "plan", targetId: id, metadata: { code: body.code } });
      return { id };
    });
    
    fastify.get("/admin/plans", async () => ({ plans: await entitlements.listPlans() }));
    
    fastify.log.info("Legacy entitlements routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Entitlements module not available");
  }
  
  // Messaging module
  try {
    const { createCampaignWithJobs } = require("./modules/messaging");
    
    fastify.post("/messaging/campaigns", async (request: FastifyRequest) => {
      const body = request.body as { projectId: string; channel: string; subject: string; recipients: unknown[] };
      const result = await createCampaignWithJobs(body);
      request.audit({
        action: "messaging.campaign.sent",
        targetType: "project",
        targetId: body.projectId,
        metadata: { channel: body.channel, recipientCount: body.recipients?.length },
      });
      return result;
    });
    
    fastify.log.info("Legacy messaging routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Messaging module not available");
  }
}

/**
 * Register Sites Routes
 */
async function registerSitesRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const { siteRoutes, publicSiteRoutes } = require("./modules/sites/routes");
    await fastify.register(siteRoutes, { prefix: "/" });
    await fastify.register(publicSiteRoutes, { prefix: "/" });
    fastify.log.info("Sites routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Sites routes not available");
  }
}

/**
 * Register Projects Routes
 */
async function registerProjectsRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const { registerProjectsRoutes: registerRoutes } = require("./modules/projects/routes");
    await registerRoutes(fastify);
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Projects module not available");
  }
}

/**
 * Register Guests, Invites & RSVP routes
 */
async function registerGuestsRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const guests = require("./modules/guests");

    // Guest Groups
    fastify.get("/projects/:projectId/groups", async (request: FastifyRequest) => {
      const groups = await guests.getProjectGuestGroups((request.params as { projectId: string }).projectId);
      return { groups };
    });

    fastify.post("/projects/:projectId/groups", async (request: FastifyRequest) => {
      const id = await guests.createProjectGuestGroup(
        (request.params as { projectId: string }).projectId,
        request.body as { name: string; householdLabel?: string }
      );
      return { id };
    });

    fastify.put("/groups/:groupId", async (request: FastifyRequest) => {
      await guests.updateProjectGuestGroup(
        (request.params as { groupId: string }).groupId,
        request.body as { name?: string; householdLabel?: string }
      );
      return { success: true };
    });

    fastify.delete("/groups/:groupId", async (request: FastifyRequest) => {
      await guests.deleteProjectGuestGroup((request.params as { groupId: string }).groupId);
      return { success: true };
    });

    // Guests
    interface GetGuestsQuery {
      groupId?: string;
      role?: string;
      tagId?: string;
      search?: string;
    }

    fastify.get("/projects/:projectId/guests", async (request: FastifyRequest) => {
      const guests_list = await guests.getProjectGuests(
        (request.params as { projectId: string }).projectId,
        request.query as GetGuestsQuery
      );
      return { guests: guests_list };
    });

    fastify.post("/projects/:projectId/guests", async (request: FastifyRequest) => {
      const id = await guests.createProjectGuest(
        (request.params as { projectId: string }).projectId,
        request.body as Record<string, unknown>
      );
      return { id };
    });

    fastify.get("/projects/:projectId/guests/:guestId", async (request: FastifyRequest) => {
      const guest = await guests.getGuest((request.params as { guestId: string }).guestId);
      return { guest };
    });

    fastify.patch("/projects/:projectId/guests/:guestId", async (request: FastifyRequest) => {
      await guests.updateProjectGuest((request.params as { guestId: string }).guestId, request.body as Record<string, unknown>);
      return { success: true, message: "Guest updated successfully" };
    });

    fastify.delete("/projects/:projectId/guests/:guestId", async (request: FastifyRequest) => {
      await guests.deleteProjectGuest((request.params as { guestId: string }).guestId);
      return { success: true, message: "Guest deleted successfully" };
    });

    fastify.log.info("Guests routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Guests module not available");
  }
}

/**
 * Start the server
 */
export async function start(): Promise<FastifyInstance> {
  const fastify = createServer();
  
  try {
    await registerCorePlugins(fastify);
    await registerHealthRoutes(fastify);
    await registerInfoRoute(fastify);
    
    try {
      const authPlugin = require("./modules/auth");
      await fastify.register(authPlugin);
      fastify.log.info("Auth module registered");
    } catch (error) {
      fastify.log.warn({ err: (error as Error).message }, "Auth module not available");
    }
    
    await registerLegacyRoutes(fastify);
    await registerModuleLoader(fastify);
    await registerAuthRoutes(fastify);
    await registerProjectsRoutes(fastify);
    await registerSitesRoutes(fastify);
    await registerGuestsRoutes(fastify);
    
    await fastify.listen({
      port: SERVER.PORT,
      host: SERVER.HOST,
    });
    
    fastify.log.info(`EIOS API server listening on ${SERVER.HOST}:${SERVER.PORT} (${SERVER.NODE_ENV})`);
    
    return fastify;
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
export function setupGracefulShutdown(fastify: FastifyInstance): void {
  const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
  
  for (const signal of signals) {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, starting graceful shutdown...`);
      try {
        await fastify.close();
        fastify.log.info("Server closed successfully");
        process.exit(0);
      } catch (error) {
        fastify.log.error(error, "Error during shutdown");
        process.exit(1);
      }
    });
  }
  
  process.on("uncaughtException", (error: Error) => {
    fastify.log.fatal(error, "Uncaught exception");
    process.exit(1);
  });
  
  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    fastify.log.fatal({ reason, promise }, "Unhandled promise rejection");
    process.exit(1);
  });
}

// Start server if run directly
if (require.main === module) {
  start().then((fastify) => {
    setupGracefulShutdown(fastify);
  });
}

// Export for testing
export default { createServer, start, setupGracefulShutdown };
