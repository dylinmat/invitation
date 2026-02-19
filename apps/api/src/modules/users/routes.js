/**
 * User Routes
 * Handles user-related API endpoints
 */

module.exports = async function (fastify, opts) {
  const userService = require('./service')(fastify);

  /**
   * POST /api/users/onboarding
   * Complete user onboarding with type selection and details
   */
  fastify.post('/onboarding', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['COUPLE', 'PLANNER', 'VENUE'] },
          coupleNames: {
            type: 'object',
            properties: {
              partner1: { type: 'string' },
              partner2: { type: 'string' }
            }
          },
          eventDate: { type: 'string', format: 'date' },
          businessName: { type: 'string' },
          website: { type: 'string' },
          businessType: { type: 'string', enum: ['PLANNER', 'VENUE', 'VENDOR'] }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const organization = await userService.completeOnboarding(userId, request.body);
        
        return {
          success: true,
          organization: {
            id: organization.id,
            type: organization.type,
            name: organization.name,
            coupleNames: organization.couple_names ? JSON.parse(organization.couple_names) : null,
            eventDate: organization.event_date,
            website: organization.website,
            businessType: organization.business_type
          }
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to complete onboarding'
        };
      }
    }
  });

  /**
   * PUT /api/users/plan
   * Update user's selected subscription plan
   */
  fastify.put('/plan', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['plan'],
        properties: {
          plan: { type: 'string', enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const { plan } = request.body;
        
        await userService.updatePlan(userId, plan);
        
        return {
          success: true,
          plan
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(400);
        return {
          success: false,
          error: error.message || 'Failed to update plan'
        };
      }
    }
  });

  /**
   * GET /api/users/me/organization
   * Get current user's organization details
   */
  fastify.get('/me/organization', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const organization = await userService.getOrganization(userId);
        
        if (!organization) {
          reply.status(404);
          return {
            success: false,
            error: 'Organization not found'
          };
        }

        return {
          success: true,
          organization: {
            id: organization.id,
            type: organization.type,
            name: organization.name,
            coupleNames: organization.couple_names,
            eventDate: organization.event_date,
            website: organization.website,
            businessType: organization.business_type
          }
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to get organization'
        };
      }
    }
  });

  /**
   * GET /api/users/me
   * Get current user details with organization
   */
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const user = await userService.getMe(userId);
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            onboardingCompleted: user.onboarding_completed,
            selectedPlan: user.selected_plan,
            organizationId: user.organization_id,
            orgType: user.org_type,
            orgName: user.org_name
          }
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to get user'
        };
      }
    }
  });
};
