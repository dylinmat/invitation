/**
 * Session Management
 * Tracks session expiry, warns before expiry, and auto-extends on activity
 */

import { getToken, clearAuth, isTokenExpired, getTokenExpiry, parseJwt } from "./auth";
import { secureStorage } from "./storage";

// Session configuration
const SESSION_CONFIG = {
  // Warn 5 minutes before expiry
  WARNING_THRESHOLD_MS: 5 * 60 * 1000,
  // Check session status every minute
  CHECK_INTERVAL_MS: 60 * 1000,
  // Extend session on activity (if expiry is within this threshold)
  EXTEND_THRESHOLD_MS: 10 * 60 * 1000,
  // Inactivity timeout (30 minutes)
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
  // Session key for storage
  SESSION_KEY: "session_data",
};

// Session state
interface SessionState {
  lastActivity: number;
  warningShown: boolean;
  expiryWarnedAt: number | null;
}

// Session event types
type SessionEventType = 
  | "expiryWarning"
  | "expired"
  | "extended"
  | "activityDetected"
  | "logout";

type SessionEventHandler = (data?: unknown) => void;

// Event handlers registry
const eventHandlers: Map<SessionEventType, Set<SessionEventHandler>> = new Map();

// Register event handler
export function onSessionEvent(
  event: SessionEventType,
  handler: SessionEventHandler
): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  eventHandlers.get(event)!.add(handler);
  
  return () => {
    eventHandlers.get(event)?.delete(handler);
  };
}

// Emit session event
function emitSessionEvent(event: SessionEventType, data?: unknown): void {
  eventHandlers.get(event)?.forEach((handler) => {
    try {
      handler(data);
    } catch (error) {
      console.error(`[Session] Error in ${event} handler:`, error);
    }
  });
}

// Get current session state
function getSessionState(): SessionState {
  return secureStorage.getItem<SessionState>(SESSION_CONFIG.SESSION_KEY) || {
    lastActivity: Date.now(),
    warningShown: false,
    expiryWarnedAt: null,
  };
}

// Save session state
function saveSessionState(state: SessionState): void {
  secureStorage.setItem(SESSION_CONFIG.SESSION_KEY, state, true);
}

// Update last activity timestamp
export function updateActivity(): void {
  const state = getSessionState();
  state.lastActivity = Date.now();
  saveSessionState(state);
  
  emitSessionEvent("activityDetected");
  
  // Check if we should auto-extend
  maybeExtendSession();
}

// Check if we should auto-extend the session
function maybeExtendSession(): void {
  const token = getToken();
  if (!token) return;
  
  const expiry = getTokenExpiry(token);
  if (!expiry) return;
  
  const timeUntilExpiry = expiry.getTime() - Date.now();
  
  // If expiry is within threshold, we could trigger a token refresh
  // This depends on your backend implementation
  if (timeUntilExpiry < SESSION_CONFIG.EXTEND_THRESHOLD_MS && timeUntilExpiry > 0) {
    console.info("[Session] Session nearing expiry, could trigger refresh");
    emitSessionEvent("extended", { timeUntilExpiry });
  }
}

// Check session status and handle expiry
function checkSession(): void {
  const token = getToken();
  if (!token) return;
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    console.warn("[Session] Session expired");
    emitSessionEvent("expired");
    forceLogout("Session expired");
    return;
  }
  
  // Check for inactivity timeout
  const state = getSessionState();
  const inactiveTime = Date.now() - state.lastActivity;
  
  if (inactiveTime > SESSION_CONFIG.INACTIVITY_TIMEOUT_MS) {
    console.warn("[Session] Inactivity timeout");
    forceLogout("Inactivity timeout");
    return;
  }
  
  // Check if we should show warning
  const expiry = getTokenExpiry(token);
  if (expiry) {
    const timeUntilExpiry = expiry.getTime() - Date.now();
    
    if (
      timeUntilExpiry < SESSION_CONFIG.WARNING_THRESHOLD_MS &&
      timeUntilExpiry > 0 &&
      !state.warningShown
    ) {
      state.warningShown = true;
      state.expiryWarnedAt = Date.now();
      saveSessionState(state);
      
      console.warn(`[Session] Expiry warning: ${Math.floor(timeUntilExpiry / 1000)}s remaining`);
      emitSessionEvent("expiryWarning", {
        timeUntilExpiry,
        expiryTime: expiry,
      });
    }
  }
}

