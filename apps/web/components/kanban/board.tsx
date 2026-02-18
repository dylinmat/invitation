"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DropAnimation,
  closestCorners,
  pointerWithin,
  getFirstCollision,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Columns,
  List,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  CheckSquare,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Project } from "@/lib/api";
import {
  KanbanBoardProps,
  KanbanColumnData,
  KanbanBoardData,
  ColumnStatus,
  SortableData,
} from "./types";
import { KanbanColumn as ColumnComponent } from "./column";
import { KanbanDragOverlay } from "./drag-overlay";

// Initial column configuration
const DEFAULT_COLUMNS: KanbanColumnData[] = [
  {
    id: "draft",
    title: "Draft",
    color: "#f59e0b",
    projects: [],
  },
  {
    id: "active",
    title: "Active",
    color: "#10b981",
    projects: [],
  },
  {
    id: "archived",
    title: "Archived",
    color: "#64748b",
    projects: [],
  },
];

// Custom collision detection strategy for better card-to-column detection
const customCollisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
  // First try pointerWithin for precise detection
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  
  // Fallback to closest corners if no pointer collision
  return closestCorners(args);
};

export function KanbanBoard({
  projects,
  isLoading,
  selectedIds = [],
  onSelect,
  onSelectAll,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onStatusChange,
  onOrderChange,
  showCheckboxes = true,
}: KanbanBoardProps) {
  // Initialize board data from projects
  const [boardData, setBoardData] = useState<KanbanBoardData>(() => {
    const columns: KanbanColumnData[] = DEFAULT_COLUMNS.map((col) => ({
      ...col,
      projects: projects.filter((p) => p.status === col.id),
    }));
    return {
      columns,
      columnOrder: ["draft", "active", "archived"],
    };
  });

  // Update board data when projects change
  useEffect(() => {
    setBoardData((prev) => {
      const updatedColumns = prev.columns.map((col) => ({
        ...col,
        projects: projects.filter((p) => p.status === col.id),
      }));
      return {
        ...prev,
        columns: updatedColumns,
      };
    });
  }, [projects]);

  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  const [activeProject, setActiveProject] = useState<Project | undefined>();
  const [activeColumn, setActiveColumn] = useState<KanbanColumnData | undefined>();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [visibleColumns, setVisibleColumns] = useState<ColumnStatus[]>([
    "draft",
    "active",
    "archived",
  ]);

  // Announcement state for screen readers
  const [announcement, setAnnouncement] = useState<string>("");
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        const { active } = event;
        const node = active?.rect?.current?.translated;
        return node
          ? {
              x: node.left,
              y: node.top,
            }
          : { x: 0, y: 0 };
      },
    })
  );

  // Announce to screen readers
  const announce = useCallback((message: string) => {
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    setAnnouncement(message);
    announcementTimeoutRef.current = setTimeout(() => {
      setAnnouncement("");
    }, 3000);
  }, []);

  // Get active data
  const getActiveData = useCallback(
    (id: string): SortableData | null => {
      // Check if it's a card
      if (id.startsWith("card-")) {
        const projectId = id.replace("card-", "");
        for (const col of boardData.columns) {
          const project = col.projects.find((p) => p.id === projectId);
          if (project) {
            return {
              type: "card",
              project,
              columnId: col.id,
              index: col.projects.findIndex((p) => p.id === projectId),
            };
          }
        }
      }
      // Check if it's a column
      if (id.startsWith("column-")) {
        const columnId = id.replace("column-", "") as ColumnStatus;
        const column = boardData.columns.find((c) => c.id === columnId);
        if (column) {
          return {
            type: "column",
            column,
            index: boardData.columnOrder.indexOf(columnId),
          };
        }
      }
      return null;
    },
    [boardData]
  );

  // Drag start handler
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const id = active.id as string;
      const data = getActiveData(id);

      if (data) {
        setActiveId(id);
        setActiveType(data.type);

        if (data.type === "card") {
          setActiveProject(data.project);
          announce(`Picked up project ${data.project.name}. Use arrow keys to move, space to drop.`);
        } else {
          setActiveColumn(data.column);
          announce(`Picked up column ${data.column.title}. Use arrow keys to move, space to drop.`);
        }
      }
    },
    [getActiveData, announce]
  );

  // Drag over handler for real-time updates
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Don't process if dragging over self
      if (activeId === overId) return;

      const activeData = getActiveData(activeId);
      if (!activeData || activeData.type !== "card") return;

      // Find the target column
      let targetColumnId: ColumnStatus | null = null;
      let targetIndex: number = -1;

      if (overId.startsWith("column-")) {
        targetColumnId = overId.replace("column-", "") as ColumnStatus;
        targetIndex = boardData.columns.find((c) => c.id === targetColumnId)?.projects.length || 0;
      } else if (overId.startsWith("card-")) {
        const overProjectId = overId.replace("card-", "");
        for (const col of boardData.columns) {
          const index = col.projects.findIndex((p) => p.id === overProjectId);
          if (index !== -1) {
            targetColumnId = col.id;
            targetIndex = index;
            break;
          }
        }
      } else if (overId.startsWith("column-droppable-")) {
        targetColumnId = overId.replace("column-droppable-", "") as ColumnStatus;
        targetIndex = boardData.columns.find((c) => c.id === targetColumnId)?.projects.length || 0;
      }

      if (!targetColumnId || targetColumnId === activeData.columnId) return;

      // Update board state
      setBoardData((prev) => {
        const newColumns = prev.columns.map((col) => {
          if (col.id === activeData.columnId) {
            return {
              ...col,
              projects: col.projects.filter((p) => p.id !== activeData.project.id),
            };
          }
          if (col.id === targetColumnId) {
            const newProjects = [...col.projects];
            const updatedProject = { ...activeData.project, status: targetColumnId };
            
            // Find insertion index
            let insertIndex = targetIndex;
            if (overId.startsWith("card-")) {
              const overProjectId = overId.replace("card-", "");
              const overIndex = newProjects.findIndex((p) => p.id === overProjectId);
              if (overIndex !== -1) {
                insertIndex = overIndex;
              }
            }
            
            newProjects.splice(insertIndex, 0, updatedProject);
            return {
              ...col,
              projects: newProjects,
            };
          }
          return col;
        });

        return { ...prev, columns: newColumns };
      });

      // Update active data
      setActiveProject((prev) =>
        prev ? { ...prev, status: targetColumnId! } : undefined
      );
    },
    [getActiveData, boardData.columns]
  );

  // Drag end handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        setActiveType(null);
        setActiveProject(undefined);
        setActiveColumn(undefined);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;
      const activeData = getActiveData(activeId);

      if (!activeData) {
        setActiveId(null);
        setActiveType(null);
        setActiveProject(undefined);
        setActiveColumn(undefined);
        return;
      }

      if (activeData.type === "card") {
        // Handle card drop
        let targetColumnId: ColumnStatus | null = null;

        if (overId.startsWith("column-")) {
          targetColumnId = overId.replace("column-", "") as ColumnStatus;
        } else if (overId.startsWith("card-")) {
          const overProjectId = overId.replace("card-", "");
          for (const col of boardData.columns) {
            if (col.projects.find((p) => p.id === overProjectId)) {
              targetColumnId = col.id;
              break;
            }
          }
        } else if (overId.startsWith("column-droppable-")) {
          targetColumnId = overId.replace("column-droppable-", "") as ColumnStatus;
        }

        if (targetColumnId && targetColumnId !== activeData.project.status) {
          onStatusChange?.(activeData.project.id, targetColumnId);
          announce(
            `Moved project ${activeData.project.name} to ${targetColumnId} column`
          );
        } else {
          // Card was reordered within same column
          const column = boardData.columns.find((c) => c.id === activeData.columnId);
          if (column) {
            const newIndex = column.projects.findIndex((p) => p.id === activeData.project.id);
            const projectIds = column.projects.map((p) => p.id);
            onOrderChange?.(activeData.columnId, projectIds);
          }
          announce(`Reordered project ${activeData.project.name}`);
        }
      } else if (activeData.type === "column") {
        // Handle column reorder
        if (activeId !== overId && overId.startsWith("column-")) {
          const oldIndex = boardData.columnOrder.indexOf(activeData.column.id);
          const newColumnId = overId.replace("column-", "") as ColumnStatus;
          const newIndex = boardData.columnOrder.indexOf(newColumnId);

          const newOrder = arrayMove(boardData.columnOrder, oldIndex, newIndex);
          setBoardData((prev) => ({ ...prev, columnOrder: newOrder }));
          announce(`Moved ${activeData.column.title} column to position ${newIndex + 1}`);
        }
      }

      setActiveId(null);
      setActiveType(null);
      setActiveProject(undefined);
      setActiveColumn(undefined);
    },
    [getActiveData, boardData.columns, boardData.columnOrder, onStatusChange, onOrderChange, announce]
  );

  // Drag cancel handler
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
    setActiveProject(undefined);
    setActiveColumn(undefined);
    announce("Drag cancelled");
  }, [announce]);

  // Drop animation configuration
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  // Toggle column visibility
  const toggleColumn = useCallback((columnId: ColumnStatus) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  }, []);

  // Filtered columns based on visibility
  const visibleBoardColumns = useMemo(
    () =>
      boardData.columnOrder
        .map((id) => boardData.columns.find((c) => c.id === id)!)
        .filter((col) => visibleColumns.includes(col.id)),
    [boardData.columns, boardData.columnOrder, visibleColumns]
  );

  // Column IDs for SortableContext
  const columnIds = useMemo(
    () => visibleBoardColumns.map((col) => `column-${col.id}`),
    [visibleBoardColumns]
  );

  // Select all visible cards
  const handleSelectAll = useCallback(() => {
    const allVisibleIds = visibleBoardColumns.flatMap((col) =>
      col.projects.map((p) => p.id)
    );
    onSelectAll?.(allVisibleIds);
  }, [visibleBoardColumns, onSelectAll]);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    onSelectAll?.([]);
  }, [onSelectAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Screen Reader Announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "board" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="board" className="gap-2">
                <Columns className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-[200px] lg:w-[280px]"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selection Info */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedIds.length} selected
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={handleClearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Columns
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {visibleColumns.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {boardData.columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={visibleColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    {col.title}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {col.projects.length}
                    </Badge>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSelectAll}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Select All Visible
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={selectedIds.length === 0}>
                Export Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Project */}
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex items-start gap-4 p-4 min-w-max h-full">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {visibleBoardColumns.map((column, index) => (
                <ColumnComponent
                  key={column.id}
                  column={column}
                  index={index}
                  selectedCardIds={selectedIds}
                  onCardSelect={onSelect}
                  onCardEdit={onEdit}
                  onCardDuplicate={onDuplicate}
                  onCardArchive={onArchive}
                  onCardDelete={onDelete}
                  showCheckboxes={showCheckboxes}
                />
              ))}
            </SortableContext>

            {/* Add Column Placeholder */}
            <Button
              variant="outline"
              className="w-[280px] h-12 border-dashed border-2"
              disabled
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </div>
        </div>

        {/* Drag Overlay */}
        <KanbanDragOverlay
          activeId={activeId}
          activeType={activeType}
          activeProject={activeProject}
          activeColumn={activeColumn}
        />
      </DndContext>
    </div>
  );
}
