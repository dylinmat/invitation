"use client";

import { useState } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Users,
  Mail,
  MoreHorizontal,
  Copy,
  Trash2,
  Archive,
  CheckSquare,
  GripVertical,
  Clock,
  TrendingUp,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Project } from "@/lib/api";
import { formatDate, cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { KanbanCardProps, ColumnStatus } from "./types";

// Mock team members for avatars - in real app, fetch from API
const MOCK_TEAM = [
  { id: "1", name: "Alex Smith", avatar: null },
  { id: "2", name: "Jordan Lee", avatar: null },
  { id: "3", name: "Taylor Brown", avatar: null },
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

function getStatusBadgeVariant(status: ColumnStatus): "default" | "secondary" | "outline" | "success" {
  switch (status) {
    case "draft":
      return "secondary";
    case "active":
      return "success";
    case "archived":
      return "outline";
    default:
      return "default";
  }
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date < new Date() && date.toDateString() !== new Date().toDateString();
}

function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 7;
}

export function KanbanCard({
  project,
  index,
  columnId,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  showCheckbox,
}: KanbanCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${project.id}`,
    data: {
      type: "card",
      project,
      columnId,
      index,
    },
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Calculate progress percentage
  const checklistTotal = 10;
  const checklistCompleted = Math.floor(Math.random() * checklistTotal); // Mock data
  const progressPercentage = (checklistCompleted / checklistTotal) * 100;

  // Calculate RSVP rate
  const rsvpRate = project.stats
    ? Math.round(
        (project.stats.rsvpYes /
          Math.max(1, project.stats.rsvpYes + project.stats.rsvpNo + project.stats.rsvpPending)) *
          100
      )
    : 0;

  // Date indicators
  const overdue = isOverdue(project.eventDate);
  const dueSoon = isDueSoon(project.eventDate);

  return (
    <TooltipProvider>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative bg-white border border-border/60",
          "hover:border-[#E8D5D0] hover:shadow-md",
          "transition-all duration-200 ease-out",
          "cursor-grab active:cursor-grabbing",
          isSelected && "border-[#8B6B5D] ring-2 ring-[#8B6B5D]/20",
          isDragging && "rotate-2 scale-105 shadow-xl z-50",
          "overflow-hidden"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
        {...listeners}
        role="button"
        aria-label={`Project: ${project.name}. Press space to lift, arrow keys to move.`}
        aria-grabbed={isDragging}
        tabIndex={0}
      >
        {/* Status Indicator Strip */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            getStatusColor(columnId)
          )}
        />

        {/* Cover Image Placeholder */}
        <div className="relative h-24 bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center overflow-hidden">
          {project.settings?.branding?.logo ? (
            <img
              src={project.settings.branding.logo}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground/50">
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">No cover</span>
            </div>
          )}
          
          {/* Selection Checkbox */}
          {showCheckbox && (
            <div
              className={cn(
                "absolute top-2 left-2 z-10 transition-opacity duration-150",
                isSelected || isHovered ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect?.(project.id)}
                className="border-white/80 bg-white/90 data-[state=checked]:bg-[#8B6B5D] data-[state=checked]:border-[#8B6B5D]"
                aria-label={`Select ${project.name}`}
              />
            </div>
          )}

          {/* Quick Actions Menu */}
          <div
            className={cn(
              "absolute top-2 right-2 z-10 transition-opacity duration-150",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white/90 hover:bg-white border-0 shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit?.(project)}>
                  Open Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive?.(project.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(project.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-3 pt-3">
          {/* Title */}
          <Link href={`/dashboard/projects/${project.id}`} className="block mb-2">
            <h3
              className="font-semibold text-sm truncate hover:text-[#8B6B5D] transition-colors"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {project.name}
            </h3>
          </Link>

          {/* Description */}
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          {/* Event Date with Indicators */}
          <div className="flex items-center gap-2 text-xs mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center px-2 py-1 rounded-md",
                    overdue && "bg-red-50 text-red-600",
                    dueSoon && "bg-amber-50 text-amber-600",
                    !overdue && !dueSoon && "bg-muted text-muted-foreground"
                  )}
                >
                  {overdue ? (
                    <Clock className="mr-1 h-3 w-3" />
                  ) : (
                    <Calendar className="mr-1 h-3 w-3" />
                  )}
                  <span className="font-medium">
                    {project.eventDate
                      ? formatRelativeTime(project.eventDate)
                      : "No date"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {project.eventDate
                  ? formatDate(project.eventDate)
                  : "No event date set"}
              </TooltipContent>
            </Tooltip>

            {/* RSVP Badge */}
            {project.stats && rsvpRate > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    <span className="font-medium">{rsvpRate}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>RSVP Response Rate</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Stats Row */}
          {project.stats && (
            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center hover:text-foreground transition-colors">
                    <Users className="mr-1 h-3.5 w-3.5" />
                    <span>{project.stats.totalGuests}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Total Guests</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center hover:text-foreground transition-colors">
                    <Mail className="mr-1 h-3.5 w-3.5" />
                    <span>{project.stats.totalInvites}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Invitations Sent</TooltipContent>
              </Tooltip>

              {/* RSVP Breakdown */}
              <div className="flex items-center gap-1 ml-auto">
                {project.stats.rsvpYes > 0 && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                    {project.stats.rsvpYes}
                  </Badge>
                )}
                {project.stats.rsvpNo > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    {project.stats.rsvpNo}
                  </Badge>
                )}
                {project.stats.rsvpPending > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {project.stats.rsvpPending}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center">
                <CheckSquare className="mr-1 h-3 w-3" />
                Progress
              </div>
              <span>
                {checklistCompleted}/{checklistTotal}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>

          {/* Footer: Team Avatars & Status */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {/* Team Avatars */}
            <div className="flex -space-x-2">
              {MOCK_TEAM.slice(0, 3).map((member, i) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-white ring-0">
                      <AvatarImage src={member.avatar || undefined} alt={member.name} />
                      <AvatarFallback className="text-[8px] bg-muted">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{member.name}</TooltipContent>
                </Tooltip>
              ))}
              {MOCK_TEAM.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[8px] text-muted-foreground">
                  +{MOCK_TEAM.length - 3}
                </div>
              )}
            </div>

            {/* Status Badge */}
            <Badge
              variant={getStatusBadgeVariant(columnId)}
              className="text-[10px] px-2 py-0 h-5 capitalize"
            >
              {columnId}
            </Badge>
          </div>
        </CardContent>

        {/* Drag Handle Indicator */}
        <div
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity",
            "text-muted-foreground cursor-grab"
          )}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </Card>
    </TooltipProvider>
  );
}
