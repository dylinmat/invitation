/**
 * Security Plugin
 * Combines Helmet for security headers and Rate Limiting for request throttling
 */

import { FastifyInstance, FastifyPluginAsync } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Redis from "ioredis";
import { SECURITY, RATE_LIMIT, REDIS } from "../config";

interface HelmetOptions {
  contentSecurityPolicy?: object | boolean;
  hsts?: object | boolean;
  referrerPolicy?: object;
  hidePoweredBy?: boolean;
  noSniff?: boolean;
  frameguard?: object;
  xssFilter?: boolean;
}

interface RateLimitContext {
  max: number;
  ttl: number;
}

/**
 * Create Redis client for rate limiting
 */
function createRedisClient(): Redis | null {
  if (REDIS.URL) {
    try {
      return new Redis(REDIS.URL, {
        maxRetriesPerRequest: REDIS.MAX_RETRIES,
        retryStrategy: (times: number) => {
          return Math.min(times * REDIS.RETRY_DELAY, 2000);
        },
        connectTimeout: REDIS.CONNECT_TIMEOUT,
        keyPrefix: REDIS.KEY_PREFIX + RATE_LIMIT.NAMESPACE,
      });
    } catch (error) {
      console.warn("Failed to connect to Redis, falling back to memory store:", (error as Error).message);
    }
  }
  
  if (REDIS.HOST && REDIS.PORT) {
    try {
      return new Redis({
        host: REDIS.HOST,
        port: REDIS.PORT,
        password: REDIS.PASSWORD,
        db: REDIS.DB,
        maxRetriesPerRequest: REDIS.MAX_RETRIES,
        retryStrategy: (times: number) => {
          return Math.min(times * REDIS.RETRY_DELAY, 2000);
        },
        connectTimeout: REDIS.CONNECT_TIMEOUT,
        keyPrefix: REDIS.KEY_PREFIX + RATE_LIMIT.NAMESPACE,
      });
    } catch (error) {
      console.warn("Failed to connect to Redis, falling back to memory store:", (error as Error).message);
    }
  }
  
  return null;
}

/**
 * Register Helmet security headers plugin
 */
export async function registerHelmet(fastify: FastifyInstance, options: HelmetOptions = {}): Promise<void> {
  await fastify.register(helmet, {
    contentSecurityPolicy: options.contentSecurityPolicy ?? SECURITY.CONTENT_SECURITY_POLICY,
    hsts: options.hsts ?? SECURITY.HSTS,
    referrerPolicy: options.referrerPolicy ?? SECURITY.REFERRER_POLICY,
    hidePoweredBy: options.hidePoweredBy ?? SECURITY.HIDE_POWERED_BY,
    noSniff: options.noSniff ?? SECURITY.NO_SNIFF,
    frameguard: options.frameguard ?? SECURITY.FRAMEGUARD,
    xssFilter: options.xssFilter ?? SECURITY.XSS_FILTER,
    
    // Additional security headers
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  });
  
  fastify.log.debug("Helmet security plugin registered");
}

/**
 * Register Rate Limit plugin
 */
export async function registerRateLimit(fastify: FastifyInstance): Promise<void> {
  const redis = createRedisClient();
  
  if (redis) {
    redis.on("error", (err: Error) => {
      fastify.log.warn({ err }, "Redis connection error in rate limiter");
    });
    
    redis.on("connect", () => {
      fastify.log.info("Rate limiter connected to Redis");
    });
    
    fastify.decorate("rateLimitRedis", redis);
  }
  
  // Register rate limit with minimal options - using any for options due to type mismatch
  const rateLimitOptions: Record<string, unknown> = {
    max: RATE_LIMIT.MAX,
    timeWindow: RATE_LIMIT.WINDOW_MS,
    
    keyGenerator: (req: import("fastify").FastifyRequest) => {
      const user = (req as import("fastify").FastifyRequest & { user?: { id: string } }).user;
      if (user?.id) {
        return `user:${user.id}`;
      }
      const correlationId = req.headers["x-correlation-id"];
      if (correlationId) {
        return `corr:${correlationId}`;
      }
      return req.ip;
    },
    
    skipOnError: false,
    
    errorResponseBuilder: (_req: import("fastify").FastifyRequest, context: RateLimitContext) => {
      return {
        statusCode: 429,
        error: "RATE_LIMITED",
        message: RATE_LIMIT.ERROR_MESSAGE,
        retryAfter: Math.ceil(context.ttl / 1000),
        limit: context.max,
        remaining: 0,
        code: "RATE_LIMITED",
      };
    },
    
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
    
    hook: "onRequest",
    
    skip: (req: import("fastify").FastifyRequest) => {
      if (req.url === "/health" || req.url === "/ready") {
        return true;
      }
      const config = (req.routeOptions?.config as { rateLimit?: boolean }) || {};
      if (config.rateLimit === false) {
        return true;
      }
      return false;
    },
    
    allowList: [],
  };
  
  await fastify.register(rateLimit as FastifyPluginAsync, rateLimitOptions);
  
  fastify.log.debug("Rate limit plugin registered");
}

/**
 * Register per-route rate limit overrides
 */
export async function registerRateLimitOverrides(fastify: FastifyInstance): Promise<void> {
  const overrides = RATE_LIMIT.OVERRIDES;
  
  fastify.addHook("onRoute", (routeOptions: import("fastify").RouteOptions) => {
    for (const [route, config] of Object.entries(overrides)) {
      if (routeOptions.url === route || 
          (routeOptions.url && routeOptions.url.startsWith(route.replace(/:\w+/g, "")))) {
        routeOptions.config = routeOptions.config || {};
        (routeOptions.config as Record<string, unknown>).rateLimit = {
          max: config.max,
          timeWindow: config.windowMs,
        };
      }
    }
  });
  
  fastify.log.debug("Rate limit overrides registered");
}

/**
 * Register all security plugins
 */
export async function registerSecurity(fastify: FastifyInstance, options: { helmet?: HelmetOptions } = {}): Promise<void> {
  await registerHelmet(fastify, options.helmet);
  await registerRateLimit(fastify);
  await registerRateLimitOverrides(fastify);
  
  fastify.log.info("Security plugins registered");
}
