/**
 * Secure Local Storage Wrapper
 * 
 * ⚠️ IMPORTANT SECURITY NOTICE:
 * This module provides basic obfuscation, NOT true encryption.
 * 
 * - Client-side "encryption" with a public key is SECURITY THEATER
 * - The key is visible in the client bundle, making encryption trivial to break
 * - For truly sensitive data, use HttpOnly cookies (server-side only)
 * 
 * This wrapper primarily provides:
 * 1. Namespacing (prefixing keys)
 * 2. Basic obfuscation to prevent casual inspection
 * 3. Safe localStorage access with fallbacks
 */

import { clearAuth } from "./auth";

// Storage configuration
const STORAGE_PREFIX = "eios_";

// Storage availability check
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Basic obfuscation - NOT encryption
// Uses a fixed salt for basic obfuscation only
const OBFUSCATION_SALT = "eios-v1";

function obfuscate(text: string): string {
  try {
    // Simple obfuscation - base64 with salt prefix
    // This is NOT secure, just prevents casual inspection
    const salted = OBFUSCATION_SALT + text;
    return btoa(salted);
  } catch {
    return text;
  }
}

function deobfuscate(value: string): string {
  try {
    const decoded = atob(value);
    if (decoded.startsWith(OBFUSCATION_SALT)) {
      return decoded.slice(OBFUSCATION_SALT.length);
    }
    return decoded;
  } catch {
    // If deobfuscation fails, return as-is (for backwards compatibility)
    return value;
  }
}

// Check if value looks obfuscated (base64 pattern)
function isObfuscated(value: string): boolean {
  // Basic check: obfuscated values are base64 encoded
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(value) && value.length % 4 === 0;
}

// Storage event handler for cross-tab sync
type StorageEventHandler = (key: string, newValue: string | null) => void;
const storageEventHandlers: Set<StorageEventHandler> = new Set();

function handleStorageEvent(event: StorageEvent): void {
  if (!event.key?.startsWith(STORAGE_PREFIX)) return;
  
  const key = event.key.replace(STORAGE_PREFIX, "");
  
  // Handle auth logout from other tabs
  if (key === "token" && event.newValue === null) {
    console.info("[Storage] Token cleared from another tab, logging out");
    clearAuth();
  }
  
  // Notify registered handlers
  storageEventHandlers.forEach((handler) => {
    try {
      handler(key, event.newValue);
    } catch (error) {
      console.error("[Storage] Error in storage event handler:", error);
    }
  });
}

// Setup storage event listener
function setupStorageListener(): void {
  if (typeof window === "undefined") return;
  
  window.addEventListener("storage", handleStorageEvent);
}

// Initialize on module load
if (typeof window !== "undefined") {
  setupStorageListener();
}

// Register a storage event handler
export function onStorageChange(handler: StorageEventHandler): () => void {
  storageEventHandlers.add(handler);
  return () => storageEventHandlers.delete(handler);
}

// Secure storage interface
export interface SecureStorage {
  setItem(key: string, value: unknown, obfuscate?: boolean): void;
  getItem<T>(key: string, obfuscated?: boolean): T | null;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
  hasItem(key: string): boolean;
}

