"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Settings,
  User,
  LogOut,
  Plus,
  Home,
  BarChart3,
  Users,
  Mail,
  Calendar,
  HelpCircle,
  Command,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { modalOverlayVariants, modalContentVariants } from "@/lib/animations";

// ============================================
// TYPES
// ============================================

type CommandAction = () => void | Promise<void>;

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  shortcut?: string;
  action: CommandAction;
  keywords?: string[];
  section?: string;
  badge?: string;
}

interface CommandSection {
  title: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  commands?: CommandItem[];
  sections?: CommandSection[];
  className?: string;
  placeholder?: string;
  shortcut?: string;
  onOpenChange?: (open: boolean) => void;
}

// ============================================
// DEFAULT COMMANDS
// ============================================

const defaultCommands: CommandItem[] = [
  {
    id: "home",
    title: "Go to Dashboard",
    subtitle: "View your main dashboard",
    icon: Home,
    shortcut: "G D",
    action: () => (window.location.href = "/dashboard"),
    keywords: ["home", "main", "start"],
    section: "Navigation",
  },
  {
    id: "projects",
    title: "View Projects",
    subtitle: "Manage your projects",
    icon: FileText,
    shortcut: "G P",
    action: () => (window.location.href = "/dashboard/projects"),
    keywords: ["projects", "files"],
    section: "Navigation",
  },
  {
    id: "analytics",
    title: "View Analytics",
    subtitle: "See your analytics and reports",
    icon: BarChart3,
    shortcut: "G A",
    action: () => (window.location.href = "/dashboard/analytics"),
    keywords: ["stats", "reports", "metrics"],
    section: "Navigation",
  },
  {
    id: "guests",
    title: "Manage Guests",
    subtitle: "View and edit guest list",
    icon: Users,
    shortcut: "G G",
    action: () => (window.location.href = "/dashboard/guests"),
    keywords: ["guests", "people", "attendees"],
    section: "Navigation",
  },
  {
    id: "messages",
    title: "Messages",
    subtitle: "View your messages",
    icon: Mail,
    shortcut: "G M",
    action: () => (window.location.href = "/dashboard/messages"),
    keywords: ["email", "inbox", "communications"],
    section: "Navigation",
    badge: "3",
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "View events calendar",
    icon: Calendar,
    shortcut: "G C",
    action: () => (window.location.href = "/dashboard/calendar"),
    keywords: ["events", "schedule", "dates"],
    section: "Navigation",
  },
  {
    id: "new-project",
    title: "Create New Project",
    subtitle: "Start a new invitation project",
    icon: Plus,
    shortcut: "C P",
    action: () => (window.location.href = "/dashboard/projects/new"),
    keywords: ["new", "create", "add", "project"],
    section: "Actions",
    badge: "New",
  },
  {
    id: "new-invitation",
    title: "Create Invitation",
    subtitle: "Design a new invitation",
    icon: Sparkles,
    shortcut: "C I",
    action: () => (window.location.href = "/dashboard/invitations/new"),
    keywords: ["new", "create", "design", "invitation"],
    section: "Actions",
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "Manage your account settings",
    icon: Settings,
    shortcut: "G S",
    action: () => (window.location.href = "/dashboard/settings"),
    keywords: ["preferences", "config", "options"],
    section: "Settings",
  },
  {
    id: "profile",
    title: "Profile",
    subtitle: "View and edit your profile",
    icon: User,
    shortcut: "G U",
    action: () => (window.location.href = "/dashboard/profile"),
    keywords: ["account", "user", "personal"],
    section: "Settings",
  },
  {
    id: "help",
    title: "Help & Support",
    subtitle: "Get help with EIOS",
    icon: HelpCircle,
    shortcut: "?",
    action: () => (window.location.href = "/help"),
    keywords: ["support", "docs", "documentation"],
    section: "Help",
  },
  {
    id: "logout",
    title: "Log Out",
    subtitle: "Sign out of your account",
    icon: LogOut,
    action: () => {
      // Handle logout
      window.location.href = "/auth/logout";
    },
    keywords: ["sign out", "exit", "leave"],
    section: "Account",
  },
];

// ============================================
// HIGHLIGHT MATCH
// ============================================

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-rose-200 text-rose-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================

export function CommandPalette({
  commands = defaultCommands,
  sections: customSections,
  className,
  placeholder = "Type a command or search...",
  shortcut = "⌘K",
  onOpenChange,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Group commands into sections
  const sections = React.useMemo(() => {
    if (customSections) return customSections;

    const grouped = commands.reduce((acc, item) => {
      const section = item.section || "Other";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    }, {} as Record<string, CommandItem[]>);

    return Object.entries(grouped).map(([title, items]) => ({
      title,
      items,
    }));
  }, [commands, customSections]);

  // Filter items based on query
  const filteredSections = React.useMemo(() => {
    if (!query) return sections;

    const q = query.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesSubtitle = item.subtitle?.toLowerCase().includes(q);
          const matchesKeywords = item.keywords?.some((k) =>
            k.toLowerCase().includes(q)
          );
          return matchesTitle || matchesSubtitle || matchesKeywords;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

  // Flatten for keyboard navigation
  const flatItems = React.useMemo(
    () => filteredSections.flatMap((s) => s.items),
    [filteredSections]
  );

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) {
          item.action();
          setIsOpen(false);
          setQuery("");
        }
        break;
    }
  };

  // Notify parent of open state
  React.useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Scroll selected into view
  React.useEffect(() => {
    const element = document.querySelector(`[data-index="${selectedIndex}"]`);
    element?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  let itemIndex = 0;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border transition-colors",
          className
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-background rounded border">
          {shortcut}
        </kbd>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            <motion.div
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-2xl mx-4 bg-background rounded-xl shadow-2xl border overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-muted rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto py-2"
              >
                {filteredSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      No results found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  filteredSections.map((section, sectionIdx) => (
                    <div key={section.title}>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {section.title}
                      </div>
                      <ul>
                        {section.items.map((item) => {
                          const currentIndex = itemIndex++;
                          const isSelected = currentIndex === selectedIndex;
                          const Icon = item.icon;

                          return (
                            <li
                              key={item.id}
                              data-index={currentIndex}
                              onClick={() => {
                                item.action();
                                setIsOpen(false);
                                setQuery("");
                              }}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-rose-500/10 text-rose-900"
                                  : "hover:bg-muted"
                              )}
                            >
                              {Icon && (
                                <Icon
                                  className={cn(
                                    "h-5 w-5",
                                    isSelected
                                      ? "text-rose-600"
                                      : "text-muted-foreground"
                                  )}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">
                                  {highlightMatch(item.title, query)}
                                </div>
                                {item.subtitle && (
                                  <div className="text-xs text-muted-foreground">
                                    {highlightMatch(item.subtitle, query)}
                                  </div>
                                )}
                              </div>
                              {item.badge && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                              {item.shortcut && (
                                <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 text-xs bg-muted rounded">
                                  {item.shortcut}
                                </kbd>
                              )}
                              {isSelected && (
                                <ArrowRight className="h-4 w-4 text-rose-600" />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-background rounded border">
                      ↓
                    </kbd>
                    <span className="ml-1">to navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border">
                      ↵
                    </kbd>
                    <span className="ml-1">to select</span>
                  </span>
                </div>
                <span>EIOS Command</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// EXPORTS
// ============================================

export type { CommandItem, CommandSection, CommandAction };
export { defaultCommands };
