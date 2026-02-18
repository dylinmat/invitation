"use client";

/**
 * Team Management Page
 * Enterprise-grade team management with role-based access control
 * Inspired by GitHub Organization Settings and Vercel Team Management
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TeamMember, TeamInvite, Permission } from "@/lib/permissions";
import { PermissionGate, AdminGate } from "@/components/permissions/permission-gate";
import { useTeamPermissions } from "@/components/permissions/use-permissions";
import { RoleBadge } from "@/components/permissions/role-badge";
import { MemberList } from "./member-list";
import { InviteMemberDialog } from "./invite-member-dialog";
import { PermissionsMatrix } from "./permissions-matrix";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

// ============================================
// Mock API Data (to be replaced with real API)
// ============================================

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    userId: "user-1",
    email: "sarah@example.com",
    name: "Sarah Chen",
    avatar: null,
    role: "owner",
    joinedAt: "2024-01-15T08:00:00Z",
    lastActiveAt: "2024-03-15T10:30:00Z",
  },
  {
    id: "2",
    userId: "user-2",
    email: "mike@example.com",
    name: "Mike Johnson",
    avatar: null,
    role: "admin",
    joinedAt: "2024-02-01T10:00:00Z",
    invitedBy: "user-1",
    lastActiveAt: "2024-03-14T16:45:00Z",
  },
  {
    id: "3",
    userId: "user-3",
    email: "emma@example.com",
    name: "Emma Williams",
    avatar: null,
    role: "member",
    joinedAt: "2024-02-10T14:30:00Z",
    invitedBy: "user-2",
    lastActiveAt: "2024-03-13T09:15:00Z",
  },
  {
    id: "4",
    userId: "user-4",
    email: "david@example.com",
    name: "David Brown",
    avatar: null,
    role: "viewer",
    joinedAt: "2024-03-01T11:00:00Z",
    invitedBy: "user-1",
    lastActiveAt: "2024-03-10T14:20:00Z",
  },
];

const mockPendingInvites: TeamInvite[] = [
  {
    id: "invite-1",
    email: "alex@example.com",
    role: "member",
    invitedBy: "user-1",
    invitedAt: "2024-03-14T09:00:00Z",
    expiresAt: "2024-03-21T09:00:00Z",
    status: "pending",
  },
];

// ============================================
// Mock API Functions
// ============================================

const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockTeamMembers;
};

const fetchPendingInvites = async (): Promise<TeamInvite[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockPendingInvites;
};

// ============================================
// Stats Component
// ============================================

function TeamStats({
  totalMembers,
  pendingInvites,
  roleDistribution,
}: {
  totalMembers: number;
  pendingInvites: number;
  roleDistribution: Record<string, number>;
}) {
  const stats = [
    {
      label: "Total Members",
      value: totalMembers,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pending Invites",
      value: pendingInvites,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Admins & Owners",
      value: (roleDistribution.admin || 0) + (roleDistribution.owner || 0),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Active This Week",
      value: Math.ceil(totalMembers * 0.75),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
        >
          <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Tab Component
// ============================================

type TabId = "members" | "permissions" | "invites";

function Tabs({
  activeTab,
  onChange,
  pendingInvitesCount,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  pendingInvitesCount: number;
}) {
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "members", label: "Team Members" },
    { id: "invites", label: "Pending Invites", count: pendingInvitesCount },
    { id: "permissions", label: "Permissions" },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              py-4 px-6 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>("members");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const teamPermissions = useTeamPermissions();

  // Fetch team data
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["team", "members"],
    queryFn: fetchTeamMembers,
  });

  const { data: pendingInvites = [], isLoading: isLoadingInvites } = useQuery({
    queryKey: ["team", "invites"],
    queryFn: fetchPendingInvites,
  });

  // Calculate role distribution
  const roleDistribution = members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isLoading = isLoadingMembers || isLoadingInvites;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage team members, roles, and permissions for your organization.
              </p>
            </div>
            <PermissionGate permission={Permission.TEAM_INVITE}>
              <button
                onClick={() => setIsInviteDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Invite Member
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TeamStats
          totalMembers={members.length}
          pendingInvites={pendingInvites.length}
          roleDistribution={roleDistribution}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            pendingInvitesCount={pendingInvites.length}
          />

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
              </div>
            ) : (
              <>
                {activeTab === "members" && (
                  <MemberList
                    members={members}
                    onInviteClick={() => setIsInviteDialogOpen(true)}
                  />
                )}
                {activeTab === "invites" && (
                  <div className="space-y-4">
                    {pendingInvites.length === 0 ? (
                      <EmptyState
                        variant="inbox"
                        title="No pending invites"
                        description="All invitations have been accepted or expired."
                        primaryAction={{
                          label: "Invite Member",
                          onClick: () => setIsInviteDialogOpen(true),
                        }}
                      />
                    ) : (
                      pendingInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {invite.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{invite.email}</p>
                              <p className="text-sm text-gray-500">
                                Invited {new Date(invite.invitedAt).toLocaleDateString()} ·{" "}
                                <RoleBadge role={invite.role} size="sm" />
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <PermissionGate permission={Permission.TEAM_INVITE}>
                              <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors">
                                Resend
                              </button>
                            </PermissionGate>
                            <PermissionGate permission={Permission.TEAM_REMOVE}>
                              <button className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
                                Revoke
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "permissions" && (
                  <PermissionsMatrix />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
      />
    </div>
  );
}
