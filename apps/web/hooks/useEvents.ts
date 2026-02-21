"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import type { BusinessEvent } from "@/lib/api";

// ====================
// Query Keys
// ====================

export const eventKeys = {
  all: ["events"] as const,
  lists: (filters?: Record<string, unknown>) =>
    [...eventKeys.all, "list", filters] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
};

// ====================
// Queries
// ====================

export function useEvents(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}) {
  return useQuery({
    queryKey: eventKeys.lists(filters),
    queryFn: async () => {
      const response = await eventsApi.list(filters);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const response = await eventsApi.get(id);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ====================
// Mutations
// ====================

export type CreateEventData = {
  name: string;
  type: string;
  date: string;
  location?: string;
  description?: string;
  clientId?: string;
};

export type UpdateEventData = Partial<CreateEventData>;

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await eventsApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Event created", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to create event",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventData }) => {
      const response = await eventsApi.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Event updated", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update event",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await eventsApi.delete(id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Event deleted", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to delete event",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Bulk Operations
// ====================

export function useBulkDeleteEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => eventsApi.delete(id)));
      return { deleted: ids.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({
        title: "Events deleted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to delete events",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useBulkUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: "draft" | "confirmed" | "completed" | "cancelled";
    }) => {
      const results = await Promise.allSettled(
        ids.map((id) => eventsApi.update(id, { status }))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failed = results.length - successful;
      return { successful, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      if (result.failed > 0) {
        showToast({
          title: "Partially updated",
          description: `${result.successful} updated, ${result.failed} failed`,
          variant: "warning",
        });
      } else {
        showToast({
          title: "Events updated",
          variant: "success",
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update events",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Optimistic Updates
// ====================

export function useUpdateEventOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventData }) => {
      const response = await eventsApi.update(id, data);
      return response;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: eventKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: eventKeys.lists() });

      // Snapshot previous values
      const previousEvent = queryClient.getQueryData<BusinessEvent>(
        eventKeys.detail(id)
      );
      const previousEvents = queryClient.getQueryData<{
        events: BusinessEvent[];
        total: number;
      }>(eventKeys.lists());

      // Optimistically update cache
      if (previousEvent) {
        queryClient.setQueryData(eventKeys.detail(id), {
          ...previousEvent,
          ...data,
        });
      }

      if (previousEvents) {
        queryClient.setQueryData(eventKeys.lists(), {
          ...previousEvents,
          events: previousEvents.events.map((event) =>
            event.id === id ? { ...event, ...data } : event
          ),
        });
      }

      return { previousEvent, previousEvents };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(
          eventKeys.detail(variables.id),
          context.previousEvent
        );
      }
      if (context?.previousEvents) {
        queryClient.setQueryData(eventKeys.lists(), context.previousEvents);
      }
      showToast({
        title: "Failed to update event",
        description: err.message,
        variant: "error",
      });
    },
    onSettled: (data, error, variables) => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      if (!error) {
        showToast({ title: "Event updated", variant: "success" });
      }
    },
  });
}
