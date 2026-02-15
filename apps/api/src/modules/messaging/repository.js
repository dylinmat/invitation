const { query } = require("../../db");

// Campaign operations

const createCampaign = async ({
  projectId,
  channel,
  subject,
  bodyHtml,
  bodyText,
  scheduledAt,
  status
}) => {
  const result = await query(
    `insert into messaging_campaigns
      (project_id, channel, subject, body_html, body_text, status, scheduled_at)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [
      projectId,
      channel,
      subject || null,
      bodyHtml || null,
      bodyText || null,
      status || "QUEUED",
      scheduledAt || null
    ]
  );
  return result.rows[0]?.id;
};

const listCampaigns = async ({ projectId, status, channel, limit = 50, offset = 0 }) => {
  const conditions = ["project_id = $1"];
  const params = [projectId];
  let paramIndex = 1;

  if (status) {
    paramIndex++;
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
  }

  if (channel) {
    paramIndex++;
    conditions.push(`channel = $${paramIndex}`);
    params.push(channel);
  }

  paramIndex++;
  params.push(limit);
  paramIndex++;
  params.push(offset);

  const result = await query(
    `select id, project_id, channel, subject, status, scheduled_at, created_at
     from messaging_campaigns
     where ${conditions.join(" and ")}
     order by created_at desc
     limit $${paramIndex - 1} offset $${paramIndex}`,
    params
  );

  const countResult = await query(
    `select count(*) as total
     from messaging_campaigns
     where ${conditions.join(" and ")}`,
    params.slice(0, -2)
  );

  return {
    campaigns: result.rows,
    total: parseInt(countResult.rows[0]?.total || "0", 10)
  };
};

const getCampaignById = async (campaignId) => {
  const result = await query(
    `select id, project_id, channel, subject, body_html, body_text, status, scheduled_at, created_at
     from messaging_campaigns
     where id = $1`,
    [campaignId]
  );
  return result.rows[0] || null;
};

const updateCampaignStatus = async (campaignId, status) => {
  await query(
    `update messaging_campaigns
     set status = $2
     where id = $1`,
    [campaignId, status]
  );
};

// Message job operations

const createMessageJob = async ({
  campaignId,
  guestId,
  contactEmail,
  contactPhone,
  channel,
  status
}) => {
  const result = await query(
    `insert into message_jobs
      (campaign_id, guest_id, contact_email, contact_phone, channel, status)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      campaignId,
      guestId || null,
      contactEmail || null,
      contactPhone || null,
      channel,
      status || "QUEUED"
    ]
  );
  return result.rows[0]?.id;
};

const updateMessageJobStatus = async ({
  jobId,
  status,
  providerMessageId,
  lastError,
  attempts
}) => {
  const updates = ["status = $2", "updated_at = now()"];
  const params = [jobId, status];
  let paramIndex = 2;

  if (providerMessageId !== undefined) {
    paramIndex++;
    updates.push(`provider_message_id = $${paramIndex}`);
    params.push(providerMessageId);
  }

  if (lastError !== undefined) {
    paramIndex++;
    updates.push(`last_error = $${paramIndex}`);
    params.push(lastError);
  }

  if (attempts !== undefined) {
    paramIndex++;
    updates.push(`attempts = $${paramIndex}`);
    params.push(attempts);
  }

  await query(
    `update message_jobs
     set ${updates.join(", ")}
     where id = $1`,
    params
  );
};

const getMessageJobById = async (jobId) => {
  const result = await query(
    `select id, campaign_id, guest_id, contact_email, contact_phone, channel, status, 
            provider_message_id, attempts, last_error, created_at, updated_at
     from message_jobs
     where id = $1`,
    [jobId]
  );
  return result.rows[0] || null;
};

const getMessageJobByProviderId = async (providerMessageId) => {
  const result = await query(
    `select id, campaign_id, guest_id, contact_email, contact_phone, channel, status, 
            provider_message_id, attempts, last_error, created_at, updated_at
     from message_jobs
     where provider_message_id = $1`,
    [providerMessageId]
  );
  return result.rows[0] || null;
};

