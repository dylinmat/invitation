"use client";

import { useState, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CalendarIcon,
  Search,
  Filter,
  X,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import {
  AuditLogFilters,
  AuditAction,
  AuditResourceType,
  AuditSeverity,
  AuditStatus,
  AUDIT_ACTION_CATEGORIES,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  AUDIT_SEVERITY_CONFIG,
} from "@/types/audit";

// ============================================================================
// Available Options
// ============================================================================

const ALL_ACTIONS = Object.values(AUDIT_ACTION_CATEGORIES).flat();

const RESOURCE_TYPES: AuditResourceType[] = [
  "user",
  "project",
  "site",
  "guest",
  "invite",
  "rsvp",
  "template",
  "asset",
  "team",
  "organization",
  "api_key",
  "webhook",
  "integration",
  "setting",
];

const SEVERITIES: AuditSeverity[] = ["info", "low", "medium", "high", "critical"];

const STATUSES: AuditStatus[] = ["success", "failure", "warning", "pending"];

// ============================================================================
// Date Range Presets
// ============================================================================

const DATE_PRESETS = [
  { label: "Last 24 hours", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

// ============================================================================
// Props
// ============================================================================

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function AuditLogFiltersComponent({
  filters,
  onFiltersChange,
  className,
}: AuditLogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || "");
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  // Count active filters
  const activeFilterCount = [
    filters.actions?.length,
    filters.resourceTypes?.length,
    filters.severities?.length,
    filters.statuses?.length,
    filters.startDate,
    filters.searchQuery,
  ].filter(Boolean).length;

  // Toggle array filter
  const toggleArrayFilter = useCallback(<T extends string>(
    key: keyof AuditLogFilters,
    value: T,
    currentValues?: T[]
  ) => {
    const values = currentValues || [];
    const newValues = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    
    onFiltersChange({
      ...filters,
      [key]: newValues.length > 0 ? newValues : undefined,
    });
  }, [filters, onFiltersChange]);

  // Handle date range change
  const handleDateRangeChange = useCallback((range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    onFiltersChange({
      ...filters,
      startDate: range.from ? startOfDay(range.from).toISOString() : undefined,
      endDate: range.to ? endOfDay(range.to).toISOString() : undefined,
    });
  }, [filters, onFiltersChange]);

  // Apply search
  const handleSearch = useCallback(() => {
    onFiltersChange({
      ...filters,
      searchQuery: searchQuery || undefined,
    });
  }, [filters, onFiltersChange, searchQuery]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDateRange({});
    onFiltersChange({});
  }, [onFiltersChange]);

  // Apply preset date range
  const applyPreset = useCallback((days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    handleDateRangeChange({ from, to });
  }, [handleDateRangeChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Date Range */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, users, or resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                onFiltersChange({ ...filters, searchQuery: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[240px]",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} -{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="border-b p-3">
              <p className="text-sm font-medium mb-2">Quick select</p>
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.days}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(range) =>
                handleDateRangeChange({
                  from: range?.from,
                  to: range?.to,
                })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <Accordion type="single" collapsible className="border rounded-lg">
        <AccordionItem value="filters" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Advanced Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Actions Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Actions</Label>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {Object.entries(AUDIT_ACTION_CATEGORIES).map(([category, actions]) => (
                    <div key={category}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {actions.map((action) => (
                          <label
                            key={action}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={filters.actions?.includes(action)}
                              onChange={() =>
                                toggleArrayFilter("actions", action, filters.actions)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="truncate">
                              {AUDIT_ACTION_LABELS[action]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Types Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Resource Types</Label>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                  {RESOURCE_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.resourceTypes?.includes(type)}
                        onChange={() =>
                          toggleArrayFilter("resourceTypes", type, filters.resourceTypes)
                        }
                        className="rounded border-gray-300"
                      />
                      <span>{AUDIT_RESOURCE_LABELS[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Severity Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Severity</Label>
                <div className="space-y-1">
                  {SEVERITIES.map((severity) => (
                    <label
                      key={severity}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.severities?.includes(severity)}
                        onChange={() =>
                          toggleArrayFilter("severities", severity, filters.severities)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className={cn("capitalize", AUDIT_SEVERITY_CONFIG[severity].color)}>
                        {AUDIT_SEVERITY_CONFIG[severity].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Status</Label>
                <div className="space-y-1">
                  {STATUSES.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.statuses?.includes(status)}
                        onChange={() =>
                          toggleArrayFilter("statuses", status, filters.statuses)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.actions?.map((action) => (
            <Badge
              key={action}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleArrayFilter("actions", action, filters.actions)}
            >
              {AUDIT_ACTION_LABELS[action]}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {filters.resourceTypes?.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleArrayFilter("resourceTypes", type, filters.resourceTypes)}
            >
              {AUDIT_RESOURCE_LABELS[type]}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {filters.severities?.map((severity) => (
            <Badge
              key={severity}
              variant="secondary"
              className={cn(
                "cursor-pointer hover:bg-destructive hover:text-destructive-foreground",
                AUDIT_SEVERITY_CONFIG[severity].color
              )}
              onClick={() => toggleArrayFilter("severities", severity, filters.severities)}
            >
              {AUDIT_SEVERITY_CONFIG[severity].label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
