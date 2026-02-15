const repo = require("./repository");

const { calculateReadiness } = require("./scoring");

const VALID_CHANNELS = ["EMAIL", "WHATSAPP"];
const VALID_STATUSES = ["DRAFT", "QUEUED", "SCHEDULED", "SENDING", "PAUSED", "COMPLETED", "CANCELLED", "BLOCKED"];

const validateChannel = (channel) => VALID_CHANNELS.includes(channel);

// Helper to extract projectId from campaign
const getProjectIdFromCampaign = async (campaignId) => {
  const campaign = await repo.getCampaignById(campaignId);
  return campaign?.project_id;
};

/**
 * Create a new campaign with audience targeting
 */
const createCampaign = async ({
  projectId,
  channel,
  subject,
  bodyHtml,
  bodyText,
  scheduledAt,
  recipients,
  audienceSegment,
  skipReadinessCheck = false
}) => {
  // Validation
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!validateChannel(channel)) {
    throw new Error(`Unsupported channel. Must be one of: ${VALID_CHANNELS.join(", ")}`);
  }
  
  // Audience targeting: either explicit recipients or segment
  const hasRecipients = Array.isArray(recipients) && recipients.length > 0;
  const hasSegment = audienceSegment && typeof audienceSegment === 'object';
  
  if (!hasRecipients && !hasSegment) {
    throw new Error("Either recipients or audienceSegment is required");
  }

  // Parse scheduled date
  let scheduledDate = null;
  if (scheduledAt) {
    scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new Error("scheduledAt must be a valid date");
    }
  }

  // Determine campaign status
  const isScheduled = scheduledDate && scheduledDate.getTime() > Date.now();
  let campaignStatus = isScheduled ? "SCHEDULED" : "QUEUED";
  const jobStatus = isScheduled ? "SCHEDULED" : "QUEUED";

  // Check readiness unless skipped
  let readiness = null;
  if (!skipReadinessCheck) {
    readiness = await calculateReadiness(projectId);
    
    if (readiness.outcome === "BLOCKED") {
      campaignStatus = "BLOCKED";
    } else if (readiness.outcome === "THROTTLED") {
      // Keep QUEUED but mark for throttled processing
      // This would be handled by the worker
    }
  }

  // Create campaign
  const campaignId = await repo.createCampaign({
    projectId,
    channel,
    subject,
    bodyHtml,
    bodyText,
    scheduledAt: scheduledDate,
    status: campaignStatus
  });

  // Process recipients
  let createdJobs = 0;
  let suppressedCount = 0;
  
  const targetRecipients = recipients || [];
  
  for (const recipient of targetRecipients) {
    // Check suppression list for email campaigns
    if (channel === "EMAIL" && recipient.email) {
      const suppressed = await repo.isSuppressed({
        projectId,
        email: recipient.email
      });
      if (suppressed) {
        suppressedCount++;
        continue; // Skip suppressed contacts
      }
    }

    // Validate required fields
    if (channel === "EMAIL" && !recipient.email) {
      throw new Error("Recipient email is required for EMAIL campaigns");
    }
    if (channel === "WHATSAPP" && !recipient.phone) {
      throw new Error("Recipient phone is required for WHATSAPP campaigns");
    }

    await repo.createMessageJob({
      campaignId,
      guestId: recipient.guestId,
      contactEmail: recipient.email,
      contactPhone: recipient.phone,
      channel,
      status: jobStatus
    });
    createdJobs++;
  }

  return {
    campaignId,
    jobCount: createdJobs,
    suppressedCount,
    status: campaignStatus,
    readiness: readiness || await calculateReadiness(projectId)
  };
};

/**
 * Get campaign readiness score
 */
const getCampaignReadiness = async (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  return await calculateReadiness(projectId);
};

/**
 * Approve a blocked campaign (admin override)
 */
const approveCampaign = async (campaignId, adminId, reason) => {
  if (!campaignId) {
    throw new Error("campaignId is required");
  }
  if (!adminId) {
    throw new Error("adminId is required");
  }

  const campaign = await repo.getCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Can only approve blocked campaigns
  if (campaign.status !== "BLOCKED") {
    throw new Error(`Cannot approve campaign with status: ${campaign.status}. Only BLOCKED campaigns can be approved.`);
  }

  // Determine new status based on scheduled time
  let newStatus = "QUEUED";
  if (campaign.scheduled_at) {
    const scheduledDate = new Date(campaign.scheduled_at);
    if (scheduledDate.getTime() > Date.now()) {
      newStatus = "SCHEDULED";
    }
  }

  await repo.updateCampaignStatus(campaignId, newStatus);

  // Also update associated message jobs
  // Note: This would require a repository method to update all jobs for a campaign
  // For now, the worker will handle job status when processing

  // Log the approval (in a real implementation, this would be an audit log)
  console.log(`Campaign ${campaignId} approved by admin ${adminId}. Reason: ${reason || 'N/A'}`);

  return {
    campaignId,
    previousStatus: campaign.status,
    newStatus,
    approvedBy: adminId,
    approvedAt: new Date().toISOString(),
    reason
  };
};

