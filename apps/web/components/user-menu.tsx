"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Keyboard,
  Building2,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Mock organizations
const mockOrganizations = [
  { id: "1", name: "Personal", role: "Owner" },
  { id: "2", name: "Acme Corp", role: "Admin" },
  { id: "3", name: "Design Studio", role: "Member" },
];

// Mock keyboard shortcuts
const keyboardShortcuts = [
  { key: "⌘ K", description: "Open command palette" },
  { key: "⌘ /", description: "Open global search" },
  { key: "G then D", description: "Go to Dashboard" },
  { key: "G then P", description: "Go to Projects" },
  { key: "G then S", description: "Go to Settings" },
  { key: "C then P", description: "Create Project" },
  { key: "Esc", description: "Close modal/dropdown" },
];

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentOrg, setCurrentOrg] = useState(mockOrganizations[0]);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn("relative h-9 w-9 rounded-full", className)}
          >
            <Avatar className="h-9 w-9 ring-2 ring-border ring-offset-2 ring-offset-background transition-all hover:ring-primary">
              <AvatarImage
                src={user?.avatar || ""}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="bg-rose-100 text-rose-700 font-medium">
                {getInitials(user?.name || user?.email || "U")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72"
          align="end"
          sideOffset={8}
          forceMount
        >
          {/* User Profile Section */}
          <div className="flex items-start gap-3 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
              <AvatarFallback className="bg-rose-100 text-rose-700">
                {getInitials(user?.name || user?.email || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-muted-foreground">Pro Plan</span>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Organization Switcher */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2">
              Organization
            </DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                <span className="flex-1">{currentOrg.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {currentOrg.role}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuRadioGroup
                  value={currentOrg.id}
                  onValueChange={(id) => {
                    const org = mockOrganizations.find((o) => o.id === id);
                    if (org) setCurrentOrg(org);
                  }}
                >
                  {mockOrganizations.map((org) => (
                    <DropdownMenuRadioItem
                      key={org.id}
                      value={org.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{org.name}</span>
                        {org.id === currentOrg.id && (
                          <Check className="w-4 h-4 ml-2" />
                        )}
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/organizations/new")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Organization
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Theme Toggle */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2">
              Preferences
            </DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
              </div>
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowShortcuts(true)}
            className="cursor-pointer"
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Keyboard Shortcuts
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-muted rounded">
              ⌘?
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShortcuts(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <div className="bg-background rounded-xl shadow-2xl border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h2 className="font-semibold">Keyboard Shortcuts</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcuts(false)}
                  >
                    <span className="sr-only">Close</span>×
                  </Button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-3">
                    {keyboardShortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-sm bg-muted rounded border font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3 border-t bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-1 bg-background rounded">Esc</kbd> to close
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
