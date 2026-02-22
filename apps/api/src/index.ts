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
import { checkConnection } from "./db";

// Plugin imports
import { registerCors } from "./plugins/cors";
import { registerSecurity } from "./plugins/security";
import { registerLogging } from "./plugins/logger";
import { registerErrorHandler } from "./plugins/error-handler";
// import { registerModuleLoader } from "./plugins/module-loader";
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
  version?: string;
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
      // SECURITY: Version information removed to prevent information disclosure
      timestamp: new Date().toISOString(),
    };
  });
  
  fastify.get("/ready", {
    config: { rateLimit: false },
  }, async (_request: FastifyRequest, reply: FastifyReply): Promise<ReadyCheckResponse> => {
    const dbHealthy = await checkConnection();
    
    if (!dbHealthy) {
      reply.status(503);
      return {
        status: "not_ready",
        checks: { database: "unavailable" },
      };
    }
    
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
    const { registerUser, sendLoginMagicLink, loginWithMagicLink, logout, getCurrentUser } = require("./modules/auth/service");
    const { authenticateHook, otpVerifyRateLimiter } = require("./modules/auth/middleware");
    
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
    
    fastify.post("/auth/logout", {
      preHandler: [authenticateHook],
      schema: {
        description: "Logout user and invalidate session",
        tags: ["Auth"],
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
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      await logout((request as any).sessionToken as string);
      (reply as any).clearCookie("session_token");
      return { success: true, message: "Logged out successfully" };
    });
    
    fastify.get("/auth/me", {
      preHandler: [authenticateHook],
      schema: {
        description: "Get current authenticated user",
        tags: ["Auth"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: { type: "object" }
            }
          }
        }
      }
    }, async (request: FastifyRequest) => {
      const user = await getCurrentUser(request.user?.id as string);
      if (!user) {
        const error = new Error("User not found");
        (error as any).statusCode = 404;
        throw error;
      }
      return { success: true, user };
    });
    
    fastify.patch("/auth/profile", {
      preHandler: [authenticateHook],
      schema: {
        description: "Update user profile",
        tags: ["Auth"],
        body: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            locale: { type: "string" },
            avatar: { type: "string" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: { type: "object" }
            }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { fullName, locale, avatar } = request.body as { fullName?: string; locale?: string; avatar?: string };
      const userId = request.user?.id as string;
      
      // Import repository function
      const { updateUser } = require("./modules/auth/repository");
      
      const updates: Record<string, string> = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (locale !== undefined) updates.locale = locale;
      if (avatar !== undefined) updates.avatar = avatar;
      
      if (Object.keys(updates).length === 0) {
        reply.status(400);
        return { statusCode: 400, error: "Bad Request", message: "No fields to update" };
      }
      
      const updatedUser = await updateUser(userId, updates);
      if (!updatedUser) {
        const error = new Error("User not found");
        (error as any).statusCode = 404;
        throw error;
      }
      
      return { 
        success: true, 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          locale: updatedUser.locale,
          avatar: updatedUser.avatar,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      };
    });
    
    // Add alias for OTP verify to maintain compatibility
    fastify.post("/auth/otp/verify", {
      preHandler: [otpVerifyRateLimiter],
      schema: {
        description: "Verify magic link token and create session (alias for /auth/verify)",
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string" }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { token } = request.body as { token: string };
      const result: AuthResult = await loginWithMagicLink(token, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      
      (reply as any).setCookie("session_token", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      return {
        success: true,
        user: result.user,
        token: result.sessionToken,
        isNewUser: result.isNewUser
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
    
    // Public endpoint - no auth required
    fastify.get("/settings/definitions", async () => ({ settings: getPublicDefinitions() }));
    
    // Protected endpoints - require authentication
    fastify.post("/settings/resolve", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest) => {
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
    
    fastify.post("/settings/values", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest) => {
      const id = await setSettingsValue(request.body as { scope: string; scopeId: string; key: string; value: unknown; updatedBy?: string });
      return { id };
    });
    
    fastify.get("/settings/values", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest) => {
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
    
    fastify.get("/entitlements/resolve", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest) => {
      const { projectId, orgId } = request.query as { projectId?: string; orgId?: string };
      return { entitlements: await entitlements.resolveEntitlements({ projectId, orgId }) };
    });
    
    fastify.post("/admin/plans", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      // Check admin role
      const user = (request as unknown as { user?: { role?: string } }).user;
      if (!user || user.role !== 'admin') {
        reply.status(403);
        return { error: "Forbidden", message: "Admin access required" };
      }
      const body = request.body as { code: string; name: string };
      const id = await entitlements.createPlanEntry(body);
      request.audit({ action: "plan.created", targetType: "plan", targetId: id, metadata: { code: body.code } });
      return { id };
    });
    
    fastify.get("/admin/plans", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      // Check admin role
      const user = (request as unknown as { user?: { role?: string } }).user;
      if (!user || user.role !== 'admin') {
        reply.status(403);
        return { error: "Forbidden", message: "Admin access required" };
      }
      return { plans: await entitlements.listPlans() };
    });
    
    fastify.log.info("Legacy entitlements routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Entitlements module not available");
  }
  
  // Messaging module
  try {
    const { createCampaignWithJobs } = require("./modules/messaging");
    
    fastify.post("/messaging/campaigns", {
      preHandler: [(fastify as unknown as { authenticate?: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }).authenticate || (async () => {})],
    }, async (request: FastifyRequest) => {
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
    const siteModule = require("./modules/sites");
    // Handle both { register: fn } and direct function exports
    const registerFn = siteModule.register || siteModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/" });
    }
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
    const projectsModule = require("./modules/projects");
    // Handle both { register: fn } and direct function exports
    const registerFn = projectsModule.register || projectsModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/projects" });
    }
    fastify.log.info("Projects routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Projects module not available");
  }
}

/**
 * Register Admin Routes
 */
async function registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const adminModule = require("./modules/admin");
    // Handle both { register: fn } and direct function exports
    const registerFn = adminModule.register || adminModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/admin" });
    }
    fastify.log.info("Admin routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Admin module not available");
  }
}

/**
 * Register Users Routes
 */
async function registerUsersRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const usersModule = require("./modules/users");
    // Handle both { register: fn } and direct function exports
    const registerFn = usersModule.register || usersModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/users" });
    }
    fastify.log.info("Users routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Users routes not available");
  }
}

