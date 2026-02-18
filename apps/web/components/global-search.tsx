"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FolderKanban,
  Users,
  Mail,
  Settings,
  X,
  ArrowRight,
  Hash,
  Command,
} from "lucide-react";
import { cn, highlightText } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

// Types
export type SearchResultType = "project" | "guest" | "invite" | "setting";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  metadata?: Record<string, string>;
}

// Mock data
const mockProjects: SearchResult[] = [
  { id: "p1", type: "project", title: "Sarah's Wedding", description: "Elegant floral theme" },
  { id: "p2", type: "project", title: "Birthday Party 2024", description: "Tropical celebration" },
  { id: "p3", type: "project", title: "Corporate Event", description: "Annual gala dinner" },
  { id: "p4", type: "project", title: "Baby Shower", description: "Pastel colors theme" },
];

const mockGuests: SearchResult[] = [
  { id: "g1", type: "guest", title: "John Smith", description: "john@example.com", metadata: { phone: "+1234567890" } },
  { id: "g2", type: "guest", title: "Emma Wilson", description: "emma@example.com", metadata: { phone: "+0987654321" } },
  { id: "g3", type: "guest", title: "Michael Brown", description: "michael@example.com" },
  { id: "g4", type: "guest", title: "Lisa Davis", description: "lisa@example.com", metadata: { phone: "+1122334455" } },
];

const mockInvites: SearchResult[] = [
  { id: "i1", type: "invite", title: "INV-001", description: "Sent 2 days ago", metadata: { token: "abc123def" } },
  { id: "i2", type: "invite", title: "INV-002", description: "Sent 1 week ago", metadata: { token: "xyz789uvw" } },
  { id: "i3", type: "invite", title: "INV-003", description: "Sent yesterday", metadata: { token: "mno456pqr" } },
];

const mockSettings: SearchResult[] = [
  { id: "s1", type: "setting", title: "Profile Settings", description: "Update your personal information" },
  { id: "s2", type: "setting", title: "Notification Preferences", description: "Manage email and push notifications" },
  { id: "s3", type: "setting", title: "Billing & Subscription", description: "View and manage your plan" },
  { id: "s4", type: "setting", title: "Team Members", description: "Invite and manage collaborators" },
  { id: "s5", type: "setting", title: "API Keys", description: "Manage integration keys" },
];

// Search configuration
const searchConfig: Record<
  SearchResultType,
  {
    icon: React.ReactNode;
    label: string;
    shortcut: string;
    color: string;
  }
> = {
  project: {
    icon: <FolderKanban className="w-4 h-4" />,
    label: "Project",
    shortcut: "P",
    color: "text-blue-600 bg-blue-100",
  },
  guest: {
    icon: <Users className="w-4 h-4" />,
    label: "Guest",
    shortcut: "G",
    color: "text-green-600 bg-green-100",
  },
  invite: {
    icon: <Mail className="w-4 h-4" />,
    label: "Invite",
    shortcut: "I",
    color: "text-purple-600 bg-purple-100",
  },
  setting: {
    icon: <Settings className="w-4 h-4" />,
    label: "Setting",
    shortcut: "S",
    color: "text-amber-600 bg-amber-100",
  },
};

// Fuzzy search
function fuzzySearch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase().replace(/\s+/g, "");
  const textLower = text.toLowerCase().replace(/\s+/g, "");
  
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
}

