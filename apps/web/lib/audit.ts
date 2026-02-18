/**
 * Audit Log Service - Enterprise-grade audit logging
 * Features:
 * - Event batching for performance
 * - Offline queue with localStorage persistence
 * - Automatic retry with exponential backoff
 * - Real-time sync via WebSocket
 * - Comprehensive event tracking
 */

import { api } from './api';
import { getStoredUser } from './auth';
import { secureStorage } from './storage';
import { generateId } from './utils';
import {
  AuditEvent,
  AuditEventInput,
  AuditActor,
  AuditAction,
  AuditResourceType,
  AuditSeverity,
  AuditStatus,
  AuditConfig,
  AuditChange,
  DEFAULT_AUDIT_CONFIG,
} from '@/types/audit';

// ============================================================================
// State Management
// ============================================================================

interface AuditQueueState {
  queue: AuditEvent[];
  isProcessing: boolean;
  retryCount: number;
  lastSync: string | null;
}

const state: AuditQueueState = {
  queue: [],
  isProcessing: false,
  retryCount: 0,
  lastSync: null,
};

let config: AuditConfig = { ...DEFAULT_AUDIT_CONFIG };
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let wsConnection: WebSocket | null = null;

// ============================================================================
// Event Listeners
// ============================================================================

type AuditEventListener = (event: AuditEvent) => void;
const listeners: Set<AuditEventListener> = new Set();

export function onAuditEvent(listener: AuditEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(event: AuditEvent): void {
  listeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('[Audit] Error in event listener:', error);
    }
  });
}

// ============================================================================
// Actor Detection
// ============================================================================

function getCurrentActor(): AuditActor {
  const user = getStoredUser();
  const sessionId = typeof window !== 'undefined' 
    ? secureStorage.getItem('session_id') || undefined 
    : undefined;
  
  if (user) {
    return {
      id: user.id,
      type: 'user',
      email: user.email,
      name: user.name || undefined,
      ip: undefined, // Set by server
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      sessionId,
    };
  }
  
  // System/Anonymous actor
  return {
    id: 'system',
    type: 'system',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
}

// ============================================================================
// Severity Auto-detection
// ============================================================================

function autoDetectSeverity(action: AuditAction, status: AuditStatus): AuditSeverity {
  // Critical events
  if (['login_failed', 'permission_denied', 'system_error'].includes(action)) {
    return status === 'failure' ? 'critical' : 'high';
  }
  
  // High severity events
  if (['delete', 'bulk_delete', 'permission_revoke', 'role_remove'].includes(action)) {
    return 'high';
  }
  
  // Auth events
  if (['login', 'logout', 'password_change', 'password_reset'].includes(action)) {
    return 'medium';
  }
  
  // Data export/import
  if (['export', 'import', 'download', 'backup', 'restore'].includes(action)) {
    return 'medium';
  }
  
  // Permission changes
  if (action.includes('permission') || action.includes('role')) {
    return 'medium';
  }
  
  // Default
  return 'info';
}

// ============================================================================
// Event Creation
// ============================================================================

export function createAuditEvent(input: AuditEventInput): AuditEvent {
  const actor = getCurrentActor();
  const status = input.status || 'success';
  const severity = input.severity || autoDetectSeverity(input.action, status);
  
  const event: AuditEvent = {
    id: generateId(32),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    actor,
    projectId: input.projectId,
    organizationId: input.organizationId,
    changes: input.changes,
    metadata: {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...input.metadata,
    },
    severity,
    status,
    error: input.error,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    clientTimestamp: new Date().toISOString(),
    offlineQueued: !navigator.onLine,
  };
  
  return event;
}

// ============================================================================
// Queue Management
// ============================================================================

function loadQueueFromStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = secureStorage.getItem(config.localStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as AuditEvent[];
      state.queue = parsed.filter(e => e && e.id); // Validate entries
    }
  } catch (error) {
    console.error('[Audit] Failed to load queue from storage:', error);
    state.queue = [];
  }
}

function saveQueueToStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep only the most recent events to prevent storage overflow
    const eventsToStore = state.queue.slice(-config.maxOfflineEvents);
    secureStorage.setItem(config.localStorageKey, JSON.stringify(eventsToStore));
  } catch (error) {
    console.error('[Audit] Failed to save queue to storage:', error);
  }
}

function addToQueue(event: AuditEvent): void {
  // Prevent queue overflow
  if (state.queue.length >= config.maxQueueSize) {
    console.warn('[Audit] Queue full, removing oldest events');
    state.queue = state.queue.slice(-Math.floor(config.maxQueueSize / 2));
  }
  
  state.queue.push(event);
  saveQueueToStorage();
  
  // Notify listeners immediately for real-time updates
  notifyListeners(event);
  
  // Schedule batch processing
  scheduleBatchProcessing();
}

// ============================================================================
// Batch Processing
// ============================================================================

