/**
 * Dashboard Routes
 * Handles dashboard data endpoints
 */

module.exports = async function (fastify, opts) {
  const dashboardService = require('./service')(fastify);
  
  // Get authenticate hook from fastify OR opts fallback
  const authenticate = fastify.authenticate || opts.authenticate;

  /**
   * GET /api/dashboard/couple
   * Get couple dashboard data
   */
  fastify.get('/couple', {
    onRequest: authenticate ? [authenticate] : [],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const organizationId = request.user.organization_id;

        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'No organization found. Please complete onboarding.'
          };
        }

        const data = await dashboardService.getCoupleDashboard(userId, organizationId);

        return {
          success: true,
          data
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: error.message || 'Failed to load dashboard'
        };
      }
    }
  });

  /**
   * GET /api/dashboard/business
   * Get business dashboard data
   */
  fastify.get('/business', {
    onRequest: authenticate ? [authenticate] : [],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        const organizationId = request.user.organization_id;

        if (!organizationId) {
          reply.status(400);
          return {
            success: false,
            error: 'No organization found. Please complete onboarding.'
          };
        }

        const data = await dashboardService.getBusinessDashboard(userId, organizationId);

        return {
          success: true,
          data
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: error.message || 'Failed to load dashboard'
        };
      }
    }
  });

  /**
   * POST /api/events/:id/reminders
   * Send RSVP reminders
   */
  fastify.post('/events/:id/reminders', {
    onRequest: authenticate ? [authenticate] : [],
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', default: 'rsvp' },
          message: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const eventId = request.params.id;
        const userId = request.user.id;
        const { type, message } = request.body;

        const result = await dashboardService.sendReminders(eventId, userId, { type, message });

        return {
          success: true,
          sent: result.count
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: error.message || 'Failed to send reminders'
        };
      }
    }
  });

  /**
   * GET /api/checklist
   * Get checklist items
   */
  fastify.get('/checklist', {
    onRequest: authenticate ? [authenticate] : [],
    handler: async (request, reply) => {
      try {
        const organizationId = request.user.organization_id;

        if (!organizationId) {
          return { success: true, items: [] };
        }

        const result = await fastify.db.query(`
          SELECT * FROM checklists 
          WHERE organization_id = $1 
          ORDER BY created_at ASC
        `, [organizationId]);

        return {
          success: true,
          items: result.rows
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to load checklist'
        };
      }
    }
  });

  /**
   * POST /api/checklist
   * Create checklist item
   */
  fastify.post('/checklist', {
    onRequest: authenticate ? [authenticate] : [],
    schema: {
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string' },
          category: { type: 'string', default: 'general' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const organizationId = request.user.organization_id;
        const { text, category } = request.body;

        const result = await fastify.db.query(`
          INSERT INTO checklists (organization_id, text, category, completed)
          VALUES ($1, $2, $3, false)
          RETURNING *
        `, [organizationId, text, category]);

        return {
          success: true,
          item: result.rows[0]
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to create checklist item'
        };
      }
    }
  });

  /**
   * PUT /api/checklist/:id
   * Update checklist item (toggle completion)
   */
  fastify.put('/checklist/:id', {
    onRequest: authenticate ? [authenticate] : [],
    schema: {
      body: {
        type: 'object',
        properties: {
          completed: { type: 'boolean' },
          text: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const itemId = request.params.id;
        const organizationId = request.user.organization_id;
        const { completed, text } = request.body;

        // Verify item belongs to user's organization
        const existing = await fastify.db.query(
          'SELECT * FROM checklists WHERE id = $1 AND organization_id = $2',
          [itemId, organizationId]
        );

        if (existing.rows.length === 0) {
          reply.status(404);
          return {
            success: false,
            error: 'Checklist item not found'
          };
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (completed !== undefined) {
          updates.push(`completed = $${paramCount++}`);
          values.push(completed);
        }

        if (text !== undefined) {
          updates.push(`text = $${paramCount++}`);
          values.push(text);
        }

        updates.push(`updated_at = NOW()`);
        values.push(itemId);

        const result = await fastify.db.query(`
          UPDATE checklists 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `, values);

        return {
          success: true,
          item: result.rows[0]
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to update checklist item'
        };
      }
    }
  });

  /**
   * DELETE /api/checklist/:id
   * Delete checklist item
   */
  fastify.delete('/checklist/:id', {
    onRequest: authenticate ? [authenticate] : [],
    handler: async (request, reply) => {
      try {
        const itemId = request.params.id;
        const organizationId = request.user.organization_id;

        const result = await fastify.db.query(
          'DELETE FROM checklists WHERE id = $1 AND organization_id = $2 RETURNING id',
          [itemId, organizationId]
        );

        if (result.rows.length === 0) {
          reply.status(404);
          return {
            success: false,
            error: 'Checklist item not found'
          };
        }

        return {
          success: true
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to delete checklist item'
        };
      }
    }
  });
};
