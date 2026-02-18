/**
 * Security Module - Centralized exports for all security features
 */

// Re-export from individual modules
export * from './error-handler';
export * from './storage';
export * from './session';

// Security utilities that don't belong elsewhere

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string (simple implementation - for non-critical use)
 * For critical operations, use a proper hashing library
 */
export async function hashString(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback
  return btoa(input);
}

/**
 * Check if running in a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}

/**
 * Validate URL to prevent open redirects
 */
export function isValidInternalUrl(url: string): boolean {
  // Only allow relative URLs or URLs starting with /
  if (url.startsWith('/')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      // Check if it's the same origin
      return parsed.origin === (typeof window !== 'undefined' ? window.location.origin : '');
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Rate limiter for client-side actions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canProceed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter((time) => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  getRemainingTime(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.windowMs;
    return Math.max(0, resetTime - now);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Create global rate limiter instance
export const globalRateLimiter = new RateLimiter();

/**
 * Security configuration object
 */
export const securityConfig = {
  // Token refresh threshold (5 minutes before expiry)
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,
  
  // Maximum login attempts
  MAX_LOGIN_ATTEMPTS: 5,
  
  // Login attempt window
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Session inactivity timeout
  SESSION_INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Storage encryption key (should be overridden in production)
  STORAGE_KEY: process.env.NEXT_PUBLIC_STORAGE_KEY || 'eios-default-key',
};

export default {
  sanitizeInput,
  isValidEmail,
  generateSecureToken,
  hashString,
  isSecureContext,
  isValidInternalUrl,
  RateLimiter,
  globalRateLimiter,
  securityConfig,
};