function scheduleBatchProcessing(): void {
  if (batchTimer) return; // Already scheduled
  
  if (state.queue.length >= config.batchSize) {
    // Process immediately if batch is full
    processBatch();
  } else {
    // Schedule processing
    batchTimer = setTimeout(() => {
      batchTimer = null;
      processBatch();
    }, config.batchIntervalMs);
  }
}

async function processBatch(): Promise<void> {
  if (state.isProcessing || state.queue.length === 0) return;
  if (!navigator.onLine) {
    console.log('[Audit] Offline, deferring batch processing');
    return;
  }
  
  state.isProcessing = true;
  
  // Take events from queue
  const batchSize = Math.min(config.batchSize, state.queue.length);
  const batch = state.queue.slice(0, batchSize);
  
  try {
    await sendEventsToServer(batch);
    
    // Remove successfully sent events
    state.queue = state.queue.slice(batchSize);
    saveQueueToStorage();
    
    state.retryCount = 0;
    state.lastSync = new Date().toISOString();
    
    // Continue processing if more events exist
    if (state.queue.length > 0) {
      scheduleBatchProcessing();
    }
  } catch (error) {
    console.error('[Audit] Failed to send batch:', error);
    handleSendError(batch);
  } finally {
    state.isProcessing = false;
  }
}

async function sendEventsToServer(events: AuditEvent[]): Promise<void> {
  await api.post('/audit/events', { events });
}

function handleSendError(events: AuditEvent[]): void {
  state.retryCount++;
  
  if (state.retryCount >= config.maxRetries) {
    console.error('[Audit] Max retries reached, events remain in queue');
    // Mark events as offline queued
    events.forEach(e => {
      e.offlineQueued = true;
    });
    saveQueueToStorage();
    state.retryCount = 0;
    return;
  }
  
  // Exponential backoff retry
  const delay = config.retryDelayMs * Math.pow(2, state.retryCount - 1);
  setTimeout(() => {
    processBatch();
  }, delay);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log an audit event
 */
export function logAudit(input: AuditEventInput): AuditEvent {
  if (!config.enabled) {
    console.log('[Audit] Logging disabled, event not recorded');
    return createAuditEvent(input); // Still create but don't queue
  }
  
  const event = createAuditEvent(input);
  addToQueue(event);
  
  // Also send high severity events immediately
  if (event.severity === 'critical' || event.severity === 'high') {
    sendImmediate(event);
  }
  
  return event;
}

/**
 * Send an event immediately (bypass batching)
 */
async function sendImmediate(event: AuditEvent): Promise<void> {
  if (!navigator.onLine) return;
  
  try {
    await api.post('/audit/events', { events: [event] });
  } catch (error) {
    console.error('[Audit] Failed to send immediate event:', error);
  }
}

/**
 * Log with automatic change detection for updates
 */
export function logAuditUpdate<T extends Record<string, unknown>>(
  resourceType: AuditResourceType,
  resourceId: string,
  oldData: T,
  newData: T,
  options: Omit<AuditEventInput, 'action' | 'resourceType' | 'resourceId' | 'changes'> = {}
): AuditEvent {
  const changes: AuditChange[] = [];
  
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  allKeys.forEach(key => {
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  });
  
  return logAudit({
    action: 'update',
    resourceType,
    resourceId,
    changes,
    ...options,
  });
}

/**
 * Convenience methods for common operations
 */
export const auditLogger = {
  create: (resourceType: AuditResourceType, resourceId: string, resourceName?: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'create', resourceType, resourceId, resourceName, metadata }),
  
  read: (resourceType: AuditResourceType, resourceId: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'read', resourceType, resourceId, metadata }),
  
  update: (resourceType: AuditResourceType, resourceId: string, resourceName?: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'update', resourceType, resourceId, resourceName, metadata }),
  
  delete: (resourceType: AuditResourceType, resourceId: string, resourceName?: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'delete', resourceType, resourceId, resourceName, metadata, severity: 'high' }),
  
  list: (resourceType: AuditResourceType, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'list', resourceType, metadata }),
  
  search: (resourceType: AuditResourceType, query: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'search', resourceType, metadata: { query, ...metadata } }),
  
  bulkCreate: (resourceType: AuditResourceType, count: number, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'bulk_create', resourceType, metadata: { count, ...metadata } }),
  
  bulkUpdate: (resourceType: AuditResourceType, ids: string[], metadata?: Record<string, unknown>) =>
    logAudit({ action: 'bulk_update', resourceType, metadata: { ids, count: ids.length, ...metadata } }),
  
  bulkDelete: (resourceType: AuditResourceType, ids: string[], metadata?: Record<string, unknown>) =>
    logAudit({ action: 'bulk_delete', resourceType, metadata: { ids, count: ids.length, ...metadata }, severity: 'high' }),
  
  login: (metadata?: Record<string, unknown>) =>
    logAudit({ action: 'login', resourceType: 'user', metadata }),
  
  logout: (metadata?: Record<string, unknown>) =>
    logAudit({ action: 'logout', resourceType: 'user', metadata }),
  
  loginFailed: (email: string, reason: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'login_failed', resourceType: 'user', metadata: { email, reason, ...metadata }, status: 'failure' }),
  
  export: (resourceType: AuditResourceType, format: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'export', resourceType, metadata: { format, ...metadata }, severity: 'medium' }),
  
  import: (resourceType: AuditResourceType, count: number, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'import', resourceType, metadata: { count, ...metadata } }),
  
  permissionDenied: (resourceType: AuditResourceType, action: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'permission_denied', resourceType, metadata: { attemptedAction: action, ...metadata }, severity: 'high', status: 'failure' }),
  
  permissionChange: (action: 'permission_grant' | 'permission_revoke', resourceType: AuditResourceType, resourceId: string, userId: string, metadata?: Record<string, unknown>) =>
    logAudit({ action, resourceType, resourceId, metadata: { targetUserId: userId, ...metadata }, severity: 'medium' }),
  
  publish: (resourceType: AuditResourceType, resourceId: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'publish', resourceType, resourceId, metadata }),
  
  unpublish: (resourceType: AuditResourceType, resourceId: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'unpublish', resourceType, resourceId, metadata }),
  
  error: (resourceType: AuditResourceType, error: Error, metadata?: Record<string, unknown>) =>
    logAudit({ 
      action: 'system_error', 
      resourceType, 
      metadata: { errorMessage: error.message, errorStack: error.stack, ...metadata },
      severity: 'high',
      status: 'failure',
    }),
};

