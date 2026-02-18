"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Archive,
  Ban,
  UserCog,
  ExternalLink,
  Eye,
  LucideIcon,
  AlertTriangle,
} from "lucide-react";

export interface ActionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive" | "warning";
  disabled?: boolean;
  shortcut?: string;
  description?: string;
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  group?: string;
}

export interface ActionGroup {
  label: string;
  actions: ActionItem[];
}

interface ActionMenuProps {
  actions: ActionItem[] | ActionGroup[];
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
  loading?: boolean;
}

export function ActionMenu({
  actions,
  trigger,
  align = "end",
  className,
  size = "sm",
  variant = "ghost",
  loading,
}: ActionMenuProps) {
  const [confirmAction, setConfirmAction] = React.useState<ActionItem | null>(null);

  const isGrouped = (actions[0] as ActionGroup)?.label !== undefined;

  const handleActionClick = (action: ActionItem) => {
    if (action.requireConfirm && !confirmAction) {
      setConfirmAction(action);
    } else {
      action.onClick();
      setConfirmAction(null);
    }
  };

  const renderActionItem = (action: ActionItem) => {
    const Icon = action.icon;
    const isDestructive = action.variant === "destructive";
    const isWarning = action.variant === "warning";

    return (
      <DropdownMenuItem
        key={action.id}
        onClick={() => handleActionClick(action)}
        disabled={action.disabled || loading}
        className={cn(
          "cursor-pointer",
          isDestructive && "text-red-600 focus:text-red-600 focus:bg-red-50",
          isWarning && "text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50"
        )}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        <div className="flex flex-col">
          <span>{action.label}</span>
          {action.description && (
            <span className="text-xs text-muted-foreground">{action.description}</span>
          )}
        </div>
        {action.shortcut && (
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {action.shortcut}
          </kbd>
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant={variant}
            size={size}
            className={cn("h-8 w-8 p-0", className)}
            disabled={loading}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {isGrouped ? (
          (actions as ActionGroup[]).map((group, groupIndex) => (
            <React.Fragment key={group.label}>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              <DropdownMenuGroup>
                {group.actions.map(renderActionItem)}
              </DropdownMenuGroup>
              {groupIndex < (actions as ActionGroup[]).length - 1 && (
                <DropdownMenuSeparator />
              )}
            </React.Fragment>
          ))
        ) : (
          (actions as ActionItem[]).map((action, index) => {
            // Check if we need a separator based on group changes
            const prevAction = (actions as ActionItem[])[index - 1];
            const showSeparator = prevAction && prevAction.group !== action.group && action.group;

            return (
              <React.Fragment key={action.id}>
                {showSeparator && <DropdownMenuSeparator />}
                {renderActionItem(action)}
              </React.Fragment>
            );
          })
        )}
      </DropdownMenuContent>

      {/* Confirmation Dialog would be implemented here using a Dialog component */}
    </DropdownMenu>
  );
}

// Preset action creators for common operations
export const createUserActions = ({
  onView,
  onEdit,
  onImpersonate,
  onSuspend,
  onBan,
  onDelete,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onImpersonate?: () => void;
  onSuspend?: () => void;
  onBan?: () => void;
  onDelete?: () => void;
}): ActionItem[] => [
  ...(onView
    ? [{ id: "view", label: "View Details", icon: Eye, onClick: onView }]
    : []),
  ...(onEdit
    ? [{ id: "edit", label: "Edit User", icon: Edit, onClick: onEdit }]
    : []),
  ...(onImpersonate
    ? [
        {
          id: "impersonate",
          label: "Impersonate",
          icon: UserCog,
          onClick: onImpersonate,
          description: "Log in as this user",
          group: "admin",
        },
      ]
    : []),
  ...(onSuspend
    ? [
        {
          id: "suspend",
          label: "Suspend",
          icon: Ban,
          onClick: onSuspend,
          variant: "warning" as const,
          requireConfirm: true,
          confirmTitle: "Suspend User",
          confirmDescription: "Are you sure you want to suspend this user?",
          group: "restrict",
        },
      ]
    : []),
  ...(onBan
    ? [
        {
          id: "ban",
          label: "Ban Permanently",
          icon: Ban,
          onClick: onBan,
          variant: "destructive" as const,
          requireConfirm: true,
          confirmTitle: "Ban User",
          confirmDescription:
            "This will permanently ban the user from the platform. This action cannot be undone.",
          group: "restrict",
        },
      ]
    : []),
  ...(onDelete
    ? [
        {
          id: "delete",
          label: "Delete Account",
          icon: Trash2,
          onClick: onDelete,
          variant: "destructive" as const,
          requireConfirm: true,
          confirmTitle: "Delete User Account",
          confirmDescription:
            "This will permanently delete all user data. This action cannot be undone.",
          group: "danger",
        },
      ]
    : []),
];

export const createOrgActions = ({
  onView,
  onEdit,
  onArchive,
  onTransfer,
  onDelete,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onTransfer?: () => void;
  onDelete?: () => void;
}): ActionItem[] => [
  ...(onView
    ? [{ id: "view", label: "View Details", icon: Eye, onClick: onView }]
    : []),
  ...(onEdit
    ? [{ id: "edit", label: "Edit Settings", icon: Edit, onClick: onEdit }]
    : []),
  ...(onTransfer
    ? [
        {
          id: "transfer",
          label: "Transfer Ownership",
          icon: UserCog,
          onClick: onTransfer,
          description: "Change organization owner",
          group: "admin",
        },
      ]
    : []),
  ...(onArchive
    ? [
        {
          id: "archive",
          label: "Archive",
          icon: Archive,
          onClick: onArchive,
          requireConfirm: true,
          group: "status",
        },
      ]
    : []),
  ...(onDelete
    ? [
        {
          id: "delete",
          label: "Delete Organization",
          icon: Trash2,
          onClick: onDelete,
          variant: "destructive" as const,
          requireConfirm: true,
          confirmTitle: "Delete Organization",
          confirmDescription:
            "This will permanently delete the organization and all associated data. This action cannot be undone.",
          group: "danger",
        },
      ]
    : []),
];

export const createBillingActions = ({
  onViewInvoice,
  onRefund,
  onCancel,
}: {
  onViewInvoice?: () => void;
  onRefund?: () => void;
  onCancel?: () => void;
}): ActionItem[] => [
  ...(onViewInvoice
    ? [
        {
          id: "view",
          label: "View Invoice",
          icon: ExternalLink,
          onClick: onViewInvoice,
        },
      ]
    : []),
  ...(onRefund
    ? [
        {
          id: "refund",
          label: "Issue Refund",
          icon: Copy,
          onClick: onRefund,
          requireConfirm: true,
          group: "payment",
        },
      ]
    : []),
  ...(onCancel
    ? [
        {
          id: "cancel",
          label: "Cancel Subscription",
          icon: Ban,
          onClick: onCancel,
          variant: "warning" as const,
          requireConfirm: true,
          group: "subscription",
        },
      ]
    : []),
];

// Bulk action bar component
interface BulkActionBarProps {
  selectedCount: number;
  actions: ActionItem[];
  onClear: () => void;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  actions,
  onClear,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "bg-card border shadow-lg rounded-lg px-4 py-3",
        "flex items-center gap-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
          {selectedCount}
        </span>
        <span className="text-sm text-muted-foreground">selected</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isDestructive = action.variant === "destructive";

          return (
            <Button
              key={action.id}
              variant={isDestructive ? "destructive" : "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                isDestructive && "bg-red-600 hover:bg-red-700",
                action.variant === "warning" && "text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              )}
            >
              {Icon && <Icon className="mr-1.5 h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-border" />

      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
