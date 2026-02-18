"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import {
  Search,
  Home,
  FolderKanban,
  Settings,
  Plus,
  Mail,
  Download,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

// Types
interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  group: string;
  action: () => void;
  keywords?: string[];
}

interface RecentProject {
  id: string;
  name: string;
  visitedAt: Date;
}

// HTML escape utility to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Mock recent projects - in real app, this would come from localStorage or API
const getRecentProjects = (): RecentProject[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("eios_recent_projects");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch {
      return [];
    }
  }
  return [
    { id: "1", name: "Sarah's Wedding", visitedAt: new Date() },
    { id: "2", name: "Birthday Party 2024", visitedAt: new Date(Date.now() - 86400000) },
    { id: "3", name: "Corporate Event", visitedAt: new Date(Date.now() - 172800000) },
  ];
};

// Fuzzy search implementation
function fuzzySearch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  // Sanitize the text first to prevent XSS
  const safeText = escapeHtml(text);
  const safeQuery = escapeHtml(query);
  
  const parts: { text: string; match: boolean }[] = [];
  const textLower = safeText.toLowerCase();
  const queryLower = safeQuery.toLowerCase();
  
  let lastIndex = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      if (i > lastIndex) {
        parts.push({ text: safeText.slice(lastIndex, i), match: false });
      }
      parts.push({ text: safeText[i], match: true });
      lastIndex = i + 1;
      queryIndex++;
    }
  }
  
  if (lastIndex < safeText.length) {
    parts.push({ text: safeText.slice(lastIndex), match: false });
  }
  
  return (
    <>
      {parts.map((part, i) => (
        <span
          key={i}
          className={cn(
            part.match && "bg-rose-200 text-rose-900 rounded px-0.5"
          )}
          dangerouslySetInnerHTML={{ __html: part.text }}
        />
      ))}
    </>
  );
}

// Stable command definitions - defined outside component to prevent recreation
const NAV_COMMANDS: Omit<CommandItem, "action">[] = [
  {
    id: "nav-dashboard",
    title: "Go to Dashboard",
    description: "View your projects overview",
    icon: <Home className="w-4 h-4" />,
    shortcut: "G D",
    group: "Navigation",
    keywords: ["home", "overview", "main"],
  },
  {
    id: "nav-projects",
    title: "Go to Projects",
    description: "Browse all your projects",
    icon: <FolderKanban className="w-4 h-4" />,
    shortcut: "G P",
    group: "Navigation",
    keywords: ["projects", "list", "all"],
  },
  {
    id: "nav-settings",
    title: "Go to Settings",
    description: "Manage your account settings",
    icon: <Settings className="w-4 h-4" />,
    shortcut: "G S",
    group: "Navigation",
    keywords: ["preferences", "config", "account"],
  },
];

const ACTION_COMMANDS: Omit<CommandItem, "action">[] = [
  {
    id: "action-create",
    title: "Create Project",
    description: "Start a new invitation project",
    icon: <Plus className="w-4 h-4" />,
    shortcut: "C P",
    group: "Actions",
    keywords: ["new", "add", "start"],
  },
  {
    id: "action-invite",
    title: "Send Invites",
    description: "Send invitations to your guests",
    icon: <Mail className="w-4 h-4" />,
    group: "Actions",
    keywords: ["email", "send", "guests"],
  },
  {
    id: "action-export",
    title: "Export Data",
    description: "Export your project data",
    icon: <Download className="w-4 h-4" />,
    group: "Actions",
    keywords: ["download", "backup", "save"],
  },
];