/**
 * Register Dashboard Routes
 */
async function registerDashboardRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const dashboardModule = require("./modules/dashboard");
    // Handle { routes: fn } export pattern
    const routesFn = dashboardModule.routes || dashboardModule.register || dashboardModule;
    if (typeof routesFn === "function") {
      await fastify.register(routesFn, { prefix: "/api/dashboard" });
    }
    fastify.log.info("Dashboard routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Dashboard routes not available");
  }
}

/**
 * Register Events Routes
 */
async function registerEventsRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const eventsModule = require("./modules/events");
    // Handle both { register: fn } and direct function exports
    const registerFn = eventsModule.register || eventsModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/events" });
    }
    fastify.log.info("Events routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Events routes not available");
  }
}

/**
 * Register Clients Routes
 */
async function registerClientsRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const clientsModule = require("./modules/clients");
    // Handle both { register: fn } and direct function exports
    const registerFn = clientsModule.register || clientsModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/clients" });
    }
    fastify.log.info("Clients routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Clients routes not available");
  }
}

/**
 * Register Team Routes
 */
async function registerTeamRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const teamModule = require("./modules/team");
    // Handle both { register: fn } and direct function exports
    const registerFn = teamModule.register || teamModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/team" });
    }
    fastify.log.info("Team routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Team routes not available");
  }
}

/**
 * Register Invoices Routes
 */
async function registerInvoicesRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const invoicesModule = require("./modules/invoices");
    // Handle both { register: fn } and direct function exports
    const registerFn = invoicesModule.register || invoicesModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api/invoices" });
    }
    fastify.log.info("Invoices routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Invoices routes not available");
  }
}

/**
 * Register Guests, Invites & RSVP routes
 */
async function registerGuestsRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const guestsModule = require("./modules/guests");
    // Handle both { register: fn } and direct function exports
    const registerFn = guestsModule.register || guestsModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api" });
    }
    fastify.log.info("Guests routes registered via module");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Guests module not available");
  }
}

/**
 * Register Photos routes
 */
