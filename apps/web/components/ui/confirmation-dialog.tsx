"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "info";
  requireTextInput?: boolean;
  confirmationText?: string;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  requireTextInput = false,
  confirmationText = "DELETE",
  isLoading = false,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const isConfirmed = !requireTextInput || inputValue === confirmationText;

  const handleConfirm = async () => {
    await onConfirm();
    setInputValue("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setInputValue("");
      onClose();
    }
  };

  const variantStyles = {
    destructive: {
      icon: "text-red-600 bg-red-50",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: "text-amber-600 bg-amber-50",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: "text-blue-600 bg-blue-50",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-4">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full", variantStyles[variant].icon)}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireTextInput && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Type <strong>{confirmationText}</strong> to confirm:
            </p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type ${confirmationText}`}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className={cn(variantStyles[variant].button)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for using confirmation dialog
export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmationDialogProps, "isOpen" | "onClose" | "onConfirm"> & {
    onConfirm?: () => Promise<void> | void;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const confirm = (options: Omit<ConfirmationDialogProps, "isOpen" | "onClose" | "isLoading">) => {
    setConfig(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      const originalConfirm = options.onConfirm;
      setConfig({
        ...options,
        onConfirm: async () => {
          setIsLoading(true);
          try {
            await originalConfirm?.();
            resolve(true);
          } catch (error) {
            resolve(false);
          } finally {
            setIsLoading(false);
            setIsOpen(false);
          }
        },
      });
    });
  };

  const close = () => {
    setIsOpen(false);
    setIsLoading(false);
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={close}
      onConfirm={config.onConfirm || (() => {})}
      title={config.title || ""}
      description={config.description || ""}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      requireTextInput={config.requireTextInput}
      confirmationText={config.confirmationText}
      isLoading={isLoading}
    />
  );

  return { confirm, close, ConfirmationDialogComponent };
}

export default ConfirmationDialog;
