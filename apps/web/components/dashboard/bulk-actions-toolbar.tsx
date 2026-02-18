"use client";

import { useState } from "react";
import { Trash2, Archive, Copy, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  isProcessing: boolean;
}

type ActionType = "delete" | "archive" | "duplicate" | null;

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onArchive,
  onDuplicate,
  isProcessing,
}: BulkActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);

  const handleConfirm = async () => {
    switch (confirmAction) {
      case "delete":
        await onDelete();
        break;
      case "archive":
        await onArchive();
        break;
      case "duplicate":
        await onDuplicate();
        break;
    }
    setConfirmAction(null);
  };

  const getConfirmationContent = () => {
    switch (confirmAction) {
      case "delete":
        return {
          title: "Delete Projects",
          description: `Are you sure you want to delete ${selectedCount} selected project${
            selectedCount > 1 ? "s" : ""
          }? This action cannot be undone.`,
          buttonText: "Delete",
          variant: "destructive" as const,
        };
      case "archive":
        return {
          title: "Archive Projects",
          description: `Are you sure you want to archive ${selectedCount} selected project${
            selectedCount > 1 ? "s" : ""
          }? They will be moved to archived status.`,
          buttonText: "Archive",
          variant: "default" as const,
        };
      case "duplicate":
        return {
          title: "Duplicate Projects",
          description: `This will create copies of ${selectedCount} selected project${
            selectedCount > 1 ? "s" : ""
          }. Do you want to continue?`,
          buttonText: "Duplicate",
          variant: "default" as const,
        };
    }
    return null;
  };

  const confirmationContent = getConfirmationContent();

  if (selectedCount === 0) {
    return (
      <div className="flex items-center justify-between py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSelectAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Select all
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between py-3 px-4 rounded-lg",
          "bg-[#FDF8F5] border border-[#E8D5D0] animate-fade-in"
        )}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-muted-foreground"
          >
            <X className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("duplicate")}
            disabled={isProcessing}
            className="h-8 hidden sm:flex"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("archive")}
            disabled={isProcessing}
            className="h-8 hidden sm:flex"
          >
            <Archive className="mr-1.5 h-4 w-4" />
            Archive
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmAction("delete")}
            disabled={isProcessing}
            className="h-8"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === "delete" && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {confirmationContent?.title}
            </DialogTitle>
            <DialogDescription>{confirmationContent?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={confirmationContent?.variant}
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : confirmationContent?.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
