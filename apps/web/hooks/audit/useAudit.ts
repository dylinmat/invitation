/**
 * Audit Log Hooks
 * React hooks for audit log operations
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { auditApi, AuditEventStream } from '@/lib/audit-api';
import { auditLogger, logAudit, createAuditEvent, onAuditEvent, getQueueStatus, flushAuditQueue } from '@/lib/audit';
import {
  AuditEvent,
  AuditEventInput,
  AuditLogFilters,
  AuditLogQueryOptions,
  AuditLogResponse,
  AuditAction,
  AuditResourceType,
} from '@/types/audit';
import { ApiError } from '@/lib/api';

// ============================================================================
// Query Keys
// ============================================================================

export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: AuditLogQueryOptions) => [...auditKeys.lists(), filters] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
  stats: () => [...auditKeys.all, 'stats'] as const,
  resource: (type: AuditResourceType, id: string) => [...auditKeys.all, 'resource', type, id] as const,
  user: (userId: string) => [...auditKeys.all, 'user', userId] as const,
  project: (projectId: string) => [...auditKeys.all, 'project', projectId] as const,
};

// ============================================================================
// useAuditLogs - Query audit logs with filters
// ============================================================================

export function useAuditLogs(
  options: AuditLogQueryOptions = {},
  queryOptions?: Omit<UseQueryOptions<AuditLogResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AuditLogResponse, ApiError>({
    queryKey: auditKeys.list(options),
    queryFn: () => auditApi.query(options),
    staleTime: 30 * 1000, // 30 seconds
    ...queryOptions,
  });
}

// ============================================================================
// useAuditEvent - Get single audit event
// ============================================================================

export function useAuditEvent(
  id: string,
  queryOptions?: Omit<UseQueryOptions<AuditEvent, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AuditEvent, ApiError>({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditApi.getById(id),
    enabled: !!id,
    ...queryOptions,
  });
}

// ============================================================================
// useResourceHistory - Get audit history for a resource
// ============================================================================

export function useResourceHistory(
  resourceType: AuditResourceType,
  resourceId: string,
  queryOptions?: Omit<UseQueryOptions<AuditEvent[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AuditEvent[], ApiError>({
    queryKey: auditKeys.resource(resourceType, resourceId),
    queryFn: () => auditApi.getResourceHistory(resourceType, resourceId),
    enabled: !!resourceId,
    ...queryOptions,
  });
}

// ============================================================================
// useUserActivity - Get user activity
// ============================================================================

export function useUserActivity(
  userId: string,
  options: AuditLogQueryOptions = {},
  queryOptions?: Omit<UseQueryOptions<AuditLogResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AuditLogResponse, ApiError>({
    queryKey: [...auditKeys.user(userId), options],
    queryFn: () => auditApi.getUserActivity(userId, options),
    enabled: !!userId,
    ...queryOptions,
  });
}

// ============================================================================
// useProjectActivity - Get project activity
// ============================================================================

export function useProjectActivity(
  projectId: string,
  options: AuditLogQueryOptions = {},
  queryOptions?: Omit<UseQueryOptions<AuditLogResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AuditLogResponse, ApiError>({
    queryKey: [...auditKeys.project(projectId), options],
    queryFn: () => auditApi.getProjectActivity(projectId, options),
    enabled: !!projectId,
    ...queryOptions,
  });
}

// ============================================================================
// useAuditStats - Get audit statistics
// ============================================================================

export function useAuditStats(
  params?: { from?: string; to?: string },
  queryOptions?: Omit<UseQueryOptions<{
    totalEvents: number;
    byAction: Record<AuditAction, number>;
    byResourceType: Record<AuditResourceType, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    trend: { date: string; count: number }[];
  }, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...auditKeys.stats(), params],
    queryFn: () => auditApi.getStats(params),
    staleTime: 60 * 1000, // 1 minute
    ...queryOptions,
  });
}

// ============================================================================
// useExportAuditLogs - Export audit logs
// ============================================================================

export function useExportAuditLogs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ filters, format }: { filters: AuditLogFilters; format?: 'csv' | 'json' }) =>
      auditApi.export(filters, format),
    onSuccess: () => {
      // Log the export action
      auditLogger.export('audit_log', 'csv');
    },
  });
}

// ============================================================================
// useLogAudit - Hook for logging audit events
// ============================================================================

export function useLogAudit() {
  const queryClient = useQueryClient();

  const log = useCallback((input: AuditEventInput) => {
    const event = logAudit(input);
    
    // Optimistically update relevant queries
    if (input.projectId) {
      queryClient.invalidateQueries({ queryKey: auditKeys.project(input.projectId) });
    }
    
    return event;
  }, [queryClient]);

  const logCreate = useCallback((
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    metadata?: Record<string, unknown>
  ) => {
    return log({
      action: 'create',
      resourceType,
      resourceId,
      resourceName,
      metadata,
    });
  }, [log]);

  const logUpdate = useCallback((
    resourceType: AuditResourceType,
    resourceId: string,
    changes?: { field: string; oldValue: unknown; newValue: unknown }[],
    resourceName?: string,
    metadata?: Record<string, unknown>
  ) => {
    return log({
      action: 'update',
      resourceType,
      resourceId,
      resourceName,
      changes,
      metadata,
    });
  }, [log]);

  const logDelete = useCallback((
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    metadata?: Record<string, unknown>
  ) => {
    return log({
      action: 'delete',
      resourceType,
      resourceId,
      resourceName,
      metadata,
      severity: 'high',
    });
  }, [log]);

  const logRead = useCallback((
    resourceType: AuditResourceType,
    resourceId: string,
    metadata?: Record<string, unknown>
  ) => {
    return log({
      action: 'read',
      resourceType,
      resourceId,
      metadata,
    });
  }, [log]);

  const logLogin = useCallback((metadata?: Record<string, unknown>) => {
    return log({
      action: 'login',
      resourceType: 'user',
      metadata,
    });
  }, [log]);

  const logLogout = useCallback((metadata?: Record<string, unknown>) => {
    return log({
      action: 'logout',
      resourceType: 'user',
      metadata,
    });
  }, [log]);

  const logPermissionChange = useCallback((
    action: 'permission_grant' | 'permission_revoke',
    resourceType: AuditResourceType,
    resourceId: string,
    targetUserId: string,
    metadata?: Record<string, unknown>
  ) => {
    return log({
      action,
      resourceType,
      resourceId,
      metadata: { targetUserId, ...metadata },
      severity: 'medium',
    });
  }, [log]);

  return {
    log,
    logCreate,
    logUpdate,
    logDelete,
    logRead,
    logLogin,
    logLogout,
    logPermissionChange,
    logger: auditLogger,
  };
}

// ============================================================================
// useRealtimeAudit - Subscribe to real-time audit events
// ============================================================================

export function useRealtimeAudit(
  options: {
    onEvent?: (event: AuditEvent) => void;
    filter?: {
      actions?: AuditAction[];
      resourceTypes?: AuditResourceType[];
      severities?: string[];
    };
  } = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AuditEvent | null>(null);
  const streamRef = useRef<AuditEventStream | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stream = new AuditEventStream();
    streamRef.current = stream;

    // Subscribe to events
    const unsubscribe = stream.subscribe((event) => {
      // Apply filters
      if (options.filter) {
        if (options.filter.actions && !options.filter.actions.includes(event.action)) {
          return;
        }
        if (options.filter.resourceTypes && !options.filter.resourceTypes.includes(event.resourceType)) {
          return;
        }
        if (options.filter.severities && !options.filter.severities.includes(event.severity)) {
          return;
        }
      }

      setLastEvent(event);
      options.onEvent?.(event);
    });

    // Connect with connection status tracking
    const originalOnOpen = (stream as unknown as { ws: WebSocket | null }).ws?.onopen;
    stream.connect();
    setIsConnected(true);

    return () => {
      unsubscribe();
      stream.disconnect();
      setIsConnected(false);
    };
  }, [options.onEvent, options.filter?.actions?.join(','), options.filter?.resourceTypes?.join(','), options.filter?.severities?.join(',')]);

  return {
    isConnected,
    lastEvent,
  };
}

// ============================================================================
// useAuditQueue - Monitor and manage audit queue
// ============================================================================

export function useAuditQueue() {
  const [status, setStatus] = useState(getQueueStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const flush = useCallback(async () => {
    await flushAuditQueue();
    setStatus(getQueueStatus());
  }, []);

  return {
    ...status,
    flush,
  };
}

// ============================================================================
// useAuditActivity - Track recent activity
// ============================================================================

export function useAuditActivity(
  options: {
    maxEvents?: number;
    filter?: (event: AuditEvent) => boolean;
  } = {}
) {
  const { maxEvents = 50 } = options;
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const unsubscribe = onAuditEvent((event) => {
      if (options.filter && !options.filter(event)) {
        return;
      }

      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        return newEvents;
      });
    });

    return unsubscribe;
  }, [maxEvents, options.filter]);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    clear,
    count: events.length,
  };
}
