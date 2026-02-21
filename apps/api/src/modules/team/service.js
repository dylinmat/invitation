/**
 * Team Service
 * Business logic for team members and invitations
 */

const crypto = require('crypto');

// Token expiry: 7 days
const INVITE_EXPIRY_DAYS = 7;

class TeamService {
  constructor(fastify) {
    this.db = fastify.db;
    this.repository = require('./repository')(fastify.db);
  }

  // ============== Token Generation ==============

  /**
   * Generate a secure invite token
   * @returns {string}
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate invite expiration date
   * @returns {Date}
   */
  getExpiryDate() {
    return new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  }

  /**
   * Generate invite URL
   * @param {string} token - Invite token
   * @returns {string}
   */
  generateInviteUrl(token) {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/invite/accept?token=${token}`;
  }

  /**
   * Log invite email (placeholder for actual email service)
   * @param {string} email - Recipient email
   * @param {string} token - Invite token
   * @param {string} orgName - Organization name
   * @param {string} inviterName - Inviter name
   */
  logInviteEmail(email, token, orgName, inviterName) {
    const inviteUrl = this.generateInviteUrl(token);
    console.log(`[EMAIL] Invite link sent to ${email}:`);
    console.log(`  Organization: ${orgName}`);
    console.log(`  Invited by: ${inviterName}`);
    console.log(`  URL: ${inviteUrl}`);
  }

  // ============== Validation ==============

  /**
   * Validate role
   * @param {string} role - Role to validate
   */
  validateRole(role) {
    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
  }

  /**
   * Check if user is admin
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async isAdmin(organizationId, userId) {
    const member = await this.repository.getTeamMember(organizationId, userId);
    return member?.role === 'admin';
  }

  /**
   * Require admin access
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   */
  async requireAdmin(organizationId, userId) {
    const isAdmin = await this.isAdmin(organizationId, userId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can perform this action');
    }
  }

  // ============== Team Members ==============

  /**
   * List team members
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>}
   */
  async listTeamMembers(organizationId) {
    const members = await this.repository.listTeamMembers(organizationId);
    return members.map(member => ({
      id: member.id,
      userId: member.user_id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      status: member.status,
      joinedAt: member.joined_at
    }));
  }

  /**
   * Remove a team member
   * @param {string} memberId - Team member ID
   * @param {string} organizationId - Organization ID
   * @param {string} requestingUserId - User ID making the request
   * @returns {Promise<object>}
   */
  async removeTeamMember(memberId, organizationId, requestingUserId) {
    // Check admin permission
    await this.requireAdmin(organizationId, requestingUserId);

    // Get member details
    const member = await this.repository.getTeamMemberById(memberId);
    if (!member) {
      throw new Error('Team member not found');
    }

    if (member.organization_id !== organizationId) {
      throw new Error('Team member does not belong to this organization');
    }

    // Prevent removing yourself if you're the last admin
    if (member.role === 'admin') {
      const adminCount = await this.repository.countAdmins(organizationId);
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin from the organization');
      }
    }

    // Prevent self-removal (optional - can be removed if self-removal is allowed)
    if (member.user_id === requestingUserId) {
      throw new Error('You cannot remove yourself. Please ask another admin to remove you.');
    }

    const success = await this.repository.removeTeamMember(memberId);
    if (!success) {
      throw new Error('Failed to remove team member');
    }

    return {
      success: true,
      message: 'Team member removed successfully'
    };
  }

  /**
   * Update team member role
   * @param {string} memberId - Team member ID
   * @param {string} role - New role
   * @param {string} organizationId - Organization ID
   * @param {string} requestingUserId - User ID making the request
   * @returns {Promise<object>}
   */
  async updateTeamMemberRole(memberId, role, organizationId, requestingUserId) {
    // Validate role
    this.validateRole(role);

    // Check admin permission
    await this.requireAdmin(organizationId, requestingUserId);

    // Get member details
    const member = await this.repository.getTeamMemberById(memberId);
    if (!member) {
      throw new Error('Team member not found');
    }

    if (member.organization_id !== organizationId) {
      throw new Error('Team member does not belong to this organization');
    }

    // Prevent demoting the last admin
    if (member.role === 'admin' && role !== 'admin') {
      const adminCount = await this.repository.countAdmins(organizationId);
      if (adminCount <= 1) {
        throw new Error('Cannot change the role of the last admin');
      }
    }

    // Prevent self-demotion (optional)
    if (member.user_id === requestingUserId && role !== 'admin') {
      throw new Error('You cannot demote yourself. Please ask another admin to change your role.');
    }

    const updatedMember = await this.repository.updateTeamMemberRole(memberId, role);
    if (!updatedMember) {
      throw new Error('Failed to update team member role');
    }

    return {
      success: true,
      member: {
        id: updatedMember.id,
        userId: updatedMember.user_id,
        role: updatedMember.role
      }
    };
  }

  // ============== Invitations ==============

  /**
   * Invite a team member
   * @param {string} organizationId - Organization ID
   * @param {string} email - Email to invite
   * @param {string} role - Role to assign
   * @param {string} invitedBy - User ID inviting
   * @returns {Promise<object>}
   */
  async inviteTeamMember(organizationId, email, role = 'member', invitedBy) {
    // Validate inputs
    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    this.validateRole(role);

    // Check admin permission
    await this.requireAdmin(organizationId, invitedBy);

    // Only admins can invite other admins
    if (role === 'admin') {
      const isAdmin = await this.isAdmin(organizationId, invitedBy);
      if (!isAdmin) {
        throw new Error('Only admins can invite other admins');
      }
    }

    // Get organization details
    const organization = await this.repository.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user is already a team member
    const existingUser = await this.repository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      const existingMember = await this.repository.getTeamMember(organizationId, existingUser.id);
      if (existingMember) {
        throw new Error('User is already a member of this organization');
      }
    }

    // Check for existing pending invitation
    const existingInvite = await this.repository.getPendingInviteByEmail(organizationId, normalizedEmail);
    if (existingInvite) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Generate token and expiry
    const token = this.generateToken();
    const expiresAt = this.getExpiryDate();

    // Create invite
    const invite = await this.repository.createInvite({
      organizationId,
      email: normalizedEmail,
      role,
      token,
      invitedBy,
      expiresAt
    });

    // Get inviter details for email
    const inviter = await this.repository.getUserById(invitedBy);
    const inviterName = inviter?.full_name || 'A team member';

    // Log invite email (placeholder)
    this.logInviteEmail(normalizedEmail, token, organization.name, inviterName);

    return {
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expires_at
      },
      message: `Invitation sent to ${normalizedEmail}`
    };
  }

  /**
   * List pending invites
   * @param {string} organizationId - Organization ID
   * @param {string} requestingUserId - User ID making the request
   * @returns {Promise<Array>}
   */
  async listPendingInvites(organizationId, requestingUserId) {
    // Check admin permission
    await this.requireAdmin(organizationId, requestingUserId);

    const invites = await this.repository.listPendingInvites(organizationId);
    return invites.map(invite => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      invitedBy: {
        id: invite.invited_by,
        fullName: invite.invited_by_name
      },
      token: invite.token,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at
    }));
  }

  /**
   * Resend an invite
   * @param {string} inviteId - Invite ID
   * @param {string} organizationId - Organization ID
   * @param {string} requestingUserId - User ID making the request
   * @returns {Promise<object>}
   */
  async resendInvite(inviteId, organizationId, requestingUserId) {
    // Check admin permission
    await this.requireAdmin(organizationId, requestingUserId);

    // Get invite
    const invite = await this.repository.getInviteById(inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.organization_id !== organizationId) {
      throw new Error('Invite does not belong to this organization');
    }

    // Check if already accepted
    if (invite.accepted_at) {
      throw new Error('This invitation has already been accepted');
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('This invitation has expired. Please create a new invitation.');
    }

    // Generate new token and expiry
    const token = this.generateToken();
    const expiresAt = this.getExpiryDate();

    // Update invite
    const updatedInvite = await this.repository.updateInviteToken(inviteId, token, expiresAt);

    // Get organization and inviter details
    const organization = await this.repository.getOrganizationById(organizationId);
    const inviter = await this.repository.getUserById(requestingUserId);
    const inviterName = inviter?.full_name || 'A team member';

    // Log invite email (placeholder)
    this.logInviteEmail(invite.email, token, organization.name, inviterName);

    return {
      success: true,
      invite: {
        id: updatedInvite.id,
        email: updatedInvite.email,
        role: updatedInvite.role,
        expiresAt: updatedInvite.expires_at
      },
      message: `Invitation resent to ${invite.email}`
    };
  }

  /**
   * Cancel an invite
   * @param {string} inviteId - Invite ID
   * @param {string} organizationId - Organization ID
   * @param {string} requestingUserId - User ID making the request
   * @returns {Promise<object>}
   */
  async cancelInvite(inviteId, organizationId, requestingUserId) {
    // Check admin permission
    await this.requireAdmin(organizationId, requestingUserId);

    // Get invite
    const invite = await this.repository.getInviteById(inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.organization_id !== organizationId) {
      throw new Error('Invite does not belong to this organization');
    }

    // Check if already accepted
    if (invite.accepted_at) {
      throw new Error('Cannot cancel an invitation that has already been accepted');
    }

    const success = await this.repository.deleteInvite(inviteId);
    if (!success) {
      throw new Error('Failed to cancel invitation');
    }

    return {
      success: true,
      message: 'Invitation cancelled successfully'
    };
  }

  /**
   * Accept an invite
   * @param {string} token - Invite token
   * @param {string|null} userId - User ID (if authenticated)
   * @param {object|null} userData - User data for registration (if not authenticated)
   * @returns {Promise<object>}
   */
  async acceptInvite(token, userId = null, userData = null) {
    if (!token) {
      throw new Error('Invite token is required');
    }

    // Get invite by token
    const invite = await this.repository.getInviteByToken(token);
    if (!invite) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if already accepted
    if (invite.accepted_at) {
      throw new Error('This invitation has already been accepted');
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('This invitation has expired. Please ask for a new invitation.');
    }

    // If user is authenticated, verify email matches
    let targetUserId = userId;
    let user = null;

    if (userId) {
      user = await this.repository.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address');
      }
    } else {
      // Check if user exists with this email
      user = await this.repository.getUserByEmail(invite.email);
      if (user) {
        targetUserId = user.id;
      } else if (userData) {
        // Create new user (this would typically call the auth service)
        // For now, require user to exist or be logged in
        throw new Error('Please sign up or log in to accept this invitation');
      } else {
        throw new Error('Please log in or create an account to accept this invitation');
      }
    }

    // Check if user is already a member
    const existingMember = await this.repository.getTeamMember(invite.organization_id, targetUserId);
    if (existingMember) {
      // Mark invite as accepted anyway
      await this.repository.acceptInvite(invite.id);
      throw new Error('You are already a member of this organization');
    }

    // Add user to team
    const member = await this.repository.addTeamMember({
      organizationId: invite.organization_id,
      userId: targetUserId,
      role: invite.role,
      status: 'active'
    });

    // Mark invite as accepted
    await this.repository.acceptInvite(invite.id);

    // Update user's organization_id if not set
    if (user && !user.organization_id) {
      await this.db.query(
        'UPDATE users SET organization_id = $1 WHERE id = $2',
        [invite.organization_id, targetUserId]
      );
    }

    return {
      success: true,
      message: 'You have successfully joined the organization',
      organization: {
        id: invite.organization_id,
        name: invite.organization_name
      },
      role: invite.role,
      joinedAt: member.joined_at
    };
  }

  /**
   * Get invite details by token (for preview page)
   * @param {string} token - Invite token
   * @returns {Promise<object|null>}
   */
  async getInviteDetails(token) {
    if (!token) {
      return null;
    }

    const invite = await this.repository.getInviteByToken(token);
    if (!invite) {
      return null;
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return { status: 'accepted', invite: null };
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return { status: 'expired', invite: null };
    }

    return {
      status: 'pending',
      invite: {
        email: invite.email,
        role: invite.role,
        organizationName: invite.organization_name,
        invitedBy: invite.invited_by_name,
        expiresAt: invite.expires_at
      }
    };
  }
}

module.exports = function(fastify) {
  return new TeamService(fastify);
};
