"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "./dropdown-menu";
import { Badge } from "./badge";
import { listItemVariants, staggerContainer } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  filterable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  className?: string;
  searchable?: boolean;
  searchKeys?: string[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  rowActions?: {
    label: string;
    icon?: LucideIcon;
    onClick: (row: T) => void;
    variant?: "default" | "destructive";
  }[];
  emptyState?: React.ReactNode;
  loading?: boolean;
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  onExport?: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function useTableState<T>(
  data: T[],
  options: {
    searchable?: boolean;
    searchKeys?: string[];
    sortable?: boolean;
    pagination?: boolean;
    pageSize?: number;
    selectable?: boolean;
  }
) {
  const {
    searchable,
    searchKeys,
    sortable,
    pagination,
    pageSize: initialPageSize = 10,
    selectable,
  } = options;

  // Search
  const [searchQuery, setSearchQuery] = React.useState("");

  // Sort
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  // Selection
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  // Filter
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});

  // Process data
  const processedData = React.useMemo(() => {
    let result = [...data];

    // Search
    if (searchable && searchQuery && searchKeys) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) => {
          const value = (row as Record<string, unknown>)[key];
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (sortable && sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortColumn];
        const bVal = (b as Record<string, unknown>)[sortColumn];
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchable, searchQuery, searchKeys, sortable, sortColumn, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = pagination
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;

  // Handlers
  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean, keyExtractor: (row: T) => string) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(keyExtractor)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    const newSet = new Set(selectedRows);
    if (checked) {
      newSet.add(key);
    } else {
      newSet.delete(key);
    }
    setSelectedRows(newSet);
  };

  return {
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedData,
    selectedRows,
    handleSelectAll,
    handleSelectRow,
    activeFilters,
    setActiveFilters,
  };
}

// ============================================
// DATA TABLE COMPONENT
// ============================================

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  searchable = true,
  searchKeys,
  sortable = true,
  filterable = true,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  onSelectionChange,
  onRowClick,
  rowActions,
  emptyState,
  loading,
  title,
  description,
  toolbar,
  onExport,
}: DataTableProps<T>) {
  const {
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedData,
    selectedRows,
    handleSelectAll,
    handleSelectRow,
  } = useTableState(data, {
    searchable,
    searchKeys,
    sortable,
    pagination,
    pageSize: initialPageSize,
    selectable,
  });

  // Notify selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selected = data.filter((row) => selectedRows.has(keyExtractor(row)));
      onSelectionChange(selected);
    }
  }, [selectedRows, data, keyExtractor, onSelectionChange]);

  const allSelected = paginatedData.length > 0 && paginatedData.every((row) =>
    selectedRows.has(keyExtractor(row))
  );
  const someSelected = paginatedData.some((row) =>
    selectedRows.has(keyExtractor(row))
  ) && !allSelected;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, processedData.length);
  const processedData = paginatedData; // Already processed in state

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {(title || description || searchable || toolbar || onExport) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] lg:w-[300px]"
                />
              </div>
            )}

            {toolbar}

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Selection info */}
      {selectable && selectedRows.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
        >
          <Check className="h-4 w-4 text-sage-600" />
          <span className="font-medium">{selectedRows.size}</span>
          <span className="text-muted-foreground">rows selected</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6"
            onClick={() => handleSelectAll(false, keyExtractor)}
          >
            Clear
          </Button>
        </motion.div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={allSelected}
                      data-state={someSelected ? "indeterminate" : undefined}
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean, keyExtractor)
                      }
                      aria-label="Select all"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      sortable && column.sortable && "cursor-pointer select-none"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      {column.header}
                      {sortable && column.sortable && (
                        <span className="ml-1">
                          {sortColumn === column.key ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 w-10"></th>}
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer(0.03)}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableSkeleton columns={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} />
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        columns.length +
                        (selectable ? 1 : 0) +
                        (rowActions ? 1 : 0)
                      }
                      className="px-4 py-12 text-center"
                    >
                      {emptyState || (
                        <div className="text-muted-foreground">
                          No data available
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => {
                    const key = keyExtractor(row);
                    const isSelected = selectedRows.has(key);

                    return (
                      <motion.tr
                        key={key}
                        variants={listItemVariants}
                        custom={index}
                        layout
                        className={cn(
                          "border-b last:border-0 transition-colors",
                          onRowClick && "cursor-pointer hover:bg-muted/50",
                          isSelected && "bg-muted"
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {selectable && (
                          <td
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectRow(key, checked as boolean)
                              }
                              aria-label={`Select row ${index + 1}`}
                            />
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              "px-4 py-3 text-sm",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right",
                              column.className
                            )}
                          >
                            {column.accessor(row)}
                          </td>
                        ))}
                        {rowActions && (
                          <td
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {rowActions.map((action, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={() => action.onClick(row)}
                                    className={cn(
                                      action.variant === "destructive" &&
                                        "text-red-600 focus:text-red-600"
                                    )}
                                  >
                                    {action.icon && (
                                      <action.icon className="mr-2 h-4 w-4" />
                                    )}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startIndex}</span> to{" "}
            <span className="font-medium">{endIndex}</span> of{" "}
            <span className="font-medium">{processedData.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 w-[80px] rounded-md border border-input bg-background px-2 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 text-sm">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TABLE SKELETON
// ============================================

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ============================================
// EXPORTS
// ============================================

export type { Column, DataTableProps, SortDirection };
export { useTableState };
