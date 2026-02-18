/**
 * CORS Plugin
 * Cross-Origin Resource Sharing configuration for EIOS API
 */

import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { CORS } from "../config";

interface CorsOptions {
  origin?: string[] | boolean | string;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Register CORS plugin with Fastify
 */
export async function registerCors(
  fastify: FastifyInstance,
  options: CorsOptions = {}
): Promise<void> {
  const origin = options.origin ?? CORS.ORIGIN;
  
  await fastify.register(cors, {
    origin: (originValue: string | undefined, callback: (error: Error | null, allow: boolean) => void) => {
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
      callback(null, origin as boolean);
    },
    
    methods: options.methods ?? CORS.METHODS,
    allowedHeaders: options.allowedHeaders ?? CORS.ALLOWED_HEADERS,
    exposedHeaders: options.exposedHeaders ?? CORS.EXPOSED_HEADERS,
    credentials: options.credentials ?? CORS.CREDENTIALS,
    maxAge: options.maxAge ?? CORS.MAX_AGE,
    
    // Preflight handling
    preflight: true,
    strictPreflight: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  fastify.log.debug("CORS plugin registered");
}
