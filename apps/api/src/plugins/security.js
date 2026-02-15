/**
 * Security Plugin
 * Combines Helmet for security headers and Rate Limiting for request throttling
 */

const helmet = require("@fastify/helmet");
const rateLimit = require("@fastify/rate-limit");
const Redis = require("ioredis");
const { SECURITY, RATE_LIMIT, REDIS } = require("../config");

/**
 * Create Redis client for rate limiting
 * @returns {Redis|null}
 */
function createRedisClient() {
  // Check if Redis URL is configured
  const redisUrl = REDIS.URL;
  
  if (redisUrl) {
    try {
      return new Redis(redisUrl, {
        maxRetriesPerRequest: REDIS.MAX_RETRIES,
        retryStrategy: (times) => {
          const delay = Math.min(times * REDIS.RETRY_DELAY, 2000);
          return delay;
        },
        connectTimeout: REDIS.CONNECT_TIMEOUT,
        keyPrefix: REDIS.KEY_PREFIX + RATE_LIMIT.NAMESPACE,
      });
    } catch (error) {
      console.warn("Failed to connect to Redis, falling back to memory store:", error.message);
    }
  }
  
  // Fallback to individual config
  if (REDIS.HOST && REDIS.PORT) {
    try {
      return new Redis({
        host: REDIS.HOST,
        port: REDIS.PORT,
        password: REDIS.PASSWORD,
        db: REDIS.DB,
        maxRetriesPerRequest: REDIS.MAX_RETRIES,
        retryStrategy: (times) => {
          const delay = Math.min(times * REDIS.RETRY_DELAY, 2000);
          return delay;
        },
        connectTimeout: REDIS.CONNECT_TIMEOUT,
        keyPrefix: REDIS.KEY_PREFIX + RATE_LIMIT.NAMESPACE,
      });
    } catch (error) {
      console.warn("Failed to connect to Redis, falling back to memory store:", error.message);
    }
  }
  
  // No Redis available - rate limit will use memory store
  return null;
}

/**
 * Register Helmet security headers plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerHelmet(fastify, options = {}) {
  const helmetOptions = {
    contentSecurityPolicy: options.contentSecurityPolicy ?? SECURITY.CONTENT_SECURITY_POLICY,
    hsts: options.hsts ?? SECURITY.HSTS,
    referrerPolicy: options.referrerPolicy ?? SECURITY.REFERRER_POLICY,
    hidePoweredBy: options.hidePoweredBy ?? SECURITY.HIDE_POWERED_BY,
    noSniff: options.noSniff ?? SECURITY.NO_SNIFF,
    frameguard: options.frameguard ?? SECURITY.FRAMEGUARD,
    xssFilter: options.xssFilter ?? SECURITY.XSS_FILTER,
    
    // Additional security headers
    crossOriginEmbedderPolicy: false, // Disabled for compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  };
  
  await fastify.register(helmet, helmetOptions);
  
  fastify.log.debug("Helmet security plugin registered");
}

/**
 * Register Rate Limit plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerRateLimit(fastify, options = {}) {
  // Create Redis client for distributed rate limiting
  const redis = createRedisClient();
  
  if (redis) {
    redis.on("error", (err) => {
      fastify.log.warn({ err }, "Redis connection error in rate limiter");
    });
    
    redis.on("connect", () => {
      fastify.log.info("Rate limiter connected to Redis");
    });
    
    // Store redis client for cleanup
    fastify.decorate("rateLimitRedis", redis);
  }
  
  const rateLimitOptions = {
    // Store configuration - using memory store for now
    // Redis store requires a custom store class implementation
    // store: redis ? redis : undefined,
    
    // Default rate limit settings
    max: options.max ?? RATE_LIMIT.MAX,
    timeWindow: options.windowMs ?? RATE_LIMIT.WINDOW_MS,
    
    // Key generator - uses IP by default, can be customized
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }
      // Use correlation ID if available (for tracking)
      const correlationId = req.headers["x-correlation-id"];
      if (correlationId) {
        return `corr:${correlationId}`;
      }
      return req.ip;
    },
    
    // Skip certain requests
    skipOnError: false,
    
    // Custom response when rate limited
    errorResponseBuilder: (req, context) => {
      return {
        statusCode: 429,
        error: "Too Many Requests",
        message: RATE_LIMIT.ERROR_MESSAGE,
        retryAfter: Math.ceil(context.ttl / 1000),
        limit: context.max,
        remaining: 0,
      };
    },
    
    // Add rate limit headers
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
    
    // Hook for custom rate limit logic per route
    hook: "onRequest",
    
    // Custom skip function
    skip: (req) => {
      // Skip health checks from rate limiting
      if (req.url === "/health" || req.url === "/ready") {
        return true;
      }
      // Skip if explicitly disabled for this route
      if (req.routeOptions?.config?.rateLimit === false) {
        return true;
      }
      return false;
    },
    
    // Allow on redis error (fail open vs fail closed)
    allowList: [],
  };
  
  await fastify.register(rateLimit, rateLimitOptions);
  
  fastify.log.debug("Rate limit plugin registered");
}

/**
 * Register per-route rate limit overrides
 * This should be called after routes are registered
 * @param {import('fastify').FastifyInstance} fastify
 */
async function registerRateLimitOverrides(fastify) {
  const overrides = RATE_LIMIT.OVERRIDES;
  
  for (const [route, config] of Object.entries(overrides)) {
    // Store route-specific config that can be accessed by the rate limiter
    fastify.addHook("onRoute", (routeOptions) => {
      if (routeOptions.url === route || 
          routeOptions.url.startsWith(route.replace(/:\w+/g, ""))) {
        routeOptions.config = routeOptions.config || {};
        routeOptions.config.rateLimit = {
          max: config.max,
          timeWindow: config.windowMs,
        };
      }
    });
  }
  
  fastify.log.debug("Rate limit overrides registered");
}

/**
 * Register all security plugins
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerSecurity(fastify, options = {}) {
  await registerHelmet(fastify, options.helmet);
  await registerRateLimit(fastify, options.rateLimit);
  await registerRateLimitOverrides(fastify);
  
  fastify.log.info("Security plugins registered");
}

module.exports = {
  registerHelmet,
  registerRateLimit,
  registerRateLimitOverrides,
  registerSecurity,
};
