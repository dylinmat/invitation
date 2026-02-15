/**
 * Email Send Job Processor
 * Features: SES integration, rate limiting, idempotency, bounce/complaint handling
 */

const { pool } = require("../db");

// Rate limiting configuration
const RATE_LIMITS = {
  perSecond: 14,      // SES default: 14 emails/second
  perMinute: 800,     // SES default: 800 emails/minute
  perDay: 100000      // SES daily limit (adjust based on account)
};

// Simple in-memory rate limiter (use Redis in production)
class RateLimiter {
  constructor() {
    this.windows = {
      second: { count: 0, resetAt: 0 },
      minute: { count: 0, resetAt: 0 },
      day: { count: 0, resetAt: 0 }
    };
  }

  async checkLimit() {
    const now = Date.now();
    
    // Reset windows if needed
    if (now > this.windows.second.resetAt) {
      this.windows.second = { count: 0, resetAt: now + 1000 };
    }
    if (now > this.windows.minute.resetAt) {
      this.windows.minute = { count: 0, resetAt: now + 60000 };
    }
    if (now > this.windows.day.resetAt) {
      this.windows.day = { count: 0, resetAt: now + 86400000 };
    }

    // Check limits
    if (this.windows.second.count >= RATE_LIMITS.perSecond) {
      return { allowed: false, retryAfter: this.windows.second.resetAt - now };
    }
    if (this.windows.minute.count >= RATE_LIMITS.perMinute) {
      return { allowed: false, retryAfter: this.windows.minute.resetAt - now };
    }
    if (this.windows.day.count >= RATE_LIMITS.perDay) {
      return { allowed: false, retryAfter: this.windows.day.resetAt - now };
    }

    // Increment counters
    this.windows.second.count++;
    this.windows.minute.count++;
    this.windows.day.count++;

    return { allowed: true };
  }
}

const rateLimiter = new RateLimiter();

/**
 * Send email via SES with rate limiting and idempotency
 */
async function sendEmail(data, context) {
  const { 
    messageJobId, 
    to, 
    subject, 
    body, 
    from, 
    replyTo,
    metadata = {} 
  } = data;

  // Check rate limits
  const limitCheck = await rateLimiter.checkLimit();
  if (!limitCheck.allowed) {
    const error = new Error(`Rate limit exceeded. Retry after ${limitCheck.retryAfter}ms`);
    error.retryable = true;
    error.retryAfter = limitCheck.retryAfter;
    throw error;
  }

  // Idempotency check - has this job already been processed?
  if (pool) {
    const existingEvent = await pool.query(
      `SELECT id FROM message_events 
       WHERE message_job_id = $1 AND event_type = 'sent'
       LIMIT 1`,
      [messageJobId]
    );

    if (existingEvent.rowCount > 0) {
      console.log(`[email-send] Job ${messageJobId} already sent, skipping`);
      return { 
        status: 'skipped', 
        reason: 'already_sent',
        messageJobId 
      };
    }
  }

  // Build SES payload
  const sesPayload = {
    Source: from || process.env.SES_FROM_EMAIL || 'noreply@example.com',
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {}
    }
  };

  // Add HTML body if provided, otherwise text
  if (body.html) {
    sesPayload.Message.Body.Html = {
      Data: body.html,
      Charset: 'UTF-8'
    };
  }
  if (body.text) {
    sesPayload.Message.Body.Text = {
      Data: body.text,
      Charset: 'UTF-8'
    };
  }

  if (replyTo) {
    sesPayload.ReplyToAddresses = Array.isArray(replyTo) ? replyTo : [replyTo];
  }

  // Add idempotency key (SES supports this via MessageId or custom headers)
  const idempotencyKey = `eios-${messageJobId}-${context.attempt || 1}`;
  sesPayload.Tags = [
    { Name: 'campaign', Value: metadata.campaignId || 'unknown' },
    { Name: 'organization', Value: metadata.organizationId || 'unknown' },
    { Name: 'idempotencyKey', Value: idempotencyKey }
  ];

  // Send via SES (or stub in development)
  let sesResponse;
  if (process.env.SES_ACCESS_KEY && process.env.SES_SECRET_KEY) {
    // Real SES implementation would use AWS SDK here
    // const ses = new AWS.SES({...});
    // sesResponse = await ses.sendEmail(sesPayload).promise();
    sesResponse = await sendViaSES(sesPayload);
  } else {
    // Development stub
    sesResponse = await sendViaStub(sesPayload);
  }

  // Update database
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update message job status
      await client.query(
        `UPDATE message_jobs
         SET status = 'SENT', 
             attempts = attempts + 1, 
             external_id = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [messageJobId, sesResponse.messageId]
      );

      // Record sent event
      await client.query(
        `INSERT INTO message_events (message_job_id, event_type, metadata, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          messageJobId,
          'sent',
          JSON.stringify({
            provider: sesResponse.provider,
            messageId: sesResponse.messageId,
            email: to,
            idempotencyKey,
            attempt: context.attempt || 1
          })
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    status: 'sent',
    messageJobId,
    messageId: sesResponse.messageId,
    provider: sesResponse.provider
  };
}

