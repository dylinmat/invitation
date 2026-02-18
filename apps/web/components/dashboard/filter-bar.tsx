"use client";

import { Search, X, Calendar, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectFilters } from "@/hooks/useDashboard";
import { cn, debounce } from "@/lib/utils";
import { useCallback, useState, useEffect } from "react";

interface FilterBarProps {
  filters: ProjectFilters;
  onSearchChange: (search: string) => void;
  onStatusToggle: (status: "draft" | "active" | "archived") => void;
  onClearStatus: () => void;
  onSortByChange: (sortBy: ProjectFilters["sortBy"]) => void;
  onSortOrderToggle: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  totalCount: number;
}

const statusOptions: { value: "draft" | "active" | "archived"; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const sortOptions: { value: ProjectFilters["sortBy"]; label: string }[] = [
  { value: "date", label: "Event Date" },
  { value: "name", label: "Name" },
  { value: "guests", label: "Guest Count" },
  { value: "rsvp", label: "RSVP Count" },
];

export function FilterBar({
  filters,
  onSearchChange,
  onStatusToggle,
  onClearStatus,
  onSortByChange,
  onSortOrderToggle,
  onClearFilters,
  hasActiveFilters,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce search input
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearchChange(value);
    }, 300),
    [onSearchChange]
  );

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  return (
    <div className="space-y-3">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-9 pr-9 h-10"
            style={{ borderRadius: "8px" }}
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 px-3",
                filters.status.length > 0 && "border-[#E8D5D0] bg-[#FDF8F5]"
              )}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Status
              {filters.status.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 px-1.5 text-xs"
                >
                  {filters.status.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onStatusToggle(option.value)}
                className="flex items-center justify-between"
              >
                <span className="capitalize">{option.label}</span>
                {filters.status.includes(option.value) && (
                  <span className="text-[#8B6B5D]">✓</span>
                )}
              </DropdownMenuItem>
            ))}
            {filters.status.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClearStatus}>
                  Clear filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 px-3">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortByChange(option.value)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {filters.sortBy === option.value && (
                  <span className="text-[#8B6B5D]">✓</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSortOrderToggle}>
              <span>Order: {filters.sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Status Filters */}
          {filters.status.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="capitalize gap-1 pr-1 bg-[#FDF8F5] border border-[#E8D5D0] text-[#5D4037] hover:bg-[#F5EBE6]"
            >
              {status}
              <button
                onClick={() => onStatusToggle(status)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {/* Clear All Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{resultCount}</span> of{" "}
          <span className="font-medium text-foreground">{totalCount}</span>{" "}
          projects
        </p>
      </div>
    </div>
  );
}