// ============================================================================
// Configuration
// ============================================================================

export function configureAudit(newConfig: Partial<AuditConfig>): void {
  config = { ...config, ...newConfig };
}

export function getAuditConfig(): AuditConfig {
  return { ...config };
}

// ============================================================================
// WebSocket Integration
// ============================================================================

export function connectAuditWebSocket(url: string): WebSocket | null {
  if (typeof window === 'undefined') return null;
  if (wsConnection?.readyState === WebSocket.OPEN) return wsConnection;
  
  try {
    wsConnection = new WebSocket(url);
    
    wsConnection.onopen = () => {
      console.log('[Audit] WebSocket connected');
      // Process any queued events immediately
      processBatch();
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'audit_event') {
          notifyListeners(data.event);
        }
      } catch (error) {
        console.error('[Audit] Failed to parse WebSocket message:', error);
      }
    };
    
    wsConnection.onclose = () => {
      console.log('[Audit] WebSocket disconnected');
      wsConnection = null;
    };
    
    wsConnection.onerror = (error) => {
      console.error('[Audit] WebSocket error:', error);
    };
    
    return wsConnection;
  } catch (error) {
    console.error('[Audit] Failed to connect WebSocket:', error);
    return null;
  }
}

export function disconnectAuditWebSocket(): void {
  wsConnection?.close();
  wsConnection = null;
}

// ============================================================================
// Queue Management API
// ============================================================================

export function getQueueStatus(): {
  queued: number;
  isProcessing: boolean;
  lastSync: string | null;
  retryCount: number;
} {
  return {
    queued: state.queue.length,
    isProcessing: state.isProcessing,
    lastSync: state.lastSync,
    retryCount: state.retryCount,
  };
}

export async function flushAuditQueue(): Promise<void> {
  if (state.queue.length === 0) return;
  
  while (state.queue.length > 0 && navigator.onLine) {
    await processBatch();
  }
}

export function clearAuditQueue(): void {
  state.queue = [];
  saveQueueToStorage();
}

// ============================================================================
// Initialization
// ============================================================================

export function initAuditService(): void {
  if (typeof window === 'undefined') return;
  
  loadQueueFromStorage();
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('[Audit] Back online, processing queue');
    processBatch();
  });
  
  // Flush queue before page unload
  window.addEventListener('beforeunload', () => {
    if (state.queue.length > 0) {
      // Try to send remaining events synchronously
      const events = state.queue.slice(0, config.batchSize);
      const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
      navigator.sendBeacon?.(`${process.env.NEXT_PUBLIC_API_URL}/audit/events`, blob);
    }
  });
  
  // Process any existing queue on init
  if (navigator.onLine && state.queue.length > 0) {
    processBatch();
  }
  
  console.log('[Audit] Service initialized, queue:', state.queue.length);
}

// Auto-initialize on client
if (typeof window !== 'undefined') {
  initAuditService();
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  log: logAudit,
  logUpdate: logAuditUpdate,
  logger: auditLogger,
  configure: configureAudit,
  getConfig: getAuditConfig,
  onEvent: onAuditEvent,
  connectWebSocket: connectAuditWebSocket,
  disconnectWebSocket: disconnectAuditWebSocket,
  getQueueStatus,
  flushQueue: flushAuditQueue,
  clearQueue: clearAuditQueue,
  init: initAuditService,
};
