"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, eventsApi, clientsApi, teamApi, invoicesApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import type { TeamRole } from "@/lib/api";

// ====================
// Dashboard Query
// ====================

export function useBusinessDashboard() {
  return useQuery({
    queryKey: ["business-dashboard"],
    queryFn: async () => {
      const response = await dashboardApi.getBusinessDashboard();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ====================
// Event Mutations
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
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
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
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
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
// Client Mutations
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
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
// Team Mutations
// ====================

export type InviteTeamMemberData = {
  email: string;
  role: TeamRole;
  orgId: string;
};

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, email, role }: { orgId: string; email: string; role: TeamRole }) => {
      const response = await teamApi.inviteMember(orgId, { email, role });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      showToast({
        title: "Invitation sent",
        description: "They'll receive an email shortly.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, memberId }: { orgId: string; memberId: string }) => {
      await teamApi.removeMember(orgId, memberId);
      return { memberId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      showToast({ title: "Team member removed", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to remove team member",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      memberId,
      role,
    }: {
      orgId: string;
      memberId: string;
      role: TeamRole;
    }) => {
      const response = await teamApi.updateMemberRole(orgId, memberId, role);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      showToast({ title: "Role updated", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update role",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Invoice Mutations
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
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      showToast({ title: "Invoice sent", variant: "success" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
