/**
 * Schedule Promote Job Processor
 * Features: Campaign promotion post-processing, notification triggers, analytics
 */

const { pool } = require("../db");

/**
 * Process promoted scheduled campaign
 */
async function processSchedulePromote(data, context) {
  const {
    campaignId,
    campaignName,
    scheduledAt,
    promotedAt,
    notifyUsers = true
  } = data;

  console.log(`[schedule-promote] Processing promoted campaign: ${campaignName}`, {
    campaignId,
    scheduledAt,
    promotedAt
  });

  try {
    // Get campaign details
    const campaign = await getCampaignDetails(campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const results = {
      campaignId,
      campaignName: campaign.name,
      status: 'completed',
      actions: []
    };

    // 1. Queue email sending jobs for the campaign
    const queuedJobs = await queueCampaignEmails(campaign);
    results.actions.push({ type: 'queue_emails', count: queuedJobs });

    // 2. Send notification to campaign creator
    if (notifyUsers && campaign.created_by) {
      await notifyCampaignCreator(campaign, 'promoted');
      results.actions.push({ type: 'notify_creator', userId: campaign.created_by });
    }

    // 3. Log promotion event for analytics
    await logPromotionEvent(campaign, scheduledAt, promotedAt);
    results.actions.push({ type: 'log_event' });

    // 4. Update campaign metrics
    await updateCampaignMetrics(campaignId);
    results.actions.push({ type: 'update_metrics' });

    // 5. Trigger webhooks if configured
    const webhooksTriggered = await triggerWebhooks(campaign, 'campaign.promoted');
    if (webhooksTriggered > 0) {
      results.actions.push({ type: 'trigger_webhooks', count: webhooksTriggered });
    }

    console.log(`[schedule-promote] Completed processing campaign ${campaignId}`, {
      actions: results.actions.length
    });

    return results;

  } catch (error) {
    console.error(`[schedule-promote] Failed to process campaign ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Legacy: Promote scheduled campaigns (called by scheduler)
 */
async function promoteScheduledJobs() {
  if (!pool) {
    console.log('[schedule-promote] Database not configured, skipping');
    return 0;
  }

  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // Update campaigns that are ready
    await client.query(
      `UPDATE messaging_campaigns
       SET status = 'QUEUED'
       WHERE status = 'SCHEDULED' 
         AND scheduled_at IS NOT NULL 
         AND scheduled_at <= NOW()`
    );

    // Update associated message jobs and return count
    const result = await client.query(
      `UPDATE message_jobs AS mj
       SET status = 'QUEUED', updated_at = NOW()
       FROM messaging_campaigns AS mc
       WHERE mj.campaign_id = mc.id
         AND mj.status = 'SCHEDULED'
         AND mc.scheduled_at IS NOT NULL
         AND mc.scheduled_at <= NOW()
       RETURNING mj.id, mj.campaign_id`
    );

    await client.query("COMMIT");

    // Queue promote jobs for post-processing
    const processedCampaigns = new Set();
    
    for (const job of result.rows) {
      if (!processedCampaigns.has(job.campaign_id)) {
        processedCampaigns.add(job.campaign_id);
        
        // Add to queue for post-processing
        // This will be processed by the worker
        console.log(`[schedule-promote] Campaign ${job.campaign_id} promoted with ${result.rowCount} jobs`);
      }
    }

    return result.rowCount;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get campaign details
 */
async function getCampaignDetails(campaignId) {
  if (!pool) return null;

  const result = await pool.query(
    `SELECT 
      mc.*,
      o.name as organization_name,
      u.email as creator_email,
      COUNT(mj.id) as total_recipients,
      COUNT(CASE WHEN mj.status = 'QUEUED' THEN 1 END) as queued_count
    FROM messaging_campaigns mc
    JOIN organizations o ON mc.organization_id = o.id
    LEFT JOIN users u ON mc.created_by = u.id
    LEFT JOIN message_jobs mj ON mj.campaign_id = mc.id
    WHERE mc.id = $1
    GROUP BY mc.id, o.name, u.email`,
    [campaignId]
  );

  return result.rows[0] || null;
}

/**
 * Queue individual email sending jobs for a campaign
 */
async function queueCampaignEmails(campaign) {
  if (!pool) return 0;

  // Get all QUEUED message jobs for this campaign
  const result = await pool.query(
    `SELECT id, contact_email, metadata
     FROM message_jobs
     WHERE campaign_id = $1 AND status = 'QUEUED'`,
    [campaign.id]
  );

  let queued = 0;

  // In a full implementation, this would add jobs to the BullMQ queue
  // For now, we just count them as they'll be picked up by the email processor
  for (const job of result.rows) {
    // Here you would:
    // await queue.add('email-send', { messageJobId: job.id, ... }, { priority: 5 });
    queued++;
  }

  console.log(`[schedule-promote] Queued ${queued} email jobs for campaign ${campaign.id}`);
  
  return queued;
}

/**
 * Notify campaign creator
 */
async function notifyCampaignCreator(campaign, event) {
  if (!pool || !campaign.created_by) return;

  // Create in-app notification
  await pool.query(
    `INSERT INTO notifications (
      user_id, type, title, message, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      campaign.created_by,
      `campaign.${event}`,
      event === 'promoted' ? 'Campaign Started Sending' : 'Campaign Update',
      event === 'promoted' 
        ? `Your campaign "${campaign.name}" has started sending.`
        : `Your campaign "${campaign.name}" has been updated.`,
      JSON.stringify({
        campaignId: campaign.id,
        campaignName: campaign.name,
        organizationId: campaign.organization_id,
        recipients: campaign.total_recipients
      })
    ]
  );

  // Optionally send email notification
  if (campaign.creator_email && event === 'promoted') {
    // Queue email notification
    console.log(`[schedule-promote] Notification queued for ${campaign.creator_email}`);
  }
}

/**
 * Log promotion event for analytics
 */
async function logPromotionEvent(campaign, scheduledAt, promotedAt) {
  if (!pool) return;

  const delay = promotedAt && scheduledAt 
    ? new Date(promotedAt).getTime() - new Date(scheduledAt).getTime()
    : 0;

  await pool.query(
    `INSERT INTO campaign_promotion_events (
      campaign_id, organization_id, scheduled_at, promoted_at, delay_ms, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      campaign.id,
      campaign.organization_id,
      scheduledAt,
      promotedAt,
      delay
    ]
  );
}

/**
 * Update campaign metrics
 */
async function updateCampaignMetrics(campaignId) {
  if (!pool) return;

  await pool.query(
    `UPDATE messaging_campaigns
     SET metrics = COALESCE(metrics, '{}') || jsonb_build_object(
       'promoted_at', NOW(),
       'processing_started', true
     ),
     updated_at = NOW()
     WHERE id = $1`,
    [campaignId]
  );
}

/**
 * Trigger configured webhooks
 */
async function triggerWebhooks(campaign, event) {
  if (!pool) return 0;

  // Get active webhooks for this organization
  const webhooks = await pool.query(
    `SELECT id, url, secret, events
     FROM webhooks
     WHERE organization_id = $1
       AND is_active = true
       AND events @> $2::jsonb`,
    [campaign.organization_id, JSON.stringify([event])]
  );

  let triggered = 0;

  for (const webhook of webhooks.rows) {
    try {
      // In production, this would make an HTTP POST to the webhook URL
      // with proper signature verification
      console.log(`[schedule-promote] Would trigger webhook ${webhook.id} for event ${event}`);
      triggered++;
    } catch (error) {
      console.error(`[schedule-promote] Webhook ${webhook.id} failed:`, error);
    }
  }

  return triggered;
}

/**
 * Get scheduled campaigns ready for promotion
 */
async function getReadyCampaigns() {
  if (!pool) return [];

  const result = await pool.query(
    `SELECT 
      mc.id, mc.name, mc.scheduled_at, mc.organization_id,
      COUNT(mj.id) as recipient_count
    FROM messaging_campaigns mc
    LEFT JOIN message_jobs mj ON mj.campaign_id = mc.id
    WHERE mc.status = 'SCHEDULED'
      AND mc.scheduled_at IS NOT NULL
      AND mc.scheduled_at <= NOW()
    GROUP BY mc.id
    ORDER BY mc.scheduled_at ASC`
  );

  return result.rows;
}

/**
 * Cancel scheduled campaign
 */
async function cancelScheduledCampaign(campaignId, reason) {
  if (!pool) return false;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Update campaign status
    await client.query(
      `UPDATE messaging_campaigns
       SET status = 'CANCELLED',
           metadata = metadata || jsonb_build_object('cancelled_reason', $2, 'cancelled_at', NOW()),
           updated_at = NOW()
       WHERE id = $1 AND status = 'SCHEDULED'`,
      [campaignId, reason]
    );

    // Cancel associated message jobs
    await client.query(
      `UPDATE message_jobs
       SET status = 'CANCELLED',
           updated_at = NOW()
       WHERE campaign_id = $1 AND status = 'SCHEDULED'`,
      [campaignId]
    );

    await client.query('COMMIT');

    console.log(`[schedule-promote] Campaign ${campaignId} cancelled: ${reason}`);
    return true;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  processSchedulePromote,
  promoteScheduledJobs,
  getCampaignDetails,
  queueCampaignEmails,
  notifyCampaignCreator,
  logPromotionEvent,
  getReadyCampaigns,
  cancelScheduledCampaign
};
