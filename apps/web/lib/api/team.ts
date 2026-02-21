/**
 * Team API Client
 * Team member management and invitation API operations
 */

import { api } from "../api";

// ====================
// Types
// ====================

/**
 * Team member role values
 */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Team member entity
 */
export interface TeamMember {
  id: string;
  userId: string;
  orgId: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: TeamRole;
  joinedAt: string;
  lastActiveAt: string | null;
  status: 'active' | 'pending' | 'suspended';
}

/**
 * Pending invitation entity
 */
export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
}

/**
 * Data for inviting a new team member
 */
export interface InviteMemberData {
  email: string;
  role: TeamRole;
}

/**
 * Data for updating a team member's role
 */
export interface UpdateRoleData {
  role: TeamRole;
}

/**
 * Team members list response
 */
export interface TeamMembersResponse {
  members: TeamMember[];
}

/**
 * Pending invites list response
 */
export interface PendingInvitesResponse {
  invites: TeamInvite[];
}

/**
 * Invite response with token
 */
export interface InviteResponse {
  member: TeamMember;
  inviteToken: string;
  invite: TeamInvite;
}

// ====================
// Team Members API
// ====================

/**
 * Get all team members for the current organization
 * @returns Promise with array of team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  return api.get<TeamMember[]>("/team/members");
}

/**
 * Invite a new team member by email
 * @param data - Invitation data containing email and role
 * @returns Promise with created member and invite token
 */
export async function inviteTeamMember(data: InviteMemberData): Promise<InviteResponse> {
  return api.post<InviteResponse>("/team/invites", data);
}

/**
 * Remove a team member from the organization
 * @param id - Team member ID
 * @returns Promise that resolves when removed
 */
export async function removeTeamMember(id: string): Promise<void> {
  return api.delete<void>(`/team/members/${id}`);
}

/**
 * Update a team member's role
 * @param id - Team member ID
 * @param role - New role to assign
 * @returns Promise with updated team member
 */
export async function updateTeamMemberRole(id: string, role: TeamRole): Promise<TeamMember> {
  return api.patch<TeamMember>(`/team/members/${id}/role`, { role });
}

// ====================
// Invitations API
// ====================

/**
 * Get all pending team invitations
 * @returns Promise with array of pending invites
 */
export async function getPendingInvites(): Promise<TeamInvite[]> {
  return api.get<TeamInvite[]>("/team/invites/pending");
}

/**
 * Resend an invitation email
 * @param id - Invite ID
 * @returns Promise with updated invite
 */
export async function resendInvite(id: string): Promise<TeamInvite> {
  return api.post<TeamInvite>(`/team/invites/${id}/resend`);
}

/**
 * Cancel a pending invitation
 * @param id - Invite ID
 * @returns Promise that resolves when cancelled
 */
export async function cancelInvite(id: string): Promise<void> {
  return api.delete<void>(`/team/invites/${id}`);
}

/**
 * Accept a team invitation using token
 * @param token - Invitation token
 * @returns Promise with accepted member
 */
export async function acceptInvite(token: string): Promise<TeamMember> {
  return api.post<TeamMember>(`/team/invites/${token}/accept`);
}

/**
 * Decline a team invitation using token
 * @param token - Invitation token
 * @returns Promise that resolves when declined
 */
export async function declineInvite(token: string): Promise<void> {
  return api.post<void>(`/team/invites/${token}/decline`);
}

// ====================
// Team API Object
// ====================

/**
 * Team API object - alternative way to access team operations
 */
export const teamApi = {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  invites: {
    getPendingInvites,
    resendInvite,
    cancelInvite,
    acceptInvite,
    declineInvite,
  },
};

export default teamApi;
