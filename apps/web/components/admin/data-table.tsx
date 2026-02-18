"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DataTable as BaseDataTable,
  Column,
  DataTableProps as BaseDataTableProps,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, parseISO } from "date-fns";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
} from "lucide-react";
import { DateRange } from "react-day-picker";

// Extended filter types
export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "between"
  | "isEmpty"
  | "isNotEmpty";

export interface FilterCondition<T = unknown> {
  field: keyof T | string;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown;
}

export interface AdminColumn<T> extends Column<T> {
  filterable?: boolean;
  filterType?: "text" | "select" | "date" | "number" | "boolean";
  filterOptions?: { label: string; value: unknown }[];
}

export interface AdminDataTableProps<T> extends Omit<BaseDataTableProps<T>, "columns"> {
  columns: AdminColumn<T>[];
  filters?: FilterCondition<T>[];
  onFiltersChange?: (filters: FilterCondition<T>[]) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onRefresh?: () => void;
  refreshInterval?: number;
  exportFileName?: string;
  enableAdvancedFilters?: boolean;
  // Server-side pagination props
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

// Advanced filter builder component
interface FilterBuilderProps<T> {
  columns: AdminColumn<T>[];
  filters: FilterCondition<T>[];
  onChange: (filters: FilterCondition<T>[]) => void;
}

function FilterBuilder<T>({ columns, filters, onChange }: FilterBuilderProps<T>) {
  const filterableColumns = columns.filter((col) => col.filterable);

  const addFilter = () => {
    if (filterableColumns.length === 0) return;
    const newFilter: FilterCondition<T> = {
      field: filterableColumns[0].key as keyof T,
      operator: "equals",
      value: "",
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition<T>>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const getOperatorOptions = (filterType?: string) => {
    const common = [
      { value: "equals", label: "equals" },
      { value: "notEquals", label: "does not equal" },
    ];

    switch (filterType) {
      case "text":
        return [
          ...common,
          { value: "contains", label: "contains" },
          { value: "notContains", label: "does not contain" },
          { value: "startsWith", label: "starts with" },
          { value: "endsWith", label: "ends with" },
          { value: "isEmpty", label: "is empty" },
          { value: "isNotEmpty", label: "is not empty" },
        ];
      case "number":
      case "date":
        return [
          ...common,
          { value: "gt", label: "greater than" },
          { value: "gte", label: "greater than or equal" },
          { value: "lt", label: "less than" },
          { value: "lte", label: "less than or equal" },
          { value: "between", label: "between" },
        ];
      case "boolean":
        return [{ value: "equals", label: "is" }];
      default:
        return common;
    }
  };

  if (filterableColumns.length === 0) return null;

  return (
    <div className="space-y-2">
      {filters.map((filter, index) => {
        const column = filterableColumns.find((c) => c.key === filter.field);
        const filterType = column?.filterType || "text";

        return (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={String(filter.field)}
              onValueChange={(value) =>
                updateFilter(index, { field: value as keyof T })
              }
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterableColumns.map((col) => (
                  <SelectItem key={col.key} value={col.key}>
                    {col.header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.operator}
              onValueChange={(value) =>
                updateFilter(index, { operator: value as FilterOperator })
              }
            >
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getOperatorOptions(filterType).map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filter.operator !== "isEmpty" && filter.operator !== "isNotEmpty" && (
              <>
                {filterType === "select" && column?.filterOptions ? (
                  <Select
                    value={String(filter.value)}
                    onValueChange={(value) =>
                      updateFilter(index, { value })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {column.filterOptions.map((opt) => (
                        <SelectItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : filterType === "boolean" ? (
                  <Select
                    value={String(filter.value)}
                    onValueChange={(value) =>
                      updateFilter(index, { value: value === "true" })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={filterType === "number" ? "number" : "text"}
                    value={String(filter.value || "")}
                    onChange={(e) =>
                      updateFilter(index, {
                        value:
                          filterType === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    className="w-[140px] h-8"
                    placeholder="Value..."
                  />
                )}

                {filter.operator === "between" && (
                  <Input
                    type={filterType === "number" ? "number" : "text"}
                    value={String(filter.value2 || "")}
                    onChange={(e) =>
                      updateFilter(index, {
                        value2:
                          filterType === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    className="w-[140px] h-8"
                    placeholder="End value..."
                  />
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => removeFilter(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={addFilter}
        className="w-full"
      >
        + Add Filter
      </Button>
    </div>
  );
}

// Main admin data table component
export function AdminDataTable<T>({
  columns,
  filters = [],
  onFiltersChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  refreshInterval,
  exportFileName = "export",
  enableAdvancedFilters = true,
  toolbar,
  // Server-side pagination props
  currentPage,
  totalItems,
  onPageChange,
  ...props
}: AdminDataTableProps<T>) {
  const [showFilters, setShowFilters] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<FilterCondition<T>[]>(filters);

  // Auto-refresh
  React.useEffect(() => {
    if (!refreshInterval || !onRefresh) return;
    const interval = setInterval(onRefresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  // Apply filters
  const applyFilters = () => {
    onFiltersChange?.(localFilters);
  };

  const clearFilters = () => {
    setLocalFilters([]);
    onFiltersChange?.([]);
  };

  // Export functionality
  const handleExport = () => {
    const data = props.data;
    const headers = columns.map((col) => col.header).join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = col.accessor(row);
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? "").replace(/"/g, '""');
          return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeFiltersCount = filters.length + (dateRange?.from ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          {props.searchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 w-[200px] lg:w-[300px]"
              />
            </div>
          )}

          {/* Date Range Filter */}
          {onDateRangeChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Advanced Filters */}
          {enableAdvancedFilters && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {localFilters.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <FilterBuilder
                    columns={columns}
                    filters={localFilters}
                    onChange={setLocalFilters}
                  />
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setLocalFilters(filters)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Active Filter Badges */}
          {filters.length > 0 &&
            filters.map((filter, index) => {
              const column = columns.find((c) => c.key === filter.field);
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {column?.header}: {filter.operator} {String(filter.value)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() =>
                      onFiltersChange?.(filters.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}

          {toolbar}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <BaseDataTable
        {...props}
        columns={columns}
        toolbar={null}
        onExport={undefined}
        // Disable internal pagination if server-side pagination is used
        pagination={!onPageChange}
      />
      
      {/* Server-side Pagination */}
      {onPageChange && totalItems !== undefined && currentPage !== undefined && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * (props.pageSize || 10)) + 1} to {Math.min(currentPage * (props.pageSize || 10), totalItems)} of {totalItems} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm px-2">
              Page {currentPage} of {Math.ceil(totalItems / (props.pageSize || 10))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalItems / (props.pageSize || 10))}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.ceil(totalItems / (props.pageSize || 10)))}
              disabled={currentPage >= Math.ceil(totalItems / (props.pageSize || 10))}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for filtering
export function applyFilters<T>(
  data: T[],
  filters: FilterCondition<T>[]
): T[] {
  if (!filters.length) return data;

  return data.filter((item) => {
    return filters.every((filter) => {
      const value = (item as Record<string, unknown>)[filter.field as string];
      const filterValue = filter.value;

      switch (filter.operator) {
        case "equals":
          return value === filterValue;
        case "notEquals":
          return value !== filterValue;
        case "contains":
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case "notContains":
          return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case "startsWith":
          return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
        case "endsWith":
          return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
        case "gt":
          return Number(value) > Number(filterValue);
        case "gte":
          return Number(value) >= Number(filterValue);
        case "lt":
          return Number(value) < Number(filterValue);
        case "lte":
          return Number(value) <= Number(filterValue);
        case "in":
          return (filterValue as unknown[]).includes(value);
        case "notIn":
          return !(filterValue as unknown[]).includes(value);
        case "between":
          const num = Number(value);
          return num >= Number(filterValue) && num <= Number(filter.value2);
        case "isEmpty":
          return value === null || value === undefined || value === "";
        case "isNotEmpty":
          return value !== null && value !== undefined && value !== "";
        default:
          return true;
      }
    });
  });
}

export function applyDateRange<T>(
  data: T[],
  dateRange: DateRange | undefined,
  dateField: keyof T
): T[] {
  if (!dateRange?.from) return data;

  return data.filter((item) => {
    const value = (item as Record<string, unknown>)[dateField as string];
    if (!value) return false;

    const date = typeof value === "string" ? parseISO(value) : new Date(value as string);
    if (dateRange.to) {
      return isWithinInterval(date, { start: dateRange.from, end: dateRange.to });
    }
    return date >= dateRange.from;
  });
}