const HELP_COMMANDS: Omit<CommandItem, "action">[] = [
  {
    id: "help-docs",
    title: "Documentation",
    description: "Read our guides and tutorials",
    icon: <FileText className="w-4 h-4" />,
    group: "Help",
    keywords: ["docs", "guide", "tutorial", "help"],
  },
  {
    id: "help-support",
    title: "Support",
    description: "Get help from our team",
    icon: <HelpCircle className="w-4 h-4" />,
    group: "Help",
    keywords: ["contact", "help", "assist"],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Load recent projects on mount
  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, []);

  // Build commands with actions - only depends on recentProjects
  const commands = useMemo<CommandItem[]>(() => {
    const navCommands: CommandItem[] = NAV_COMMANDS.map((cmd) => ({
      ...cmd,
      action: () => {
        switch (cmd.id) {
          case "nav-dashboard":
            router.push("/dashboard");
            break;
          case "nav-projects":
            router.push("/dashboard/projects");
            break;
          case "nav-settings":
            router.push("/dashboard/settings");
            break;
        }
      },
    }));

    const actionCommands: CommandItem[] = ACTION_COMMANDS.map((cmd) => ({
      ...cmd,
      action: () => {
        switch (cmd.id) {
          case "action-create":
            router.push("/dashboard/projects/new");
            break;
          case "action-invite":
            router.push("/dashboard/invites");
            break;
          case "action-export":
            router.push("/dashboard/export");
            break;
        }
      },
    }));

    const recentCommands: CommandItem[] = recentProjects.map((project) => ({
      id: `recent-${project.id}`,
      title: project.name,
      description: `Last visited ${new Date(project.visitedAt).toLocaleDateString()}`,
      icon: <Clock className="w-4 h-4" />,
      group: "Recent",
      action: () => router.push(`/dashboard/projects/${project.id}`),
      keywords: ["recent", "history"],
    }));

    const helpCommands: CommandItem[] = HELP_COMMANDS.map((cmd) => ({
      ...cmd,
      action: () => {
        if (cmd.id === "help-docs") {
          window.open("/docs", "_blank");
        } else if (cmd.id === "help-support") {
          router.push("/support");
        }
      },
    }));

    return [...navCommands, ...actionCommands, ...recentCommands, ...helpCommands];
  }, [router, recentProjects]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    
    return commands.filter((cmd) => {
      const text = `${cmd.title} ${cmd.description || ""} ${cmd.keywords?.join(" ") || ""}`;
      return fuzzySearch(searchQuery, text);
    });
  }, [commands, searchQuery]);

  // Group commands
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Get flat list for keyboard navigation
  const flatCommands = useMemo(() => filteredCommands, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
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
          setSelectedIndex((prev) => (prev + 1) % flatCommands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatCommands.length) % flatCommands.length);
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            setIsOpen(false);
            setSearchQuery("");
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchQuery("");
          break;
      }
    },
    [flatCommands, selectedIndex]
  );

  // Scroll selected item into view
  useEffect(() => {
    const element = itemRefs.current.get(selectedIndex);
    element?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery("");
    }
  }, [router]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-expanded={false}
        aria-haspopup="dialog"
        aria-label="Open command palette"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-background border rounded">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-[640px] mx-4"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="bg-background rounded-xl shadow-2xl border overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b">
                  <Search className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                    role="combobox"
                    aria-expanded={flatCommands.length > 0}
                    aria-controls="command-list"
                    aria-activedescendant={flatCommands[selectedIndex]?.id}
                  />
                  <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd>
                </div>

                {/* Results */}
                <div
                  ref={listRef}
                  id="command-list"
                  role="listbox"
                  className="max-h-[400px] overflow-y-auto p-2"
                >
                  {flatCommands.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No results found for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Try different keywords or check your spelling
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedCommands).map(([group, items]) => (
                      <div key={group} className="mb-4 last:mb-0">
                        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {group}
                        </h3>
                        <div className="space-y-1">
                          {items.map((cmd) => {
                            const globalIndex = flatCommands.findIndex((c) => c.id === cmd.id);
                            const isSelected = globalIndex === selectedIndex;

                            return (
                              <button
                                key={cmd.id}
                                id={cmd.id}
                                ref={(el) => {
                                  if (el) itemRefs.current.set(globalIndex, el);
                                }}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  cmd.action();
                                  setIsOpen(false);
                                  setSearchQuery("");
                                }}
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
                                    "p-1.5 rounded-md",
                                    isSelected ? "bg-rose-200" : "bg-muted"
                                  )}
                                  aria-hidden="true"
                                >
                                  {cmd.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">
                                    {highlightMatch(cmd.title, searchQuery)}
                                  </p>
                                  {cmd.description && (
                                    <p
                                      className={cn(
                                        "text-xs truncate",
                                        isSelected
                                          ? "text-rose-700"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      {cmd.description}
                                    </p>
                                  )}
                                </div>
                                {cmd.shortcut && (
                                  <kbd
                                    className={cn(
                                      "px-1.5 py-0.5 text-xs rounded hidden sm:block",
                                      isSelected
                                        ? "bg-rose-200 text-rose-800"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {cmd.shortcut}
                                  </kbd>
                                )}
                                {isSelected && (
                                  <ArrowRight className="w-4 h-4 opacity-50" aria-hidden="true" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background border rounded">↑↓</kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background border rounded">↵</kbd>
                      to select
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    EIOS Command Palette
                  </span>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
