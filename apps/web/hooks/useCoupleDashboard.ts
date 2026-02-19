"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, checklistApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";

export function useCoupleDashboard() {
  return useQuery({
    queryKey: ["couple-dashboard"],
    queryFn: async () => {
      const response = await dashboardApi.getCoupleDashboard();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChecklist() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["checklist"],
    queryFn: async () => {
      const response = await checklistApi.getItems();
      return response.items || [];
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await checklistApi.updateItem(id, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      queryClient.invalidateQueries({ queryKey: ["couple-dashboard"] });
    },
  });

  const addItem = useMutation({
    mutationFn: async (text: string) => {
      await checklistApi.createItem(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      showToast({ title: "Task added", variant: "success" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await checklistApi.deleteItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
    },
  });

  return { 
    items: data || [], 
    isLoading, 
    toggleItem, 
    addItem,
    deleteItem 
  };
}

export function useSendReminders() {
  return useMutation({
    mutationFn: async ({ eventId, message }: { eventId: string; message?: string }) => {
      const response = await dashboardApi.sendReminders(eventId, { type: "rsvp", message });
      return response;
    },
    onSuccess: (data) => {
      showToast({
        title: "Reminders sent!",
        description: `${data.sent} guests will receive an email.`,
        variant: "success",
      });
    },
    onError: () => {
      showToast({
        title: "Failed to send reminders",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
}
