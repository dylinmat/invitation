"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutKanban, ArrowLeft, RefreshCw } from "lucide-react";
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
import { KanbanBoard } from "@/components/kanban";
import { ColumnStatus } from "@/components/kanban/types";
import { Project, projectsApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

// Create Project Dialog Component
function CreateProjectDialog({ onSuccess }: { onSuccess: () => void }) {
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
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

export default function BoardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch projects
  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", "board"],
    queryFn: async () => {
      const response = await projectsApi.list({ limit: 1000 });
      return response.projects;
    },
    staleTime: 30 * 1000,
  });

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
      setSelectedIds([]);
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
      setSelectedIds([]);
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
      setSelectedIds([]);
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

  // Selection handlers
  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  // Board action handlers
  const handleStatusChange = useCallback(
    (projectId: string, newStatus: ColumnStatus) => {
      statusMutation.mutate({ projectId, newStatus });
    },
    [statusMutation]
  );

  const handleEdit = useCallback(
    (project: Project) => {
      router.push(`/dashboard/projects/${project.id}`);
    },
    [router]
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

  const handleOrderChange = useCallback(
    (columnId: ColumnStatus, projectIds: string[]) => {
      // This could be used to persist custom ordering
      console.log(`Order changed in ${columnId}:`, projectIds);
    },
    []
  );

  // Loading state
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/20 rounded w-48 animate-pulse" />
        <div className="h-[calc(100vh-200px)] bg-muted/20 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to load board</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading your projects. Please try again.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight flex items-center gap-2"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              <LayoutKanban className="h-6 w-6" />
              Project Board
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Drag and drop to organize your projects
            </p>
          </div>
        </div>
        <CreateProjectDialog onSuccess={refetch} />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          projects={projectsData || []}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onOrderChange={handleOrderChange}
          showCheckboxes={true}
        />
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="px-6 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border">
                Space
              </kbd>
              to lift/drop
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border">
                ↑↓←→
              </kbd>
              to move
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border">
                Esc
              </kbd>
              to cancel
            </span>
          </div>
          <span>
            {projectsData?.length || 0} projects across 3 columns
          </span>
        </div>
      </div>
    </div>
  );
}
