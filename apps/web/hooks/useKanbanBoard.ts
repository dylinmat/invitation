"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, projectsApi } from "@/lib/api";
import { ColumnStatus } from "@/components/kanban/types";
import { showToast } from "@/components/ui/toaster";

export interface KanbanBoardState {
  selectedIds: string[];
  isProcessing: boolean;
}

export interface KanbanBoardActions {
  // Selection
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  // Actions
  handleStatusChange: (projectId: string, newStatus: ColumnStatus) => void;
  handleDuplicate: (id: string) => void;
  handleArchive: (id: string) => void;
  handleDelete: (id: string) => void;
  handleBulkDuplicate: () => void;
  handleBulkArchive: () => void;
  handleBulkDelete: () => void;
}

export interface UseKanbanBoardReturn extends KanbanBoardState, KanbanBoardActions {}

/**
 * Hook for managing Kanban board state and actions
 * Handles selection, status changes, and bulk operations
 */
export function useKanbanBoard(): UseKanbanBoardReturn {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ==================== Selection ====================

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  // ==================== Mutations ====================

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({
      projectId,
      newStatus,
    }: {
      projectId: string;
      newStatus: ColumnStatus;
    }) => {
      await projectsApi.update(projectId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: () => {
      showToast({
        title: "Failed to update status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => projectsApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      clearSelection();
      showToast({
        title: "Projects deleted",
        description: "Selected projects have been deleted.",
        variant: "success",
      });
    },
    onError: () => {
      showToast({
        title: "Failed to delete",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => projectsApi.update(id, { status: "archived" }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      clearSelection();
      showToast({
        title: "Projects archived",
        description: "Selected projects have been archived.",
        variant: "success",
      });
    },
    onError: () => {
      showToast({
        title: "Failed to archive",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => projectsApi.duplicate(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      clearSelection();
      showToast({
        title: "Projects duplicated",
        description: "Selected projects have been duplicated.",
        variant: "success",
      });
    },
    onError: () => {
      showToast({
        title: "Failed to duplicate",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // ==================== Action Handlers ====================

  const handleStatusChange = useCallback(
    (projectId: string, newStatus: ColumnStatus) => {
      statusMutation.mutate({ projectId, newStatus });
    },
    [statusMutation]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateMutation.mutate([id]);
    },
    [duplicateMutation]
  );

  const handleArchive = useCallback(
    (id: string) => {
      archiveMutation.mutate([id]);
    },
    [archiveMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate([id]);
    },
    [deleteMutation]
  );

  const handleBulkDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    duplicateMutation.mutate(selectedIds);
  }, [selectedIds, duplicateMutation]);

  const handleBulkArchive = useCallback(() => {
    if (selectedIds.length === 0) return;
    archiveMutation.mutate(selectedIds);
  }, [selectedIds, archiveMutation]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    deleteMutation.mutate(selectedIds);
  }, [selectedIds, deleteMutation]);

  // ==================== Computed State ====================

  const isProcessing = useMemo(
    () =>
      statusMutation.isPending ||
      deleteMutation.isPending ||
      archiveMutation.isPending ||
      duplicateMutation.isPending,
    [statusMutation.isPending, deleteMutation.isPending, archiveMutation.isPending, duplicateMutation.isPending]
  );

  return {
    // State
    selectedIds,
    isProcessing,

    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,

    // Project actions
    handleStatusChange,
    handleDuplicate,
    handleArchive,
    handleDelete,
    handleBulkDuplicate,
    handleBulkArchive,
    handleBulkDelete,
  };
}

export default useKanbanBoard;
