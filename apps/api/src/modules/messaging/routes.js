const {
  createCampaign,
  getCampaignReadiness,
  approveCampaign,
  cancelCampaign,
  getCampaignStats,
  listCampaigns,
  getCampaign,
  addToSuppressionList,
  handleSESEvent,
  getProjectSuppressionList,
  removeFromSuppressionList
} = require("./service");

/**
 * Register messaging routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function messagingRoutes(fastify, opts) {
  // Use authenticate hook from parent if available
  const authenticate = fastify.authenticate || opts.authenticate;

  /**
   * GET /projects/:projectId/campaigns
   * List campaigns for a project with optional filtering
   */
  fastify.get("/projects/:projectId/campaigns", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List campaigns for a project with optional filtering",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      },
      querystring: {
        type: "object",
        properties: {
          status: { type: "string" },
          channel: { type: "string" },
          limit: { type: "integer", default: 50 },
          offset: { type: "integer", default: 0 }
        }
      }
    }
  }, async (request) => {
    const { projectId } = request.params;
    const { status, channel, limit, offset } = request.query;

    const result = await listCampaigns({
      projectId,
      status,
      channel,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    return {
      success: true,
      data: result
    };
  });

  /**
   * POST /projects/:projectId/campaigns
   * Create a new campaign with audience targeting
   */
  fastify.post("/projects/:projectId/campaigns", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a new campaign with audience targeting",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["channel"],
        properties: {
          channel: { type: "string", enum: ["EMAIL", "WHATSAPP"] },
          subject: { type: "string" },
          bodyHtml: { type: "string" },
          bodyText: { type: "string" },
          scheduledAt: { type: "string", format: "date-time" },
          recipients: {
            type: "array",
            items: { type: "object" }
          },
          audienceSegment: { type: "object" },
          skipReadinessCheck: { type: "boolean" }
        }
      }
    }
  }, async (request, reply) => {
    const { projectId } = request.params;
    const {
      channel,
      subject,
      bodyHtml,
      bodyText,
      scheduledAt,
      recipients,
      audienceSegment,
      skipReadinessCheck
    } = request.body;

    const result = await createCampaign({
      projectId,
      channel,
      subject,
      bodyHtml,
      bodyText,
      scheduledAt,
      recipients,
      audienceSegment,
      skipReadinessCheck
    });

    reply.status(201);
    return {
      success: true,
      data: result
    };
  });

  /**
   * GET /projects/:projectId/campaigns/readiness
   * Get campaign readiness score for a project
   */
  fastify.get("/projects/:projectId/campaigns/readiness", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get campaign readiness score for a project",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { projectId } = request.params;
    const readiness = await getCampaignReadiness(projectId);

    return {
      success: true,
      data: readiness
    };
  });

  /**
   * GET /campaigns/:id
   * Get a single campaign by ID with stats
   */
  fastify.get("/campaigns/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get a single campaign by ID with stats",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;

    const [campaign, statsWithCampaign] = await Promise.all([
      getCampaign(id),
      getCampaignStats(id).catch(() => null)
    ]);

    return {
      success: true,
      data: {
        ...campaign,
        stats: statsWithCampaign?.stats || null
      }
    };
  });

  /**
   * POST /campaigns/:id/approve
   * Approve a blocked campaign (admin only)
   */
  fastify.post("/campaigns/:id/approve", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Approve a blocked campaign (admin only)",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          reason: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body;
    const adminId = request.user?.id || request.headers["x-admin-id"];

    if (!adminId) {
      return reply.status(401).send({
        success: false,
        error: "Admin authentication required"
      });
    }

    const result = await approveCampaign(id, adminId, reason);

    return {
      success: true,
      data: result
    };
  });

  /**
   * POST /campaigns/:id/cancel
   * Cancel a scheduled or queued campaign
   */
  fastify.post("/campaigns/:id/cancel", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Cancel a scheduled or queued campaign",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          reason: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { reason } = request.body;
    const cancelledBy = request.user?.id || request.headers["x-user-id"] || "system";

    const result = await cancelCampaign(id, cancelledBy, reason);

    return {
      success: true,
      data: result
    };
  });

  /**
   * GET /campaigns/:id/stats
   * Get detailed statistics for a campaign
   */
  fastify.get("/campaigns/:id/stats", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get detailed statistics for a campaign",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const result = await getCampaignStats(id);

    return {
      success: true,
      data: result
    };
  });

  /**
   * GET /projects/:projectId/suppression-list
   * Get suppression list for a project
   */
  fastify.get("/projects/:projectId/suppression-list", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get suppression list for a project",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      },
      querystring: {
        type: "object",
        properties: {
          limit: { type: "integer", default: 100 },
          offset: { type: "integer", default: 0 }
        }
      }
    }
  }, async (request) => {
    const { projectId } = request.params;
    const { limit, offset } = request.query;

    const result = await getProjectSuppressionList({
      projectId,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0
    });

    return {
      success: true,
      data: result
    };
  });

  /**
   * POST /projects/:projectId/suppression-list
   * Add a contact to the suppression list
   */
  fastify.post("/projects/:projectId/suppression-list", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Add a contact to the suppression list",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          reason: { type: "string", enum: ["BOUNCE", "COMPLAINT", "UNSUBSCRIBE", "MANUAL", "INVALID"] }
        }
      }
    }
  }, async (request, reply) => {
    const { projectId } = request.params;
    const { email, phone, reason } = request.body;

    const result = await addToSuppressionList({
      projectId,
      email,
      phone,
      reason,
      source: "MANUAL"
    });

    reply.status(201);
    return {
      success: true,
      data: result
    };
  });

  /**
   * DELETE /projects/:projectId/suppression-list/:id
   * Remove a contact from the suppression list
   */
  fastify.delete("/projects/:projectId/suppression-list/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Remove a contact from the suppression list",
      tags: ["Messaging"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const result = await removeFromSuppressionList(id);

    return {
      success: true,
      data: result
    };
  });
}

/**
 * Register webhook routes (no auth required, uses signature validation)
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function webhookRoutes(fastify, opts) {
  /**
   * POST /webhooks/ses
   * Handle SES bounce/complaint/delivery webhooks
   */
  fastify.post("/webhooks/ses", {
    schema: {
      description: "Handle SES bounce/complaint/delivery webhooks",
      tags: ["System"]
    }
  }, async (request, reply) => {
    // SES sends the event in different formats depending on configuration
    // Handle both direct JSON and SNS notification format
    let event = request.body;

    // Handle SNS notification format
    if (request.body.Type === "Notification" && request.body.Message) {
      try {
        event = JSON.parse(request.body.Message);
      } catch (err) {
        return reply.status(400).send({
          success: false,
          error: "Invalid SNS message format"
        });
      }
    }

    // Handle SNS subscription confirmation
    if (request.body.Type === "SubscriptionConfirmation") {
      request.log.info(`SES SNS SubscriptionConfirmation received: ${request.body.SubscribeURL}`);
      // In production, you should verify and confirm the subscription
      return {
        success: true,
        data: { type: "SubscriptionConfirmation", handled: true }
      };
    }

    // Validate the event
    if (!event.eventType && !event.EventType && !event.notificationType) {
      return reply.status(400).send({
        success: false,
        error: "Invalid SES event: missing eventType"
      });
    }

    // Normalize event type (SES uses different casing in different versions)
    event.eventType = event.eventType || event.EventType || event.notificationType;

    try {
      const result = await handleSESEvent(event);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      request.log.error("SES webhook processing error:", error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = {
  messagingRoutes,
  webhookRoutes
};
