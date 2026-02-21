"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Undo,
  Redo,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Save,
  Check,
  Loader2,
  Globe,
  ArrowLeft,
  MoreHorizontal,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface ToolbarProps {
  siteName?: string;
  siteStatus?: "draft" | "published" | "archived";
  previewMode: boolean;
  device: "desktop" | "mobile";
  isSaving: boolean;
  saveError: Error | null;
  canUndo: boolean;
  canRedo: boolean;
  onPreviewToggle: () => void;
  onDeviceChange: (device: "desktop" | "mobile") => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish?: () => void;
  isPublishing: boolean;
  lastSaved?: Date;
}

export function Toolbar({
  siteName = "Wedding Website",
  siteStatus = "draft",
  previewMode,
  device,
  isSaving,
  saveError,
  canUndo,
  canRedo,
  onPreviewToggle,
  onDeviceChange,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  onUnpublish,
  isPublishing,
  lastSaved,
}: ToolbarProps) {
  const [showSavedCheck, setShowSavedCheck] = useState(false);

  const handleSave = () => {
    onSave();
    setShowSavedCheck(true);
    setTimeout(() => setShowSavedCheck(false), 2000);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved yet";
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 border-b bg-background flex items-center px-4 justify-between shrink-0 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex flex-col">
            <h1 className="font-semibold text-sm leading-tight">{siteName}</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant={siteStatus === "published" ? "default" : "secondary"}
                className="text-[10px] h-4 px-1"
              >
                {siteStatus === "published" ? "Published" : "Draft"}
              </Badge>
              {saveError ? (
                <span className="text-[10px] text-destructive">Save failed</span>
              ) : isSaving ? (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                <AnimatePresence mode="wait">
                  {showSavedCheck ? (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[10px] text-green-600 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Saved
                    </motion.span>
                  ) : (
                    <motion.span
                      key="time"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-muted-foreground"
                    >
                      {formatLastSaved()}
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Center Section - History Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Device Preview Toggle */}
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={device === "desktop" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDeviceChange("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desktop view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={device === "mobile" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDeviceChange("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mobile view</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Preview Toggle */}
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={onPreviewToggle}
            className="gap-2"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </>
            )}
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save now (Ctrl+S)</TooltipContent>
          </Tooltip>

          {siteStatus === "published" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Published</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPublish} disabled={isPublishing}>
                  <History className="h-4 w-4 mr-2" />
                  Republish changes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onUnpublish}
                  className="text-destructive focus:text-destructive"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Unpublish site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={onPublish}
              disabled={isPublishing}
              className="gap-2"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isPublishing ? "Publishing..." : "Publish"}
              </span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/site/${siteName.toLowerCase().replace(/\s+/g, "-")}`} target="_blank">
                  View live site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Site settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Delete site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
