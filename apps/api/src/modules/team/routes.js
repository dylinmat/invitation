/**
 * Team Routes
 * Fastify plugin for team management and invitations API
 */

module.exports = async function(fastify, opts) {
  const teamService = require('./service')(fastify);

  // ============== Team Members ==============

  /**
   * GET /api/team
   * List all team members for the user's organization
   */
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        
        // Get user's organization from auth middleware or user data
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const members = await teamService.listTeamMembers(organizationId);
        
        return {
          success: true,
          members
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to list team members'
        };
      }
    }
  });

  /**
   * POST /api/team/invite
   * Invite a new team member
   */
  fastify.post('/invite', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            description: 'Email address of the person to invite'
          },
          role: { 
            type: 'string', 
            enum: ['admin', 'member'],
            default: 'member',
            description: 'Role to assign to the invited user'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const { email, role = 'member' } = request.body;
        
        // Get user's organization
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const result = await teamService.inviteTeamMember(
          organizationId,
          email,
          role,
          userId
        );
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to send invitation'
        };
      }
    }
  });

  /**
   * DELETE /api/team/:id
   * Remove a team member
   */
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            format: 'uuid',
            description: 'Team member ID'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;
        
        // Get user's organization
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const result = await teamService.removeTeamMember(
          id,
          organizationId,
          userId
        );
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to remove team member'
        };
      }
    }
  });

  /**
   * PUT /api/team/:id/role
   * Update a team member's role
   */
  fastify.put('/:id/role', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            format: 'uuid',
            description: 'Team member ID'
          }
        }
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { 
            type: 'string', 
            enum: ['admin', 'member'],
            description: 'New role for the team member'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;
        const { role } = request.body;
        
        // Get user's organization
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const result = await teamService.updateTeamMemberRole(
          id,
          role,
          organizationId,
          userId
        );
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to update team member role'
        };
      }
    }
  });

  // ============== Invitations ==============

  /**
   * GET /api/team/invites
   * List pending invitations
   */
  fastify.get('/invites', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        
        // Get user's organization
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const invites = await teamService.listPendingInvites(
          organizationId,
          userId
        );
        
        return {
          success: true,
          invites
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to list pending invitations'
        };
      }
    }
  });

  /**
   * POST /api/team/invites/:id/resend
   * Resend an invitation
   */
  fastify.post('/invites/:id/resend', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            format: 'uuid',
            description: 'Invite ID'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;
        
        // Get user's organization
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const result = await teamService.resendInvite(
          id,
          organizationId,
          userId
        );
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to resend invitation'
        };
      }
    }
  });

  /**
   * DELETE /api/team/invites/:id
   * Cancel an invitation
   */
  fastify.delete('/invites/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            format: 'uuid',
            description: 'Invite ID'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;
        
        // Get user's organization
        const userResult = await fastify.db.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        const organizationId = userResult.rows[0]?.organization_id;
        
        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'User is not associated with an organization'
          };
        }

        const result = await teamService.cancelInvite(
          id,
          organizationId,
          userId
        );
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to cancel invitation'
        };
      }
    }
  });

  /**
   * POST /api/team/accept-invite
   * Accept an invitation (public or authenticated)
   */
  fastify.post('/accept-invite', {
    onRequest: [fastify.optionalAuth],
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { 
            type: 'string',
            minLength: 10,
            description: 'Invitation token'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { token } = request.body;
        const userId = request.user?.id || null;

        const result = await teamService.acceptInvite(token, userId);
        
        return result;
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to accept invitation'
        };
      }
    }
  });

  /**
   * GET /api/team/invite-details
   * Get invite details for preview page (public)
   */
  fastify.get('/invite-details', {
    schema: {
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { 
            type: 'string',
            description: 'Invitation token'
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { token } = request.query;

        const details = await teamService.getInviteDetails(token);
        
        if (!details) {
          reply.status(404);
          return {
            success: false,
            error: 'Invitation not found'
          };
        }

        return {
          success: true,
          ...details
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to get invitation details'
        };
      }
    }
  });
};
