"use client";

/**
 * Permissions Matrix Component
 * Visual grid showing permissions for each role
 * Inspired by AWS IAM and GitHub permission matrices
 */

import React, { useState, useMemo } from "react";
import {
  Role,
  Permission,
  PermissionCategoryKey,
  PermissionCategories,
  PermissionMetadataMap,
  RolePermissions,
  RoleDisplayNames,
  RoleDescriptions,
  isDangerousPermission,
} from "@/lib/permissions";
import { RoleBadge, RoleDot } from "@/components/permissions/role-badge";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

type ViewMode = "grid" | "list" | "compare";
type FilterType = "all" | "differences" | "dangerous";

// ============================================
// Permission Cell Component
// ============================================

function PermissionCell({
  hasPermission,
  isDangerous,
  showCheck = true,
}: {
  hasPermission: boolean;
  isDangerous: boolean;
  showCheck?: boolean;
}) {
  if (!hasPermission) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="sr-only">No access</span>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center",
        isDangerous && "bg-red-50"
      )}
    >
      {showCheck ? (
        <svg
          className={cn(
            "w-5 h-5",
            isDangerous ? "text-red-500" : "text-emerald-500"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            isDangerous ? "bg-red-400" : "bg-emerald-400"
          )}
        />
      )}
      <span className="sr-only">Has access</span>
    </div>
  );
}

// ============================================
// Permission Tooltip
// ============================================

