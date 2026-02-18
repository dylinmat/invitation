/**
 * Audit Log API Client
 * Server-side audit log operations
 */

import { api } from './api';
import {
  AuditEvent,
  AuditLogFilters,
  AuditLogQueryOptions,
  AuditLogResponse,
  AuditAction,
  AuditResourceType,
  AuditSeverity,
  AuditStatus,
} from '@/types/audit';

// ============================================================================
// Audit Log API
// ============================================================================

export const auditApi = {
  /**
   * Query audit logs with filters
   */
  query: (options: AuditLogQueryOptions = {}) =>
    api.post<AuditLogResponse>('/audit/query', options),

  /**
   * Get audit event by ID
   */
  getById: (id: string) =>
    api.get<AuditEvent>(`/audit/events/${id}`),

  /**
   * Get events for a specific resource
   */
  getResourceHistory: (resourceType: AuditResourceType, resourceId: string) =>
    api.get<AuditEvent[]>(`/audit/resources/${resourceType}/${resourceId}`),

  /**
   * Get user activity
   */
  getUserActivity: (userId: string, options?: AuditLogQueryOptions) =>
    api.post<AuditLogResponse>(`/audit/users/${userId}/activity`, options),

  /**
   * Get project activity
   */
  getProjectActivity: (projectId: string, options?: AuditLogQueryOptions) =>
    api.post<AuditLogResponse>(`/audit/projects/${projectId}/activity`, options),

  /**
   * Export audit logs
   */
  export: (filters: AuditLogFilters, format: 'csv' | 'json' = 'csv') =>
    api.post<{ downloadUrl: string; expiresAt: string }>('/audit/export', {
      filters,
      format,
    }),

  /**
   * Get audit statistics
   */
  getStats: (params?: { from?: string; to?: string }) =>
    api.get<{
      totalEvents: number;
      byAction: Record<AuditAction, number>;
      byResourceType: Record<AuditResourceType, number>;
      bySeverity: Record<AuditSeverity, number>;
      byStatus: Record<AuditStatus, number>;
      trend: { date: string; count: number }[];
    }>('/audit/stats', params),

  /**
   * Get retention policy
   */
  getRetentionPolicy: () =>
    api.get<{
      retentionDays: number;
      archiveEnabled: boolean;
      archiveAfterDays: number;
    }>('/audit/retention'),

  /**
   * Update retention policy
   */
  updateRetentionPolicy: (policy: {
    retentionDays: number;
    archiveEnabled: boolean;
    archiveAfterDays: number;
  }) =>
    api.put('/audit/retention', policy),
};

// ============================================================================
// Real-time Audit Events
// ============================================================================

export type AuditEventHandler = (event: AuditEvent) => void;

export class AuditEventStream {
  private ws: WebSocket | null = null;
  private handlers: Set<AuditEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;

  constructor(url?: string) {
    this.url = url || `${process.env.NEXT_PUBLIC_REALTIME_URL?.replace('ws:', 'wss:') || 'wss://localhost:3001'}/audit`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[AuditStream] Connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audit_event') {
            this.handlers.forEach(handler => {
              try {
                handler(data.event);
              } catch (error) {
                console.error('[AuditStream] Handler error:', error);
              }
            });
          }
        } catch (error) {
          console.error('[AuditStream] Parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[AuditStream] Disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[AuditStream] Error:', error);
      };
    } catch (error) {
      console.error('[AuditStream] Connection failed:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[AuditStream] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`[AuditStream] Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  subscribe(handler: AuditEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default auditApi;
