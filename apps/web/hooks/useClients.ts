"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import type { Client } from "@/lib/api";

// ====================
// Query Keys
// ====================

export const clientKeys = {
  all: ["clients"] as const,
  lists: (filters?: Record<string, unknown>) =>
    [...clientKeys.all, "list", filters] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
};

// ====================
// Queries
// ====================

export function useClients(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: clientKeys.lists(filters),
    queryFn: async () => {
      const response = await clientsApi.list(filters);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const response = await clientsApi.get(id);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ====================
// Mutations
// ====================

export type CreateClientData = {
  name: string;
  email: string;
  phone?: string;
  type: "couple" | "corporate" | "individual";
  notes?: string;
  address?: string;
};

export type UpdateClientData = Partial<CreateClientData>;

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      const response = await clientsApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Client added", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to add client",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientData }) => {
      const response = await clientsApi.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Client updated", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update client",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await clientsApi.delete(id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Client deleted", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to delete client",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Bulk Operations
// ====================

export function useBulkDeleteClients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => clientsApi.delete(id)));
      return { deleted: ids.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({
        title: "Clients deleted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to delete clients",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useBulkUpdateClientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: "active" | "inactive" | "archived";
    }) => {
      const results = await Promise.allSettled(
        ids.map((id) => clientsApi.update(id, { status }))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failed = results.length - successful;
      return { successful, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      if (result.failed > 0) {
        showToast({
          title: "Partially updated",
          description: `${result.successful} updated, ${result.failed} failed`,
          variant: "warning",
        });
      } else {
        showToast({
          title: "Clients updated",
          variant: "success",
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update clients",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Optimistic Updates
// ====================

export function useUpdateClientOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientData }) => {
      const response = await clientsApi.update(id, data);
      return response;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot previous values
      const previousClient = queryClient.getQueryData<Client>(
        clientKeys.detail(id)
      );
      const previousClients = queryClient.getQueryData<{ clients: Client[] }>(
        clientKeys.lists()
      );

      // Optimistically update cache
      if (previousClient) {
        queryClient.setQueryData(clientKeys.detail(id), {
          ...previousClient,
          ...data,
        });
      }

      if (previousClients) {
        queryClient.setQueryData(clientKeys.lists(), {
          ...previousClients,
          clients: previousClients.clients.map((client) =>
            client.id === id ? { ...client, ...data } : client
          ),
        });
      }

      return { previousClient, previousClients };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(
          clientKeys.detail(variables.id),
          context.previousClient
        );
      }
      if (context?.previousClients) {
        queryClient.setQueryData(clientKeys.lists(), context.previousClients);
      }
      showToast({
        title: "Failed to update client",
        description: err.message,
        variant: "error",
      });
    },
    onSettled: (data, error, variables) => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      if (!error) {
        showToast({ title: "Client updated", variant: "success" });
      }
    },
  });
}