// Create secure storage instance
function createSecureStorage(): SecureStorage {
  return {
    setItem(key: string, value: unknown, shouldObfuscate = true): void {
      if (!isStorageAvailable()) {
        console.warn("[Storage] localStorage is not available");
        return;
      }
      
      try {
        const prefixedKey = STORAGE_PREFIX + key;
        const serialized = JSON.stringify(value);
        
        if (shouldObfuscate) {
          const obfuscated = obfuscate(serialized);
          localStorage.setItem(prefixedKey, obfuscated);
        } else {
          localStorage.setItem(prefixedKey, serialized);
        }
        
        // Dispatch custom event for same-tab listeners
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: prefixedKey,
            newValue: shouldObfuscate ? obfuscate(serialized) : serialized,
          })
        );
      } catch (error) {
        console.error(`[Storage] Failed to set item "${key}":`, error);
        
        // Handle quota exceeded
        if (error instanceof Error && error.name === "QuotaExceededError") {
          console.warn("[Storage] Quota exceeded, attempting cleanup");
          cleanupStorage();
        }
      }
    },

    getItem<T>(key: string, obfuscated = true): T | null {
      if (!isStorageAvailable()) {
        console.warn("[Storage] localStorage is not available");
        return null;
      }
      
      try {
        const prefixedKey = STORAGE_PREFIX + key;
        const item = localStorage.getItem(prefixedKey);
        
        if (item === null) return null;
        
        let deserialized: string;
        
        if (obfuscated && isObfuscated(item)) {
          try {
            deserialized = deobfuscate(item);
          } catch {
            // If deobfuscation fails, assume it's not obfuscated
            deserialized = item;
          }
        } else {
          deserialized = item;
        }
        
        return JSON.parse(deserialized) as T;
      } catch (error) {
        console.error(`[Storage] Failed to get item "${key}":`, error);
        return null;
      }
    },

    removeItem(key: string): void {
      if (!isStorageAvailable()) {
        console.warn("[Storage] localStorage is not available");
        return;
      }
      
      try {
        const prefixedKey = STORAGE_PREFIX + key;
        localStorage.removeItem(prefixedKey);
        
        // Dispatch custom event for same-tab listeners
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: prefixedKey,
            newValue: null,
          })
        );
      } catch (error) {
        console.error(`[Storage] Failed to remove item "${key}":`, error);
      }
    },

    clear(): void {
      if (!isStorageAvailable()) {
        console.warn("[Storage] localStorage is not available");
        return;
      }
      
      try {
        // Only clear items with our prefix
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          
          // Dispatch custom event
          window.dispatchEvent(
            new StorageEvent("storage", {
              key,
              newValue: null,
            })
          );
        });
      } catch (error) {
        console.error("[Storage] Failed to clear storage:", error);
      }
    },

    keys(): string[] {
      if (!isStorageAvailable()) {
        console.warn("[Storage] localStorage is not available");
        return [];
      }
      
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keys.push(key.replace(STORAGE_PREFIX, ""));
        }
      }
      
      return keys;
    },

    hasItem(key: string): boolean {
      if (!isStorageAvailable()) return false;
      
      return localStorage.getItem(STORAGE_PREFIX + key) !== null;
    },
  };
}

// Cleanup old/unnecessary storage items
function cleanupStorage(): void {
  if (!isStorageAvailable()) return;
  
  try {
    // Remove known temporary/cache keys
    const tempKeys = ["cache_", "temp_", "draft_"];
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const shortKey = key.replace(STORAGE_PREFIX, "");
        if (tempKeys.some((prefix) => shortKey.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error("[Storage] Cleanup failed:", error);
  }
}

// Session storage wrapper (for sensitive data that shouldn't persist)
const sessionStorageWrapper: SecureStorage = {
  setItem(key: string, value: unknown, shouldEncrypt = true): void {
    if (typeof window === "undefined") return;
    
    try {
      const serialized = JSON.stringify(value);
      const storedValue = shouldEncrypt ? encrypt(serialized) : serialized;
      sessionStorage.setItem(STORAGE_PREFIX + key, storedValue);
    } catch (error) {
      console.error(`[SessionStorage] Failed to set item "${key}":`, error);
    }
  },

  getItem<T>(key: string, encrypted = true): T | null {
    if (typeof window === "undefined") return null;
    
    try {
      const item = sessionStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return null;
      
      let deserialized: string;
      
      if (encrypted && isEncrypted(item)) {
        try {
          deserialized = decrypt(item);
        } catch {
          deserialized = item;
        }
      } else {
        deserialized = item;
      }
      
      return JSON.parse(deserialized) as T;
    } catch (error) {
      console.error(`[SessionStorage] Failed to get item "${key}":`, error);
      return null;
    }
  },

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error(`[SessionStorage] Failed to remove item "${key}":`, error);
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch (error) {
      console.error("[SessionStorage] Failed to clear:", error);
    }
  },

  keys(): string[] {
    if (typeof window === "undefined") return [];
    
    const keys: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ""));
      }
    }
    
    return keys;
  },

  hasItem(key: string): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_PREFIX + key) !== null;
  },
};

// Export storage instances
export const secureStorage = createSecureStorage();
export const secureSessionStorage = sessionStorageWrapper;

// Utility to migrate existing unencrypted data
export function migrateStorage(): void {
  if (!isStorageAvailable()) return;
  
  try {
    const keysToMigrate = ["user", "settings", "preferences"];
    
    keysToMigrate.forEach((key) => {
      const prefixedKey = STORAGE_PREFIX + key;
      const item = localStorage.getItem(prefixedKey);
      
      if (item && !isEncrypted(item)) {
        try {
          // Re-save with encryption
          const value = JSON.parse(item);
          secureStorage.setItem(key, value, true);
          console.info(`[Storage] Migrated "${key}" to encrypted storage`);
        } catch {
          // If it's not valid JSON, leave it as-is
        }
      }
    });
  } catch (error) {
    console.error("[Storage] Migration failed:", error);
  }
}

// Export type and utilities
export type { StorageEventHandler };
export { isStorageAvailable, setupStorageListener, cleanupStorage };
export default secureStorage;
