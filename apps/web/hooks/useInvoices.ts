"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import type { Invoice } from "@/lib/api";

// ====================
// Query Keys
// ====================

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: (filters?: Record<string, unknown>) =>
    [...invoiceKeys.all, "list", filters] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

// ====================
// Queries
// ====================

export function useInvoices(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}) {
  return useQuery({
    queryKey: invoiceKeys.lists(filters),
    queryFn: async () => {
      const response = await invoicesApi.list(filters);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const response = await invoicesApi.get(id);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ====================
// Mutations
// ====================

export type CreateInvoiceData = {
  clientId: string;
  amount: number;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
};

export type UpdateInvoiceData = Partial<CreateInvoiceData>;

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const response = await invoicesApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice created", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceData }) => {
      const response = await invoicesApi.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice updated", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await invoicesApi.delete(id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice deleted", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to delete invoice",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await invoicesApi.send(id);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({
        title: "Invoice sent",
        description: "The client will receive an email shortly.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to send invoice",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await invoicesApi.markPaid(id);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice marked as paid", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to mark invoice as paid",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await invoicesApi.cancel(id);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice cancelled", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to cancel invoice",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Bulk Operations
// ====================

export function useBulkDeleteInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Process deletions in parallel
      await Promise.all(ids.map((id) => invoicesApi.delete(id)));
      return { deleted: ids.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({
        title: "Invoices deleted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to delete invoices",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useBulkSendInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => invoicesApi.send(id))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failed = results.length - successful;
      return { successful, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      if (result.failed > 0) {
        showToast({
          title: "Partially sent",
          description: `${result.successful} sent, ${result.failed} failed`,
          variant: "warning",
        });
      } else {
        showToast({
          title: "Invoices sent",
          description: `${result.successful} invoices sent successfully`,
          variant: "success",
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to send invoices",
        description: error.message,
        variant: "error",
      });
    },
  });
}