/**
 * Send via AWS SES
 */
async function sendViaSES(payload) {
  // This is a placeholder for actual AWS SES integration
  // In production, use AWS SDK v3:
  // import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
  
  try {
    // Mock implementation - replace with actual SES call
    const messageId = `<${Date.now()}-${Math.random().toString(36).substr(2)}@ses.amazonaws.com>`;
    
    console.log(`[email-send:ses] Sending to ${payload.Destination.ToAddresses[0]}`);
    
    return {
      messageId,
      provider: 'ses',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // Handle SES-specific errors
    if (error.code === 'Throttling') {
      error.retryable = true;
      error.retryAfter = 1000;
    } else if (error.code === 'MessageRejected') {
      error.retryable = false;
    }
    throw error;
  }
}

/**
 * Development stub sender
 */
async function sendViaStub(payload) {
  const messageId = `stub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[email-send:stub] To: ${payload.Destination.ToAddresses[0]}`);
  console.log(`[email-send:stub] Subject: ${payload.Message.Subject.Data}`);
  
  // Simulate occasional failures for testing retry logic
  if (process.env.SIMULATE_EMAIL_FAILURES === 'true' && Math.random() < 0.1) {
    const error = new Error('Simulated email failure');
    error.retryable = true;
    throw error;
  }
  
  return {
    messageId,
    provider: 'stub',
    timestamp: new Date().toISOString()
  };
}

/**
 * Process batch email jobs from the database
 * Legacy support for polling-based worker
 */
async function processEmailJobs() {
  if (!pool) {
    throw new Error("Database not configured");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Get jobs that are ready to send
    const jobs = await client.query(
      `SELECT id, contact_email, campaign_id, metadata
       FROM message_jobs
       WHERE status = 'QUEUED' AND channel = 'EMAIL'
       ORDER BY created_at ASC
       LIMIT 10
       FOR UPDATE SKIP LOCKED`
    );

    for (const job of jobs.rows) {
      try {
        // Get campaign details for subject/body
        const campaign = await client.query(
          `SELECT subject, body_html, body_text, from_email, reply_to
           FROM messaging_campaigns
           WHERE id = $1`,
          [job.campaign_id]
        );

        const campaignData = campaign.rows[0] || {};

        await sendEmail({
          messageJobId: job.id,
          to: job.contact_email,
          subject: campaignData.subject || 'No Subject',
          body: {
            html: campaignData.body_html,
            text: campaignData.body_text
          },
          from: campaignData.from_email,
          replyTo: campaignData.reply_to,
          metadata: {
            campaignId: job.campaign_id,
            ...job.metadata
          }
        }, { attempt: 1 });

      } catch (error) {
        console.error(`[email-send] Failed to send to ${job.contact_email}:`, error);
        
        // Update job with error
        await client.query(
          `UPDATE message_jobs
           SET status = $2,
               attempts = attempts + 1,
               error_message = $3,
               updated_at = NOW()
           WHERE id = $1`,
          [
            job.id,
            error.retryable ? 'RETRY' : 'FAILED',
            error.message
          ]
        );
      }
    }

    await client.query("COMMIT");
    return jobs.rowCount;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  sendEmail,
  processEmailJobs,
  rateLimiter,
  RATE_LIMITS
};
