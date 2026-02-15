/**
 * EIOS API Server
 * Fastify-based API with modular domain architecture
 */

const Fastify = require("fastify");
const { SERVER, LOGGING } = require("./config");

// Plugin imports
const { registerCors } = require("./plugins/cors");
const { registerSecurity } = require("./plugins/security");
const { registerLogging } = require("./plugins/logger");
const { registerErrorHandler } = require("./plugins/error-handler");
const { registerModuleLoader } = require("./plugins/module-loader");
const { registerSwagger } = require("./plugins/swagger");

/**
 * Create and configure Fastify instance
 */
function createServer() {
  // Configure logger
  const loggerConfig = {
    level: LOGGING.LEVEL,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket?.remotePort,
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
  if (LOGGING.PRETTY) {
    loggerConfig.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    };
  }
  
  // Create Fastify instance
  const fastify = Fastify({
    logger: loggerConfig,
    
    // Request body limits
    bodyLimit: SERVER.BODY_LIMIT,
    
    // Timeout settings
    connectionTimeout: SERVER.TIMEOUT,
    keepAliveTimeout: SERVER.KEEP_ALIVE_TIMEOUT,
    
    // Trust proxy for getting real client IP
    trustProxy: SERVER.TRUST_PROXY,
    
    // Disable built-in request logging (we use custom logging)
    disableRequestLogging: true,
    
    // JSON parsing options
    jsonShorthand: true,
    
    // Case sensitivity
    caseSensitive: false,
    
    // Ignore trailing slashes
    ignoreTrailingSlash: true,
    
    // Ignore duplicate slashes
    ignoreDuplicateSlashes: true,
    
    // Max param length
    maxParamLength: 100,
  });
  
  return fastify;
}

/**
 * Register core plugins
 */
async function registerCorePlugins(fastify) {
  // 1. Error handler first (catches all errors)
  await registerErrorHandler(fastify);
  
  // 2. Logging with correlation IDs
  await registerLogging(fastify);
  
  // 3. Security (Helmet + Rate Limiting)
  await registerSecurity(fastify);
  
  // 4. CORS
  await registerCors(fastify);
  
  // 5. Swagger/OpenAPI documentation
  try {
    await registerSwagger(fastify);
    fastify.log.info("Swagger plugin registered successfully");
  } catch (error) {
    fastify.log.error({ err: error.message, stack: error.stack }, "Failed to register Swagger plugin");
  }
  
  // 5. Cookie support (for session cookies)
  try {
    await fastify.register(require("@fastify/cookie"), {
      secret: process.env.COOKIE_SECRET || "change-me-in-production",
      parseOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    });
    fastify.log.debug("Cookie plugin registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Cookie plugin not available");
  }
}

/**
 * Register health check routes
 */