/**
 * Cancel a scheduled campaign
 */
const cancelCampaign = async (campaignId, cancelledBy, reason) => {
  if (!campaignId) {
    throw new Error("campaignId is required");
  }

  const campaign = await repo.getCampaignById(campaignId)
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Can only cancel certain statuses
  const cancellableStatuses = ["QUEUED", "SCHEDULED", "PAUSED", "BLOCKED"];
  if (!cancellableStatuses.includes(campaign.status)) {
    throw new Error(`Cannot cancel campaign with status: ${campaign.status}`);
  }

  await repo.updateCampaignStatus(campaignId, "CANCELLED");

  // Log the cancellation
  console.log(`Campaign ${campaignId} cancelled by ${cancelledBy || 'system'}. Reason: ${reason || 'N/A'}`);

  return {
    campaignId,
    previousStatus: campaign.status,
    newStatus: "CANCELLED",
    cancelledBy,
    cancelledAt: new Date().toISOString(),
    reason
  };
};

/**
 * Get campaign statistics
 */
const getCampaignStats = async (campaignId) => {
  if (!campaignId) {
    throw new Error("campaignId is required");
  }

  const campaign = await repo.getCampaignById(campaignId)
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const stats = await repo.getCampaignStats(campaignId);

  // Calculate engagement rates
  const total = stats.totalJobs || 0;
  const delivered = stats.delivered || stats.sent || 0;
  
  return {
    campaignId,
    campaign: {
      id: campaign.id,
      subject: campaign.subject,
      channel: campaign.channel,
      status: campaign.status,
      createdAt: campaign.created_at
    },
    stats: {
      ...stats,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0,
      openRate: delivered > 0 ? Math.round((stats.opened / delivered) * 1000) / 10 : 0,
      clickRate: delivered > 0 ? Math.round((stats.clicked / delivered) * 1000) / 10 : 0,
      bounceRate: total > 0 ? Math.round((stats.bounced / total) * 1000) / 10 : 0,
      complaintRate: total > 0 ? Math.round((stats.complained / total) * 10000) / 100 : 0
    }
  };
};

/**
 * List campaigns for a project with filtering
 */
const listCampaigns = async ({
  projectId,
  status,
  channel,
  limit = 50,
  offset = 0
}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  return await repo.listCampaigns({
    projectId,
    status,
    channel,
    limit,
    offset
  });
};

/**
 * Get a single campaign by ID
 */
const getCampaign = async (campaignId) => {
  if (!campaignId) {
    throw new Error("campaignId is required");
  }

  const campaign = await repo.getCampaignById(campaignId)
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
};

/**
 * Add a contact to the suppression list
 */
const addToSuppressionList = async ({
  projectId,
  email,
  phone,
  reason,
  source = "MANUAL"
}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!email && !phone) {
    throw new Error("Either email or phone is required");
  }
  if (!reason) {
    throw new Error("reason is required");
  }

  const validReasons = ["BOUNCE", "COMPLAINT", "UNSUBSCRIBE", "MANUAL", "INVALID"];
  if (!validReasons.includes(reason)) {
    throw new Error(`Invalid reason. Must be one of: ${validReasons.join(", ")}`);
  }

  const suppressionId = await repo.addToSuppressionList({
    projectId,
    email,
    phone,
    reason,
    source
  });

  return {
    suppressionId,
    projectId,
    email,
    phone,
    reason,
    source,
    suppressedAt: new Date().toISOString()
  };
};

/**
 * Handle SES webhook events (bounce, complaint, delivery)
 */
