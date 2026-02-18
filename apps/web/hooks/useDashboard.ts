"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, Project, ApiError } from "@/lib/api";

// ==================== Types ====================

export interface DashboardKPIs {
  totalProjects: number;
  totalGuests: number;
  totalInvitesSent: number;
  averageRSVPRate: number;
  upcomingEventsCount: number;
  trends: {
    projects: number;
    guests: number;
    invites: number;
    rsvpRate: number;
  };
}

export interface ProjectFilters {
  status: ("draft" | "active" | "archived")[];
  dateRange: { from: Date | null; to: Date | null };
  search: string;
  sortBy: "name" | "date" | "guests" | "rsvp";
  sortOrder: "asc" | "desc";
}

export interface ActivityItem {
  id: string;
  type: "rsvp" | "invite_sent" | "project_created" | "guest_added" | "guest_updated";
  message: string;
  projectName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ==================== Dashboard Stats Hook ====================

export function useDashboardStats() {
  return useQuery<DashboardKPIs, ApiError>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      // Use dedicated stats endpoint instead of fetching all projects
      const stats = await projectsApi.getDashboardStats();
      
      // Mock trends (in real app, compare with previous period from API)
      return {
        ...stats,
        trends: {
          projects: 12,
          guests: 8,
          invites: -3,
          rsvpRate: 5,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change often
    gcTime: 10 * 60 * 1000,
  });
}

// ==================== Project Filters Hook ====================

// Factory function to create fresh default filters - prevents shared reference bugs
const createDefaultFilters = (): ProjectFilters => ({
  status: [],
  dateRange: { from: null, to: null },
  search: "",
  sortBy: "date",
  sortOrder: "desc",
});

export function useProjectFilters() {
  const [filters, setFilters] = useState<ProjectFilters>(createDefaultFilters);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const toggleStatus = useCallback((status: "draft" | "active" | "archived") => {
    setFilters((prev) => {
      const currentStatus = prev.status;
      if (currentStatus.includes(status)) {
        return { ...prev, status: currentStatus.filter((s) => s !== status) };
      }
      return { ...prev, status: [...currentStatus, status] };
    });
  }, []);

  const clearStatusFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, status: [] }));
  }, []);

  const setDateRange = useCallback((from: Date | null, to: Date | null) => {
    setFilters((prev) => ({ ...prev, dateRange: { from, to } }));
  }, []);

  const setSortBy = useCallback((sortBy: ProjectFilters["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultFilters()); // Create new object every time
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status.length > 0 ||
      filters.search.length > 0 ||
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null
    );
  }, [filters]);

  return {
    filters,
    setSearch,
    toggleStatus,
    clearStatusFilter,
    setDateRange,
    setSortBy,
    toggleSortOrder,
    clearFilters,
    hasActiveFilters,
  };
}

// ==================== Filtered Projects Hook ====================

export function useFilteredProjects(filters: ProjectFilters) {
  // Serialize filters for stable query key - prevents cache busting on every render
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects", "filtered", filtersKey],
    queryFn: () => projectsApi.list({ limit: 1000 }),
    staleTime: 30 * 1000,
  });

  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];

    let result = [...data.projects];

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter((p) => filters.status.includes(p.status));
    }

    // Apply search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.description?.toLowerCase() || "").includes(searchLower)
      );
    }

    // Apply date range filter
    if (filters.dateRange.from) {
      const from = new Date(filters.dateRange.from);
      result = result.filter((p) => {
        if (!p.eventDate) return false;
        return new Date(p.eventDate) >= from;
      });
    }
    if (filters.dateRange.to) {
      const to = new Date(filters.dateRange.to);
      result = result.filter((p) => {
        if (!p.eventDate) return false;
        return new Date(p.eventDate) <= to;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
          const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "guests":
          const guestsA = a.stats?.totalGuests || 0;
          const guestsB = b.stats?.totalGuests || 0;
          comparison = guestsA - guestsB;
          break;
        case "rsvp":
          const rsvpA = a.stats?.rsvpYes || 0;
          const rsvpB = b.stats?.rsvpYes || 0;
          comparison = rsvpA - rsvpB;
          break;
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [data, filters]);

  return {
    projects: filteredProjects,
    isLoading,
    error,
    refetch,
    total: data?.total || 0,
  };
}

// ==================== Bulk Actions Hook ====================

export function useBulkProjectActions() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedCount = selectedIds.size;

  // Delete mutation
  const deleteMutation = useMutation<unknown, ApiError, string[]>({
    mutationFn: async (ids) => {
      // Delete projects one by one (could be optimized with bulk endpoint)
      await Promise.all(ids.map((id) => projectsApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      clearSelection();
    },
  });

  // Archive mutation (update status)
  const archiveMutation = useMutation<unknown, ApiError, string[]>({
    mutationFn: async (ids) => {
      await Promise.all(
        ids.map((id) => projectsApi.update(id, { status: "archived" }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      clearSelection();
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation<Project[], ApiError, string[]>({
    mutationFn: async (ids) => {
      const results = await Promise.all(
        ids.map((id) => projectsApi.duplicate(id))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      clearSelection();
    },
  });

  const handleDelete = useCallback(
    async (ids: string[]) => {
      await deleteMutation.mutateAsync(ids);
    },
    [deleteMutation]
  );

  const handleArchive = useCallback(
    async (ids: string[]) => {
      await archiveMutation.mutateAsync(ids);
    },
    [archiveMutation]
  );

  const handleDuplicate = useCallback(
    async (ids: string[]) => {
      await duplicateMutation.mutateAsync(ids);
    },
    [duplicateMutation]
  );

  const isProcessing =
    deleteMutation.isPending ||
    archiveMutation.isPending ||
    duplicateMutation.isPending;

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    handleDelete,
    handleArchive,
    handleDuplicate,
    isProcessing,
    deleteMutation,
    archiveMutation,
    duplicateMutation,
  };
}

// ==================== Activity Feed Hook ====================

export function useActivityFeed(limit = 10) {
  return useQuery<ActivityItem[], ApiError>({
    queryKey: ["dashboard", "activity", limit],
    queryFn: async () => {
      // Mock activity data - in real app, fetch from API
      const activities: ActivityItem[] = [
        {
          id: "1",
          type: "rsvp",
          message: "John & Sarah confirmed attendance",
          projectName: "Johnson Wedding",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: "2",
          type: "invite_sent",
          message: "45 invitations sent",
          projectName: "Corporate Gala 2024",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: "3",
          type: "project_created",
          message: "New project created",
          projectName: "Birthday Bash",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: "4",
          type: "guest_added",
          message: "12 guests added to list",
          projectName: "Johnson Wedding",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        },
        {
          id: "5",
          type: "rsvp",
          message: "Mike & Emma declined",
          projectName: "Summer Party",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        },
        {
          id: "6",
          type: "guest_updated",
          message: "Dietary preferences updated",
          projectName: "Corporate Gala 2024",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];
      return activities.slice(0, limit);
    },
    staleTime: 30 * 1000,
  });
}

// ==================== Sparkline Data Hook ====================

export function useSparklineData(projectId: string) {
  return useQuery<number[], ApiError>({
    queryKey: ["projects", projectId, "sparkline"],
    queryFn: async () => {
      // Mock sparkline data - in real app, fetch from API
      return Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 10);
    },
    staleTime: 5 * 60 * 1000,
  });
}
