const { validateSession, getUserOrgRole } = require("./service");

/**
 * Extract bearer token from Authorization header
 * @param {object} headers - Request headers
 * @returns {string|null}
 */
const extractBearerToken = (headers) => {
  const authHeader = headers.authorization;
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Extract session token from cookies (if using cookie-based sessions)
 * @param {object} cookies - Request cookies
 * @returns {string|null}
 */
const extractCookieToken = (cookies) => {
  return cookies?.session_token || null;
};

/**
 * Fastify hook: Require authentication
 * Verifies session token and attaches user to request
 * 
 * Usage: fastify.addHook('onRequest', fastify.authenticate)
 * Or: preHandler: [fastify.authenticate] in route config
 */
const authenticateHook = async (request, reply) => {
  try {
    // Try to get token from Authorization header, cookies, or query string
    const token =
      extractBearerToken(request.headers) ||
      extractCookieToken(request.cookies) ||
      request.query?.token;

    if (!token) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Authentication required. Please provide a valid session token."
      });
    }

    const validation = await validateSession(token);

    if (!validation.valid) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Invalid or expired session. Please log in again."
      });
    }

    // Attach user and session to request
    request.user = validation.user;
    request.session = validation.session;
    request.sessionToken = token;
  } catch (error) {
    request.log.error("Auth hook error:", error);
    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "An error occurred during authentication"
    });
  }
};

/**
 * Fastify hook: Optional authentication
 * Attaches user to request if token is valid, but doesn't require it
 * 
 * Usage: fastify.addHook('onRequest', fastify.optionalAuth)
 * Or: preHandler: [fastify.optionalAuth] in route config
 */
const optionalAuthHook = async (request, reply) => {
  try {
    const token =
      extractBearerToken(request.headers) ||
      extractCookieToken(request.cookies) ||
      request.query?.token;

    if (token) {
      const validation = await validateSession(token);
      if (validation.valid) {
        request.user = validation.user;
        request.session = validation.session;
        request.sessionToken = token;
      }
    }
  } catch (error) {
    request.log.error("Optional auth hook error:", error);
    // Don't fail the request for optional auth errors
  }
};

/**
 * Fastify hook factory: Require organization role
 * Checks if the authenticated user has the required role in the specified organization
 * 
 * Usage: 
 * fastify.register(async (f) => {
 *   f.addHook('onRequest', f.requireOrgRole('admin'));
 *   f.get('/orgs/:id/admin-only', ...);
 * });
 * 
 * @param {string|string[]} requiredRole - Required role(s): 'admin', 'member', or ['admin', 'member']
 * @returns {Function} Fastify hook function
 */
const requireOrgRole = (requiredRole) => {
  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];

  return async (request, reply) => {
    try {
      // Must be called after authenticate
      if (!request.user) {
        return reply.status(401).send({
          statusCode: 401,
          error: "Unauthorized",
          message: "Authentication required"
        });
      }

      const orgId = request.params.id || request.params.orgId || request.body?.orgId;

      if (!orgId) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Organization ID is required"
        });
      }

      const userRole = await getUserOrgRole(request.user.id, orgId);

      if (!userRole) {
        return reply.status(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: "You are not a member of this organization"
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return reply.status(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: `This action requires ${allowedRoles.join(" or ")} role`
        });
      }

      // Attach organization role to request for later use
      request.orgRole = userRole;
      request.orgId = orgId;
    } catch (error) {
      request.log.error("Org role hook error:", error);
      return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "An error occurred while checking organization permissions"
      });
    }
  };
};

/**
 * Fastify hook: Require organization membership (any role)
 * A convenience wrapper around requireOrgRole that accepts any role
 * 
 * Usage: 
 * fastify.register(async (f) => {
 *   f.addHook('onRequest', f.requireOrgMember);
 *   f.get('/orgs/:id', ...);
 * });
 */
const requireOrgMember = async (request, reply) => {
  try {
    if (!request.user) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }

    const orgId = request.params.id || request.params.orgId || request.body?.orgId;

    if (!orgId) {
      return reply.status(400).send({
        error: "Bad Request",
        message: "Organization ID is required"
      });
    }

    const userRole = await getUserOrgRole(request.user.id, orgId);

    if (!userRole) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "You are not a member of this organization"
      });
    }

    request.orgRole = userRole;
    request.orgId = orgId;
  } catch (error) {
    request.log.error("Org member hook error:", error);
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "An error occurred while checking organization membership"
    });
  }
};

/**
 * Rate limiting hook factory for auth endpoints
 * Simple in-memory rate limiter. In production, use Redis.
 * 
 * @param {object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.keyPrefix - Prefix for rate limit keys
 * @returns {Function} Fastify hook function
 */
const createRateLimiter = (options = {}) => {
  const { windowMs = 10 * 60 * 1000, maxRequests = 5, keyPrefix = "ratelimit" } = options;

  // Simple in-memory store (use Redis in production)
  const requests = new Map();

  return async (request, reply) => {
    const key = `${keyPrefix}:${request.ip}`;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const timestamps = requests.get(key);

    // Remove old entries outside the window
    const windowStart = now - windowMs;
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= maxRequests) {
      return reply.status(429).send({
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please try again in ${Math.ceil(
          windowMs / 60000
        )} minutes.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    validTimestamps.push(now);
    requests.set(key, validTimestamps);
  };
};

// Pre-configured rate limiters for auth endpoints
const magicLinkRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5,
  keyPrefix: "auth:magiclink"
});

const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 10,
  keyPrefix: "auth:otpverify"
});

module.exports = {
  // Fastify hooks
  authenticateHook,
  optionalAuthHook,
  requireOrgRole,
  requireOrgMember,
  createRateLimiter,
  magicLinkRateLimiter,
  otpVerifyRateLimiter,

  // Expose for testing
  extractBearerToken,
  extractCookieToken
};
