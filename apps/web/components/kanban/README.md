# Kanban Board Components

A sophisticated drag-and-drop project management system built with `@dnd-kit`.

## Features

- **Drag & Drop**: Smooth, accessible drag-and-drop for both cards and columns
- **Keyboard Navigation**: Full keyboard support (arrow keys, space, escape)
- **Screen Reader Support**: ARIA labels and live announcements
- **Bulk Actions**: Select and perform actions on multiple cards
- **Responsive Design**: Works on desktop and touch devices
- **Smooth Animations**: Polished visual feedback during interactions

## Components

### `KanbanBoard`

The main board container that manages the DnD context and state.

```tsx
import { KanbanBoard } from "@/components/kanban";

<KanbanBoard
  projects={projects}
  isLoading={false}
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
```

### `KanbanColumn`

Individual column component representing a status (draft, active, archived).

```tsx
import { KanbanColumn } from "@/components/kanban";

<KanbanColumn
  column={column}
  index={0}
  selectedCardIds={[]}
  onCardSelect={handleSelect}
  onCardEdit={handleEdit}
  showCheckboxes={true}
/>
```

### `KanbanCard`

Individual project card with rich preview.

```tsx
import { KanbanCard } from "@/components/kanban";

<KanbanCard
  project={project}
  index={0}
  columnId="active"
  isSelected={false}
  onSelect={handleSelect}
  showCheckbox={true}
/>
```

## Hooks

### `useKanbanBoard`

A hook for managing Kanban board state and actions.

```tsx
import { useKanbanBoard } from "@/hooks/useKanbanBoard";

const {
  selectedIds,
  isProcessing,
  toggleSelection,
  selectAll,
  clearSelection,
  handleStatusChange,
  handleDuplicate,
  handleArchive,
  handleDelete,
} = useKanbanBoard();
```

## Types

### `ColumnStatus`

```ts
type ColumnStatus = "draft" | "active" | "archived";
```

### `KanbanColumn`

```ts
interface KanbanColumn {
  id: ColumnStatus;
  title: string;
  color: string;
  projects: Project[];
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Lift/Drop item |
| `↑↓←→` | Move item |
| `Esc` | Cancel drag |
| `Tab` | Navigate between items |

## Accessibility

- Full keyboard navigation support
- Screen reader announcements for drag operations
- ARIA labels on all interactive elements
- Focus management during drag operations
- Reduced motion support via `prefers-reduced-motion`

## Styling

The components use Tailwind CSS for styling. Custom styles can be applied via:

- CSS classes on the component
- Tailwind utility classes
- CSS custom properties (see `styles/globals.css`)

## Dependencies

- `@dnd-kit/core` - Core DnD functionality
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - Utilities for DnD