function PermissionTooltip({
  permission,
  role,
  hasAccess,
}: {
  permission: Permission;
  role: Role;
  hasAccess: boolean;
}) {
  const metadata = PermissionMetadataMap[permission];
  const isDangerous = isDangerousPermission(permission);

  return (
    <div className="p-3 max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <p className="font-medium text-gray-900">{metadata.label}</p>
        {isDangerous && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded">
            DANGER
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-2">{metadata.description}</p>
      <div className="flex items-center gap-2 text-xs">
        <RoleDot role={role} size="sm" />
        <span className={hasAccess ? "text-emerald-600" : "text-gray-400"}>
          {hasAccess ? "Has access" : "No access"}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Grid View Component
// ============================================

function GridView({
  selectedRoles,
  selectedCategory,
  filter,
}: {
  selectedRoles: Role[];
  selectedCategory: PermissionCategoryKey | "all";
  filter: FilterType;
}) {
  const roles: Role[] = ["owner", "admin", "member", "viewer"];
  const visibleRoles = roles.filter((r) => selectedRoles.includes(r));

  // Get permissions to display
  const permissions = useMemo(() => {
    let perms: Permission[] = [];

    if (selectedCategory === "all") {
      perms = Object.values(Permission);
    } else {
      perms = PermissionCategories[selectedCategory].permissions;
    }

    if (filter === "differences") {
      // Only show permissions that differ between visible roles
      perms = perms.filter((p) => {
        const hasPerms = visibleRoles.map((r) =>
          RolePermissions[r].includes(p)
        );
        return new Set(hasPerms).size > 1;
      });
    }

    if (filter === "dangerous") {
      perms = perms.filter((p) => isDangerousPermission(p));
    }

    return perms;
  }, [selectedCategory, filter, visibleRoles]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    permissions.forEach((p) => {
      const metadata = PermissionMetadataMap[p];
      const category = metadata.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(p);
    });

    return groups;
  }, [permissions]);

  if (permissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No permissions match your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            {PermissionCategories[category as PermissionCategoryKey].label}
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-64">
                    Permission
                  </th>
                  {visibleRoles.map((role) => (
                    <th
                      key={role}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-24"
                    >
                      <RoleBadge role={role} size="sm" showIcon={false} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perms.map((permission) => {
                  const metadata = PermissionMetadataMap[permission];
                  const isDangerous = isDangerousPermission(permission);

                  return (
                    <tr
                      key={permission}
                      className={cn(
                        "hover:bg-gray-50 transition-colors group",
                        isDangerous && "bg-red-50/30"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">
                            {metadata.label}
                          </span>
                          {isDangerous && (
                            <svg
                              className="w-4 h-4 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              title="Dangerous permission"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {metadata.description}
                        </p>
                      </td>
                      {visibleRoles.map((role) => (
                        <td
                          key={role}
                          className="px-4 py-3 text-center"
                        >
                          <PermissionCell
                            hasPermission={RolePermissions[role].includes(
                              permission
                            )}
                            isDangerous={isDangerous}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// List View Component
// ============================================

function ListView({
  selectedRoles,
  selectedCategory,
}: {
  selectedRoles: Role[];
  selectedCategory: PermissionCategoryKey | "all";
}) {
  const permissions =
    selectedCategory === "all"
      ? Object.values(Permission)
      : PermissionCategories[selectedCategory].permissions;

  return (
    <div className="space-y-4">
      {selectedRoles.map((role) => {
        const rolePerms = RolePermissions[role];
        const filteredPerms = permissions.filter((p) => rolePerms.includes(p));

        return (
          <div
            key={role}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RoleBadge role={role} />
                <span className="text-sm text-gray-500">
                  {filteredPerms.length} permissions
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {filteredPerms.map((permission) => {
                  const metadata = PermissionMetadataMap[permission];
                  const isDangerous = isDangerousPermission(permission);

                  return (
                    <span
                      key={permission}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full",
                        isDangerous
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-gray-100 text-gray-700"
                      )}
                      title={metadata.description}
                    >
                      {metadata.label}
                      {isDangerous && (
                        <svg
                          className="w-3 h-3 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Compare View Component
// ============================================

function CompareView({ selectedRoles }: { selectedRoles: Role[] }) {
  if (selectedRoles.length !== 2) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Select exactly 2 roles to compare</p>
      </div>
    );
  }

  const [role1, role2] = selectedRoles;
  const perms1 = new Set(RolePermissions[role1]);
  const perms2 = new Set(RolePermissions[role2]);

  const onlyInRole1 = RolePermissions[role1].filter((p) => !perms2.has(p));
  const onlyInRole2 = RolePermissions[role2].filter((p) => !perms1.has(p));
  const inBoth = RolePermissions[role1].filter((p) => perms2.has(p));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Only in Role 1 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm font-medium text-blue-900">
            Only {RoleDisplayNames[role1]}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            {onlyInRole1.length} permissions
          </p>
        </div>
        <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
          {onlyInRole1.map((p) => (
            <div
              key={p}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded"
            >
              {PermissionMetadataMap[p].label}
            </div>
          ))}
        </div>
      </div>

      {/* In Both */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
          <p className="text-sm font-medium text-emerald-900">Both Roles</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {inBoth.length} permissions
          </p>
        </div>
        <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
          {inBoth.map((p) => (
            <div
              key={p}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded"
            >
              {PermissionMetadataMap[p].label}
            </div>
          ))}
        </div>
      </div>

      {/* Only in Role 2 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <p className="text-sm font-medium text-purple-900">
            Only {RoleDisplayNames[role2]}
          </p>
          <p className="text-xs text-purple-600 mt-0.5">
            {onlyInRole2.length} permissions
          </p>
        </div>
        <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
          {onlyInRole2.map((p) => (
            <div
              key={p}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded"
            >
              {PermissionMetadataMap[p].label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Permissions Matrix Component
// ============================================

export function PermissionsMatrix() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([
    "owner",
    "admin",
    "member",
    "viewer",
  ]);
  const [selectedCategory, setSelectedCategory] = useState<
    PermissionCategoryKey | "all"
  >("all");
  const [filter, setFilter] = useState<FilterType>("all");

  const roles: Role[] = ["owner", "admin", "member", "viewer"];

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role].sort(
            (a, b) => roles.indexOf(a) - roles.indexOf(b)
          )
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Role Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 mr-2">Show:</span>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                selectedRoles.includes(role)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <RoleDot
                role={role}
                size="sm"
                className={
                  selectedRoles.includes(role) ? undefined : "opacity-30"
                }
              />
              {RoleDisplayNames[role]}
            </button>
          ))}
        </div>

        {/* View Mode & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as PermissionCategoryKey | "all")
            }
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(PermissionCategories).map(([key, category]) => (
              <option key={key} value={key}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Filter Type */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Permissions</option>
            <option value="differences">Differences Only</option>
            <option value="dangerous">Dangerous Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(["grid", "list", "compare"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize",
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Has permission</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
          <span>No permission</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Dangerous permission</span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {viewMode === "grid" && (
          <GridView
            selectedRoles={selectedRoles}
            selectedCategory={selectedCategory}
            filter={filter}
          />
        )}
        {viewMode === "list" && (
          <ListView
            selectedRoles={selectedRoles}
            selectedCategory={selectedCategory}
          />
        )}
        {viewMode === "compare" && <CompareView selectedRoles={selectedRoles} />}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Role Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedRoles.map((role) => (
            <div key={role} className="flex items-start gap-3">
              <RoleDot role={role} size="md" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {RoleDisplayNames[role]}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {RolePermissions[role].length} permissions
                </p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {RoleDescriptions[role]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PermissionsMatrix;