const handleSESEvent = async (event) => {
  const { eventType, mail, bounce, complaint, delivery } = event;
  
  if (!eventType || !mail) {
    throw new Error("Invalid SES event: missing eventType or mail");
  }

  const messageId = mail.messageId;
  if (!messageId) {
    throw new Error("Invalid SES event: missing messageId");
  }

  // Find the message job by provider message ID
  const job = await repo.getMessageJobByProviderId(messageId);
  if (!job) {
    console.warn(`No message job found for SES message ID: ${messageId}`);
    return { handled: false, reason: "Message job not found" };
  }

  let eventData = {
    jobId: job.id,
    eventType: eventType.toUpperCase(),
    eventAt: new Date(),
    metadata: {}
  };

  switch (eventType.toLowerCase()) {
    case "bounce":
      if (!bounce) {
        throw new Error("Invalid bounce event: missing bounce data");
      }
      
      eventData.metadata = {
        bounceType: bounce.bounceType,
        bounceSubType: bounce.bounceSubType,
        bouncedRecipients: bounce.bouncedRecipients?.map(r => r.emailAddress) || [],
        timestamp: bounce.timestamp
      };

      // Update job status
      const bounceType = bounce.bounceType?.toLowerCase();
      if (bounceType === "permanent") {
        await repo.updateMessageJobStatus({
          jobId: job.id,
          status: "BOUNCED"
        });

        // Add to suppression list for permanent bounces
        if (job.contact_email) {
          const projectId = await getProjectIdFromCampaign(job.campaign_id);
          if (projectId) {
            await repo.addToSuppressionList({
              projectId,
              email: job.contact_email,
              reason: "BOUNCE",
              source: "SES_WEBHOOK"
            });
          }
        }
      } else {
        await repo.updateMessageJobStatus({
          jobId: job.id,
          status: "DEFERRED",
          attempts: (job.attempts || 0) + 1
        });
      }
      break;

    case "complaint":
      if (!complaint) {
        throw new Error("Invalid complaint event: missing complaint data");
      }

      eventData.metadata = {
        complaintFeedbackType: complaint.complaintFeedbackType,
        complainedRecipients: complaint.complainedRecipients?.map(r => r.emailAddress) || [],
        timestamp: complaint.timestamp
      };

      // Update job status
      await updateMessageJobStatus({
        jobId: job.id,
        status: "COMPLAINED"
      });

      // Add to suppression list
      if (job.contact_email) {
        await addToSuppressionList({
          projectId: job.project_id || job.campaign_id,
          email: job.contact_email,
          reason: "COMPLAINT",
          source: "SES_WEBHOOK"
        });
      }
      break;

    case "delivery":
      if (!delivery) {
        throw new Error("Invalid delivery event: missing delivery data");
      }

      eventData.metadata = {
        timestamp: delivery.timestamp,
        processingTimeMillis: delivery.processingTimeMillis,
        recipients: delivery.recipients
      };

      await updateMessageJobStatus({
        jobId: job.id,
        status: "DELIVERED"
      });
      break;

    case "send":
      eventData.metadata = { timestamp: mail.timestamp };
      await updateMessageJobStatus({
        jobId: job.id,
        status: "SENT"
      });
      break;

    case "open":
      eventData.metadata = {
        ipAddress: event.open?.ipAddress,
        timestamp: event.open?.timestamp
      };
      // Don't update job status for opens, just log the event
      break;

    case "click":
      eventData.metadata = {
        link: event.click?.link,
        ipAddress: event.click?.ipAddress,
        timestamp: event.click?.timestamp
      };
      // Don't update job status for clicks, just log the event
      break;

    default:
      console.warn(`Unhandled SES event type: ${eventType}`);
      return { handled: false, reason: `Unhandled event type: ${eventType}` };
  }

  // Create the event record
  await repo.createMessageEvent(eventData);

  return {
    handled: true,
    eventType: eventType.toUpperCase(),
    jobId: job.id,
    campaignId: job.campaign_id
  };
};

/**
 * Get suppression list for a project
 */
const getProjectSuppressionList = async ({
  projectId,
  limit = 100,
  offset = 0
}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  return await repo.getSuppressionList({ projectId, limit, offset });
};

/**
 * Remove a contact from the suppression list
 */
const removeFromSuppressionList = async (suppressionId) => {
  if (!suppressionId) {
    throw new Error("suppressionId is required");
  }

  await repo.removeFromSuppressionList(suppressionId);
  
  return {
    suppressionId,
    removedAt: new Date().toISOString()
  };
};

/**
 * Legacy function for backwards compatibility
 */
const createCampaignWithJobs = async ({
  projectId,
  channel,
  subject,
  bodyHtml,
  bodyText,
  scheduledAt,
  recipients
}) => {
  return await createCampaign({
    projectId,
    channel,
    subject,
    bodyHtml,
    bodyText,
    scheduledAt,
    recipients
  });
};

module.exports = {
  createCampaign,
  createCampaignWithJobs,
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
};