interface GlobalSearchProps {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({
  onSelect,
  placeholder = "Search projects, guests, invites...",
  className,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<SearchResultType | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Combine all data
  const allResults = useMemo(
    () => [...mockProjects, ...mockGuests, ...mockInvites, ...mockSettings],
    []
  );

  // Filter results
  const filteredResults = useMemo(() => {
    let results = allResults;

    // Filter by type if selected
    if (selectedType) {
      results = results.filter((r) => r.type === selectedType);
    }

    // Filter by query
    if (query.trim()) {
      results = results.filter((r) => {
        const text = `${r.title} ${r.description || ""} ${Object.values(r.metadata || {}).join(" ")}`;
        return fuzzySearch(query, text);
      });
    }

    return results;
  }, [allResults, query, selectedType]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach((result) => {
      if (!groups[result.type]) groups[result.type] = [];
      groups[result.type].push(result);
    });
    return groups;
  }, [filteredResults]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "k",
      meta: true,
      handler: () => setIsOpen(true),
    },
    {
      key: "k",
      ctrl: true,
      handler: () => setIsOpen(true),
    },
  ]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredResults.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            handleSelect(filteredResults[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setQuery("");
          setSelectedType(null);
          break;
        case "p":
          if (e.metaKey || e.ctrlKey) break;
          if (!query && !selectedType) {
            e.preventDefault();
            setSelectedType("project");
          }
          break;
        case "g":
          if (!query && !selectedType) {
            e.preventDefault();
            setSelectedType("guest");
          }
          break;
        case "i":
          if (!query && !selectedType) {
            e.preventDefault();
            setSelectedType("invite");
          }
          break;
        case "s":
          if (!query && !selectedType) {
            e.preventDefault();
            setSelectedType("setting");
          }
          break;
      }
    },
    [filteredResults, selectedIndex, query, selectedType]
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedType]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect?.(result);
      setIsOpen(false);
      setQuery("");
      setSelectedType(null);
    },
    [onSelect]
  );

  // Inline search component
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors",
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex ml-auto px-1.5 py-0.5 text-xs bg-background border rounded">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-2xl mx-4"
          >
            <div className="bg-background rounded-xl shadow-2xl border overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedType ? `Search ${selectedType}s...` : placeholder}
                  className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                />
                {selectedType && (
                  <button
                    onClick={() => setSelectedType(null)}
                    className="px-2 py-1 text-xs bg-muted rounded-full hover:bg-muted/80"
                  >
                    {searchConfig[selectedType].label}
                    <X className="w-3 h-3 inline ml-1" />
                  </button>
                )}
                <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd>
              </div>

              {/* Type Filters */}
              {!query && !selectedType && (
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 overflow-x-auto">
                  <span className="text-xs text-muted-foreground mr-2">Jump to:</span>
                  {(Object.keys(searchConfig) as SearchResultType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-background border hover:border-primary transition-colors whitespace-nowrap"
                    >
                      {searchConfig[type].icon}
                      <span>{searchConfig[type].label}</span>
                      <kbd className="px-1 bg-muted rounded text-[10px]">
                        {searchConfig[type].shortcut}
                      </kbd>
                    </button>
                  ))}
                </div>
              )}

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {filteredResults.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Search className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      No results found for &quot;{query}&quot;
                    </p>
                    {selectedType && (
                      <button
                        onClick={() => setSelectedType(null)}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Search all categories
                      </button>
                    )}
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([type, items]) => {
                    const config = searchConfig[type as SearchResultType];
                    let itemIndex = 0;
                    
                    // Calculate starting index for this group
                    Object.keys(groupedResults).forEach((t) => {
                      if (t < type) {
                        itemIndex += groupedResults[t].length;
                      }
                    });

                    return (
                      <div key={type} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 px-3 py-2">
                          <span className={cn("p-1 rounded", config.color)}>
                            {config.icon}
                          </span>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {config.label}s
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            ({items.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {items.map((result, idx) => {
                            const globalIndex = itemIndex + idx;
                            const isSelected = globalIndex === selectedIndex;

                            return (
                              <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                                  isSelected
                                    ? "bg-rose-100 text-rose-900"
                                    : "hover:bg-muted text-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    "p-1.5 rounded-md flex-shrink-0",
                                    isSelected ? "bg-rose-200" : config.color
                                  )}
                                >
                                  {config.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">
                                    {highlightText(result.title, query)}
                                  </p>
                                  {result.description && (
                                    <p
                                      className={cn(
                                        "text-xs truncate",
                                        isSelected
                                          ? "text-rose-700"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      {result.type === "invite" && result.metadata?.token && (
                                        <span className="inline-flex items-center gap-1 mr-2">
                                          <Hash className="w-3 h-3" />
                                          {result.metadata.token}
                                        </span>
                                      )}
                                      {highlightText(result.description, query)}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background border rounded">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background border rounded">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  Global Search
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
