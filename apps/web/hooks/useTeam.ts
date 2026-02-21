"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, teamInvitesApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import type { TeamRole } from "@/lib/api";

// ====================
// Query Keys
// ====================

export const teamKeys = {
  all: ["team"] as const,
  members: (orgId: string) => [...teamKeys.all, "members", orgId] as const,
  invites: (orgId: string) => [...teamKeys.all, "invites", orgId] as const,
};

// ====================
// Queries
// ====================

export function useTeamMembers(orgId: string) {
  return useQuery({
    queryKey: teamKeys.members(orgId),
    queryFn: async () => {
      const response = await teamApi.listMembers(orgId);
      return response.members;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePendingInvites(orgId: string) {
  return useQuery({
    queryKey: teamKeys.invites(orgId),
    queryFn: async () => {
      const response = await teamInvitesApi.getPendingInvites(orgId);
      return response.invites;
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ====================
// Mutations
// ====================

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      email,
      role,
    }: {
      orgId: string;
      email: string;
      role: TeamRole;
    }) => {
      const response = await teamApi.inviteMember(orgId, { email, role });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.invites(variables.orgId),
      });
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(variables.orgId),
      });
      showToast({
        title: "Invitation sent",
        description: "They'll receive an email shortly.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      memberId,
    }: {
      orgId: string;
      memberId: string;
    }) => {
      await teamApi.removeMember(orgId, memberId);
      return { memberId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(variables.orgId),
      });
      showToast({ title: "Team member removed", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to remove team member",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      memberId,
      role,
    }: {
      orgId: string;
      memberId: string;
      role: TeamRole;
    }) => {
      const response = await teamApi.updateMemberRole(orgId, memberId, role);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(variables.orgId),
      });
      showToast({ title: "Role updated", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to update role",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      inviteId,
    }: {
      orgId: string;
      inviteId: string;
    }) => {
      const response = await teamInvitesApi.resendInvite(orgId, inviteId);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.invites(variables.orgId),
      });
      showToast({
        title: "Invitation resent",
        description: "A new email has been sent.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to resend invitation",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      inviteId,
    }: {
      orgId: string;
      inviteId: string;
    }) => {
      const response = await teamInvitesApi.cancelInvite(orgId, inviteId);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.invites(variables.orgId),
      });
      showToast({ title: "Invitation cancelled", variant: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "error",
      });
    },
  });
}

// ====================
// Public Invitations
// ====================

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await teamApi.acceptInvite(token);
      return response;
    },
    onSuccess: () => {
      showToast({
        title: "Invitation accepted",
        description: "Welcome to the team!",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useDeclineInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      await teamApi.declineInvite(token);
      return { success: true };
    },
    onSuccess: () => {
      showToast({
        title: "Invitation declined",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Failed to decline invitation",
        description: error.message,
        variant: "error",
      });
    },
  });
}
