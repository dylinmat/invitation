/**
 * Team Module
 * 
 * Handles team member management and invitations.
 * 
 * Endpoints:
 * - GET    /api/team                     - List team members
 * - POST   /api/team/invite              - Invite team member
 * - DELETE /api/team/:id                 - Remove team member
 * - PUT    /api/team/:id/role            - Update member role
 * - GET    /api/team/invites             - List pending invites
 * - POST   /api/team/invites/:id/resend  - Resend invite
 * - DELETE /api/team/invites/:id         - Cancel invite
 * - POST   /api/team/accept-invite       - Accept invite (public)
 * - GET    /api/team/invite-details      - Get invite details (public)
 */

module.exports = {
  routes: require('./routes'),
  service: require('./service'),
  repository: require('./repository')
};
