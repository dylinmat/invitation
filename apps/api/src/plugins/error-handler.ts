/**
 * Error Handler Plugin
 * Centralized error handling with consistent response format
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SERVER } from "../config";
import { ErrorCode, ApiErrorResponse } from "@eios/types";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  code: ErrorCode;
  details: Record<string, unknown>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = "INTERNAL_ERROR",
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message = "Bad Request", code: ErrorCode = "BAD_REQUEST", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 400, code, details);
  }
  
  static unauthorized(message = "Unauthorized", code: ErrorCode = "UNAUTHORIZED", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 401, code, details);
  }
  
  static forbidden(message = "Forbidden", code: ErrorCode = "FORBIDDEN", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 403, code, details);
  }
  
  static notFound(message = "Not Found", code: ErrorCode = "NOT_FOUND", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 404, code, details);
  }
  
  static conflict(message = "Conflict", code: ErrorCode = "CONFLICT", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 409, code, details);
  }
  
  static validationError(message = "Validation Error", code: ErrorCode = "VALIDATION_ERROR", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 422, code, details);
  }
  
  static tooManyRequests(message = "Too Many Requests", code: ErrorCode = "RATE_LIMITED", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 429, code, details);
  }
  
  static serviceUnavailable(message = "Service Unavailable", code: ErrorCode = "SERVICE_UNAVAILABLE", details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 503, code, details);
  }
}

/**
 * Known error codes mapping
 */
const ERROR_CODE_MAP: Record<string, { status: number; code: ErrorCode; message?: string }> = {
  // Database errors (PostgreSQL error codes)
  "23505": { status: 409, code: "CONFLICT", message: "Resource already exists" },
  "23503": { status: 409, code: "CONFLICT", message: "Referenced resource not found" },
  "23502": { status: 400, code: "BAD_REQUEST", message: "Required field is null" },
  "22P02": { status: 400, code: "BAD_REQUEST", message: "Invalid input syntax" },
  "22001": { status: 400, code: "BAD_REQUEST", message: "Value too long for field" },
  
  // Custom error codes
  "Payload too large": { status: 413, code: "BAD_REQUEST", message: "Payload too large" },
  "Invalid JSON payload": { status: 400, code: "BAD_REQUEST", message: "Invalid JSON" },
  "Database not configured": { status: 503, code: "SERVICE_UNAVAILABLE", message: "Database unavailable" },
  "ETIMEDOUT": { status: 504, code: "INTERNAL_ERROR", message: "Request timeout" },
  "ECONNREFUSED": { status: 503, code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
  "ENOTFOUND": { status: 503, code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
};

/**
 * Determine if error is an operational error (expected) vs programming error (bug)
 */
function isOperationalError(error: Error & { code?: string; statusCode?: number }): boolean {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  
  if (error.code && ERROR_CODE_MAP[error.code]) {
    return true;
  }
  
  if (error.message && ERROR_CODE_MAP[error.message]) {
    return true;
  }
  
  return false;
}

/**
 * Format error for client response
 */
function formatErrorResponse(
  error: Error & { code?: string; validation?: unknown; statusCode?: number },
  includeStack: boolean = false
): ApiErrorResponse & { stack?: string[] } {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    const response: ApiErrorResponse & { stack?: string[] } = {
      statusCode: error.statusCode,
      error: error.code,
      message: error.message,
      code: error.code,
    };
    
    if (Object.keys(error.details).length > 0) {
      response.details = Array.isArray(error.details) ? error.details : undefined;
    }
    
    if (includeStack && error.stack) {
      response.stack = error.stack.split("\n");
    }
    
    return response;
  }
  
  // Handle database errors (pg)
  if (error.code && ERROR_CODE_MAP[error.code]) {
    const mapped = ERROR_CODE_MAP[error.code];
    return {
      statusCode: mapped.status,
      error: mapped.code,
      message: error.message || mapped.message || "Error occurred",
      code: mapped.code,
    };
  }
  
  // Handle known error messages
  if (error.message && ERROR_CODE_MAP[error.message]) {
    const mapped = ERROR_CODE_MAP[error.message];
    return {
      statusCode: mapped.status,
      error: mapped.code,
      message: mapped.message || error.message,
      code: mapped.code,
    };
  }
  
  // Handle Fastify validation errors
  if ((error as { validation?: unknown }).validation) {
    return {
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: error.message || "Request validation failed",
      code: "VALIDATION_ERROR",
      details: error.validation as Array<{ field?: string; message: string; code?: string }>,
    };
  }
  
  // Handle syntax errors (JSON parsing)
  if (error instanceof SyntaxError && error.statusCode === 400) {
    return {
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: "Invalid JSON in request body",
      code: "VALIDATION_ERROR",
    };
  }
  
  // Generic fallback
  const response: ApiErrorResponse & { stack?: string[] } = {
    statusCode: error.statusCode || 500,
    error: "INTERNAL_ERROR",
    message: SERVER.IS_PROD ? "Internal server error" : error.message,
    code: "INTERNAL_ERROR",
  };
  
  if (includeStack && error.stack) {
    response.stack = error.stack.split("\n");
  }
  
  return response;
}

/**
 * Global error handler
 */
async function globalErrorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const isOperational = isOperationalError(error);
  const errorResponse = formatErrorResponse(error, !SERVER.IS_PROD);
  
  const logData = {
    err: error,
    req: {
      method: request.method,
      url: request.url,
    },
    res: {
      statusCode: errorResponse.statusCode,
    },
    correlationId: (request as FastifyRequest & { correlationId?: string }).correlationId,
  };
  
  if (!isOperational) {
    request.log.error(logData, "Unhandled error occurred");
  } else if (errorResponse.statusCode >= 500) {
    request.log.error(logData, "Server error occurred");
  } else if (errorResponse.statusCode >= 400) {
    request.log.warn(logData, "Client error occurred");
  }
  
  reply.status(errorResponse.statusCode).send(errorResponse);
}

/**
 * Not found handler
 */
async function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.status(404).send({
    statusCode: 404,
    error: "NOT_FOUND",
    message: `Route ${request.method} ${request.url} not found`,
    code: "NOT_FOUND",
  });
}

/**
 * Register error handler plugin
 */
export async function registerErrorHandler(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler(globalErrorHandler);
  fastify.setNotFoundHandler(notFoundHandler);
  
  // Decorate with ApiError class for use in routes
  fastify.decorate("ApiError", ApiError);
  
  // Helper to create errors from routes
  fastify.decorateRequest("apiError", function(this: FastifyRequest, message: string, statusCode: number, code: ErrorCode, details?: Record<string, unknown>) {
    return new ApiError(message, statusCode, code, details);
  });
  
  fastify.log.debug("Error handler plugin registered");
}
