"use client";

import * as React from "react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// TYPES
// ============================================

type DateRangePreset = {
  label: string;
  getValue: () => DateRange;
};

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
  presets?: boolean;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

// ============================================
// PRESETS
// ============================================

const defaultPresets: DateRangePreset[] = [
  {
    label: "Today",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = addDays(new Date(), -1);
      return {
        from: yesterday,
        to: yesterday,
      };
    },
  },
  {
    label: "Last 7 days",
    getValue: () => ({
      from: addDays(new Date(), -6),
      to: new Date(),
    }),
  },
  {
    label: "Last 14 days",
    getValue: () => ({
      from: addDays(new Date(), -13),
      to: new Date(),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      from: addDays(new Date(), -29),
      to: new Date(),
    }),
  },
  {
    label: "This week",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: "Last week",
    getValue: () => {
      const lastWeek = addDays(new Date(), -7);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      };
    },
  },
  {
    label: "This month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "This year",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

// ============================================
// FORMATTER
// ============================================

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) {
    return "Pick a date range";
  }

  if (!range.to) {
    return format(range.from, "MMM d, yyyy");
  }

  if (isSameDay(range.from, range.to)) {
    return format(range.from, "MMM d, yyyy");
  }

  // Same month
  if (range.from.getMonth() === range.to.getMonth() && 
      range.from.getFullYear() === range.to.getFullYear()) {
    return `${format(range.from, "MMM d")} - ${format(range.to, "d, yyyy")}`;
  }

  // Same year
  if (range.from.getFullYear() === range.to.getFullYear()) {
    return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`;
  }

  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

// ============================================
// DATE RANGE PICKER
// ============================================

export function DateRangePicker({
  value,
  onChange,
  className,
  align = "start",
  presets = true,
  placeholder = "Pick a date range",
  disabled,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value?.from ?? new Date());

  // Update month when value changes externally
  React.useEffect(() => {
    if (value?.from) {
      setMonth(value.from);
    }
  }, [value?.from]);

  const handlePresetSelect = (preset: DateRangePreset) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const displayValue = formatDateRange(value);
  const hasValue = value?.from != null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !hasValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{displayValue}</span>
          {hasValue && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="ml-2 rounded-sm opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-4 w-4" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets */}
          {presets && (
            <div className="border-r p-2 space-y-1 min-w-[140px] max-h-[360px] overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick select
              </div>
              {defaultPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          {/* Calendar */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(month, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMonth((m) => addDays(endOfMonth(m), 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Calendar
              initialFocus
              mode="range"
              defaultMonth={month}
              month={month}
              onMonthChange={setMonth}
              selected={value}
              onSelect={(range) => {
                onChange(range);
                if (range?.from && range?.to) {
                  setIsOpen(false);
                }
              }}
              numberOfMonths={1}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
            />

            {/* Selected range display */}
            {hasValue && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Selected:</span>
                  <span className="font-medium">{displayValue}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={!value?.from || !value?.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// SINGLE DATE PICKER
// ============================================

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  className,
  align = "start",
  placeholder = "Pick a date",
  disabled,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const displayValue = value ? format(value, "MMM d, yyyy") : placeholder;
  const hasValue = value != null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !hasValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{displayValue}</span>
          {hasValue && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="ml-2 rounded-sm opacity-50 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="p-3">
          <Calendar
            initialFocus
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setIsOpen(false);
            }}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// EXPORTS
// ============================================

export type { DateRangePickerProps, DatePickerProps, DateRangePreset };