// Force logout
export function forceLogout(reason: string = "session_ended"): void {
  clearAuth();
  secureStorage.removeItem(SESSION_CONFIG.SESSION_KEY);
  emitSessionEvent("logout", { reason });
  
  if (typeof window !== "undefined") {
    window.location.href = `/auth/login?error=${reason}`;
  }
}

// Reset warning state (call after extending session)
export function resetWarningState(): void {
  const state = getSessionState();
  state.warningShown = false;
  state.expiryWarnedAt = null;
  saveSessionState(state);
}

// Get session info for display
export interface SessionInfo {
  isValid: boolean;
  expiresAt: Date | null;
  timeUntilExpiry: number | null;
  lastActivity: Date | null;
  inactiveTime: number;
  warningShown: boolean;
}

export function getSessionInfo(): SessionInfo {
  const token = getToken();
  const state = getSessionState();
  
  if (!token) {
    return {
      isValid: false,
      expiresAt: null,
      timeUntilExpiry: null,
      lastActivity: state.lastActivity ? new Date(state.lastActivity) : null,
      inactiveTime: Date.now() - state.lastActivity,
      warningShown: state.warningShown,
    };
  }
  
  const expiry = getTokenExpiry(token);
  const timeUntilExpiry = expiry ? expiry.getTime() - Date.now() : null;
  
  return {
    isValid: !isTokenExpired(token),
    expiresAt: expiry,
    timeUntilExpiry,
    lastActivity: new Date(state.lastActivity),
    inactiveTime: Date.now() - state.lastActivity,
    warningShown: state.warningShown,
  };
}

// Format time remaining for display
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  
  return `${minutes}m ${seconds}s`;
}

// Activity tracking interval
let checkInterval: NodeJS.Timeout | null = null;

// Start session monitoring
export function startSessionMonitoring(): () => void {
  if (typeof window === "undefined") return () => {};
  
  // Update activity on user interaction
  const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
  
  const handleActivity = () => {
    updateActivity();
  };
  
  activityEvents.forEach((event) => {
    document.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Start check interval
  checkInterval = setInterval(checkSession, SESSION_CONFIG.CHECK_INTERVAL_MS);
  
  // Initial check
  checkSession();
  
  // Return cleanup function
  return () => {
    activityEvents.forEach((event) => {
      document.removeEventListener(event, handleActivity);
    });
    
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };
}

// Stop session monitoring
export function stopSessionMonitoring(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// Hook for React components (returns session info and controls)
export function useSessionManager() {
  return {
    getInfo: getSessionInfo,
    updateActivity,
    forceLogout,
    resetWarningState,
    formatTimeRemaining,
    onSessionEvent,
    startMonitoring: startSessionMonitoring,
    stopMonitoring: stopSessionMonitoring,
  };
}

// React hook for session status
export function createSessionHooks() {
  // This would be used in React components
  // Implementation depends on your React setup
  return {
    useSessionInfo: getSessionInfo,
    useSessionEvents: onSessionEvent,
  };
}

// Export configuration for customization
export function configureSession(config: Partial<typeof SESSION_CONFIG>): void {
  Object.assign(SESSION_CONFIG, config);
}

// Initialize session on page load
export function initializeSession(): void {
  const token = getToken();
  if (token) {
    // Validate token and reset state
    if (isTokenExpired(token)) {
      forceLogout("session_expired");
      return;
    }
    
    // Reset warning state on fresh load
    resetWarningState();
    
    // Update activity
    updateActivity();
    
    console.info("[Session] Session initialized");
  }
}

// Default export
export default {
  startSessionMonitoring,
  stopSessionMonitoring,
  updateActivity,
  forceLogout,
  getSessionInfo,
  formatTimeRemaining,
  onSessionEvent,
  initializeSession,
  resetWarningState,
  useSessionManager,
};
