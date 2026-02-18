/**
 * Global API Error Handler
 * Intercepts fetch requests and handles errors consistently
 */

import { clearAuth, getToken } from "./auth";

// Error types
export class NetworkError extends Error {
  constructor(message = "Network error occurred") {
    super(message);
    this.name = "NetworkError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized - Please log in again") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ServerError extends Error {
  constructor(public status: number, message = "Server error occurred") {
    super(message);
    this.name = "ServerError";
  }
}

export class ValidationError extends Error {
  constructor(
    message = "Validation failed",
    public errors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter: number = 60
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Error handler callbacks
interface ErrorHandlerConfig {
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  onServerError?: (status: number) => void;
  onNetworkError?: () => void;
  onRateLimit?: (retryAfter: number) => void;
}

// Default configuration
let errorHandlerConfig: ErrorHandlerConfig = {
  onUnauthorized: () => {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login?error=session_expired";
    }
  },
  onForbidden: () => {
    // Could show a toast or modal
    console.error("Permission denied");
  },
  onServerError: (status) => {
    console.error(`Server error: ${status}`);
  },
  onNetworkError: () => {
    console.error("Network error - check your connection");
  },
  onRateLimit: (retryAfter) => {
    console.error(`Rate limited. Retry after ${retryAfter}s`);
  },
};

// Configure error handlers
export function configureErrorHandlers(config: ErrorHandlerConfig): void {
  errorHandlerConfig = { ...errorHandlerConfig, ...config };
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Exponential backoff calculation
function getRetryDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Handle HTTP errors
function handleHttpError(response: Response): void {
  switch (response.status) {
    case 401:
      errorHandlerConfig.onUnauthorized?.();
      throw new UnauthorizedError();
    case 403:
      errorHandlerConfig.onForbidden?.();
      throw new ForbiddenError();
    case 429:
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      errorHandlerConfig.onRateLimit?.(retryAfter);
      throw new RateLimitError("Rate limit exceeded", retryAfter);
    case 500:
    case 502:
    case 503:
    case 504:
      errorHandlerConfig.onServerError?.(response.status);
      throw new ServerError(response.status, `Server error: ${response.statusText}`);
    default:
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} - ${response.statusText}`);
      }
  }
}

// Fetch wrapper with error handling and retry logic
export async function fetchWithErrorHandling(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const config = { ...defaultRetryConfig, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      // Handle HTTP errors
      if (!response.ok) {
        // Check if status is retryable
        if (
          attempt < config.maxRetries &&
          config.retryableStatuses.includes(response.status)
        ) {
          const delay = getRetryDelay(attempt, config.baseDelay, config.maxDelay);
          console.warn(
            `Request failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`
          );
          await sleep(delay);
          continue;
        }

        handleHttpError(response);
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Handle network errors (no response received)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        if (attempt < config.maxRetries) {
          const delay = getRetryDelay(attempt, config.baseDelay, config.maxDelay);
          console.warn(
            `Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`
          );
          await sleep(delay);
          continue;
        }

        errorHandlerConfig.onNetworkError?.();
        throw new NetworkError(error.message);
      }

      // Re-throw other errors
      throw error;
    }
  }

  throw lastError || new Error("Request failed after retries");
}

// JSON fetch wrapper
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  const response = await fetchWithErrorHandling(input, init, retryConfig);
  
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  
  // For non-JSON responses, return the text (or null)
  const text = await response.text();
  return text as unknown as T;
}

// Authenticated fetch wrapper
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const token = getToken();
  
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  return fetchWithErrorHandling(input, { ...init, headers }, retryConfig);
}

// Global fetch interceptor setup
export function setupFetchInterceptor(): void {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch;

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError) {
        console.error("[Fetch Interceptor] Network error:", error);
        errorHandlerConfig.onNetworkError?.();
      }
      throw error;
    }
  };
}

// Error boundary helper for components
export function isAuthError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError || 
    (error instanceof Error && error.message.includes("401"));
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError ||
    (error instanceof Error && 
      (error.message.includes("fetch") || error.message.includes("network")));
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ServerError) {
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }
  return isNetworkError(error);
}

// Get user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof UnauthorizedError) {
    return "Your session has expired. Please log in again.";
  }
  if (error instanceof ForbiddenError) {
    return "You don't have permission to perform this action.";
  }
  if (error instanceof NetworkError) {
    return "Unable to connect. Please check your internet connection.";
  }
  if (error instanceof RateLimitError) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (error instanceof ServerError) {
    return "Something went wrong on our end. Please try again later.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export default {
  fetchWithErrorHandling,
  fetchJson,
  fetchWithAuth,
  configureErrorHandlers,
  setupFetchInterceptor,
  getErrorMessage,
  isAuthError,
  isNetworkError,
  isRetryableError,
};
