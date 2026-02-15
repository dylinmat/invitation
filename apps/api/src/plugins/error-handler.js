/**
 * Error Handler Plugin
 * Centralized error handling with consistent response format
 */

const { SERVER } = require("../config");

/**
 * Custom API Error class
 */
class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client handling
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message = "Bad Request", code = "BAD_REQUEST", details) {
    return new ApiError(message, 400, code, details);
  }
  
  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED", details) {
    return new ApiError(message, 401, code, details);
  }
  
  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = "Forbidden", code = "FORBIDDEN", details) {
    return new ApiError(message, 403, code, details);
  }
  
  /**
   * Create a 404 Not Found error
   */
  static notFound(message = "Not Found", code = "NOT_FOUND", details) {
    return new ApiError(message, 404, code, details);
  }
  
  /**
   * Create a 409 Conflict error
   */
  static conflict(message = "Conflict", code = "CONFLICT", details) {
    return new ApiError(message, 409, code, details);
  }
  
  /**
   * Create a 422 Unprocessable Entity error
   */
  static validationError(message = "Validation Error", code = "VALIDATION_ERROR", details) {
    return new ApiError(message, 422, code, details);
  }
  
  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message = "Too Many Requests", code = "RATE_LIMITED", details) {
    return new ApiError(message, 429, code, details);
  }
  
  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message = "Service Unavailable", code = "SERVICE_UNAVAILABLE", details) {
    return new ApiError(message, 503, code, details);
  }
}

/**
 * Known error codes mapping
 */
const ERROR_CODE_MAP = {
  // Database errors
  "23505": { status: 409, code: "DUPLICATE_ENTRY", message: "Resource already exists" },
  "23503": { status: 409, code: "FOREIGN_KEY_VIOLATION", message: "Referenced resource not found" },
  "23502": { status: 400, code: "REQUIRED_FIELD", message: "Required field is null" },
  "22P02": { status: 400, code: "INVALID_INPUT", message: "Invalid input syntax" },
  "22001": { status: 400, code: "VALUE_TOO_LONG", message: "Value too long for field" },
  
  // Custom error codes
  "Payload too large": { status: 413, code: "PAYLOAD_TOO_LARGE" },
  "Invalid JSON payload": { status: 400, code: "INVALID_JSON" },
  "Database not configured": { status: 503, code: "DATABASE_UNAVAILABLE" },
  "ETIMEDOUT": { status: 504, code: "TIMEOUT", message: "Request timeout" },
  "ECONNREFUSED": { status: 503, code: "CONNECTION_REFUSED", message: "Service unavailable" },
  "ENOTFOUND": { status: 503, code: "DNS_ERROR", message: "Service unavailable" },
};

/**
 * Determine if error is an operational error (expected) vs programming error (bug)
 * @param {Error} error
 * @returns {boolean}
 */
function isOperationalError(error) {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  
  // Check for known database error codes
  if (error.code && ERROR_CODE_MAP[error.code]) {
    return true;
  }
  
  // Check for known error messages
  if (error.message && ERROR_CODE_MAP[error.message]) {
    return true;
  }
  
  return false;
}

/**
 * Format error for client response
 * @param {Error} error
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {Object}
 */
function formatErrorResponse(error, includeStack = false) {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    const response = {
      statusCode: error.statusCode,
      error: error.code,
      message: error.message,
    };
    
    if (Object.keys(error.details).length > 0) {
      response.details = error.details;
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
      message: error.message || mapped.message,
    };
  }
  
  // Handle known error messages
  if (error.message && ERROR_CODE_MAP[error.message]) {
    const mapped = ERROR_CODE_MAP[error.message];
    return {
      statusCode: mapped.status,
      error: mapped.code,
      message: mapped.message,
    };
  }
  
  // Handle Fastify validation errors
  if (error.validation) {
    return {
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: error.message || "Request validation failed",
      details: error.validation,
    };
  }
  
  // Handle syntax errors (JSON parsing)
  if (error instanceof SyntaxError && error.statusCode === 400) {
    return {
      statusCode: 400,
      error: "INVALID_JSON",
      message: "Invalid JSON in request body",
    };
  }
  
  // Generic fallback
  const response = {
    statusCode: error.statusCode || 500,
    error: "INTERNAL_ERROR",
    message: SERVER.IS_PROD ? "Internal server error" : error.message,
  };
  
  if (includeStack && error.stack) {
    response.stack = error.stack.split("\n");
  }
  
  return response;
}

/**
 * Global error handler
 * @param {Error} error
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function globalErrorHandler(error, request, reply) {
  const isOperational = isOperationalError(error);
  const errorResponse = formatErrorResponse(error, !SERVER.IS_PROD);
  
  // Log the error
  const logData = {
    err: error,
    req: {
      method: request.method,
      url: request.url,
    },
    res: {
      statusCode: errorResponse.statusCode,
    },
    correlationId: request.correlationId,
  };
  
  if (!isOperational) {
    // Programming error - log as error
    request.log.error(logData, "Unhandled error occurred");
  } else if (errorResponse.statusCode >= 500) {
    // Server error - log as error
    request.log.error(logData, "Server error occurred");
  } else if (errorResponse.statusCode >= 400) {
    // Client error - log as warn
    request.log.warn(logData, "Client error occurred");
  }
  
  // Send response
  return reply.status(errorResponse.statusCode).send(errorResponse);
}

/**
 * Not found handler
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function notFoundHandler(request, reply) {
  return reply.status(404).send({
    statusCode: 404,
    error: "NOT_FOUND",
    message: `Route ${request.method} ${request.url} not found`,
  });
}

/**
 * Register error handler plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerErrorHandler(fastify, options = {}) {
  // Set global error handler
  fastify.setErrorHandler(globalErrorHandler);
  
  // Set not found handler
  fastify.setNotFoundHandler(notFoundHandler);
  
  // Decorate with ApiError class for use in routes
  fastify.decorate("ApiError", ApiError);
  
  // Helper to create errors from routes
  fastify.decorateRequest("apiError", function(message, statusCode, code, details) {
    return new ApiError(message, statusCode, code, details);
  });
  
  fastify.log.debug("Error handler plugin registered");
}

module.exports = {
  registerErrorHandler,
  ApiError,
  isOperationalError,
  formatErrorResponse,
};
