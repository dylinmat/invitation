"use client";

/**
 * Role Select Component
 * Dropdown for selecting and assigning roles
 * Includes role descriptions and permission previews
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Role,
  RoleDisplayNames,
  RoleDescriptions,
  RoleHierarchy,
  Permission,
  getRolePermissions,
  getPermissionDifferences,
} from "@/lib/permissions";
import { useTeamPermissions } from "@/components/permissions/use-permissions";
import { RoleBadge, RoleLabel, RoleHierarchy as RoleHierarchyIndicator } from "@/components/permissions/role-badge";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface RoleSelectProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  excludeRoles?: Role[];
  showDescriptions?: boolean;
  showHierarchy?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface RoleOptionProps {
  role: Role;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  showDescription?: boolean;
}

// ============================================
// Role Option Component
// ============================================

function RoleOption({
  role,
  isSelected,
  isDisabled,
  onClick,
  showDescription = true,
}: RoleOptionProps) {
  const permissions = getRolePermissions(role);
  const permissionCount = permissions.length;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        isSelected && "bg-rose-50 border-rose-200",
        !isSelected && !isDisabled && "hover:bg-gray-50",
        isDisabled && "opacity-50 cursor-not-allowed",
        "border border-transparent"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
            isSelected
              ? "border-rose-500 bg-rose-500"
              : "border-gray-300"
          )}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <RoleBadge role={role} size="sm" showIcon={false} />
            <span className="text-xs text-gray-400">
              {permissionCount} permissions
            </span>
          </div>
          {showDescription && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {RoleDescriptions[role]}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================
// Permission Diff Component
// ============================================

function PermissionDiff({ fromRole, toRole }: { fromRole: Role; toRole: Role }) {
  const { added, removed } = getPermissionDifferences(fromRole, toRole);

  if (added.length === 0 && removed.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      {added.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-emerald-600 mb-1">
            + {added.length} new permissions
          </p>
          <div className="flex flex-wrap gap-1">
            {added.slice(0, 3).map((perm) => (
              <span
                key={perm}
                className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded"
              >
                {perm.split(":").pop()}
              </span>
            ))}
            {added.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-gray-500">
                +{added.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      {removed.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 mb-1">
            - {removed.length} permissions removed
          </p>
          <div className="flex flex-wrap gap-1">
            {removed.slice(0, 3).map((perm) => (
              <span
                key={perm}
                className="px-1.5 py-0.5 text-[10px] bg-red-50 text-red-700 rounded"
              >
                {perm.split(":").pop()}
              </span>
            ))}
            {removed.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-gray-500">
                +{removed.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Role Select Component
// ============================================

export function RoleSelect({
  value,
  onChange,
  disabled = false,
  excludeRoles = [],
  showDescriptions = true,
  showHierarchy = true,
  size = "md",
  className,
}: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const teamPermissions = useTeamPermissions();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Filter available roles based on user's permissions
  const availableRoles = RoleHierarchy.filter((role) => {
    // Exclude specified roles
    if (excludeRoles.includes(role)) return false;
    
    // Users can only assign roles lower than their own
    return teamPermissions.canInviteRole(role);
  });

  const handleSelect = (role: Role) => {
    if (role !== value) {
      onChange(role);
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  // Show diff for hovered role or current selection
  const previewRole = hoveredRole || value;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border transition-colors",
          sizeClasses[size],
          disabled
            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        )}
      >
        <RoleBadge role={value} size={size === "lg" ? "md" : "sm"} />
        {!disabled && (
          <svg
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
          {showHierarchy && (
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Role Hierarchy</p>
              <RoleHierarchyIndicator currentRole={value} />
            </div>
          )}

          <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
            {availableRoles.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-gray-500">
                  You don&apos;t have permission to change roles
                </p>
              </div>
            ) : (
              availableRoles.map((role) => (
                <div
                  key={role}
                  onMouseEnter={() => setHoveredRole(role)}
                  onMouseLeave={() => setHoveredRole(null)}
                >
                  <RoleOption
                    role={role}
                    isSelected={role === value}
                    isDisabled={false}
                    onClick={() => handleSelect(role)}
                    showDescription={showDescriptions}
                  />
                </div>
              ))
            )}
          </div>

          {/* Permission Preview */}
          {hoveredRole && hoveredRole !== value && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Permission Changes
              </p>
              <PermissionDiff fromRole={value} toRole={hoveredRole} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Role Select (for tables/lists)
// ============================================

export function RoleSelectCompact({
  value,
  onChange,
  disabled = false,
  excludeRoles = [],
  className,
}: Omit<RoleSelectProps, "showDescriptions" | "showHierarchy" | "size">) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const teamPermissions = useTeamPermissions();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableRoles = RoleHierarchy.filter((role) => {
    if (excludeRoles.includes(role)) return false;
    return teamPermissions.canInviteRole(role);
  });

  const handleSelect = (role: Role) => {
    if (role !== value) {
      onChange(role);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
        )}
      >
        {RoleDisplayNames[value]}
        {!disabled && (
          <svg
            className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", isOpen && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {availableRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelect(role)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between",
                role === value
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <span>{RoleDisplayNames[role]}</span>
              {role === value && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Role Assign Component (for invite flows)
// ============================================

interface RoleAssignProps {
  value: Role;
  onChange: (role: Role) => void;
  defaultRole?: Role;
  className?: string;
}

export function RoleAssign({
  value,
  onChange,
  defaultRole = Role.MEMBER,
  className,
}: RoleAssignProps) {
  const teamPermissions = useTeamPermissions();

  const availableRoles = RoleHierarchy.filter((role) =>
    teamPermissions.canInviteRole(role)
  );

  return (
    <div className={cn("space-y-3", className)}>
      {availableRoles.map((role) => (
        <label
          key={role}
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
            value === role
              ? "border-rose-500 bg-rose-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
        >
          <input
            type="radio"
            name="role"
            value={role}
            checked={value === role}
            onChange={() => onChange(role)}
            className="mt-1 w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <RoleBadge role={role} />
              {role === defaultRole && (
                <span className="text-xs text-gray-400">(Default)</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {RoleDescriptions[role]}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}

export default RoleSelect;
