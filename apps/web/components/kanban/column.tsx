"use client";

import { useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  MoreHorizontal,
  GripHorizontal,
  Archive,
  Trash2,
  Settings,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KanbanColumnProps, ColumnStatus } from "./types";
import { KanbanCard } from "./card";
import { Project } from "@/lib/api";

interface ColumnHeaderProps {
  column: {
    id: ColumnStatus;
    title: string;
    color: string;
    projects: Project[];
  };
  isDragging?: boolean;
  onAddCard?: () => void;
  onColumnSettings?: () => void;
  onClearColumn?: () => void;
}

function ColumnHeader({
  column,
  isDragging,
  onAddCard,
  onColumnSettings,
  onClearColumn,
}: ColumnHeaderProps) {
  const projectCount = column.projects.length;

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
        "flex items-center justify-between p-3 bg-muted/50 border-b border-border/50",
        "rounded-t-lg transition-colors",
        isDragging && "bg-muted ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="cursor-grab active:cursor-grabbing hover:bg-muted-foreground/10 rounded p-0.5 transition-colors">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
        {getStatusIcon()}
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge
          variant="secondary"
          className="text-xs h-5 px-1.5 bg-background"
        >
          {projectCount}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onAddCard}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add project to {column.title}</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onColumnSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Column Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Filter className="mr-2 h-4 w-4" />
              Filter Projects
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearColumn}>
              <Archive className="mr-2 h-4 w-4" />
              Archive All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearColumn}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function KanbanColumn({
  column,
  index,
  selectedCardIds = [],
  onCardSelect,
  onCardEdit,
  onCardDuplicate,
  onCardArchive,
  onCardDelete,
  showCheckboxes,
}: KanbanColumnProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Sortable context for the column itself
  const {
    attributes,
    listeners,
    setNodeRef: setColumnRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
      index,
    },
  });

  // Droppable context for cards within this column
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-droppable-${column.id}`,
    data: {
      type: "column",
      column,
    },
  });

  const columnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isColumnDragging ? 0.5 : 1,
  };

  // Memoize card IDs for SortableContext
  const cardIds = useMemo(
    () => column.projects.map((p) => `card-${p.id}`),
    [column.projects]
  );

  const handleAddCard = () => {
    // This would open a create project dialog
    console.log("Add card to column:", column.id);
  };

  const handleColumnSettings = () => {
    console.log("Column settings:", column.id);
  };

  const handleClearColumn = () => {
    console.log("Clear column:", column.id);
  };

  return (
    <TooltipProvider>
      <div
        ref={setColumnRef}
        style={columnStyle}
        className={cn(
          "flex flex-col w-[320px] min-w-[320px] max-w-[320px]",
          "bg-muted/30 rounded-lg border border-border/50",
          "transition-shadow duration-200",
          isOver && "ring-2 ring-primary/30 shadow-lg",
          isColumnDragging && "shadow-2xl rotate-1 scale-105 z-50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
        {...listeners}
        role="list"
        aria-label={`${column.title} column with ${column.projects.length} projects`}
      >
        <ColumnHeader
          column={column}
          isDragging={isColumnDragging}
          onAddCard={handleAddCard}
          onColumnSettings={handleColumnSettings}
          onClearColumn={handleClearColumn}
        />

        {/* Cards Container */}
        <div
          ref={setDroppableRef}
          className={cn(
            "flex-1 p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)]",
            "overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
            "transition-colors duration-200",
            isOver && "bg-primary/5"
          )}
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            {column.projects.map((project, cardIndex) => (
              <KanbanCard
                key={project.id}
                project={project}
                index={cardIndex}
                columnId={column.id}
                isSelected={selectedCardIds.includes(project.id)}
                onSelect={onCardSelect}
                onEdit={onCardEdit}
                onDuplicate={onCardDuplicate}
                onArchive={onCardArchive}
                onDelete={onCardDelete}
                showCheckbox={showCheckboxes}
              />
            ))}
          </SortableContext>

          {/* Empty State */}
          {column.projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No projects in {column.title.toLowerCase()}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={handleAddCard}
              >
                Add a project
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/50 bg-muted/30 rounded-b-lg">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8"
            onClick={handleAddCard}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add project
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
