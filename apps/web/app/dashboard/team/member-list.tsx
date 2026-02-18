"use client";

/**
 * Member List Component
 * Displays team members with role management capabilities
 */

import React, { useState, useMemo } from "react";
import { TeamMember, Role, Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { useTeamPermissions } from "@/components/permissions/use-permissions";
import { RoleBadge, RoleLabel, RoleComparison } from "@/components/permissions/role-badge";
import { RoleSelect } from "./role-select";
import { cn, formatRelativeTime } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface MemberListProps {
  members: TeamMember[];
  onInviteClick: () => void;
}

type SortField = "name" | "role" | "joinedAt" | "lastActiveAt";
type SortDirection = "asc" | "desc";

// ============================================
// Member Row Component
// ============================================

function MemberRow({
  member,
  currentUserId,
  onRoleChange,
  onRemove,
}: {
  member: TeamMember;
  currentUserId?: string;
  onRoleChange: (memberId: string, newRole: Role) => void;
  onRemove: (member: TeamMember) => void;
}) {
  const permissions = useTeamPermissions();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState<Role | null>(null);

  const isCurrentUser = member.userId === currentUserId;
  const canManageThisMember = permissions.canRemoveMember(member) && !isCurrentUser;
  const canChangeRole = permissions.canChangeRole(member, member.role);

  const handleRoleChange = (newRole: Role) => {
    if (newRole !== member.role) {
      setShowRoleChangeConfirm(newRole);
    }
    setIsRoleMenuOpen(false);
  };

  const confirmRoleChange = () => {
    if (showRoleChangeConfirm) {
      onRoleChange(member.id, showRoleChangeConfirm);
      setShowRoleChangeConfirm(null);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* User Info */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name || member.email}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {member.name
                    ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                    : member.email.charAt(0).toUpperCase()}
                </div>
              )}
              {member.lastActiveAt && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">
                  {member.name || member.email.split("@")[0]}
                </p>
                {isCurrentUser && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    You
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
        </td>

        {/* Role */}
        <td className="px-6 py-4">
          {canChangeRole && !isCurrentUser ? (
            <div className="relative">
              <RoleSelect
                value={member.role}
                onChange={handleRoleChange}
                disabled={!canChangeRole}
                excludeRoles={[Role.OWNER]}
              />
            </div>
          ) : (
            <RoleBadge role={member.role} />
          )}
        </td>

        {/* Joined */}
        <td className="px-6 py-4">
          <span className="text-sm text-gray-500">
            {formatRelativeTime(member.joinedAt)}
          </span>
          {member.invitedBy && (
            <p className="text-xs text-gray-400 mt-0.5">
              Invited by team member
            </p>
          )}
        </td>

        {/* Last Active */}
        <td className="px-6 py-4">
          {member.lastActiveAt ? (
            <span className="text-sm text-gray-500">
              {formatRelativeTime(member.lastActiveAt)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Never</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <PermissionGate permission={Permission.TEAM_ROLES_MANAGE}>
              {!isCurrentUser && canChangeRole && (
                <button
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Change role"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </PermissionGate>

            <PermissionGate permission={Permission.TEAM_REMOVE}>
              {canManageThisMember && (
                <button
                  onClick={() => onRemove(member)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove member"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </PermissionGate>
          </div>
        </td>
      </tr>

      {/* Role Change Confirmation Modal */}
      {showRoleChangeConfirm && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-amber-50 border-l-4 border-amber-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Change role for {member.name || member.email}?
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={member.role} size="sm" />
                    <span className="text-amber-700">→</span>
                    <RoleBadge role={showRoleChangeConfirm} size="sm" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRoleChangeConfirm(null)}
                  className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================
// Main Member List Component
// ============================================

export function MemberList({ members, onInviteClick }: MemberListProps) {
  const [sortField, setSortField] = useState<SortField>("joinedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<TeamMember | null>(null);

  const permissions = useTeamPermissions();

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.name || a.email).localeCompare(b.name || b.email);
          break;
        case "role":
          const roleOrder = { owner: 3, admin: 2, member: 1, viewer: 0 };
          comparison = roleOrder[a.role] - roleOrder[b.role];
          break;
        case "joinedAt":
          comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
          break;
        case "lastActiveAt":
          const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [members, searchQuery, roleFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRoleChange = (memberId: string, newRole: Role) => {
    // TODO: Call API to update role
    console.log(`Changing role for ${memberId} to ${newRole}`);
  };

  const handleRemove = (member: TeamMember) => {
    setShowRemoveConfirm(member);
  };

  const confirmRemove = () => {
    if (showRemoveConfirm) {
      // TODO: Call API to remove member
      console.log(`Removing member ${showRemoveConfirm.id}`);
      setShowRemoveConfirm(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No members found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || roleFilter !== "all"
              ? "Try adjusting your filters"
              : "Invite team members to get started"}
          </p>
          {!searchQuery && roleFilter === "all" && (
            <button
              onClick={onInviteClick}
              className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              Invite Member
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Member
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center gap-1">
                    Role
                    <SortIcon field="role" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("joinedAt")}
                >
                  <div className="flex items-center gap-1">
                    Joined
                    <SortIcon field="joinedAt" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("lastActiveAt")}
                >
                  <div className="flex items-center gap-1">
                    Last Active
                    <SortIcon field="lastActiveAt" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Remove team member?</h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {showRemoveConfirm.name
                    ? showRemoveConfirm.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                    : showRemoveConfirm.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {showRemoveConfirm.name || showRemoveConfirm.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-gray-500">{showRemoveConfirm.email}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberList;
