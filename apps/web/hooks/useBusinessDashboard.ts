"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";

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

// Placeholder hooks for mutations that will be implemented
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; type: string; date: string }) => {
      // TODO: Implement when events API is ready
      console.log("Creating event:", data);
      return { id: "temp" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Event created", variant: "success" });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; type: string; email: string }) => {
      // TODO: Implement when clients API is ready
      console.log("Creating client:", data);
      return { id: "temp" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Client added", variant: "success" });
    },
  });
}

export function useInviteTeamMember() {
  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      // TODO: Implement when team API is ready
      console.log("Inviting:", data);
    },
    onSuccess: () => {
      showToast({ 
        title: "Invitation sent", 
        description: "They'll receive an email shortly.",
        variant: "success" 
      });
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { clientId: string; amount: number; dueDate: string }) => {
      // TODO: Implement when invoices API is ready
      console.log("Creating invoice:", data);
      return { id: "temp" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice created", variant: "success" });
    },
  });
}
