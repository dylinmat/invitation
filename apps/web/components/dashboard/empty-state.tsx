"use client";

import { FolderOpen, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "no-projects" | "no-results";
  onCreateClick?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

export function EmptyState({
  type,
  onCreateClick,
  onClearFilters,
  className,
}: EmptyStateProps) {
  if (type === "no-results") {
    return (
      <Card
        className={cn("border border-border/50 border-dashed", className)}
        style={{ borderRadius: "12px" }}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "#FDF8F5" }}
          >
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No projects found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-4">
            We couldn&apos;t find any projects matching your filters. Try adjusting your search or clear the filters.
          </p>
          <Button onClick={onClearFilters} variant="outline">
            Clear Filters
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("border border-border/50 border-dashed", className)}
      style={{ borderRadius: "12px" }}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "#FDF8F5" }}
        >
          <FolderOpen className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          Create your first project to start designing beautiful invitations and
          managing your guest list.
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Project
        </Button>
      </CardContent>
    </Card>
  );
}
