"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { projectsApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";

// Dashboard components
import { KPIDashboard } from "@/components/dashboard/kpi-dashboard";
import { ProjectCard } from "@/components/dashboard/project-card";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { BulkActionsToolbar } from "@/components/dashboard/bulk-actions-toolbar";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProjectGridSkeleton } from "@/components/dashboard/project-skeleton";

// Dashboard hooks
import {
  useProjectFilters,
  useFilteredProjects,
  useBulkProjectActions,
} from "@/hooks/useDashboard";

// Create Project Dialog Component
function CreateProjectDialog({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await projectsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      showToast({
        title: "Project created",
        description: "Your new project has been created successfully.",
        variant: "success",
      });
      setIsOpen(false);
      setName("");
      setDescription("");
      onSuccess();
    } catch {
      showToast({
        title: "Failed to create project",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start a new event invitation project. You can add details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., Sarah & John's Wedding"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of the event"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filters hook
  const {
    filters,
    setSearch,
    toggleStatus,
    clearStatusFilter,
    setSortBy,
    toggleSortOrder,
    clearFilters,
    hasActiveFilters,
  } = useProjectFilters();

  // Filtered projects hook
  const {
    projects,
    isLoading: isProjectsLoading,
    total,
    refetch: refetchProjects,
  } = useFilteredProjects(filters);

  // Bulk actions hook
  const {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    handleDelete,
    handleArchive,
    handleDuplicate,
    isProcessing,
  } = useBulkProjectActions();

  // Handlers for individual project actions
  const handleDeleteProject = async (id: string) => {
    try {
      await handleDelete([id]);
      showToast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
        variant: "success",
      });
    } catch {
      showToast({
        title: "Failed to delete project",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveProject = async (id: string) => {
    try {
      await handleArchive([id]);
      showToast({
        title: "Project archived",
        description: "The project has been archived successfully.",
        variant: "success",
      });
    } catch {
      showToast({
        title: "Failed to archive project",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (id: string) => {
    try {
      await handleDuplicate([id]);
      showToast({
        title: "Project duplicated",
        description: "The project has been duplicated successfully.",
        variant: "success",
      });
    } catch {
      showToast({
        title: "Failed to duplicate project",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Select all visible projects
  const handleSelectAll = () => {
    if (selectedCount === projects.length) {
      clearSelection();
    } else {
      selectAll(projects.map((p) => p.id));
    }
  };

  // Show loading state during SSR or before mount
  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="h-24 bg-muted/20 rounded-xl animate-pulse" />
        <div className="h-20 bg-muted/20 rounded-xl animate-pulse" />
        <ProjectGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and track RSVPs in one place
          </p>
        </div>
        <CreateProjectDialog onSuccess={refetchProjects} />
      </div>

      {/* KPI Dashboard */}
      <section>
        <KPIDashboard />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Projects Section */}
        <div className="xl:col-span-3 space-y-4">
          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onSearchChange={setSearch}
            onStatusToggle={toggleStatus}
            onClearStatus={clearStatusFilter}
            onSortByChange={setSortBy}
            onSortOrderToggle={toggleSortOrder}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={projects.length}
            totalCount={total}
          />

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedCount={selectedCount}
            totalCount={projects.length}
            onSelectAll={handleSelectAll}
            onClearSelection={clearSelection}
            onDelete={() => handleDelete(selectedIds)}
            onArchive={() => handleArchive(selectedIds)}
            onDuplicate={() => handleDuplicate(selectedIds)}
            isProcessing={isProcessing}
          />

          {/* Projects Grid */}
          {isProjectsLoading ? (
            <ProjectGridSkeleton count={6} />
          ) : projects.length === 0 ? (
            <EmptyState
              type={hasActiveFilters ? "no-results" : "no-projects"}
              onCreateClick={() => {}}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={isSelected(project.id)}
                  onSelect={toggleSelection}
                  onDelete={handleDeleteProject}
                  onArchive={handleArchiveProject}
                  onDuplicate={handleDuplicateProject}
                  showCheckbox={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Activity Feed */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
