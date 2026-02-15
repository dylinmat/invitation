/**
 * Auth Module - Fastify Plugin
 * 
 * This module handles authentication and organization management:
 * - User registration and login via magic links
 * - Session management
 * - Organization CRUD
 * - Organization membership and invitations
 */

const { setRedisClient, setEmailService } = require("./repository");

const {
  // Configuration
  setEmailService: setAuthEmailService,

  // Auth
  registerUser,
  sendLoginMagicLink,
  loginWithMagicLink,
  validateSession,
  logout,
  getCurrentUser,

  // Organizations
  createOrganizationForUser,
  getOrganization,
  inviteToOrganization,
  acceptInvitation,
  getUserOrgRole
} = require("./service");

const {
  authRoutes,
  orgRoutes
} = require("./routes");

const {
  authenticateHook,
  optionalAuthHook,
  requireOrgRole,
  requireOrgMember,
  createRateLimiter,
  magicLinkRateLimiter,
  otpVerifyRateLimiter,
  extractBearerToken,
  extractCookieToken
} = require("./middleware");

const repository = require("./repository");

/**
 * Configure the auth module with external dependencies
 * @param {object} options - Configuration options
 * @param {object} options.redisClient - Redis client instance
 * @param {object} options.emailService - Email service for sending magic links
 */
const configureAuth = (options = {}) => {
  if (options.redisClient) {
    setRedisClient(options.redisClient);
  }

  if (options.emailService) {
    setAuthEmailService(options.emailService);
  }
};

/**
 * Auth Module - Fastify Plugin
 * Exports an object compatible with the EIOS module loader
 */
module.exports = {
  // Module metadata
  name: "auth",
  prefix: "/auth",

  /**
   * Register function called by the module loader
   * @param {import('fastify').FastifyInstance} fastify
   * @param {object} opts
   */
  async register(fastify, opts) {
    // Configure with options if provided
    if (opts.redisClient) {
      setRedisClient(opts.redisClient);
    }
    if (opts.emailService) {
      setAuthEmailService(opts.emailService);
    }

    // Decorate fastify instance with auth hooks
    fastify.decorate("authenticate", authenticateHook);
    fastify.decorate("optionalAuth", optionalAuthHook);
    fastify.decorate("requireOrgRole", requireOrgRole);
    fastify.decorate("requireOrgMember", requireOrgMember);

    // Decorate with rate limiters
    fastify.decorate("magicLinkRateLimiter", magicLinkRateLimiter);
    fastify.decorate("otpVerifyRateLimiter", otpVerifyRateLimiter);
    fastify.decorate("createRateLimiter", createRateLimiter);

    // Register auth routes with /auth prefix
    await fastify.register(authRoutes, { prefix: "/auth" });

    // Register org routes with /orgs prefix
    await fastify.register(orgRoutes, { prefix: "/orgs" });

    fastify.log.info("Auth module registered");
  },

  // Export configuration
  configureAuth,
  setRedisClient,
  setEmailService: setAuthEmailService,

  // Export hooks for manual use
  authenticateHook,
  optionalAuthHook,
  requireOrgRole,
  requireOrgMember,
  createRateLimiter,
  magicLinkRateLimiter,
  otpVerifyRateLimiter,

  // Export service methods for programmatic use
  registerUser,
  sendLoginMagicLink,
  loginWithMagicLink,
  validateSession,
  logout,
  getCurrentUser,
  createOrganizationForUser,
  getOrganization,
  inviteToOrganization,
  acceptInvitation,
  getUserOrgRole,

  // Export route handlers for testing or custom registration
  authRoutes,
  orgRoutes,

  // Export utilities for testing
  extractBearerToken,
  extractCookieToken,

  // Export repository for advanced use cases
  repository
};
