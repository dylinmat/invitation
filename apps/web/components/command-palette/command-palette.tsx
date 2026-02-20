"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "cmdk";
import {
  Calendar,
  Users,
  Settings,
  Plus,
  Home,
  Search,
  LayoutDashboard,
  Mail,
  ChartBar,
  Heart,
} from "lucide-react";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: "dashboard",
      title: "Go to Dashboard",
      description: "View your main dashboard",
      icon: LayoutDashboard,
      shortcut: "G D",
      href: "/dashboard",
      keywords: ["home", "main"],
    },
    {
      id: "events",
      title: "View All Events",
      description: "See all your events",
      icon: Calendar,
      shortcut: "G E",
      href: "/dashboard/business",
      keywords: ["calendar", "planning"],
    },
    {
      id: "couple-dashboard",
      title: "Couple Dashboard",
      description: "Wedding planning dashboard",
      icon: Heart,
      shortcut: "G C",
      href: "/dashboard/couple",
      keywords: ["wedding", "personal"],
    },
    {
      id: "new-event",
      title: "Create New Event",
      description: "Start planning a new event",
      icon: Plus,
      shortcut: "N E",
      href: "/events/new",
      keywords: ["add", "create", "plan"],
    },
    {
      id: "guests",
      title: "Manage Guests",
      description: "View and edit guest list",
      icon: Users,
      shortcut: "G G",
      href: "/guests",
      keywords: ["people", "attendees", "rsvp"],
    },
    {
      id: "messages",
      title: "Send Messages",
      description: "Email guests and contacts",
      icon: Mail,
      shortcut: "G M",
      href: "/messages",
      keywords: ["email", "communication", "invite"],
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "View event statistics",
      icon: ChartBar,
      shortcut: "G A",
      href: "/dashboard/analytics",
      keywords: ["stats", "reports", "data"],
    },
    {
      id: "settings",
      title: "Settings",
      description: "App preferences and account",
      icon: Settings,
      shortcut: "G S",
      href: "/settings",
      keywords: ["preferences", "account", "profile"],
    },
  ];

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (command: Command) => {
      setOpen(false);
      if (command.action) {
        command.action();
      } else if (command.href) {
        router.push(command.href);
      }
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        className="border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {commands.filter(c => c.id.includes("dashboard") || c.id === "events").map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => handleSelect(command)}
                className="flex items-center gap-2 px-4 py-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{command.title}</div>
                  {command.description && (
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {commands.filter(c => c.id.includes("new") || c.id === "guests" || c.id === "messages").map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => handleSelect(command)}
                className="flex items-center gap-2 px-4 py-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{command.title}</div>
                  {command.description && (
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {commands.filter(c => c.id === "settings" || c.id === "analytics").map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => handleSelect(command)}
                className="flex items-center gap-2 px-4 py-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{command.title}</div>
                  {command.description && (
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
