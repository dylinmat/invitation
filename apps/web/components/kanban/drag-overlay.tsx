"use client";

import { createPortal } from "react-dom";
import { DragOverlay as DndDragOverlay, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Users,
  Mail,
  GripHorizontal,
  GripVertical,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn, getInitials } from "@/lib/utils";
import { DragOverlayProps, ColumnStatus } from "./types";
import { Project } from "@/lib/api";

// Mock team members
const MOCK_TEAM = [
  { id: "1", name: "Alex Smith", avatar: null },
  { id: "2", name: "Jordan Lee", avatar: null },
];

function getStatusColor(status: ColumnStatus): string {
  switch (status) {
    case "draft":
      return "bg-amber-500";
    case "active":
      return "bg-emerald-500";
    case "archived":
      return "bg-slate-500";
    default:
      return "bg-slate-500";
  }
}

interface CardDragOverlayProps {
  project: Project;
  columnId: ColumnStatus;
}

function CardDragOverlay({ project, columnId }: CardDragOverlayProps) {
  const checklistTotal = 10;
  const checklistCompleted = Math.floor(Math.random() * checklistTotal);
  const progressPercentage = (checklistCompleted / checklistTotal) * 100;

  const rsvpRate = project.stats
    ? Math.round(
        (project.stats.rsvpYes /
          Math.max(1, project.stats.rsvpYes + project.stats.rsvpNo + project.stats.rsvpPending)) *
          100
      )
    : 0;

  return (
    <Card
      className={cn(
        "w-[300px] bg-white border-2 border-[#8B6B5D] shadow-2xl",
        "rotate-2 scale-105 cursor-grabbing",
        "overflow-hidden pointer-events-none"
      )}
    >
      {/* Status Indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          getStatusColor(columnId)
        )}
      />

      {/* Cover Placeholder */}
      <div className="h-20 bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Project Cover</span>
      </div>

      <CardContent className="p-3">
        {/* Title */}
        <h3
          className="font-semibold text-sm truncate mb-2"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {project.name}
        </h3>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Users className="mr-1 h-3.5 w-3.5" />
            <span>{project.stats?.totalGuests || 0}</span>
          </div>
          <div className="flex items-center">
            <Mail className="mr-1 h-3.5 w-3.5" />
            <span>{project.stats?.totalInvites || 0}</span>
          </div>
          {rsvpRate > 0 && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
              {rsvpRate}%
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span>
              {checklistCompleted}/{checklistTotal}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>

        {/* Footer Avatars */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50">
          <div className="flex -space-x-2">
            {MOCK_TEAM.map((member) => (
              <Avatar
                key={member.id}
                className="h-5 w-5 border-2 border-white"
              >
                <AvatarFallback className="text-[7px] bg-muted">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 h-5 capitalize"
          >
            {columnId}
          </Badge>
        </div>
      </CardContent>

      {/* Drag Handle */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
    </Card>
  );
}

interface ColumnDragOverlayProps {
  column: {
    id: ColumnStatus;
    title: string;
    color: string;
    projects: Project[];
  };
}

function ColumnDragOverlay({ column }: ColumnDragOverlayProps) {
  const getStatusIcon = () => {
    switch (column.id) {
      case "draft":
        return (
          <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-100" />
        );
      case "active":
        return (
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
        );
      case "archived":
        return (
          <div className="w-3 h-3 rounded-full bg-slate-500 ring-2 ring-slate-100" />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col w-[320px] min-w-[320px] max-w-[320px]",
        "bg-muted/50 rounded-lg border-2 border-[#8B6B5D]",
        "shadow-2xl rotate-1 scale-105 pointer-events-none",
        "overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          {getStatusIcon()}
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-background">
            {column.projects.length}
          </Badge>
        </div>
      </div>

      {/* Preview of Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[150px] max-h-[300px] overflow-hidden">
        {column.projects.slice(0, 3).map((project) => (
          <Card
            key={project.id}
            className="p-3 bg-white/80 border border-border/50 opacity-60"
          >
            <h4 className="font-medium text-sm truncate">{project.name}</h4>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{project.stats?.totalGuests || 0}</span>
            </div>
          </Card>
        ))}
        {column.projects.length > 3 && (
          <div className="text-center text-xs text-muted-foreground py-2">
            +{column.projects.length - 3} more projects
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-start text-muted-foreground text-xs h-8 px-2">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add project
        </div>
      </div>
    </div>
  );
}

export function KanbanDragOverlay({
  activeId,
  activeType,
  activeProject,
  activeColumn,
}: DragOverlayProps) {
  if (!activeId || !activeType) return null;

  return (
    <DndDragOverlay
      dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
      }}
      zIndex={100}
    >
      {activeType === "card" && activeProject && (
        <CardDragOverlay
          project={activeProject}
          columnId={activeId.replace("card-", "").split("-")[0] as ColumnStatus}
        />
      )}
      {activeType === "column" && activeColumn && (
        <ColumnDragOverlay column={activeColumn} />
      )}
    </DndDragOverlay>
  );
}