// Campaign stats aggregation

const getCampaignStats = async (campaignId) => {
  // Aggregate counts by event type for the campaign
  const result = await query(
    `select 
      me.event_type,
      count(*) as count
     from message_events me
     join message_jobs mj on me.message_job_id = mj.id
     where mj.campaign_id = $1
     group by me.event_type`,
    [campaignId]
  );

  // Get job status counts
  const jobStats = await query(
    `select 
      status,
      count(*) as count
     from message_jobs
     where campaign_id = $1
     group by status`,
    [campaignId]
  );

  const stats = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
    totalJobs: 0
  };

  result.rows.forEach(row => {
    const type = row.event_type.toLowerCase();
    if (stats.hasOwnProperty(type)) {
      stats[type] = parseInt(row.count, 10);
    }
  });

  jobStats.rows.forEach(row => {
    stats.totalJobs += parseInt(row.count, 10);
    if (row.status === 'FAILED') {
      stats.failed += parseInt(row.count, 10);
    }
  });

  return stats;
};

// Message events

const createMessageEvent = async ({ jobId, eventType, eventAt, metadata }) => {
  await query(
    `insert into message_events
      (message_job_id, event_type, event_at, metadata)
     values ($1, $2, $3, $4)`,
    [jobId, eventType, eventAt || new Date(), metadata ? JSON.stringify(metadata) : null]
  );
};

// Suppression list management

const addToSuppressionList = async ({ projectId, email, phone, reason, source }) => {
  // Check if already suppressed
  const checkResult = await query(
    `select id from suppressed_contacts
     where project_id = $1 and (email = $2 or phone = $3)`,
    [projectId, email || null, phone || null]
  );

  if (checkResult.rows.length > 0) {
    // Update existing record
    await query(
      `update suppressed_contacts
       set reason = $4, source = $5, suppressed_at = now()
       where project_id = $1 and (email = $2 or phone = $3)`,
      [projectId, email || null, phone || null, reason, source]
    );
    return checkResult.rows[0].id;
  }

  const result = await query(
    `insert into suppressed_contacts
      (project_id, email, phone, reason, source, suppressed_at)
     values ($1, $2, $3, $4, $5, now())
     returning id`,
    [projectId, email || null, phone || null, reason, source]
  );
  return result.rows[0]?.id;
};

const isSuppressed = async ({ projectId, email, phone }) => {
  const result = await query(
    `select id, reason from suppressed_contacts
     where project_id = $1 and (email = $2 or phone = $3)
     and (expires_at is null or expires_at > now())`,
    [projectId, email || null, phone || null]
  );
  return result.rows[0] || null;
};

const getSuppressionList = async ({ projectId, limit = 100, offset = 0 }) => {
  const result = await query(
    `select id, email, phone, reason, source, suppressed_at, expires_at
     from suppressed_contacts
     where project_id = $1
     order by suppressed_at desc
     limit $2 offset $3`,
    [projectId, limit, offset]
  );

  const countResult = await query(
    `select count(*) as total from suppressed_contacts where project_id = $1`,
    [projectId]
  );

  return {
    suppressed: result.rows,
    total: parseInt(countResult.rows[0]?.total || "0", 10)
  };
};

const removeFromSuppressionList = async (suppressionId) => {
  await query(
    `delete from suppressed_contacts where id = $1`,
    [suppressionId]
  );
};

module.exports = {
  // Campaigns
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaignStatus,
  
  // Message jobs
  createMessageJob,
  updateMessageJobStatus,
  getMessageJobById,
  getMessageJobByProviderId,
  
  // Stats and events
  getCampaignStats,
  createMessageEvent,
  
  // Suppression list
  addToSuppressionList,
  isSuppressed,
  getSuppressionList,
  removeFromSuppressionList
};
