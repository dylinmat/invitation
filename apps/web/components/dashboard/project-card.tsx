"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  Users,
  Mail,
  MoreHorizontal,
  Copy,
  Trash2,
  Archive,
  CheckSquare,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { Project } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";
import { Sparkline } from "./sparkline";
import { useSparklineData } from "@/hooks/useDashboard";

interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  showCheckbox?: boolean;
}

export function ProjectCard({
  project,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  onArchive,
  showCheckbox,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: sparklineData } = useSparklineData(project.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "draft":
        return "secondary";
      case "archived":
        return "default";
      default:
        return "secondary";
    }
  };

  // Mock checklist progress (in real app, fetch from API)
  const checklistProgress = Math.floor(Math.random() * 10);
  const checklistTotal = 10;

  return (
    <Card
      className={cn(
        "group relative transition-all duration-150 overflow-hidden",
        "border border-border/50 hover:border-[#E8D5D0]",
        isSelected && "border-[#E8D5D0] ring-1 ring-[#E8D5D0]",
        "hover:shadow-sm"
      )}
      style={{ borderRadius: "12px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox Overlay */}
      {showCheckbox && (
        <div
          className={cn(
            "absolute top-3 left-3 z-10 transition-opacity duration-150",
            isSelected || isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(project.id)}
            className="border-muted-foreground/50 data-[state=checked]:bg-[#8B6B5D] data-[state=checked]:border-[#8B6B5D]"
          />
        </div>
      )}

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <Link href={`/dashboard/projects/${project.id}`}>
              <h3
                className="font-semibold text-base truncate hover:text-[#8B6B5D] transition-colors"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {project.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {project.description || "No description"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <Link href={`/dashboard/projects/${project.id}`}>
                <DropdownMenuItem>Open Project</DropdownMenuItem>
              </Link>
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

        {/* Event Date */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-4 w-4" />
            {project.eventDate ? formatDate(project.eventDate) : "No date set"}
          </div>
        </div>

        {/* Stats Row */}
        {project.stats && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center text-sm">
              <Users className="mr-1.5 h-4 w-4 text-muted-foreground" />
              <span>{project.stats.totalGuests}</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="mr-1.5 h-4 w-4 text-muted-foreground" />
              <span>{project.stats.totalInvites}</span>
            </div>
            {project.stats.rsvpYes > 0 && (
              <Badge variant="success" className="text-xs">
                {project.stats.rsvpYes} Yes
              </Badge>
            )}
            {/* Sparkline */}
            {sparklineData && (
              <div className="ml-auto">
                <Sparkline data={sparklineData} width={60} height={20} />
              </div>
            )}
          </div>
        )}

        {/* Checklist Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
              Checklist
            </div>
            <span>
              {checklistProgress}/{checklistTotal}
            </span>
          </div>
          <ProgressBar
            value={checklistProgress}
            max={checklistTotal}
            size="sm"
          />
        </div>
      </CardContent>

      {/* Footer with Status */}
      <CardFooter className="px-5 py-3 bg-muted/20 border-t">
        <div className="flex items-center justify-between w-full">
          <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
          {project.stats && (
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3" />
              {Math.round(
                (project.stats.rsvpYes /
                  Math.max(
                    1,
                    project.stats.rsvpYes +
                      project.stats.rsvpNo +
                      project.stats.rsvpPending
                  )) *
                  100
              )}{" "}
              % RSVP
            </div>
          )}
        </div>
      </CardFooter>

      {/* Quick Action Overlay on Hover */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur-sm",
          "border-t border-[#E8D5D0] transition-all duration-150",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={() => onDuplicate?.(project.id)}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={() => onArchive?.(project.id)}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            Archive
          </Button>
        </div>
      </div>
    </Card>
  );
}
