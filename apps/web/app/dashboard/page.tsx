"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Columns } from "lucide-react";
import Link from "next/link";
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
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
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
      onOpenChange(false);
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

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sarah & John's Wedding"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
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
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
  }>({ isOpen: false, projectId: "", projectName: "" });

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
  const handleDeleteProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setConfirmDialog({
        isOpen: true,
        projectId: id,
        projectName: project.name,
      });
    }
  }, [projects]);

  const confirmDelete = async () => {
    try {
      await handleDelete([confirmDialog.projectId]);
      showToast({
        title: "Project deleted",
        description: `"${confirmDialog.projectName}" has been deleted successfully.`,
        variant: "success",
      });
    } catch {
      showToast({
        title: "Failed to delete project",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ isOpen: false, projectId: "", projectName: "" });
    }
  };

  const handleArchiveProject = useCallback(async (id: string) => {
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
  }, [handleArchive]);

  const handleDuplicateProject = useCallback(async (id: string) => {
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
  }, [handleDuplicate]);

  // Select all visible projects
  const handleSelectAll = useCallback(() => {
    if (selectedCount === projects.length) {
      clearSelection();
    } else {
      selectAll(projects.map((p) => p.id));
    }
  }, [selectedCount, projects.length, clearSelection, selectAll]);

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
      {/* Breadcrumbs */}
      <Breadcrumbs />

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
        <div className="flex items-center gap-2">
          <Link href="/dashboard/board">
            <Button variant="outline" className="gap-2">
              <Columns className="h-4 w-4" />
              Board View
            </Button>
          </Link>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <CreateProjectDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSuccess={refetchProjects}
            />
          </Dialog>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
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
            onClearStatusFilter={clearStatusFilter}
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
              onCreateClick={() => setIsCreateDialogOpen(true)}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, projectId: "", projectName: "" })}
        onConfirm={confirmDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${confirmDialog.projectName}"? This action cannot be undone and all associated data including guests, invitations, and sites will be permanently removed.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="destructive"
        requireTextInput={true}
        confirmationText="DELETE"
      />
    </div>
  );
}
