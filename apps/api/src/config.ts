/**
 * EIOS API Configuration
 * Environment-based configuration with sensible defaults
 */

import * as path from "path";

// Environment helpers
const env: string = process.env.NODE_ENV || "development";
const isDev: boolean = env === "development";
const isTest: boolean = env === "test";
const isProd: boolean = env === "production";

// Parse boolean env vars
const parseBool = (val: string | undefined, defaultVal: boolean = false): boolean => {
  if (val === undefined || val === null) return defaultVal;
  return ["true", "1", "yes", "on"].includes(String(val).toLowerCase());
};

// Parse integer env vars
const parseIntEnv = (val: string | undefined, defaultVal: number): number => {
  const parsed = Number.parseInt(val || "", 10);
  return Number.isNaN(parsed) ? defaultVal : parsed;
};

// SSL Configuration type
interface SslConfig {
  rejectUnauthorized: boolean;
}

// CSP Directives type
interface CspDirectives {
  directives?: {
    defaultSrc: string[];
    styleSrc: string[];
    scriptSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
  };
}

// HSTS Config type
interface HstsConfig {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

// Referrer Policy type
interface ReferrerPolicyConfig {
  policy: string;
}

// Frameguard Config type
interface FrameguardConfig {
  action: string;
}

// Rate limit override type
interface RateLimitOverride {
  max: number;
  windowMs: number;
}

// Server configuration
export interface ServerConfig {
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  IS_DEV: boolean;
  IS_TEST: boolean;
  IS_PROD: boolean;
  BODY_LIMIT: number;
  TIMEOUT: number;
  KEEP_ALIVE_TIMEOUT: number;
  TRUST_PROXY: boolean;
}

const SERVER: ServerConfig = {
  PORT: parseIntEnv(process.env.PORT, 4000),
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: env,
  IS_DEV: isDev,
  IS_TEST: isTest,
  IS_PROD: isProd,
  
  // Request body limits (bytes)
  BODY_LIMIT: parseIntEnv(process.env.BODY_LIMIT, 1048576), // 1MB default
  
  // Timeout settings (ms)
  TIMEOUT: parseIntEnv(process.env.REQUEST_TIMEOUT, 30000),
  KEEP_ALIVE_TIMEOUT: parseIntEnv(process.env.KEEP_ALIVE_TIMEOUT, 72000),
  
  // Trust proxy (for running behind ALB/nginx)
  TRUST_PROXY: parseBool(process.env.TRUST_PROXY, !isDev),
};

// Database configuration
export interface DatabaseConfig {
  URL: string;
  POOL_SIZE: number;
  CONNECTION_TIMEOUT: number;
  IDLE_TIMEOUT: number;
  SSL: SslConfig | boolean;
}

const DATABASE: DatabaseConfig = {
  URL: process.env.DATABASE_URL || "",
  POOL_SIZE: parseIntEnv(process.env.DB_POOL_SIZE, 20),
  CONNECTION_TIMEOUT: parseIntEnv(process.env.DB_CONNECTION_TIMEOUT, 5000),
  IDLE_TIMEOUT: parseIntEnv(process.env.DB_IDLE_TIMEOUT, 30000),
  
  // SSL configuration for production
  SSL: isProd ? {
    rejectUnauthorized: parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true)
  } : false,
};

// Redis configuration (for rate limiting, sessions, cache)
export interface RedisConfig {
  URL: string;
  HOST: string;
  PORT: number;
  PASSWORD: string | undefined;
  DB: number;
  MAX_RETRIES: number;
  RETRY_DELAY: number;
  CONNECT_TIMEOUT: number;
  KEY_PREFIX: string;
}

const REDIS: RedisConfig = {
  URL: process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL || "",
  HOST: process.env.REDIS_HOST || "localhost",
  PORT: parseIntEnv(process.env.REDIS_PORT, 6379),
  PASSWORD: process.env.REDIS_PASSWORD || undefined,
  DB: parseIntEnv(process.env.REDIS_DB, 0),
  
  // Connection pool settings
  MAX_RETRIES: parseIntEnv(process.env.REDIS_MAX_RETRIES, 3),
  RETRY_DELAY: parseIntEnv(process.env.REDIS_RETRY_DELAY, 100),
  CONNECT_TIMEOUT: parseIntEnv(process.env.REDIS_CONNECT_TIMEOUT, 10000),
  
  // Key prefixes
  KEY_PREFIX: process.env.REDIS_KEY_PREFIX || "eios:",
};

// CORS configuration
export interface CorsConfig {
  ORIGIN: string[] | boolean;
  METHODS: string[];
  ALLOWED_HEADERS: string[];
  EXPOSED_HEADERS: string[];
  CREDENTIALS: boolean;
  MAX_AGE: number;
}