async function registerPhotosRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const photosModule = require("./modules/photos");
    
    // First try to use the module's register function if available
    if (photosModule.register && typeof photosModule.register === "function") {
      await fastify.register(photosModule.register, { prefix: "/api" });
      fastify.log.info("Photos routes registered via module");
      return;
    }
    
    // Fall back to legacy route handler
    const handlePhotosRoutes = photosModule.handlePhotosRoutes;
    if (handlePhotosRoutes) {
      // Create a plugin that wraps the legacy route handler
      await fastify.register(async (instance) => {
        instance.addHook("onRequest", async (request, reply) => {
          // Check if this is a photos route
          const pathname = request.url.split("?")[0];
          const isPhotosRoute = 
            pathname.match(/^\/projects\/[^/]+\/photo-settings$/) ||
            pathname.match(/^\/projects\/[^/]+\/photos/) ||
            pathname.match(/^\/photos\//) ||
            pathname === "/photos/upload-url" ||
            pathname === "/photos/confirm-upload" ||
            pathname === "/webhooks/s3/upload-complete";
          
          if (!isPhotosRoute) return;
          
          // Build request object for legacy handler
          const reqInfo = {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] || "",
            userId: request.user?.id
          };
          
          const result = await handlePhotosRoutes(
            { ...request, pathname },
            reply,
            request.body,
            reqInfo
          );
          
          if (result) {
            reply.status(result.status).send(result.body);
          }
        });
      });
      fastify.log.info("Photos routes registered via legacy handler");
    }
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Photos module not available");
  }
}

/**
 * Register Seating routes
 */
async function registerSeatingRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const seatingModule = require("./modules/seating");
    
    // First try to use the module's register function if available
    if (seatingModule.register && typeof seatingModule.register === "function") {
      await fastify.register(seatingModule.register, { prefix: "/api" });
      fastify.log.info("Seating routes registered via module");
      return;
    }
    
    // Fall back to legacy route handler
    const handleSeatingRoutes = seatingModule.handleSeatingRoutes || seatingModule;
    if (handleSeatingRoutes && typeof handleSeatingRoutes === "function") {
      // Create a plugin that wraps the legacy route handler
      await fastify.register(async (instance) => {
        instance.addHook("onRequest", async (request, reply) => {
          // Check if this is a seating route
          const pathname = request.url.split("?")[0];
          const isSeatingRoute = 
            pathname.match(/^\/events\/[^/]+\/floor-plans/) ||
            pathname.match(/^\/events\/[^/]+\/check-in/) ||
            pathname.match(/^\/events\/[^/]+\/check-ins/) ||
            pathname.match(/^\/events\/[^/]+\/qr-code/) ||
            pathname.match(/^\/events\/[^/]+\/guest-qr-code/) ||
            pathname.match(/^\/events\/[^/]+\/seating-stats/) ||
            pathname.match(/^\/floor-plans\//) ||
            pathname.match(/^\/tables\//) ||
            pathname.match(/^\/seating\//) ||
            pathname.match(/^\/check-in\//) ||
            pathname.match(/^\/check-ins\//);
          
          if (!isSeatingRoute) return;
          
          // Build request object for legacy handler
          const reqInfo = {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] || "",
            userId: request.user?.id
          };
          
          const result = await handleSeatingRoutes(
            { ...request, pathname },
            reply,
            request.body,
            reqInfo
          );
          
          if (result) {
            reply.status(result.status).send(result.body);
          }
        });
      });
      fastify.log.info("Seating routes registered via legacy handler");
    }
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Seating module not available");
  }
}

/**
 * Register Messaging routes
 */
async function registerMessagingRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const messagingModule = require("./modules/messaging");
    // Handle both { register: fn } and direct function exports
    const registerFn = messagingModule.register || messagingModule;
    if (typeof registerFn === "function") {
      await fastify.register(registerFn, { prefix: "/api" });
    }
    fastify.log.info("Messaging routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Messaging module not available");
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
      const authModule = require("./modules/auth");
      // Handle { register: fn } export pattern
      const registerFn = authModule.register || authModule;
      if (typeof registerFn === "function") {
        await fastify.register(registerFn);
        fastify.log.info("Auth module registered");
      }
    } catch (error) {
      fastify.log.warn({ err: (error as Error).message }, "Auth module not available");
    }
    
    await registerLegacyRoutes(fastify);
    // Skip module loader - it creates encapsulation issues with auth decorator
    // await registerModuleLoader(fastify);
    await registerAuthRoutes(fastify);
    await registerUsersRoutes(fastify);
    await registerDashboardRoutes(fastify);
    await registerEventsRoutes(fastify);
    await registerClientsRoutes(fastify);
    await registerTeamRoutes(fastify);
    await registerInvoicesRoutes(fastify);
    await registerProjectsRoutes(fastify);
    await registerSitesRoutes(fastify);
    await registerGuestsRoutes(fastify);
    await registerPhotosRoutes(fastify);
    await registerSeatingRoutes(fastify);
    await registerMessagingRoutes(fastify);
    await registerAdminRoutes(fastify);
    
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
