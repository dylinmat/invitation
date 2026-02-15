/**
 * CORS Plugin
 * Cross-Origin Resource Sharing configuration for EIOS API
 */

const cors = require("@fastify/cors");
const { CORS } = require("../config");

/**
 * Register CORS plugin with Fastify
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerCors(fastify, options = {}) {
  // Determine origin based on configuration
  const origin = options.origin ?? CORS.ORIGIN;
  
  await fastify.register(cors, {
    origin: (originValue, callback) => {
      // Handle array of allowed origins
      if (Array.isArray(origin)) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!originValue) {
          callback(null, true);
          return;
        }
        
        // Check if origin is in allowed list
        const isAllowed = origin.some(allowed => {
          if (typeof allowed === "string") {
            return allowed === originValue;
          }
          if (allowed instanceof RegExp) {
            return allowed.test(originValue);
          }
          return false;
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${originValue} not allowed`), false);
        }
        return;
      }
      
      // Handle boolean or function origins
      callback(null, origin);
    },
    
    methods: options.methods ?? CORS.METHODS,
    allowedHeaders: options.allowedHeaders ?? CORS.ALLOWED_HEADERS,
    exposedHeaders: options.exposedHeaders ?? CORS.EXPOSED_HEADERS,
    credentials: options.credentials ?? CORS.CREDENTIALS,
    maxAge: options.maxAge ?? CORS.MAX_AGE,
    
    // Preflight handling
    preflight: true,
    strictPreflight: true,
    
    // Add custom headers to preflight response
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  fastify.log.debug("CORS plugin registered");
}

module.exports = { registerCors };
