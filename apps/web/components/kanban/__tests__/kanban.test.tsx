/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "../board";
import { KanbanCard } from "../card";
import { KanbanColumn } from "../column";
import { Project } from "@/lib/api";
import { KanbanColumn as KanbanColumnType } from "../types";

// Mock Dnd-kit
jest.mock("@dnd-kit/core", () => ({
  ...jest.requireActual("@dnd-kit/core"),
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}));

jest.mock("@dnd-kit/sortable", () => ({
  ...jest.requireActual("@dnd-kit/sortable"),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Project data
const mockProject: Project = {
  id: "1",
  name: "Test Wedding",
  description: "A beautiful wedding",
  status: "active",
  eventDate: "2024-12-25",
  timezone: "UTC",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  orgId: "org-1",
  settings: {
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    language: "en",
    branding: {
      logo: null,
      primaryColor: "#8B6B5D",
      secondaryColor: "#E8D5D0",
    },
  },
  stats: {
    totalGuests: 100,
    totalInvites: 50,
    rsvpYes: 30,
    rsvpNo: 10,
    rsvpPending: 60,
  },
};

const mockColumn: KanbanColumnType = {
  id: "active",
  title: "Active",
  color: "#10b981",
  projects: [mockProject],
};

describe("KanbanCard", () => {
  const defaultProps = {
    project: mockProject,
    index: 0,
    columnId: "active" as const,
    isSelected: false,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onDuplicate: jest.fn(),
    onArchive: jest.fn(),
    onDelete: jest.fn(),
    showCheckbox: true,
  };

  it("renders project name", () => {
    render(<KanbanCard {...defaultProps} />);
    expect(screen.getByText("Test Wedding")).toBeInTheDocument();
  });

  it("renders project description", () => {
    render(<KanbanCard {...defaultProps} />);
    expect(screen.getByText("A beautiful wedding")).toBeInTheDocument();
  });

  it("renders guest count", () => {
    render(<KanbanCard {...defaultProps} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders invite count", () => {
    render(<KanbanCard {...defaultProps} />);
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("calls onSelect when checkbox is clicked", async () => {
    const user = userEvent.setup();
    render(<KanbanCard {...defaultProps} />);
    
    const checkbox = screen.getByLabelText("Select Test Wedding");
    await user.click(checkbox);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith("1");
  });

  it("has correct ARIA attributes", () => {
    render(<KanbanCard {...defaultProps} />);
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-label", expect.stringContaining("Project: Test Wedding"));
  });
});

describe("KanbanColumn", () => {
  const defaultProps = {
    column: mockColumn,
    index: 0,
    selectedCardIds: [],
    onCardSelect: jest.fn(),
    onCardEdit: jest.fn(),
    onCardDuplicate: jest.fn(),
    onCardArchive: jest.fn(),
    onCardDelete: jest.fn(),
    showCheckboxes: true,
  };

  it("renders column title", () => {
    render(<KanbanColumn {...defaultProps} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders project count", () => {
    render(<KanbanColumn {...defaultProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("has correct ARIA attributes", () => {
    render(<KanbanColumn {...defaultProps} />);
    const column = screen.getByRole("list");
    expect(column).toHaveAttribute("aria-label", expect.stringContaining("Active column"));
  });
});

describe("KanbanBoard", () => {
  const defaultProps = {
    projects: [mockProject],
    isLoading: false,
    selectedIds: [],
    onSelect: jest.fn(),
    onSelectAll: jest.fn(),
    onEdit: jest.fn(),
    onDuplicate: jest.fn(),
    onArchive: jest.fn(),
    onDelete: jest.fn(),
    onStatusChange: jest.fn(),
    onOrderChange: jest.fn(),
    showCheckboxes: true,
  };

  it("renders loading state", () => {
    render(<KanbanBoard {...defaultProps} isLoading={true} />);
    expect(screen.getByText("Loading board...")).toBeInTheDocument();
  });

  it("renders projects when loaded", () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByText("Test Wedding")).toBeInTheDocument();
  });

  it("renders toolbar with view toggle", () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /board/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /list/i })).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search projects...")).toBeInTheDocument();
  });
});
