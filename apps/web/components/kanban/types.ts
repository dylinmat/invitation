/**
 * Kanban Board Types
 * Type definitions for the drag-and-drop project management system
 */

import { Project } from "@/lib/api";

export type ColumnStatus = "draft" | "active" | "archived";

export interface KanbanColumnData {
  id: ColumnStatus;
  title: string;
  color: string;
  projects: Project[];
}

export interface KanbanBoardData {
  columns: KanbanColumnData[];
  columnOrder: ColumnStatus[];
}

export interface KanbanCardProps {
  project: Project;
  index: number;
  columnId: ColumnStatus;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (project: Project) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  showCheckbox?: boolean;
}

export interface KanbanColumnProps {
  column: KanbanColumnData;
  index: number;
  isSelected?: boolean;
  selectedCardIds?: string[];
  onCardSelect?: (id: string) => void;
  onCardEdit?: (project: Project) => void;
  onCardDuplicate?: (id: string) => void;
  onCardArchive?: (id: string) => void;
  onCardDelete?: (id: string) => void;
  showCheckboxes?: boolean;
}

export interface KanbanBoardProps {
  projects: Project[];
  isLoading?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onEdit?: (project: Project) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (projectId: string, newStatus: ColumnStatus) => void;
  onOrderChange?: (columnId: ColumnStatus, projectIds: string[]) => void;
  showCheckboxes?: boolean;
}

export interface DragOverlayProps {
  activeId: string | null;
  activeType: "card" | "column" | null;
  activeProject?: Project;
  activeColumn?: KanbanColumnData;
}

// DnD Kit specific types
export interface SortableCardData {
  type: "card";
  project: Project;
  columnId: ColumnStatus;
  index: number;
}

export interface SortableColumnData {
  type: "column";
  column: KanbanColumnData;
  index: number;
}

export type SortableData = SortableCardData | SortableColumnData;

// Accessibility announcements
export interface Announcement {
  message: string;
  type: "info" | "success" | "error";
}