async function registerHealthRoutes(fastify) {
  // Health check endpoint
  fastify.get("/health", {
    config: { rateLimit: false },
    schema: {
      description: "Health check endpoint",
      tags: ["System"],
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            service: { type: "string" },
            version: { type: "string" },
            timestamp: { type: "string" },
          },
        },
      },
    },
  }, async (request, reply) => {
    return {
      status: "ok",
      service: "eios-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  });
  
  // Readiness check endpoint
  fastify.get("/ready", {
    config: { rateLimit: false },
    schema: {
      description: "Readiness check for Kubernetes/load balancer",
      tags: ["System"],
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            checks: {
              type: "object",
              properties: {
                database: { type: "string" },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    // TODO: Add actual database connectivity check
    const checks = {
      database: "ok",
    };
    
    return {
      status: "ready",
      checks,
    };
  });
  
  // Liveness check endpoint
  fastify.get("/live", {
    config: { rateLimit: false },
    schema: {
      description: "Liveness check for Kubernetes",
      tags: ["System"],
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
          },
        },
      },
    },
  }, async () => {
    return { status: "alive" };
  });
}

/**
 * Register API info route - serves landing page HTML
 */
async function registerInfoRoute(fastify) {
  const path = require("path");
  const fs = require("fs");
  
  fastify.get("/", {
    config: { rateLimit: false },
    schema: {
      description: "EIOS Landing Page",
      tags: ["System"],
    },
  }, async (request, reply) => {
    try {
      const indexPath = path.join(__dirname, "public", "index.html");
      const html = fs.readFileSync(indexPath, "utf-8");
      reply.type("text/html").send(html);
    } catch (error) {
      // Fallback to JSON if HTML file not found
      reply.send({
        name: "Event Invitation OS API",
        version: "1.0.0",
        environment: SERVER.NODE_ENV,
        docs: "/health",
        endpoints: [
          "/health",
          "/ready",
          "/live",
          "/settings",
          "/entitlements",
          "/messaging",
          "/admin",
          "/events/:eventId/floor-plans",
          "/events/:eventId/check-in",
          "/events/:eventId/seating-stats",
          "/check-in/qr",
        ],
      });
    }
  });
}

/**
 * Register legacy routes (ported from old HTTP server)
 * These will be moved to proper domain modules over time
 */
async function registerLegacyRoutes(fastify) {
  const path = require("path");
  
  // Load legacy modules
  const sharedPath = path.join(__dirname, "../../../packages/shared/src");
  
  // Settings module
  try {
    const {
      resolveSettingForContext,
      setSettingsValue,
      getSettingsValues,
    } = require("./modules/settings");
    
    const {
      resolveSetting,
      getDefinition,
      getPublicDefinitions,
    } = require(sharedPath);
    
    // Settings definitions
    fastify.get("/settings/definitions", {
      schema: {
        description: "Get public setting definitions",
        tags: ["Settings"],
        response: {
          200: {
            type: "object",
            properties: {
              settings: { type: "object" },
            },
          },
        },
      },
    }, async () => {
      return { settings: getPublicDefinitions() };
    });
    
    // Resolve setting
    fastify.post("/settings/resolve", {
      schema: {
        description: "Resolve a setting value",
        tags: ["Settings"],
        body: {
          type: "object",
          required: ["key"],
          properties: {
            key: { type: "string" },
            projectId: { type: "string" },
            orgId: { type: "string" },
            eventId: { type: "string" },
            inviteId: { type: "string" },
            overrides: { type: "array" },
            entitlements: { type: "object" },
          },
        },
      },
    }, async (request) => {
      const { key, projectId, orgId, eventId, inviteId, overrides, entitlements } = request.body;
      
      const definition = getDefinition(key);
      if (!definition) {
        throw fastify.ApiError.notFound("Unknown setting key");
      }
      
      const hasContext = Boolean(projectId || orgId || eventId || inviteId);
      
      if (hasContext) {
        const result = await resolveSettingForContext({
          key,
          projectId,
          eventId,
          inviteId,
          orgId,
        });
        if (!result) {
          throw fastify.ApiError.notFound("Unknown setting key");
        }
        return result;
      }
      
      const safeOverrides = Array.isArray(overrides) ? overrides : [];
      const result = resolveSetting(definition, safeOverrides, entitlements || {});
      return result;
    });
    
    // Set settings value
    fastify.post("/settings/values", {
      schema: {
        description: "Set a settings value",
        tags: ["Settings"],
        body: {
          type: "object",
          required: ["scope", "scopeId", "key", "value"],
          properties: {
            scope: { type: "string", enum: ["org", "project", "event", "invite"] },
            scopeId: { type: "string" },
            key: { type: "string" },
            value: {},
            updatedBy: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await setSettingsValue(request.body);
      return { id };
    });
    
    // Get settings values
    fastify.get("/settings/values", {
      schema: {
        description: "Get settings values",
        tags: ["Settings"],
        querystring: {
          type: "object",
          properties: {
            scope: { type: "string" },
            scopeId: { type: "string" },
            key: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const values = await getSettingsValues(request.query);
      return { values };
    });
    
    fastify.log.info("Legacy settings routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Settings module not available");
  }
  
  // Entitlements module
  try {
    const {
      createPlanEntry,
      listPlans,
      setOrgPlan,
      setProjectPlan,
      listOrgPlans,
      listProjectPlans,
      setPlanEntitlement,
      listPlanEntitlements,
      setEntitlementOverride,
      listEntitlementOverrides,
      resolveEntitlements,
    } = require("./modules/entitlements");
    
    // Resolve entitlements
    fastify.get("/entitlements/resolve", {
      schema: {
        description: "Resolve entitlements for org/project",
        tags: ["Admin"],
        querystring: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            orgId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const { projectId, orgId } = request.query;
      const entitlements = await resolveEntitlements({ projectId, orgId });
      return { entitlements };
    });
    
    // Admin: Create plan
    fastify.post("/admin/plans", {
      schema: {
        description: "Create a new plan",
        tags: ["Admin"],
        body: {
          type: "object",
          required: ["code", "name"],
          properties: {
            code: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await createPlanEntry(request.body);
      
      // Audit log
      request.audit({
        action: "plan.created",
        targetType: "plan",
        targetId: id,
        metadata: { code: request.body.code },
      });
      
      return { id };
    });
    
    // Admin: List plans
    fastify.get("/admin/plans", {
      schema: {
        description: "List all plans",
        tags: ["Admin"],
        response: {
          200: {
            type: "object",
            properties: {
              plans: { type: "array" }
            }
          }
        }
      }
    }, async () => {
      const plans = await listPlans();
      return { plans };
    });
    
    // Admin: Set plan entitlement
    fastify.post("/admin/plans/entitlements", {
      schema: {
        description: "Set entitlement for a plan",
        tags: ["Admin"],
        body: {
          type: "object",
          required: ["planId", "key", "value"],
          properties: {
            planId: { type: "string" },
            key: { type: "string" },
            value: {},
          },
        },
      },
    }, async (request) => {
      const id = await setPlanEntitlement({
        planId: request.body.planId,
        key: request.body.key,
        valueJson: request.body.value,
      });
      return { id };
    });
    
    // Admin: List plan entitlements
    fastify.get("/admin/plans/entitlements", {
      schema: {
        description: "List plan entitlements",
        tags: ["Admin"],
        querystring: {
          type: "object",
          required: ["planId"],
          properties: {
            planId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const entitlements = await listPlanEntitlements(request.query.planId);
      return { entitlements };
    });
    
    // Admin: Set org plan
    fastify.post("/admin/org-plans", {
      schema: {
        description: "Set organization plan",
        tags: ["Admin"],
        body: {
          type: "object",
          required: ["orgId", "planId"],
          properties: {
            orgId: { type: "string" },
            planId: { type: "string" },
            startsAt: { type: "string" },
            endsAt: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await setOrgPlan(request.body);
      
      request.audit({
        action: "entitlements.changed",
        targetType: "org",
        targetId: request.body.orgId,
        metadata: { planId: request.body.planId },
      });
      
      return { id };
    });
    
    // Admin: List org plans
    fastify.get("/admin/org-plans", {
      schema: {
        description: "List organization plans",
        tags: ["Admin"],
        querystring: {
          type: "object",
          required: ["orgId"],
          properties: {
            orgId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const assignments = await listOrgPlans(request.query.orgId);
      return { assignments };
    });
    
    // Admin: Set project plan
    fastify.post("/admin/project-plans", {
      schema: {
        description: "Set project plan",
        tags: ["Admin"],
        body: {
          type: "object",
          required: ["projectId", "planId"],
          properties: {
            projectId: { type: "string" },
            planId: { type: "string" },
            startsAt: { type: "string" },
            endsAt: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await setProjectPlan(request.body);
      
      request.audit({
        action: "entitlements.changed",
        targetType: "project",
        targetId: request.body.projectId,
        metadata: { planId: request.body.planId },
      });
      
      return { id };
    });
    
    // Admin: List project plans
    fastify.get("/admin/project-plans", {
      schema: {
        description: "List project plans",
        tags: ["Admin"],
        querystring: {
          type: "object",
          required: ["projectId"],
          properties: {
            projectId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const assignments = await listProjectPlans(request.query.projectId);
      return { assignments };
    });
    
    // Admin: Set entitlement override
    fastify.post("/admin/entitlements/overrides", {
      schema: {
        description: "Set entitlement override",
        tags: ["Admin"],
        body: {
          type: "object",
          required: ["scope", "scopeId", "key", "value"],
          properties: {
            scope: { type: "string", enum: ["org", "project", "event", "invite"] },
            scopeId: { type: "string" },
            key: { type: "string" },
            value: {},
          },
        },
      },
    }, async (request) => {
      const id = await setEntitlementOverride({
        scope: request.body.scope,
        scopeId: request.body.scopeId,
        key: request.body.key,
        valueJson: request.body.value,
      });
      
      request.audit({
        action: "settings.updated",
        targetType: request.body.scope,
        targetId: request.body.scopeId,
        metadata: { key: request.body.key },
      });
      
      return { id };
    });
    
    // Admin: List entitlement overrides
    fastify.get("/admin/entitlements/overrides", {
      schema: {
        description: "List entitlement overrides",
        tags: ["Admin"],
        querystring: {
          type: "object",
          required: ["scope"],
          properties: {
            scope: { type: "string" },
            scopeId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const overrides = await listEntitlementOverrides({
        scope: request.query.scope,
        scopeId: request.query.scopeId,
      });
      return { overrides };
    });
    
    fastify.log.info("Legacy entitlements routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Entitlements module not available");
  }
  
  // Messaging module
  try {
    const { createCampaignWithJobs } = require("./modules/messaging");
    
    // Create messaging campaign
    fastify.post("/messaging/campaigns", {
      schema: {
        description: "Create a messaging campaign",
        tags: ["Messaging"],
        body: {
          type: "object",
          required: ["projectId", "channel", "subject", "recipients"],
          properties: {
            projectId: { type: "string" },
            channel: { type: "string", enum: ["email", "sms", "whatsapp"] },
            subject: { type: "string" },
            bodyHtml: { type: "string" },
            bodyText: { type: "string" },
            scheduledAt: { type: "string" },
            recipients: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    }, async (request) => {
      const result = await createCampaignWithJobs(request.body);
      
      request.audit({
        action: "messaging.campaign.sent",
        targetType: "project",
        targetId: request.body.projectId,
        metadata: {
          channel: request.body.channel,
          recipientCount: request.body.recipients?.length,
        },
      });
      
      return result;
    });
    
    fastify.log.info("Legacy messaging routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Messaging module not available");
  }
}

/**
 * Register Auth Routes (Express-style adapted for Fastify)
 */
async function registerAuthRoutes(fastify) {
  try {
    // Auth routes use a custom handler compatible with Fastify
    const { createAuthRouter } = require("./modules/auth/routes");
    const authRouter = createAuthRouter();
    
    // Register each auth route manually with Fastify
    // POST /auth/register
    fastify.post("/auth/register", {
      schema: {
        description: "Register a new user and send magic link",
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["email", "fullName"],
          properties: {
            email: { type: "string", format: "email" },
            fullName: { type: "string", minLength: 1 }
          }
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: { type: "object" },
              message: { type: "string" }
            }
          }
        }
      }
    }, async (request, reply) => {
      const { email, fullName } = request.body;
      if (!email || !fullName) {
        reply.status(400);
        return { statusCode: 400, error: "Bad Request", message: "email and fullName are required" };
      }
      // Delegate to auth service
      const { registerUser } = require("./modules/auth/service");
      const result = await registerUser(email, fullName);
      reply.status(201);
      return { success: true, user: result.user, message: result.message };
    });
    
    // POST /auth/magic-link
    fastify.post("/auth/magic-link", {
      schema: {
        description: "Send magic link for login",
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" }
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
      const { email } = request.body;
      if (!email) {
        reply.status(400);
        return { statusCode: 400, error: "Bad Request", message: "email is required" };
      }
      const { sendLoginMagicLink } = require("./modules/auth/service");
      const result = await sendLoginMagicLink(email);
      return { success: true, message: result.message };
    });
    
    // POST /auth/otp/verify
    fastify.post("/auth/otp/verify", {
      schema: {
        description: "Verify magic link token and create session",
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: { type: "object" },
              token: { type: "string" },
              isNewUser: { type: "boolean" }
            }
          }
        }
      }
    }, async (request, reply) => {
      const { token } = request.body;
      if (!token) {
        reply.status(400);
        return { statusCode: 400, error: "Bad Request", message: "token is required" };
      }
      const { loginWithMagicLink } = require("./modules/auth/service");
      const result = await loginWithMagicLink(token, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      return {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.fullName,
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: result.sessionToken,
        isNewUser: result.isNewUser
      };
    });
    
    // POST /auth/logout
    fastify.post("/auth/logout", {
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
    }, async (request, reply) => {
      // TODO: Implement logout
      return { success: true, message: "Logged out successfully" };
    });
    
    // GET /auth/me
    fastify.get("/auth/me", {
      schema: {
        description: "Get current authenticated user",
        tags: ["Auth"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: { $ref: "#/components/schemas/User" }
            }
          }
        }
      }
    }, async (request, reply) => {
      // TODO: Get current user from token
      return { success: true, user: request.user };
    });
    
    // PATCH /auth/profile
    fastify.patch("/auth/profile", {
      schema: {
        description: "Update user profile",
        tags: ["Auth"],
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
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
    }, async (request, reply) => {
      // TODO: Update user profile
      const { name, avatar } = request.body;
      return { 
        success: true, 
        user: { 
          ...request.user, 
          name: name || request.user?.name,
          avatar: avatar || request.user?.avatar
        } 
      };
    });
    
    fastify.log.info("Auth routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Auth routes not available");
  }
}

/**
 * Register Sites Routes
 */
async function registerSitesRoutes(fastify) {
  try {
    const { siteRoutes, publicSiteRoutes } = require("./modules/sites/routes");
    
    // Register authenticated site routes
    await fastify.register(siteRoutes, { prefix: "/" });
    
    // Register public site routes
    await fastify.register(publicSiteRoutes, { prefix: "/" });
    
    fastify.log.info("Sites routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Sites routes not available");
  }
}

/**
 * Register Projects Routes
 */
async function registerProjectsRoutes(fastify) {
  try {
    const { registerProjectsRoutes: registerRoutes } = require("./modules/projects/routes");
    await registerRoutes(fastify);
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Projects module not available");
  }
}

/**
 * Register Guests, Invites & RSVP routes
 */
async function registerGuestsRoutes(fastify) {
  try {
    const {
      // Guest Groups
      getProjectGuestGroups,
      createProjectGuestGroup,
      updateProjectGuestGroup,
      deleteProjectGuestGroup,

      // Guests
      getProjectGuests,
      getGuest,
      createProjectGuest,
      updateProjectGuest,
      deleteProjectGuest,
      importGuests,

      // Guest Contacts
      addGuestContact,
      updateGuestContactInfo,
      removeGuestContact,

      // Guest Tags
      getProjectGuestTags,
      createProjectGuestTag,
      deleteProjectGuestTag,
      assignGuestTag,
      removeGuestTag,

      // Invites
      getProjectInvites,
      getInvite,
      createProjectInvite,
      revokeProjectInvite,
      regenerateProjectInviteToken,
      validateInviteToken,
      getInviteLogs,

      // RSVP Forms
      getProjectRsvpForms,
      getRsvpForm,
      createProjectRsvpForm,
      updateProjectRsvpForm,
      deleteProjectRsvpForm,

      // RSVP Questions
      addRsvpQuestion,
      removeRsvpQuestion,

      // RSVP Submissions
      getFormSubmissions,
      getSubmission,
      submitRsvp,
    } = require("./modules/guests");

    // ========== Guest Groups ==========

    fastify.get("/projects/:projectId/groups", {
      schema: {
        description: "List guest groups for a project",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
      },
    }, async (request) => {
      const groups = await getProjectGuestGroups(request.params.projectId);
      return { groups };
    });

    fastify.post("/projects/:projectId/groups", {
      schema: {
        description: "Create a guest group",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            householdLabel: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await createProjectGuestGroup(request.params.projectId, request.body);
      return { id };
    });

    fastify.put("/groups/:groupId", {
      schema: {
        description: "Update a guest group",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: { groupId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            householdLabel: { type: "string" },
          },
        },
      },
    }, async (request) => {
      await updateProjectGuestGroup(request.params.groupId, request.body);
      return { success: true };
    });

    fastify.delete("/groups/:groupId", {
      schema: {
        description: "Delete a guest group",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: { groupId: { type: "string" } },
        },
      },
    }, async (request) => {
      await deleteProjectGuestGroup(request.params.groupId);
      return { success: true };
    });

    // ========== Guests ==========

    fastify.get("/projects/:projectId/guests", {
      schema: {
        description: "List guests for a project",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        querystring: {
          type: "object",
          properties: {
            groupId: { type: "string" },
            role: { type: "string" },
            tagId: { type: "string" },
            search: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const guests = await getProjectGuests(request.params.projectId, request.query);
      return { guests };
    });

    fastify.post("/projects/:projectId/guests", {
      schema: {
        description: "Create a guest",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            groupId: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: { type: "string" },
            contacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  phone: { type: "string" },
                },
              },
            },
            tagIds: { type: "array", items: { type: "string" } },
          },
        },
      },
    }, async (request) => {
      const id = await createProjectGuest(request.params.projectId, request.body);
      return { id };
    });

    fastify.post("/projects/:projectId/guests/import", {
      schema: {
        description: "Bulk import guests",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["guests"],
          properties: {
            guests: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    }, async (request) => {
      const result = await importGuests(request.params.projectId, request.body.guests);
      return result;
    });

    // Get, Update, Delete guest - nested under project (frontend expects this pattern)
    fastify.get("/projects/:projectId/guests/:guestId", {
      schema: {
        description: "Get a guest by ID",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId", "guestId"],
          properties: { 
            projectId: { type: "string" },
            guestId: { type: "string" } 
          },
        },
      },
    }, async (request) => {
      const guest = await getGuest(request.params.guestId);
      return { guest };
    });

    fastify.patch("/projects/:projectId/guests/:guestId", {
      schema: {
        description: "Update a guest",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId", "guestId"],
          properties: { 
            projectId: { type: "string" },
            guestId: { type: "string" } 
          },
        },
        body: {
          type: "object",
          properties: {
            groupId: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: { type: "string" },
            contacts: { type: "array", items: { type: "object" } },
          },
        },
      },
    }, async (request) => {
      await updateProjectGuest(request.params.guestId, request.body);
      return { success: true, message: "Guest updated successfully" };
    });

    fastify.delete("/projects/:projectId/guests/:guestId", {
      schema: {
        description: "Delete a guest",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId", "guestId"],
          properties: { 
            projectId: { type: "string" },
            guestId: { type: "string" } 
          },
        },
      },
    }, async (request) => {
      await deleteProjectGuest(request.params.guestId);
      return { success: true, message: "Guest deleted successfully" };
    });

    // Bulk create guests
    fastify.post("/projects/:projectId/guests/bulk", {
      schema: {
        description: "Bulk create guests",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["guests"],
          properties: {
            guests: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    }, async (request) => {
      const createdIds = [];
      const failed = [];
      
      for (const guestData of request.body.guests) {
        try {
          const guestId = await createProjectGuest(request.params.projectId, guestData);
          createdIds.push(guestId);
        } catch (error) {
          failed.push({ data: guestData, error: error.message });
        }
      }
      
      return { 
        created: createdIds.length, 
        failed: failed.length,
        guestIds: createdIds 
      };
    });

    // ========== Guest Contacts ==========

    fastify.post("/guests/:guestId/contacts", {
      schema: {
        description: "Add a contact to a guest",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["guestId"],
          properties: { guestId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            email: { type: "string" },
            phone: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await addGuestContact(request.params.guestId, request.body);
      return { id };
    });

    fastify.put("/contacts/:contactId", {
      schema: {
        description: "Update a guest contact",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["contactId"],
          properties: { contactId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            email: { type: "string" },
            phone: { type: "string" },
          },
        },
      },
    }, async (request) => {
      await updateGuestContactInfo(request.params.contactId, request.body);
      return { success: true };
    });

    fastify.delete("/contacts/:contactId", {
      schema: {
        description: "Remove a guest contact",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["contactId"],
          properties: { contactId: { type: "string" } },
        },
      },
    }, async (request) => {
      await removeGuestContact(request.params.contactId);
      return { success: true };
    });

    // ========== Guest Tags ==========

    fastify.get("/projects/:projectId/tags", {
      schema: {
        description: "List guest tags for a project",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
      },
    }, async (request) => {
      const tags = await getProjectGuestTags(request.params.projectId);
      return { tags };
    });

    fastify.post("/projects/:projectId/tags", {
      schema: {
        description: "Create a guest tag",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string" } },
        },
      },
    }, async (request) => {
      const id = await createProjectGuestTag(request.params.projectId, request.body.name);
      return { id };
    });

    fastify.delete("/tags/:tagId", {
      schema: {
        description: "Delete a guest tag",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["tagId"],
          properties: { tagId: { type: "string" } },
        },
      },
    }, async (request) => {
      await deleteProjectGuestTag(request.params.tagId);
      return { success: true };
    });

    fastify.post("/guests/:guestId/tags", {
      schema: {
        description: "Assign a tag to a guest",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["guestId"],
          properties: { guestId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["tagId"],
          properties: { tagId: { type: "string" } },
        },
      },
    }, async (request) => {
      await assignGuestTag(request.params.guestId, request.body.tagId);
      return { success: true };
    });

    fastify.delete("/guests/:guestId/tags/:tagId", {
      schema: {
        description: "Remove a tag from a guest",
        tags: ["Guests"],
        params: {
          type: "object",
          required: ["guestId", "tagId"],
          properties: {
            guestId: { type: "string" },
            tagId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      await removeGuestTag(request.params.guestId, request.params.tagId);
      return { success: true };
    });

    // ========== Invites ==========

    fastify.get("/projects/:projectId/invites", {
      schema: {
        description: "List invites for a project",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        querystring: {
          type: "object",
          properties: {
            siteId: { type: "string" },
            guestId: { type: "string" },
            groupId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const invites = await getProjectInvites(request.params.projectId, request.query);
      return { invites };
    });

    fastify.post("/projects/:projectId/invites", {
      schema: {
        description: "Create an invite",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["siteId"],
          properties: {
            siteId: { type: "string" },
            guestId: { type: "string" },
            groupId: { type: "string" },
            securityMode: { type: "string" },
            passcode: { type: "string" },
            expiresAt: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const result = await createProjectInvite(request.params.projectId, request.body);
      return result;
    });

    fastify.get("/invites/:inviteId", {
      schema: {
        description: "Get an invite by ID",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["inviteId"],
          properties: { inviteId: { type: "string" } },
        },
      },
    }, async (request) => {
      const invite = await getInvite(request.params.inviteId);
      return { invite };
    });

    fastify.post("/invites/:inviteId/revoke", {
      schema: {
        description: "Revoke an invite",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["inviteId"],
          properties: { inviteId: { type: "string" } },
        },
      },
    }, async (request) => {
      await revokeProjectInvite(request.params.inviteId);
      return { success: true };
    });

    fastify.post("/invites/:inviteId/regenerate", {
      schema: {
        description: "Regenerate invite token",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["inviteId"],
          properties: { inviteId: { type: "string" } },
        },
      },
    }, async (request) => {
      const result = await regenerateProjectInviteToken(request.params.inviteId);
      return result;
    });

    fastify.get("/invites/:inviteId/logs", {
      schema: {
        description: "Get invite access logs",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["inviteId"],
          properties: { inviteId: { type: "string" } },
        },
      },
    }, async (request) => {
      const logs = await getInviteLogs(request.params.inviteId);
      return { logs };
    });

    fastify.post("/invites/:token/validate", {
      schema: {
        description: "Validate an invite token (public endpoint)",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["token"],
          properties: { token: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            passcode: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const result = await validateInviteToken(request.params.token, {
        passcode: request.body?.passcode,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      });
      return result;
    });

    // Send invite (mark as sent and trigger message)
    fastify.post("/projects/:projectId/invites/:inviteId/send", {
      schema: {
        description: "Send an invite",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["projectId", "inviteId"],
          properties: { 
            projectId: { type: "string" },
            inviteId: { type: "string" } 
          },
        },
      },
    }, async (request) => {
      // Get the invite
      const invite = await getInvite(request.params.inviteId);
      
      // TODO: Integrate with messaging service to actually send the invite
      // For now, return the invite with updated status
      return { 
        success: true, 
        invite: {
          ...invite,
          status: "sent",
          sentAt: new Date().toISOString()
        },
        message: "Invite sent successfully"
      };
    });

    // Bulk send invites
    fastify.post("/projects/:projectId/invites/send-bulk", {
      schema: {
        description: "Send multiple invites in bulk",
        tags: ["Invites"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["inviteIds"],
          properties: {
            inviteIds: { type: "array", items: { type: "string" } },
          },
        },
      },
    }, async (request) => {
      const { inviteIds } = request.body;
      let sent = 0;
      const failed = [];
      
      for (const inviteId of inviteIds) {
        try {
          // Get the invite to verify it exists
          await getInvite(inviteId);
          // TODO: Integrate with messaging service
          sent++;
        } catch (error) {
          failed.push({ inviteId, error: error.message });
        }
      }
      
      return { 
        sent, 
        failed: failed.length,
        message: `${sent} invites sent successfully`
      };
    });

    // ========== Analytics ==========

    fastify.get("/projects/:projectId/analytics/summary", {
      schema: {
        description: "Get analytics summary for a project",
        tags: ["Analytics"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
      },
    }, async (request) => {
      // TODO: Implement actual analytics
      const { getProjectStats } = require("./modules/projects/repository");
      const stats = await getProjectStats(request.params.projectId);
      
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        totalRsvps: parseInt(stats.invite_count) || 0,
        rsvpRate: 0,
        avgTimeOnSite: 0
      };
    });

    fastify.get("/projects/:projectId/analytics/timeseries", {
      schema: {
        description: "Get analytics time series for a project",
        tags: ["Analytics"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        querystring: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" }
          }
        }
      },
    }, async (request) => {
      // TODO: Implement actual time series analytics
      return [];
    });

    fastify.get("/projects/:projectId/sites/:siteId/analytics", {
      schema: {
        description: "Get analytics for a specific site",
        tags: ["Analytics"],
        params: {
          type: "object",
          required: ["projectId", "siteId"],
          properties: { 
            projectId: { type: "string" },
            siteId: { type: "string" }
          },
        },
      },
    }, async (request) => {
      // TODO: Implement actual site analytics
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        totalRsvps: 0,
        rsvpRate: 0,
        avgTimeOnSite: 0,
        topReferrers: {}
      };
    });

    // ========== RSVP Forms ==========

    fastify.get("/projects/:projectId/rsvp-forms", {
      schema: {
        description: "List RSVP forms for a project",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
      },
    }, async (request) => {
      const forms = await getProjectRsvpForms(request.params.projectId);
      return { forms };
    });

    fastify.post("/projects/:projectId/rsvp-forms", {
      schema: {
        description: "Create an RSVP form",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            questions: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    }, async (request) => {
      const id = await createProjectRsvpForm(request.params.projectId, request.body);
      return { id };
    });

    fastify.get("/rsvp-forms/:formId", {
      schema: {
        description: "Get an RSVP form by ID",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["formId"],
          properties: { formId: { type: "string" } },
        },
      },
    }, async (request) => {
      const form = await getRsvpForm(request.params.formId);
      return { form };
    });

    fastify.put("/rsvp-forms/:formId", {
      schema: {
        description: "Update an RSVP form",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["formId"],
          properties: { formId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            questions: { type: "array", items: { type: "object" } },
          },
        },
      },
    }, async (request) => {
      await updateProjectRsvpForm(request.params.formId, request.body);
      return { success: true };
    });

    fastify.delete("/rsvp-forms/:formId", {
      schema: {
        description: "Delete an RSVP form",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["formId"],
          properties: { formId: { type: "string" } },
        },
      },
    }, async (request) => {
      await deleteProjectRsvpForm(request.params.formId);
      return { success: true };
    });

    // ========== RSVP Questions ==========

    fastify.post("/rsvp-forms/:formId/questions", {
      schema: {
        description: "Add a question to an RSVP form",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["formId"],
          properties: { formId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["label", "type"],
          properties: {
            eventId: { type: "string" },
            label: { type: "string" },
            helpText: { type: "string" },
            type: { type: "string" },
            required: { type: "boolean" },
            sortOrder: { type: "number" },
            options: { type: "array", items: { type: "object" } },
            logicRules: { type: "array", items: { type: "object" } },
          },
        },
      },
    }, async (request) => {
      const id = await addRsvpQuestion(request.params.formId, request.body);
      return { id };
    });

    fastify.delete("/rsvp-questions/:questionId", {
      schema: {
        description: "Remove a question from an RSVP form",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["questionId"],
          properties: { questionId: { type: "string" } },
        },
      },
    }, async (request) => {
      await removeRsvpQuestion(request.params.questionId);
      return { success: true };
    });

    // ========== RSVP Submissions ==========

    fastify.get("/rsvp-forms/:formId/submissions", {
      schema: {
        description: "List submissions for an RSVP form",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["formId"],
          properties: { formId: { type: "string" } },
        },
        querystring: {
          type: "object",
          properties: {
            inviteId: { type: "string" },
            guestId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const submissions = await getFormSubmissions(request.params.formId, request.query);
      return { submissions };
    });

    fastify.get("/rsvp-submissions/:submissionId", {
      schema: {
        description: "Get an RSVP submission by ID",
        tags: ["RSVP"],
        params: {
          type: "object",
          required: ["submissionId"],
          properties: { submissionId: { type: "string" } },
        },
      },
    }, async (request) => {
      const submission = await getSubmission(request.params.submissionId);
      return { submission };
    });

    fastify.post("/rsvp/submit", {
      schema: {
        description: "Submit an RSVP (public endpoint)",
        tags: ["RSVP"],
        body: {
          type: "object",
          required: ["formId", "answers"],
          properties: {
            formId: { type: "string" },
            inviteToken: { type: "string" },
            guestId: { type: "string" },
            answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionId: { type: "string" },
                  value: {},
                },
              },
            },
            channel: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const result = await submitRsvp(request.body);
      return result;
    });

    fastify.log.info("Guests, Invites & RSVP routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Guests module not available");
  }
}

/**
 * Register Photos module routes
 */
async function registerPhotosRoutes(fastify) {
  try {
    const {
      // Settings
      getProjectPhotoWallSettings,
      updateProjectPhotoWallSettings,

      // Upload
      createPhotoUploadUrl,
      processPhotoUpload,

      // Gallery
      listProjectPhotos,
      getPhoto,

      // Moderation
      getProjectModerationQueue,
      getProjectModerationStats,
      moderatePhoto,

      // Likes
      likePhoto,
      unlikePhoto,

      // Policy
      checkUploadPolicy,

      // Webhooks
      handleS3UploadWebhook
    } = require("./modules/photos");

    // ========== Settings (Admin) ==========

    fastify.get("/projects/:projectId/photo-settings", {
      schema: {
        description: "Get photo wall settings for a project",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } }
        }
      }
    }, async (request) => {
      const settings = await getProjectPhotoWallSettings(request.params.projectId);
      return { settings };
    });

    fastify.put("/projects/:projectId/photo-settings", {
      schema: {
        description: "Update photo wall settings",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } }
        },
        body: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            uploadAccess: { type: "string", enum: ["LINK", "INVITE_TOKEN", "BOTH"] },
            moderationMode: { type: "string", enum: ["INSTANT", "APPROVAL"] },
            familyFriendly: { type: "boolean" },
            maxUploadMb: { type: "integer" },
            allowedFormats: { type: "array", items: { type: "string" } }
          }
        }
      }
    }, async (request) => {
      await updateProjectPhotoWallSettings(request.params.projectId, {
        enabled: request.body.enabled,
        uploadAccess: request.body.uploadAccess,
        moderationMode: request.body.moderationMode,
        familyFriendly: request.body.familyFriendly,
        maxUploadMb: request.body.maxUploadMb,
        allowedFormats: request.body.allowedFormats
      });
      return { success: true };
    });

    // ========== Upload (Public) ==========

    fastify.get("/photos/upload-url", {
      schema: {
        description: "Get presigned S3 URL for photo upload",
        tags: ["Photos"],
        querystring: {
          type: "object",
          required: ["projectId", "filename"],
          properties: {
            projectId: { type: "string" },
            filename: { type: "string" },
            mimeType: { type: "string" },
            fileSize: { type: "integer" },
            inviteToken: { type: "string" }
          }
        }
      }
    }, async (request, reply) => {
      const { projectId, filename, mimeType, fileSize, inviteToken } = request.query;

      // Check upload policy
      const policy = await checkUploadPolicy(projectId, inviteToken);
      if (!policy.allowed) {
        reply.code(403);
        return { error: policy.reason };
      }

      const result = await createPhotoUploadUrl(projectId, policy.guestId, {
        filename,
        mimeType,
        fileSize: fileSize ? parseInt(fileSize, 10) : null
      }, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });

      return result;
    });

    fastify.post("/photos/confirm-upload", {
      schema: {
        description: "Confirm upload and trigger moderation",
        tags: ["Photos"],
        body: {
          type: "object",
          required: ["projectId", "storageKey"],
          properties: {
            projectId: { type: "string" },
            storageKey: { type: "string" },
            caption: { type: "string" },
            inviteToken: { type: "string" },
            fileSizeBytes: { type: "integer" },
            mimeType: { type: "string" }
          }
        }
      }
    }, async (request, reply) => {
      const { projectId, storageKey, caption, inviteToken, fileSizeBytes, mimeType } = request.body;

      // Check upload policy
      const policy = await checkUploadPolicy(projectId, inviteToken);
      if (!policy.allowed) {
        reply.code(403);
        return { error: policy.reason };
      }

      const result = await processPhotoUpload(storageKey, {
        projectId,
        guestId: policy.guestId,
        inviteId: policy.inviteId,
        source: "UPLOAD",
        caption,
        fileSizeBytes,
        mimeType,
        uploadedByIp: request.ip,
        uploadedByUserAgent: request.headers["user-agent"]
      });

      reply.code(201);
      return {
        photoId: result.photoId,
        status: result.status,
        moderation: result.moderation
      };
    });

    // ========== Gallery (Public) ==========

    fastify.get("/projects/:projectId/photos", {
      schema: {
        description: "List approved photos for a project",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } }
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", default: 50 },
            offset: { type: "integer", default: 0 },
            guestId: { type: "string" }
          }
        }
      }
    }, async (request) => {
      const photos = await listProjectPhotos(request.params.projectId, {
        limit: parseInt(request.query.limit, 10) || 50,
        offset: parseInt(request.query.offset, 10) || 0,
        guestId: request.query.guestId
      });
      return { photos };
    });

    fastify.get("/photos/:photoId", {
      schema: {
        description: "Get a single photo",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["photoId"],
          properties: { photoId: { type: "string" } }
        }
      }
    }, async (request, reply) => {
      const photo = await getPhoto(request.params.photoId);
      if (photo.status !== "APPROVED") {
        reply.code(404);
        return { error: "Photo not found" };
      }
      return { photo };
    });

    fastify.post("/photos/:photoId/like", {
      schema: {
        description: "Like a photo",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["photoId"],
          properties: { photoId: { type: "string" } }
        },
        body: {
          type: "object",
          required: ["guestId"],
          properties: { guestId: { type: "string" } }
        }
      }
    }, async (request) => {
      const result = await likePhoto(
        request.params.photoId,
        request.body.guestId,
        request.ip
      );
      return result;
    });

    fastify.delete("/photos/:photoId/like", {
      schema: {
        description: "Unlike a photo",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["photoId"],
          properties: { photoId: { type: "string" } }
        },
        querystring: {
          type: "object",
          required: ["guestId"],
          properties: { guestId: { type: "string" } }
        }
      }
    }, async (request) => {
      const result = await unlikePhoto(request.params.photoId, request.query.guestId);
      return result;
    });

    // ========== Moderation (Admin) ==========

    fastify.get("/projects/:projectId/photos/moderation-queue", {
      schema: {
        description: "Get moderation queue for a project",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["projectId"],
          properties: { projectId: { type: "string" } }
        },
        querystring: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "AUTO_REJECTED"], default: "PENDING" },
            limit: { type: "integer", default: 50 },
            offset: { type: "integer", default: 0 }
          }
        }
      }
    }, async (request) => {
      const [photos, stats] = await Promise.all([
        getProjectModerationQueue(request.params.projectId, {
          status: request.query.status || "PENDING",
          limit: parseInt(request.query.limit, 10) || 50,
          offset: parseInt(request.query.offset, 10) || 0
        }),
        getProjectModerationStats(request.params.projectId)
      ]);
      return { photos, stats };
    });

    fastify.post("/photos/:photoId/moderate", {
      schema: {
        description: "Moderate a photo (approve/reject)",
        tags: ["Photos"],
        params: {
          type: "object",
          required: ["photoId"],
          properties: { photoId: { type: "string" } }
        },
        body: {
          type: "object",
          required: ["action"],
          properties: {
            action: { type: "string", enum: ["APPROVE", "REJECT"] },
            notes: { type: "string" },
            userId: { type: "string" }
          }
        }
      }
    }, async (request) => {
      const result = await moderatePhoto(request.params.photoId, {
        action: request.body.action,
        userId: request.body.userId,
        notes: request.body.notes
      });
      return result;
    });

    // ========== Webhooks ==========

    fastify.post("/webhooks/s3/upload-complete", {
      schema: {
        description: "S3 upload complete webhook",
        tags: ["System"]
      },
      config: { rateLimit: false }
    }, async (request) => {
      // Verify webhook signature if configured
      const webhookSecret = process.env.S3_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = request.headers["x-webhook-signature"];
        // Implement signature verification here
      }

      const results = await handleS3UploadWebhook(request.body);
      return { processed: results.length, results };
    });

    fastify.log.info("Photos module routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Photos module not available");
  }
}

/**
 * Register Seating & Check-in routes
 */
async function registerSeatingRoutes(fastify) {
  try {
    const {
      // Floor Plans
      getEventFloorPlans,
      getFloorPlan,
      createEventFloorPlan,
      updateEventFloorPlan,
      deleteEventFloorPlan,

      // Tables
      getFloorPlanTables,
      getTable,
      createFloorPlanTable,
      updateFloorPlanTable,
      updateTablePositionService,
      deleteFloorPlanTable,

      // Assignments
      getTableAssignments,
      assignGuestToTable,
      removeGuestFromTable,
      moveGuestToTable,

      // Check-in
      getEventCheckIns,
      checkInGuest,
      undoCheckIn,

      // QR Code
      generateCheckInQR,
      generateGuestCheckInQR,
      validateQRCheckIn,

      // Statistics
      getEventSeatingStats
    } = require("./modules/seating");

    // ========== Floor Plans ==========

    fastify.get("/events/:eventId/floor-plans", {
      schema: {
        description: "List floor plans for an event",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
      },
    }, async (request) => {
      const floorPlans = await getEventFloorPlans(request.params.eventId);
      return { floorPlans };
    });

    fastify.post("/events/:eventId/floor-plans", {
      schema: {
        description: "Create a floor plan",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
            backgroundImageUrl: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await createEventFloorPlan(request.params.eventId, request.body);
      return { id };
    });

    fastify.get("/floor-plans/:floorPlanId", {
      schema: {
        description: "Get a floor plan by ID",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["floorPlanId"],
          properties: { floorPlanId: { type: "string" } },
        },
      },
    }, async (request) => {
      const floorPlan = await getFloorPlan(request.params.floorPlanId);
      return { floorPlan };
    });

    fastify.patch("/floor-plans/:floorPlanId", {
      schema: {
        description: "Update a floor plan",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["floorPlanId"],
          properties: { floorPlanId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
            backgroundImageUrl: { type: "string" },
          },
        },
      },
    }, async (request) => {
      await updateEventFloorPlan(request.params.floorPlanId, request.body);
      return { success: true };
    });

    fastify.delete("/floor-plans/:floorPlanId", {
      schema: {
        description: "Delete a floor plan",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["floorPlanId"],
          properties: { floorPlanId: { type: "string" } },
        },
      },
    }, async (request) => {
      await deleteEventFloorPlan(request.params.floorPlanId);
      return { success: true };
    });

    // ========== Tables ==========

    fastify.get("/floor-plans/:floorPlanId/tables", {
      schema: {
        description: "List tables for a floor plan",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["floorPlanId"],
          properties: { floorPlanId: { type: "string" } },
        },
      },
    }, async (request) => {
      const tables = await getFloorPlanTables(request.params.floorPlanId);
      return { tables };
    });

    fastify.post("/floor-plans/:floorPlanId/tables", {
      schema: {
        description: "Create a table",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["floorPlanId"],
          properties: { floorPlanId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            shape: { type: "string", enum: ["ROUND", "RECTANGLE", "SQUARE", "CUSTOM"] },
            positionX: { type: "number" },
            positionY: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            capacity: { type: "number" },
            rotation: { type: "number" },
          },
        },
      },
    }, async (request) => {
      const id = await createFloorPlanTable(request.params.floorPlanId, request.body);
      return { id };
    });

    fastify.patch("/tables/:tableId", {
      schema: {
        description: "Update a table",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["tableId"],
          properties: { tableId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            shape: { type: "string", enum: ["ROUND", "RECTANGLE", "SQUARE", "CUSTOM"] },
            width: { type: "number" },
            height: { type: "number" },
            capacity: { type: "number" },
          },
        },
      },
    }, async (request) => {
      await updateFloorPlanTable(request.params.tableId, request.body);
      return { success: true };
    });

    fastify.delete("/tables/:tableId", {
      schema: {
        description: "Delete a table",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["tableId"],
          properties: { tableId: { type: "string" } },
        },
      },
    }, async (request) => {
      await deleteFloorPlanTable(request.params.tableId);
      return { success: true };
    });

    fastify.patch("/tables/:tableId/position", {
      schema: {
        description: "Update table position",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["tableId"],
          properties: { tableId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["positionX", "positionY"],
          properties: {
            positionX: { type: "number" },
            positionY: { type: "number" },
            rotation: { type: "number" },
          },
        },
      },
    }, async (request) => {
      await updateTablePositionService(request.params.tableId, request.body);
      return { success: true };
    });

    // ========== Assignments ==========

    fastify.get("/tables/:tableId/assignments", {
      schema: {
        description: "List assignments for a table",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["tableId"],
          properties: { tableId: { type: "string" } },
        },
      },
    }, async (request) => {
      const assignments = await getTableAssignments(request.params.tableId);
      return { assignments };
    });

    fastify.post("/seating/assignments", {
      schema: {
        description: "Assign a guest to a table",
        tags: ["Seating"],
        body: {
          type: "object",
          required: ["guestId", "tableId"],
          properties: {
            guestId: { type: "string" },
            tableId: { type: "string" },
            seatNumber: { type: "number" },
          },
        },
      },
    }, async (request) => {
      const id = await assignGuestToTable(request.body.guestId, request.body.tableId, request.body.seatNumber);
      return { id };
    });

    fastify.delete("/seating/assignments/:assignmentId", {
      schema: {
        description: "Remove a guest from a table",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["assignmentId"],
          properties: { assignmentId: { type: "string" } },
        },
      },
    }, async (request) => {
      await removeGuestFromTable(request.params.assignmentId);
      return { success: true };
    });

    fastify.post("/seating/move-guest", {
      schema: {
        description: "Move a guest to a different table",
        tags: ["Seating"],
        body: {
          type: "object",
          required: ["guestId", "tableId"],
          properties: {
            guestId: { type: "string" },
            tableId: { type: "string" },
            seatNumber: { type: "number" },
          },
        },
      },
    }, async (request) => {
      const id = await moveGuestToTable(request.body.guestId, request.body.tableId, request.body.seatNumber);
      return { id };
    });

    // ========== Check-in ==========

    fastify.post("/events/:eventId/check-in", {
      schema: {
        description: "Check in a guest",
        tags: ["Check-in"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["guestId"],
          properties: {
            guestId: { type: "string" },
            method: { type: "string", enum: ["QR", "MANUAL", "IMPORT"] },
            notes: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const id = await checkInGuest(
        request.params.eventId,
        request.body.guestId,
        request.body.method,
        request.user?.id,
        request.body.notes
      );
      return { id };
    });

    fastify.post("/check-in/qr", {
      schema: {
        description: "Validate QR code check-in",
        tags: ["Check-in"],
        body: {
          type: "object",
          required: ["qrData"],
          properties: {
            qrData: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const result = await validateQRCheckIn(request.body.qrData, request.user?.id);
      return result;
    });

    fastify.get("/events/:eventId/check-ins", {
      schema: {
        description: "List check-ins for an event",
        tags: ["Check-in"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
      },
    }, async (request) => {
      const checkIns = await getEventCheckIns(request.params.eventId);
      return { checkIns };
    });

    fastify.delete("/check-ins/:checkInId", {
      schema: {
        description: "Undo a check-in",
        tags: ["Check-in"],
        params: {
          type: "object",
          required: ["checkInId"],
          properties: { checkInId: { type: "string" } },
        },
      },
    }, async (request) => {
      await undoCheckIn(request.params.checkInId);
      return { success: true };
    });

    // ========== QR Code Generation ==========

    fastify.post("/events/:eventId/qr-code", {
      schema: {
        description: "Generate QR code for event check-in",
        tags: ["Check-in"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
      },
    }, async (request) => {
      const qrCode = await generateCheckInQR(request.params.eventId);
      return { qrCode };
    });

    fastify.post("/events/:eventId/guest-qr-code", {
      schema: {
        description: "Generate QR code for a specific guest",
        tags: ["Check-in"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["guestId"],
          properties: {
            guestId: { type: "string" },
          },
        },
      },
    }, async (request) => {
      const qrCode = await generateGuestCheckInQR(request.params.eventId, request.body.guestId);
      return { qrCode };
    });

    // ========== Statistics ==========

    fastify.get("/events/:eventId/seating-stats", {
      schema: {
        description: "Get seating and check-in statistics for an event",
        tags: ["Seating"],
        params: {
          type: "object",
          required: ["eventId"],
          properties: { eventId: { type: "string" } },
        },
      },
    }, async (request) => {
      const stats = await getEventSeatingStats(request.params.eventId);
      return stats;
    });

    fastify.log.info("Seating & Check-in routes registered");
  } catch (error) {
    fastify.log.warn({ err: error.message }, "Seating module not available");
  }
}

/**
 * Start the server
 */
async function start() {
  const fastify = createServer();
  
  try {
    // Register core plugins
    await registerCorePlugins(fastify);
    
    // Register health routes
    await registerHealthRoutes(fastify);
    
    // Register info route
    await registerInfoRoute(fastify);
    
    // ===== Register Auth Module FIRST (provides authentication for other modules) =====
    try {
      const authPlugin = require("./modules/auth");
      await fastify.register(authPlugin);
      fastify.log.info("Auth module registered");
    } catch (error) {
      fastify.log.warn({ err: error.message }, "Auth module not available");
    }
    
    // Register legacy routes (depends on auth)
    await registerLegacyRoutes(fastify);
    
    // Load domain modules (if any)
    await registerModuleLoader(fastify);
    
    // Register auth routes (inline Fastify routes - for backward compatibility)
    await registerAuthRoutes(fastify);
    
    // Register projects routes
    await registerProjectsRoutes(fastify);
    
    // Register sites routes
    await registerSitesRoutes(fastify);
    
    // Register guests/invites/RSVP module routes
    await registerGuestsRoutes(fastify);
    
    // Register photos module routes
    await registerPhotosRoutes(fastify);
    
    // Register seating/check-in module routes
    await registerSeatingRoutes(fastify);
    
    // ===== Register New Domain Modules as Fastify Plugins =====
    // Guests module (Fastify plugin version)
    try {
      const guestsPlugin = require("./modules/guests");
      await fastify.register(guestsPlugin);
      fastify.log.info("Guests module (plugin) registered");
    } catch (error) {
      fastify.log.warn({ err: error.message }, "Guests plugin module not available");
    }
    
    // Messaging module
    try {
      const messagingPlugin = require("./modules/messaging");
      await fastify.register(messagingPlugin);
      fastify.log.info("Messaging module registered");
    } catch (error) {
      fastify.log.warn({ err: error.message }, "Messaging module not available");
    }
    
    // Start listening
    await fastify.listen({
      port: SERVER.PORT,
      host: SERVER.HOST,
    });
    
    fastify.log.info(
      `EIOS API server listening on ${SERVER.HOST}:${SERVER.PORT} (${SERVER.NODE_ENV})`
    );
    
    return fastify;
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown(fastify) {
  const signals = ["SIGTERM", "SIGINT"];
  
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
  
  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    fastify.log.fatal(error, "Uncaught exception");
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
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
module.exports = {
  createServer,
  registerCorePlugins,
  registerHealthRoutes,
  registerInfoRoute,
  registerLegacyRoutes,
  start,
};