const CORS: CorsConfig = {
  ORIGIN: ((): string[] | boolean => {
    const origin = process.env.CORS_ORIGIN;
    if (!origin) {
      // Default origins based on environment
      if (isDev) return ["http://localhost:3000", "http://localhost:3001"];
      return true; // Reflect origin in production if not specified
    }
    // Parse comma-separated origins
    return origin.split(",").map(o => o.trim());
  })(),
  
  METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  
  ALLOWED_HEADERS: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Correlation-ID",
    "X-Org-ID",
    "X-Project-ID",
  ],
  
  EXPOSED_HEADERS: [
    "X-Correlation-ID",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  
  CREDENTIALS: true,
  MAX_AGE: 86400, // 24 hours
};

// Rate limiting configuration
export interface RateLimitConfig {
  MAX: number;
  WINDOW_MS: number;
  SKIP_SUCCESSFUL: boolean;
  OVERRIDES: Record<string, RateLimitOverride>;
  NAMESPACE: string;
  ERROR_MESSAGE: string;
}

const RATE_LIMIT: RateLimitConfig = {
  // Global rate limit
  MAX: parseIntEnv(process.env.RATE_LIMIT_MAX, 100),
  WINDOW_MS: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 60000), // 1 minute
  
  // Skip successful requests from count (useful for health checks)
  SKIP_SUCCESSFUL: parseBool(process.env.RATE_LIMIT_SKIP_SUCCESSFUL, false),
  
  // Per-endpoint overrides (matches by route pattern)
  OVERRIDES: {
    // Auth endpoints - stricter limits
    "/auth/magic-link": { max: 5, windowMs: 600000 }, // 5 per 10 min
    "/auth/otp/verify": { max: 10, windowMs: 600000 }, // 10 per 10 min
    "/auth/otp/request": { max: 3, windowMs: 900000 }, // 3 per 15 min
    
    // RSVP search
    "/rsvp/search": { max: 20, windowMs: 600000 }, // 20 per 10 min
    
    // Messaging
    "/messaging/send": { max: 100, windowMs: 3600000 }, // 100 per hour (pre-trust)
    
    // Invite access
    "/invites/:token": { max: 60, windowMs: 60000 }, // 60 per min
    
    // Uploads
    "/uploads/photo": { max: 10, windowMs: 300000 }, // 10 per 5 min
    
    // Health checks - no rate limit
    "/health": { max: 1000, windowMs: 60000 },
    "/ready": { max: 1000, windowMs: 60000 },
  },
  
  // Redis namespace for rate limit keys
  NAMESPACE: "rate-limit:",
  
  // Error message when rate limited
  ERROR_MESSAGE: "Too many requests, please try again later",
};

// Security / Helmet configuration
export interface SecurityConfig {
  CONTENT_SECURITY_POLICY: CspDirectives | boolean;
  HSTS: HstsConfig | boolean;
  REFERRER_POLICY: ReferrerPolicyConfig;
  HIDE_POWERED_BY: boolean;
  NO_SNIFF: boolean;
  FRAMEGUARD: FrameguardConfig;
  XSS_FILTER: boolean;
}

const SECURITY: SecurityConfig = {
  // Content Security Policy
  CONTENT_SECURITY_POLICY: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Disable CSP in dev for easier debugging
  
  // HSTS (HTTPS Strict Transport Security)
  HSTS: isProd ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  
  // Referrer Policy
  REFERRER_POLICY: { policy: "strict-origin-when-cross-origin" },
  
  // Hide X-Powered-By header
  HIDE_POWERED_BY: true,
  
  // Prevent MIME sniffing
  NO_SNIFF: true,
  
  // X-Frame-Options
  FRAMEGUARD: { action: "deny" },
  
  // XSS Filter
  XSS_FILTER: true,
};

// Logging configuration
export interface LoggingConfig {
  LEVEL: string;
  PRETTY: boolean;
  REDACT: string[];
  CORRELATION_ID_HEADER: string;
}

const LOGGING: LoggingConfig = {
  LEVEL: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  
  // Pretty print in development
  PRETTY: parseBool(process.env.LOG_PRETTY, isDev),
  
  // Redact sensitive fields
  REDACT: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.body.password",
    "req.body.token",
    "req.body.apiKey",
    "req.body.secret",
  ],
  
  // Correlation ID header name
  CORRELATION_ID_HEADER: "x-correlation-id",
};

// Domain module configuration
export interface ModulesConfig {
  AUTOLOAD_PATH: string;
  ENABLED: string[];
}

const MODULES: ModulesConfig = {
  // Auto-load modules from this directory
  AUTOLOAD_PATH: path.join(__dirname, "modules"),
  
  // Enabled modules (empty = all)
  ENABLED: process.env.ENABLED_MODULES 
    ? process.env.ENABLED_MODULES.split(",").map(m => m.trim())
    : [],
};

// Export all configurations
export {
  SERVER,
  DATABASE,
  REDIS,
  CORS,
  RATE_LIMIT,
  SECURITY,
  LOGGING,
  MODULES,
};

// Legacy compatibility exports
export const PORT = SERVER.PORT;
export const DATABASE_URL = DATABASE.URL;

// Default export object for compatibility
const config = {
  SERVER,
  DATABASE,
  REDIS,
  CORS,
  RATE_LIMIT,
  SECURITY,
  LOGGING,
  MODULES,
  PORT: SERVER.PORT,
  DATABASE_URL: DATABASE.URL,
};

export default config;
